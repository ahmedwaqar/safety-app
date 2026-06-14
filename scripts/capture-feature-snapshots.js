import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { spawn } from "bun";
import { buildApp } from "./build-app.ts";
import { ProjectService } from "../services/project-service.ts";
import { renderPlantUml } from "../server.js";

const root = join(import.meta.dir, "..");
const outputDir = join(root, "docs", "images", "features");
const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const debugPort = 9400 + Math.floor(Math.random() * 400);
const profile = `/tmp/praxis-snapshot-chrome-${Date.now()}`;
const projectService = new ProjectService(`/tmp/praxis-snapshot-projects-${Date.now()}.json`);
const mime = {
  ".css": "text/css",
  ".html": "text/html",
  ".js": "text/javascript",
  ".json": "application/json",
  ".md": "text/markdown",
  ".svg": "image/svg+xml"
};

const snapshots = [
  ["overview", "overview"],
  ["engineering-notes", "notepad"],
  ["engineering-workflow", "workflow"],
  ["architecture", "architecture"],
  ["operational-situations", "situations"],
  ["hazard-catalogue", "hazards"],
  ["amr-sil-assessment", "sil"],
  ["quantitative-safety", "quantitative"],
  ["fmeda-worksheet", "fmeda"],
  ["iso-26262-hara", "hara"],
  ["fmea-worksheet", "fmea"],
  ["safety-requirements", "requirements"],
  ["lifecycle-assurance", "assurance"]
];

const sleep = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

async function retry(action, attempts = 50) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await action();
    } catch (error) {
      if (attempt === attempts - 1) throw error;
      await sleep(100);
    }
  }
}

await buildApp();
await mkdir(outputDir, { recursive: true });

const server = Bun.serve({
  port: 0,
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/api/projects") return projectService.handle(request);
    if (url.pathname === "/api/plantuml/render") {
      try {
        return new Response(await renderPlantUml(await request.text()), {
          headers: { "content-type": "image/svg+xml; charset=utf-8" }
        });
      } catch (error) {
        return new Response(error.message, { status: 500 });
      }
    }

    const requested = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
    const file = Bun.file(join(root, requested));
    if (!await file.exists()) return new Response("Not found", { status: 404 });
    const extension = requested.slice(requested.lastIndexOf("."));
    return new Response(file, {
      headers: { "content-type": mime[extension] || "application/octet-stream" }
    });
  }
});

const browser = spawn([
  chrome,
  "--headless=new",
  "--disable-gpu",
  "--hide-scrollbars",
  "--no-first-run",
  "--no-default-browser-check",
  `--remote-debugging-port=${debugPort}`,
  `--user-data-dir=${profile}`,
  "about:blank"
], { stdout: "ignore", stderr: "ignore" });

let socket;
let sequence = 0;
const pending = new Map();

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++sequence;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
}

async function evaluate(expression) {
  const response = await send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true
  });
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.text);
  return response.result.value;
}

async function capture(name) {
  await evaluate("window.scrollTo(0, 0)");
  await sleep(250);
  const response = await send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: false
  });
  await Bun.write(join(outputDir, `${name}.png`), Buffer.from(response.data, "base64"));
  console.log(`Captured ${name}.png`);
}

try {
  const tabs = await retry(async () => {
    const response = await fetch(`http://localhost:${debugPort}/json/list`);
    if (!response.ok) throw new Error("Chrome DevTools endpoint is not ready");
    return response.json();
  });
  const page = tabs.find(tab => tab.type === "page");
  if (!page) throw new Error("Chrome did not expose a page");

  socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.onopen = resolve;
    socket.onerror = reject;
  });
  socket.onmessage = event => {
    const message = JSON.parse(event.data);
    if (!message.id) return;
    const handler = pending.get(message.id);
    if (!handler) return;
    pending.delete(message.id);
    message.error ? handler.reject(new Error(message.error.message)) : handler.resolve(message.result);
  };

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1600,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false
  });
  await send("Page.navigate", { url: `http://localhost:${server.port}` });
  await retry(async () => {
    if (await evaluate("document.readyState") !== "complete") throw new Error("Page is loading");
    if (await evaluate("document.querySelectorAll('#metrics .metric').length") !== 4) throw new Error("App is rendering");
  });

  await evaluate("localStorage.clear(); sessionStorage.clear(); location.reload()");
  await retry(async () => {
    if (await evaluate("document.querySelectorAll('#metrics .metric').length") !== 4) throw new Error("App is rendering");
  });

  for (const [name, view] of snapshots) {
    await evaluate(`document.querySelector('[data-view="${view}"]').click()`);
    if (view === "architecture") {
      await evaluate("document.querySelector('#render-btn').click()");
      await retry(async () => {
        if (!await evaluate("document.querySelector('#diagram-preview img')?.complete === true")) throw new Error("Diagram is rendering");
      });
    }
    await capture(name);
  }

  await evaluate("document.querySelector('#workspace-menu-btn').click()");
  await capture("workspace-data");
  await evaluate("document.querySelector('#workspace-menu-btn').click()");
  await evaluate("document.querySelector('[data-view=\"fmea\"]').click()");
  await evaluate("document.querySelector('#template-btn').click()");
  await retry(async () => {
    if (!await evaluate("document.querySelector('#template-dialog').open")) throw new Error("Template dialog is opening");
  });
  await capture("custom-fmea-template");
  await evaluate("document.querySelector('#template-dialog').close()");
  await evaluate("document.querySelector('#help-btn').click()");
  await retry(async () => {
    if (!await evaluate("document.querySelector('#help-dialog').open")) throw new Error("Help dialog is opening");
  });
  await capture("input-guidance");
} finally {
  socket?.close();
  browser.kill();
  server.stop();
}
