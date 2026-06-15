import { spawn } from "bun";
import { join } from "path";
import { buildApp } from "../scripts/build-app.ts";
import { ProjectService } from "../services/project-service.ts";

const root = join(import.meta.dir, "..");
const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const debugPort = 9333;
const profile = `/tmp/safeguard-chrome-${Date.now()}`;
const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".md": "text/markdown" };
const projectService = new ProjectService(`/tmp/praxis-project-service-${Date.now()}.json`);

const server = Bun.serve({
  port: 0,
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/api/projects") return projectService.handle(request);
    if (url.pathname === "/api/plantuml/render") {
      const source = await request.text();
      if (!source.includes("@startuml")) return new Response("Invalid PlantUML", { status: 400 });
      return new Response('<svg xmlns="http://www.w3.org/2000/svg"><text>Rendered test diagram</text></svg>', { headers: { "content-type": "image/svg+xml" } });
    }
    const path = url.pathname === "/" ? "/index.html" : url.pathname;
    const file = Bun.file(join(root, path));
    if (!await file.exists()) return new Response("Not found", { status: 404 });
    return new Response(file, { headers: { "content-type": mime[path.slice(path.lastIndexOf("."))] || "application/octet-stream" } });
  }
});
const browser = spawn([chrome, "--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", `--remote-debugging-port=${debugPort}`, `--user-data-dir=${profile}`, "about:blank"], { stdout: "ignore", stderr: "ignore" });

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const assert = (condition, message) => { if (!condition) throw new Error(message); };
async function retry(action, attempts = 40) {
  for (let i = 0; i < attempts; i++) {
    try { return await action(); } catch (error) { if (i === attempts - 1) throw error; await sleep(100); }
  }
}

let ws;
let sequence = 0;
const pending = new Map();
const browserErrors = [];
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++sequence;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  const response = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.text);
  return response.result.value;
}
const click = selector => evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
const fill = (selector, value) => evaluate(`(() => { const field = document.querySelector(${JSON.stringify(selector)}); field.value = ${JSON.stringify(value)}; field.dispatchEvent(new Event("input", { bubbles: true })); field.dispatchEvent(new Event("change", { bubbles: true })); })()`);
const isOpen = selector => evaluate(`document.querySelector(${JSON.stringify(selector)}).open`);
const count = selector => evaluate(`document.querySelectorAll(${JSON.stringify(selector)}).length`);
function test(name, action) {
  return action().then(() => console.log(`PASS ${name}`));
}

await buildApp();

try {
  const tabs = await retry(async () => {
    const response = await fetch(`http://localhost:${debugPort}/json/list`);
    if (!response.ok) throw new Error("Chrome DevTools endpoint is not ready");
    return response.json();
  });
  const page = tabs.find(tab => tab.type === "page" && !tab.url.startsWith("chrome-extension://"));
  assert(page, "Chrome did not expose a test page");
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  ws.onmessage = event => {
    const message = JSON.parse(event.data);
    if (message.method === "Runtime.exceptionThrown") browserErrors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
    if (!message.id) return;
    const handler = pending.get(message.id);
    if (!handler) return;
    pending.delete(message.id);
    message.error ? handler.reject(new Error(message.error.message)) : handler.resolve(message.result);
  };
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Page.navigate", { url: `http://localhost:${server.port}` });
  await retry(async () => { assert(await evaluate("document.readyState") === "complete", "page did not load"); });
  await evaluate(`localStorage.clear(); location.reload()`);
  await retry(async () => { assert(await count("#metrics .metric") === 4, "app did not render"); });
  await evaluate(`window.alert = message => window.__lastAlert = message; window.confirm = () => true;`);

  await test("Praxis Studio branding appears in the app and browser tab", async () => {
    assert(await evaluate(`document.querySelector(".brand strong").textContent`) === "Praxis Studio", "sidebar branding is incorrect");
    assert(await evaluate(`document.title.endsWith("| Praxis Studio")`), "browser tab title is incorrect");
  });

  await test("application shell has unique identifiers and navigation routes", async () => {
    const duplicates = await evaluate(`(() => {
      const repeated = values => [...new Set(values.filter((value, index) => values.indexOf(value) !== index))];
      return {
        ids: repeated([...document.querySelectorAll("[id]")].map(element => element.id)),
        routes: repeated([...document.querySelectorAll("#main-nav [data-view]")].map(element => element.dataset.view))
      };
    })()`);
    assert(!duplicates.ids.length, `duplicate element IDs found: ${duplicates.ids.join(", ")}`);
    assert(!duplicates.routes.length, `duplicate navigation routes found: ${duplicates.routes.join(", ")}`);
    assert(await count('[data-view="notepad"]') === 1, "Engineering notes appears more than once in navigation");
    assert(await count("#notepad-view") === 1, "Engineering notes view appears more than once");
  });

  await test("workspace manager creates, switches, and isolates local projects", async () => {
    const original = await evaluate(`document.querySelector("#workspace-select").value`);
    await evaluate(`createWorkspace("Warehouse AMR project")`);
    assert(await count("#workspace-select option") === 2, "workspace was not created");
    assert(await evaluate(`document.querySelector("#workspace-select").selectedOptions[0].textContent`) === "Warehouse AMR project", "new workspace did not become active");
    assert(await evaluate(`document.querySelector("#component-count").textContent`) === "0", "new workspace did not start with blank architecture");
    assert(await count("#hazards-grid .catalog-card") === 0, "new workspace did not start with blank hazard catalogue");
    await evaluate(`state.hazards.push({ id: "H-ISOLATED", name: "Isolated workspace hazard", category: "Operational", description: "Test-only project data" }); save();`);
    await fill("#workspace-select", original);
    assert(!await evaluate(`document.querySelector("#hazards-grid").textContent.includes("H-ISOLATED")`), "workspace state leaked into original project");
    const second = await evaluate(`[...document.querySelectorAll("#workspace-select option")].find(x => x.textContent === "Warehouse AMR project").value`);
    await fill("#workspace-select", second);
    assert(await evaluate(`document.querySelector("#hazards-grid").textContent.includes("H-ISOLATED")`), "workspace switch did not restore project data");
    await fill("#workspace-select", original);
  });

  await test("File > New creates and activates a blank named workspace", async () => {
    const original = await evaluate(`document.querySelector("#workspace-select").value`);
    const before = await count("#workspace-select option");
    await evaluate(`window.prompt = () => "Packaging line project";`);
    await click("#workspace-menu-btn");
    await click("#new-workspace-btn");
    assert(await count("#workspace-select option") === before + 1, "New did not create a workspace");
    assert(await evaluate(`document.querySelector("#workspace-select").selectedOptions[0].textContent`) === "Packaging line project", "New workspace did not become active");
    assert(await evaluate(`document.querySelector("#component-count").textContent`) === "0", "New workspace did not start blank");
    assert(await count("#hazards-grid .catalog-card") === 0, "New workspace inherited hazard data");
    await fill("#workspace-select", original);
  });

  await test("projects can open in independent browser tabs", async () => {
    await evaluate(`window.open = (url, target, features) => { window.__openedTab = { url: String(url), target, features }; };`);
    const activeId = await evaluate(`document.querySelector("#workspace-select").value`);
    await click("#workspace-menu-btn");
    await click("#open-workspace-tab-btn");
    const opened = await evaluate(`window.__openedTab`);
    assert(new URL(opened.url).searchParams.get("workspace") === activeId, "new tab URL did not preserve the active project");
    assert(opened.target === "_blank" && opened.features.includes("noopener"), "project did not open in an isolated browser tab");
    assert(await evaluate(`sessionStorage.getItem("safeguard-active-workspace-v1")`) === activeId, "active project is not stored per tab");
  });

  await test("close workspace affects only the current tab and allows reopening", async () => {
    const before = await count("#workspace-select option");
    const globalBefore = await evaluate(`workspaceRegistry.workspaces.length`);
    const closedId = await evaluate(`document.querySelector("#workspace-select").value`);
    const closedName = await evaluate(`document.querySelector("#workspace-select").selectedOptions[0].textContent`);
    await click("#workspace-menu-btn");
    await click("#close-workspace-btn");
    assert(await count("#workspace-select option") === before - 1, "close workspace did not remove the project from the switcher");
    assert(await evaluate(`workspaceRegistry.workspaces.length`) === globalBefore, "close workspace removed the project from the shared registry");
    assert(!await evaluate(`JSON.parse(sessionStorage.getItem("praxis-open-workspaces-v1")).includes(${JSON.stringify(closedId)})`), "closed project remains open in the current tab");
    assert(await evaluate(`workspaceRegistry.workspaces.some(workspace => workspace.id === ${JSON.stringify(closedId)})`), "closed project is unavailable to other tabs");
    await evaluate(`openProject({ name: ${JSON.stringify(closedName)}, data: blankWorkspace() })`);
    assert(await count("#workspace-select option") === before, "reopening a closed project did not restore it");
    assert(await evaluate(`document.querySelector("#workspace-select").selectedOptions[0].textContent`) === closedName, "reopened project did not become active");
  });

  await test("project service mirrors the browser workspace registry", async () => {
    const registry = await retry(async () => {
      const response = await fetch(`http://localhost:${server.port}/api/projects`);
      assert(response.ok, "project service GET failed");
      const data = await response.json();
      assert(data.workspaces.some(workspace => workspace.name === "Warehouse AMR project"), "project service has not received browser projects");
      return data;
    });
    assert(registry.version === 1, "project service registry version is missing");
  });

  await test("workspace manager rejects duplicate project names", async () => {
    const before = await count("#workspace-select option");
    await evaluate(`try { createWorkspace("warehouse amr PROJECT"); } catch (error) { window.__lastAlert = error.message; }`);
    assert(await count("#workspace-select option") === before, "case-insensitive duplicate project name was created");
    assert(await evaluate(`window.__lastAlert.includes('Project name "warehouse amr PROJECT" already exists')`), "duplicate project name did not report a useful error");
  });

  await test("file actions are grouped in a dropdown menu", async () => {
    assert(await evaluate(`document.querySelector("#workspace-menu-btn").textContent`) === "File ▾", "file menu has the wrong label");
    assert(await evaluate(`document.querySelector("#workspace-menu").hidden`), "file menu should start closed");
    await click("#workspace-menu-btn");
    assert(!await evaluate(`document.querySelector("#workspace-menu").hidden`), "file menu did not open");
    assert(await evaluate(`[...document.querySelectorAll("#workspace-menu button")].map(button => button.textContent).join(",")`) === "New,Open,Open in new tab,Save,Close workspace,Delete", "file menu does not contain the project actions");
    await evaluate(`document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }))`);
    assert(await evaluate(`document.querySelector("#workspace-menu").hidden`), "Escape did not close the file menu");
  });

  await test("save preserves current PlantUML editor changes", async () => {
    await click('[data-view="architecture"]');
    await fill("#plantuml-source", "@startuml\ntitle Explicit save test\n@enduml");
    await evaluate(`HTMLAnchorElement.prototype.click = function () { window.__download = this.download; };`);
    await click("#export-btn");
    assert(await evaluate(`JSON.parse(localStorage.getItem("safeguard-workspaces-v1")).workspaces.find(workspace => workspace.id === sessionStorage.getItem("safeguard-active-workspace-v1")).data.plantuml.includes("Explicit save test")`), "save did not preserve PlantUML editor text");
    assert(await evaluate(`window.__download`) === "cobot-safety-case.praxis.json", "save did not download the project file");
  });

  await test("workspace manager deletes the active project and keeps a blank fallback", async () => {
    await evaluate(`createWorkspace("Delete me")`);
    const before = await count("#workspace-select option");
    await click("#delete-workspace-btn");
    assert(await count("#workspace-select option") === before - 1, "workspace was not deleted");
    assert(!await evaluate(`[...document.querySelectorAll("#workspace-select option")].some(option => option.textContent === "Delete me")`), "deleted workspace remains selectable");
    await evaluate(`window.__workspaceSnapshot = structuredClone(workspaceRegistry); workspaceRegistry.workspaces = [activeWorkspace()]; persistRegistry();`);
    await click("#delete-workspace-btn");
    assert(await count("#workspace-select option") === 1, "deleting the final workspace did not create a blank fallback");
    assert(await evaluate(`document.querySelector("#workspace-select").selectedOptions[0].textContent`) === "Untitled workspace", "blank fallback workspace is missing");
    assert(await evaluate(`document.querySelector("#component-count").textContent`) === "0", "blank fallback workspace contains architecture data");
    await evaluate(`workspaceRegistry = structuredClone(window.__workspaceSnapshot); persistRegistry(); switchWorkspace(workspaceRegistry.workspaces[0].id);`);
  });

  await test("portable JSON workspace file opens as a new project", async () => {
    const before = await count("#workspace-select option");
    await evaluate(`(() => {
      const envelope = projectEnvelope();
      delete envelope.workspace.id;
      envelope.workspace.name = "Imported AMR project";
      envelope.workspace.data.hazards.push({ id: "H-IMPORTED", name: "Imported JSON hazard", category: "Operational", description: "Portable project test" });
      const file = new File([JSON.stringify(envelope)], "imported.praxis.json", { type: "application/json" });
      const transfer = new DataTransfer(); transfer.items.add(file);
      const input = document.querySelector("#workspace-file-input"); input.files = transfer.files; input.dispatchEvent(new Event("change", { bubbles: true }));
    })()`);
    await retry(async () => { assert(await count("#workspace-select option") === before + 1, "JSON workspace was not imported"); });
    assert(await evaluate(`document.querySelector("#workspace-select").selectedOptions[0].textContent`) === "Imported AMR project", "imported workspace did not become active");
    assert(await evaluate(`document.querySelector("#hazards-grid").textContent.includes("H-IMPORTED")`), "imported workspace data is missing");
  });

  await test("robotic cell training project is a complete importable workspace", async () => {
    const summary = await evaluate(`(async () => {
      const project = parseProject(await (await fetch("/training/examples/palletizing-cell.praxis.json")).text());
      return {
        name: project.name,
        phases: project.data.workflow.phases.length,
        activities: project.data.workflow.activities.length,
        components: project.data.components.length,
        situations: project.data.situations.length,
        hazards: project.data.hazards.length,
        requirements: project.data.requirements.length,
        sil: project.data.silAssessments.length,
        fmea: project.data.fmea.length,
        fmeda: project.data.fmeda.rows.length,
        noteTables: (project.data.notepad.html.match(/<table/g) || []).length,
        noteLinks: (project.data.notepad.html.match(/data-notepad-artifact/g) || []).length,
        brainstormRows: project.data.notepad.brainstormRows.length,
        tests: project.data.assurance.tests.length,
        changes: project.data.assurance.changes.length,
        claims: project.data.assurance.claims.length
      };
    })()`);
    assert(summary.name === "Palletizing Cell Training Project", "training project name is incorrect");
    assert(summary.phases >= 6 && summary.activities >= 12, "training project workflow is incomplete");
    assert(summary.components >= 12 && summary.situations >= 8 && summary.hazards >= 8, "training project system context is incomplete");
    assert(summary.requirements >= 7 && summary.sil >= 3 && summary.fmea >= 6 && summary.fmeda >= 5, "training project analyses are incomplete");
    assert(summary.noteTables >= 1 && summary.noteLinks >= 2, "training project Engineering notes exercise is incomplete");
    assert(summary.brainstormRows >= 1, "training project has no analysis draft to clean and import");
    assert(summary.tests >= 2 && summary.changes >= 1 && summary.claims >= 1, "training project lifecycle assurance exercises are incomplete");
  });

  await test("EN 50126 railway RAMS training project is complete and importable", async () => {
    const summary = await evaluate(`(async () => {
      const project = parseProject(await (await fetch("/training/examples/metro-psd-rams.praxis.json")).text());
      return {
        name: project.name,
        phases: project.data.workflow.phases.length,
        activities: project.data.workflow.activities.length,
        components: project.data.components.length,
        situations: project.data.situations.length,
        hazards: project.data.hazards.length,
        requirements: project.data.requirements.length,
        fmea: project.data.fmea.length,
        noteTables: (project.data.notepad.html.match(/<table/g) || []).length,
        noteLinks: (project.data.notepad.html.match(/data-notepad-artifact/g) || []).length,
        brainstormRows: project.data.notepad.brainstormRows.length,
        tests: project.data.assurance.tests.length,
        ram: project.data.assurance.ram.length,
        interfaces: project.data.assurance.interfaces.length
      };
    })()`);
    assert(summary.name === "Metro PSD EN 50126 Training", "railway training project name is incorrect");
    assert(summary.phases === 12 && summary.activities === 12, "railway RAMS lifecycle is incomplete");
    assert(summary.components >= 12 && summary.situations >= 8, "railway system definition is incomplete");
    assert(summary.hazards >= 8 && summary.requirements >= 8 && summary.fmea >= 5, "railway RAMS analyses are incomplete");
    assert(summary.noteTables >= 1 && summary.noteLinks >= 3 && summary.brainstormRows >= 1, "railway training exercises are incomplete");
    assert(summary.tests >= 2 && summary.ram >= 2 && summary.interfaces >= 1, "railway lifecycle assurance exercises are incomplete");
  });

  await test("portable JSON import activates an existing project without duplicating it", async () => {
    const before = await count("#workspace-select option");
    await evaluate(`(() => {
      const envelope = projectEnvelope();
      envelope.workspace.name = "imported amr PROJECT";
      const file = new File([JSON.stringify(envelope)], "duplicate-project-name.praxis.json", { type: "application/json" });
      const transfer = new DataTransfer(); transfer.items.add(file);
      const input = document.querySelector("#workspace-file-input"); input.files = transfer.files; input.dispatchEvent(new Event("change", { bubbles: true }));
    })()`);
    await retry(async () => { assert(await evaluate(`window.__lastAlert.includes("already open")`), "existing imported project did not report that it was already open"); });
    assert(await count("#workspace-select option") === before, "existing imported project was duplicated");
  });

  await test("portable JSON import rejects invalid typed values", async () => {
    const before = await count("#workspace-select option");
    await evaluate(`(() => {
      const envelope = projectEnvelope();
      envelope.workspace.name = "Invalid imported project";
      envelope.workspace.data.quantitative.components[0] ??= { id: crypto.randomUUID(), component: "TEST", role: "Validation test", lambdaTotal: 1e-6, dangerousFraction: 0.5, diagnosticCoverage: 0.9, proofTestHours: 8760, channels: 1, beta: 0.05 };
      envelope.workspace.data.quantitative.components[0].diagnosticCoverage = 2;
      const file = new File([JSON.stringify(envelope)], "invalid.praxis.json", { type: "application/json" });
      const transfer = new DataTransfer(); transfer.items.add(file);
      const input = document.querySelector("#workspace-file-input"); input.files = transfer.files; input.dispatchEvent(new Event("change", { bubbles: true }));
    })()`);
    await retry(async () => { assert(await evaluate(`window.__lastAlert.includes("Diagnostic coverage")`), "invalid JSON did not report diagnostic-coverage error"); });
    assert(await count("#workspace-select option") === before, "invalid JSON workspace was imported");
  });

  await test("portable JSON import rejects duplicate identifiers", async () => {
    const before = await count("#workspace-select option");
    await evaluate(`(() => {
      const envelope = projectEnvelope();
      envelope.workspace.name = "Duplicate-ID imported project";
      envelope.workspace.data.hazards.push({ ...envelope.workspace.data.hazards[0], id: envelope.workspace.data.hazards[0].id.toLowerCase() });
      const file = new File([JSON.stringify(envelope)], "duplicate-id.praxis.json", { type: "application/json" });
      const transfer = new DataTransfer(); transfer.items.add(file);
      const input = document.querySelector("#workspace-file-input"); input.files = transfer.files; input.dispatchEvent(new Event("change", { bubbles: true }));
    })()`);
    await retry(async () => { assert(await evaluate(`window.__lastAlert.includes("Hazard identifier") && window.__lastAlert.includes("duplicated")`), "duplicate JSON identifier did not report a useful error"); });
    assert(await count("#workspace-select option") === before, "workspace with duplicate identifiers was imported");
  });

  await test("help option explains appropriate input values", async () => {
    await click("#help-btn");
    assert(await isOpen("#help-dialog"), "help dialog did not open");
    assert(await evaluate(`document.querySelector("#help-dialog").textContent.includes("Fractions, diagnostic coverage, and beta factors")`), "numeric input guidance is missing");
    await click("#help-dialog .dialog-actions .primary");
    assert(!await isOpen("#help-dialog"), "help dialog did not close");
  });

  await test("navigation buttons switch all application views", async () => {
    for (const view of ["notepad", "workflow", "fmea", "fmeda", "hara", "sil", "quantitative", "hazards", "situations", "requirements", "architecture", "overview"]) {
      await click(`[data-view="${view}"]`);
      assert(await evaluate(`document.querySelector("#${view}-view").classList.contains("active")`), `${view} view did not activate`);
      assert(await evaluate(`document.querySelector("#add-fmea-row-btn").hidden`) === (view !== "fmea"), `Add FMEA row visibility was incorrect in ${view} view`);
    }
  });

  await test("browser back and forward restore views and workspaces in the same tab", async () => {
    const originalWorkspace = await evaluate(`document.querySelector("#workspace-select").value`);
    await click('[data-view="architecture"]');
    await click('[data-view="fmea"]');
    assert(await evaluate(`new URL(location.href).searchParams.get("view")`) === "fmea", "active view was not written to the URL");
    await evaluate(`history.back()`);
    await retry(async () => { assert(await evaluate(`document.querySelector("#architecture-view").classList.contains("active")`), "Back did not restore the previous view"); });
    await evaluate(`history.forward()`);
    await retry(async () => { assert(await evaluate(`document.querySelector("#fmea-view").classList.contains("active")`), "Forward did not restore the next view"); });

    await evaluate(`createWorkspace("Browser history project")`);
    const historyWorkspace = await evaluate(`document.querySelector("#workspace-select").value`);
    assert(historyWorkspace !== originalWorkspace, "history test workspace was not created");
    await evaluate(`history.back()`);
    await retry(async () => { assert(await evaluate(`document.querySelector("#workspace-select").value`) === originalWorkspace, "Back did not restore the previous workspace"); });
    assert(await evaluate(`document.querySelector("#fmea-view").classList.contains("active")`), "workspace Back navigation did not preserve the active view");
    await evaluate(`history.forward()`);
    await retry(async () => { assert(await evaluate(`document.querySelector("#workspace-select").value`) === historyWorkspace, "Forward did not restore the next workspace"); });
    await evaluate(`history.back()`);
    await retry(async () => { assert(await evaluate(`document.querySelector("#workspace-select").value`) === originalWorkspace, "history test did not restore its original workspace"); });
  });

  await test("notepad captures rich content and imports cleaned FMEA and HARA drafts", async () => {
    await click('[data-view="notepad"]');
    await evaluate(`document.querySelector("#notepad-editor").innerHTML = "<h3>Review notes</h3><p>Raw force calculation</p>"`);
    await click("#notepad-save-btn");
    assert(await evaluate(`state.notepad.html.includes("Raw force calculation")`), "rich notes were not saved");
    assert(await evaluate(`document.querySelector("#notepad-save-status").textContent`) === "All changes saved", "note save status was not updated");
    assert(await evaluate(`document.querySelector("#brainstorm-status").textContent.includes("Use this table")`), "saving notes overwrote brainstorming guidance");

    await evaluate(`window.prompt = message => message.includes("mathematical") ? "F = m * a" : message.includes("artifact") ? "fmea" : "Test figure";`);
    await click("#notepad-math-btn");
    await click("#notepad-table-btn");
    await click("#notepad-link-btn");
    assert(await count("#notepad-editor pre code") === 1, "mathematical data was not inserted");
    assert(await count("#notepad-editor table") === 1, "rich table was not inserted");
    assert(await count('#notepad-editor [data-notepad-artifact="fmea"]') === 1, "artifact link was not inserted");
    await evaluate(`window.prompt = () => "Engineering workflow"`);
    await click("#notepad-link-btn");
    assert(await count('#notepad-editor [data-notepad-artifact="workflow"]') === 1, "user-facing Engineering workflow name was not accepted");
    assert(await evaluate(`document.querySelector('#notepad-editor [data-notepad-artifact="workflow"]').textContent`) === "Engineering workflow", "workflow artifact link did not use its user-facing label");

    await evaluate(`document.querySelector("#notepad-editor table tbody td").dispatchEvent(new MouseEvent("click", { bubbles: true }))`);
    assert(!await evaluate(`document.querySelector("#notepad-table-action").disabled`), "table options were not enabled after selecting a cell");
    assert(await count("#notepad-table-action optgroup") === 2, "table options were not grouped professionally");
    const tableRows = await count("#notepad-editor table tr");
    const tableColumns = await count("#notepad-editor table thead tr:first-child > *");
    await fill("#notepad-table-action", "row-below");
    assert(await count("#notepad-editor table tr") === tableRows + 1, "table row was not added");
    assert(await evaluate(`document.querySelector("#notepad-table-action").value`) === "", "table options did not reset after use");
    await fill("#notepad-table-action", "column-right");
    assert(await count("#notepad-editor table thead tr:first-child > *") === tableColumns + 1, "table column was not added");
    await fill("#notepad-table-action", "delete-column");
    assert(await count("#notepad-editor table thead tr:first-child > *") === tableColumns, "table column was not deleted");
    await fill("#notepad-table-action", "delete-row");
    assert(await count("#notepad-editor table tr") === tableRows, "table row was not deleted");

    await evaluate(`(() => {
      const editor = document.querySelector("#notepad-editor");
      editor.insertAdjacentHTML("beforeend", "<p>Live autosave note</p>");
      editor.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: "Live autosave note" }));
    })()`);
    assert(await evaluate(`document.querySelector("#notepad-save-status").textContent`) === "Saving...", "autosave progress was not shown");
    await retry(async () => { assert(await evaluate(`state.notepad.html.includes("Live autosave note")`), "notepad live edits were not auto-saved"); });
    assert(await evaluate(`document.querySelector("#notepad-save-status").textContent`) === "All changes saved", "autosave completion was not shown");

    await evaluate(`(async () => {
      const blob = await (await fetch("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=")).blob();
      const transfer = new DataTransfer();
      transfer.items.add(new File([blob], "cell.png", { type: "image/png" }));
      const input = document.querySelector("#notepad-figure-input");
      input.files = transfer.files;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    })()`);
    await retry(async () => { assert(await count("#notepad-editor figure img") === 1, "figure was not inserted"); });

    const fmeaBefore = await evaluate(`state.fmea.length`);
    await evaluate(`state.notepad.brainstormType = "fmea"; state.notepad.brainstormRows = [{
      id: crypto.randomUUID(), kind: "fmea", component: "SCAN", failureMode: "  Stakeholder scanner concern  ", effect: " Missed person detection ",
      hazard: "H-03", situation: "OS-01", severity: "12", occurrence: "2.4", detection: "3", action: " Add diagnostic review "
    }]; renderNotepad();`);
    await click("#brainstorm-clean-btn");
    assert(await evaluate(`state.notepad.brainstormRows[0].severity`) === "10", "FMEA cleanup did not normalize ratings");
    await click("#brainstorm-import-btn");
    assert(await evaluate(`state.fmea.length`) === fmeaBefore + 1, "cleaned FMEA row was not imported");
    assert(await evaluate(`state.fmea.at(-1).failureMode`) === "Stakeholder scanner concern", "FMEA text was not cleaned");

    const haraBefore = await evaluate(`state.hara.length`);
    await evaluate(`state.notepad.brainstormType = "hara"; state.notepad.brainstormRows = [{
      id: crypto.randomUUID(), kind: "hara", eventId: "HE-NOTE", hazard: "H-01", situation: "OS-03",
      malfunction: " Unexpected motion during intervention ", consequence: " Hand injury ", severity: "S3", exposure: "E3", controllability: "C2", safetyGoal: "SG-01"
    }]; renderNotepad();`);
    await click("#brainstorm-clean-btn");
    await click("#brainstorm-import-btn");
    assert(await evaluate(`state.hara.length`) === haraBefore + 1, "cleaned HARA row was not imported");
    assert(await evaluate(`state.hara.at(-1).eventId`) === "HE-NOTE", "HARA event ID was not imported");

    await click('[data-view="notepad"]');
    const linkResult = await evaluate(`(() => {
      const link = document.querySelector('#notepad-editor [data-notepad-artifact="fmea"]');
      link.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
      return { target: link.dataset.go, active: document.querySelector("#fmea-view").classList.contains("active") };
    })()`);
    assert(linkResult.target === "fmea" && linkResult.active, "notepad artifact link did not navigate");
  });

  await test("engineering workflow manages phases, safety gates, evidence, and analysis links", async () => {
    await click('[data-view="workflow"]');
    const phaseCount = await count("#workflow-board .workflow-phase");
    const activityCount = await count("#workflow-board .workflow-activity");
    await click("#add-workflow-phase-btn");
    await fill('#workflow-phase-form [name="name"]', "Release");
    await fill('#workflow-phase-form [name="purpose"]', "Confirm readiness for controlled deployment.");
    await click("#workflow-phase-dialog .dialog-actions .primary");
    assert(await count("#workflow-board .workflow-phase") === phaseCount + 1, "workflow phase was not added");
    await click("#add-workflow-activity-btn");
    await fill('#workflow-activity-form [name="phaseId"]', await evaluate(`state.workflow.phases.find(phase => phase.name === "Release").id`));
    await fill('#workflow-activity-form [name="title"]', "Review residual risk");
    await fill('#workflow-activity-form [name="objective"]', "Confirm release decisions are supported by engineering evidence.");
    await fill('#workflow-activity-form [name="owner"]', "Safety lead");
    await fill('#workflow-activity-form [name="inputs"]', "Hazard log and validation results");
    await fill('#workflow-activity-form [name="outputs"]', "Residual risk acceptance record");
    await fill('#workflow-activity-form [name="safetyCheckpoint"]', "Are residual risks accepted by authorized reviewers?");
    await fill('#workflow-activity-form [name="analysis"]', "requirements");
    await fill('#workflow-activity-form [name="standardReference"]', "Internal release assurance objective");
    await fill('#workflow-activity-form [name="completionCriteria"]', "All release-blocking concerns are resolved.");
    await fill('#workflow-activity-form [name="status"]', "Complete");
    await click("#workflow-activity-dialog .dialog-actions .primary");
    assert(await count("#workflow-board .workflow-activity") === activityCount + 1, "workflow activity was not added");
    assert(await evaluate(`document.querySelector("#workflow-board .workflow-phase:last-child .workflow-flow").textContent.includes("Hazard log and validation results")`), "workflow inputs were not visible");
    assert(await evaluate(`document.querySelector("#workflow-board .workflow-phase:last-child .workflow-flow").textContent.includes("Residual risk acceptance record")`), "workflow outputs were not visible");
    assert(await evaluate(`document.querySelector("#workflow-board .workflow-phase:last-child .workflow-objective strong").textContent`) === "Objective", "workflow objective heading was not visible");
    assert(await count("#workflow-board .workflow-phase:last-child .workflow-chip.owner") === 1, "workflow owner was not visually distinguished");
    assert(await count("#workflow-board .workflow-phase:last-child .workflow-chip.analysis") === 1, "workflow analysis was not visually distinguished");
    assert(await evaluate(`document.querySelector("#workflow-guidance").textContent.includes("1 gate gap")`), "missing evidence did not create a workflow gate gap");
    await click("#workflow-board .workflow-phase:last-child [data-edit-workflow-activity]");
    await fill('#workflow-activity-form [name="evidence"]', "Residual risk review RR-01");
    await click("#workflow-activity-dialog .dialog-actions .primary");
    assert(!await evaluate(`document.querySelector("#workflow-guidance").textContent.includes("1 gate gap")`), "workflow evidence did not close the gate gap");
    await click("#workflow-board .workflow-phase:last-child [data-open-workflow-analysis]");
    assert(await evaluate(`document.querySelector("#requirements-view").classList.contains("active")`), "workflow analysis link did not open its worksheet");
    await click('[data-view="workflow"]');
    await click("#workflow-board .workflow-phase:last-child [data-delete-workflow-activity]");
    assert(await count("#workflow-board .workflow-activity") === activityCount, "workflow activity was not deleted");
    await click("#workflow-board .workflow-phase:last-child [data-delete-workflow-phase]");
    assert(await count("#workflow-board .workflow-phase") === phaseCount, "empty workflow phase was not deleted");
  });

  await test("overview shortcuts navigate to worksheets", async () => {
    await click('[data-go="fmea"]');
    assert(await evaluate(`document.querySelector("#fmea-view").classList.contains("active")`), "worksheet shortcut failed");
    await click('[data-view="overview"]');
    await click('[data-go="architecture"]');
    assert(await evaluate(`document.querySelector("#architecture-view").classList.contains("active")`), "architecture shortcut failed");
  });

  await test("empty add-row dialog dismisses with close and cancel", async () => {
    await click("[data-open-row]");
    assert(await isOpen("#row-dialog"), "row dialog did not open");
    await click("#row-dialog .dialog-close");
    assert(!await isOpen("#row-dialog"), "row dialog close button failed");
    await click("[data-open-row]");
    await click("#row-dialog [data-close-dialog].secondary");
    assert(!await isOpen("#row-dialog"), "row dialog cancel button failed");
  });

  await test("failure mode add, edit, search, and delete buttons work", async () => {
    const before = await count("#fmea-body tr");
    await click("[data-open-row]");
    await fill('#row-form [name="failureMode"]', "Test encoder failure");
    await fill('#row-form [name="effect"]', "Test-only motion effect");
    await click("#row-dialog .dialog-actions .primary");
    assert(await count("#fmea-body tr") === before + 1, "failure mode was not added");
    await click("#fmea-body tr:last-child [data-edit-row]");
    assert(await isOpen("#row-dialog"), "edit button did not open dialog");
    await fill('#row-form [name="failureMode"]', "Updated encoder failure");
    await click("#row-dialog .dialog-actions .primary");
    await fill("#fmea-search", "Updated encoder");
    assert(await count("#fmea-body tr") === 1, "search did not filter worksheet");
    await fill("#fmea-search", "");
    await click("#fmea-body tr:last-child [data-delete-row]");
    assert(await count("#fmea-body tr") === before, "failure mode was not deleted");
  });

  await test("typed numeric validation rejects invalid FMEA values", async () => {
    const before = await count("#fmea-body tr");
    await click("[data-open-row]");
    await fill('#row-form [name="failureMode"]', "Invalid rating test");
    await fill('#row-form [name="effect"]', "Should not save");
    await fill('#row-form [name="severity"]', "1.5");
    await evaluate(`document.querySelector("#row-form").dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true }))`);
    assert(await count("#fmea-body tr") === before, "invalid decimal FMEA rating was saved");
    assert(await evaluate(`window.__lastAlert.includes("Severity must be an integer")`), "invalid FMEA rating did not report a useful error");
    await click("#row-dialog .dialog-close");
  });

  await test("custom template column add and remove buttons work", async () => {
    await click("#template-btn");
    await fill("#new-column", "Review note");
    await click("#add-column-btn");
    assert(await evaluate(`[...document.querySelectorAll("#column-list span")].some(x => x.textContent === "Review note")`), "template column was not added");
    await click('#column-list [data-delete-column="review_note"]');
    assert(!await evaluate(`[...document.querySelectorAll("#column-list span")].some(x => x.textContent === "Review note")`), "template column was not removed");
    await click("#template-dialog .dialog-actions .primary");
    assert(!await isOpen("#template-dialog"), "template dialog did not close");
  });

  await test("hazard catalogue add and close buttons work", async () => {
    await click('[data-view="hazards"]');
    const before = await count("#hazards-grid .catalog-card");
    await click('[data-open-catalog="hazards"]');
    await click("#catalog-dialog .dialog-close");
    assert(!await isOpen("#catalog-dialog"), "catalog close button failed");
    await click('[data-open-catalog="hazards"]');
    await fill('#catalog-form [name="id"]', "H-TEST");
    await fill('#catalog-form [name="name"]', "Test hazard");
    await fill('#catalog-form [name="description"]', "Test-only hazard entry");
    await click("#catalog-dialog .dialog-actions .primary");
    assert(await count("#hazards-grid .catalog-card") === before + 1, "hazard was not added");
    await click('[data-delete-catalog="hazards:H-TEST"]');
    assert(await count("#hazards-grid .catalog-card") === before, "hazard was not deleted");
  });

  await test("ID fields reject case-insensitive duplicates", async () => {
    await click('[data-view="hazards"]');
    const before = await count("#hazards-grid .catalog-card");
    await click('[data-open-catalog="hazards"]');
    await fill('#catalog-form [name="id"]', "h-01");
    await fill('#catalog-form [name="name"]', "Duplicate hazard");
    await fill('#catalog-form [name="description"]', "This entry must not be saved.");
    await click("#catalog-dialog .dialog-actions .primary");
    assert(await count("#hazards-grid .catalog-card") === before, "case-insensitive duplicate hazard ID was saved");
    assert(await evaluate(`window.__lastAlert.includes('Identifier "h-01" already exists')`), "duplicate ID did not report a useful error");
    assert(await isOpen("#catalog-dialog"), "duplicate ID unexpectedly closed the form");
    await click("#catalog-dialog .dialog-close");
  });

  await test("operational situation add button works", async () => {
    await click('[data-view="situations"]');
    const before = await count("#situations-grid .catalog-card");
    await click('[data-open-catalog="situations"]');
    await fill('#catalog-form [name="id"]', "OS-TEST");
    await fill('#catalog-form [name="name"]', "Test situation");
    await fill('#catalog-form [name="description"]', "Test-only situation entry");
    await click("#catalog-dialog .dialog-actions .primary");
    assert(await count("#situations-grid .catalog-card") === before + 1, "situation was not added");
  });

  await test("safety requirement add and cancel buttons work", async () => {
    await click('[data-view="requirements"]');
    const before = await count("#requirement-list .requirement");
    await click("#add-requirement-btn");
    await click("#requirement-dialog .dialog-actions .secondary");
    assert(!await isOpen("#requirement-dialog"), "requirement cancel button failed");
    await click("#add-requirement-btn");
    await fill('#requirement-form [name="id"]', "SR-TEST");
    await fill('#requirement-form [name="text"]', "The test system shall record a verification requirement.");
    await click("#requirement-dialog .dialog-actions .primary");
    assert(await count("#requirement-list .requirement") === before + 1, "requirement was not added");
  });

  await test("ISO 26262 safety goal add and delete buttons work", async () => {
    await click('[data-view="hara"]');
    const before = await count("#goal-list .requirement");
    await click("#add-goal-btn");
    assert(await isOpen("#goal-dialog"), "safety-goal dialog did not open");
    await click("#goal-dialog .dialog-close");
    assert(!await isOpen("#goal-dialog"), "safety-goal dialog close button failed");
    await click("#add-goal-btn");
    await fill('#goal-form [name="id"]', "SG-TEST");
    await fill('#goal-form [name="text"]', "Prevent the test hazardous behaviour.");
    await fill('#goal-form [name="asil"]', "ASIL D");
    await fill('#goal-form [name="safeState"]', "Test safe state");
    await fill('#goal-form [name="ftti"]', "50 ms");
    await click("#goal-dialog .dialog-actions .primary");
    assert(await count("#goal-list .requirement") === before + 1, "safety goal was not added");
  });

  await test("ISO 26262 HARA derives ASIL D and supports edit and delete", async () => {
    const before = await count("#hara-body tr");
    await click("#add-hara-btn");
    assert(await isOpen("#hara-dialog"), "HARA dialog did not open");
    await fill('#hara-form [name="eventId"]', "HE-TEST");
    await fill('#hara-form [name="malfunction"]', "Test controller applies unintended torque.");
    await fill('#hara-form [name="consequence"]', "Potential fatal collision.");
    await fill('#hara-form [name="severity"]', "S3");
    await fill('#hara-form [name="exposure"]', "E4");
    await fill('#hara-form [name="controllability"]', "C3");
    await fill('#hara-form [name="safetyGoal"]', "SG-TEST");
    assert(await evaluate(`document.querySelector("#asil-preview").textContent`) === "ASIL D", "ASIL preview did not derive ASIL D");
    await click("#hara-dialog .dialog-actions .primary");
    assert(await count("#hara-body tr") === before + 1, "hazardous event was not added");
    assert(await evaluate(`document.querySelector("#hara-body tr:last-child").textContent.includes("ASIL D")`), "saved hazardous event does not show ASIL D");
    assert(await evaluate(`document.querySelector("#goal-list").textContent.includes("HE-TEST")`), "safety goal does not trace hazardous event");
    await click("#hara-body tr:last-child [data-edit-hara]");
    await fill('#hara-form [name="consequence"]', "Updated test consequence.");
    await click("#hara-dialog .dialog-actions .primary");
    assert(await evaluate(`document.querySelector("#hara-body tr:last-child").textContent.includes("Updated test consequence")`), "hazardous event was not edited");
    await click("#hara-body tr:last-child [data-delete-hara]");
    assert(await count("#hara-body tr") === before, "hazardous event was not deleted");
    await click('[data-delete-goal="SG-TEST"]');
    assert(!await evaluate(`document.querySelector("#goal-list").textContent.includes("SG-TEST")`), "safety goal was not deleted");
  });

  await test("ISO 26262 S/E/C matrix derives every ASIL boundary", async () => {
    await click("#add-hara-btn");
    const expected = {
      S1: { E1: ["QM", "QM", "QM"], E2: ["QM", "QM", "QM"], E3: ["QM", "QM", "ASIL A"], E4: ["QM", "ASIL A", "ASIL B"] },
      S2: { E1: ["QM", "QM", "QM"], E2: ["QM", "QM", "ASIL A"], E3: ["QM", "ASIL A", "ASIL B"], E4: ["ASIL A", "ASIL B", "ASIL C"] },
      S3: { E1: ["QM", "QM", "ASIL A"], E2: ["QM", "ASIL A", "ASIL B"], E3: ["ASIL A", "ASIL B", "ASIL C"], E4: ["ASIL B", "ASIL C", "ASIL D"] }
    };
    for (const [severity, exposures] of Object.entries(expected)) {
      for (const [exposure, levels] of Object.entries(exposures)) {
        for (const [index, asil] of levels.entries()) {
          const controllability = `C${index + 1}`;
          const actual = await evaluate(`(() => {
            const form = document.querySelector("#hara-form");
            form.elements.severity.value = "${severity}";
            form.elements.exposure.value = "${exposure}";
            form.elements.controllability.value = "${controllability}";
            form.dispatchEvent(new Event("change", { bubbles: true }));
            return document.querySelector("#asil-preview").textContent;
          })()`);
          assert(actual === asil, `${severity}/${exposure}/${controllability} derived ${actual}, expected ${asil}`);
        }
      }
    }
    for (const [severity, exposure, controllability] of [["S0", "E4", "C3"], ["S3", "E0", "C3"], ["S3", "E4", "C0"]]) {
      const actual = await evaluate(`(() => {
        const form = document.querySelector("#hara-form");
        form.elements.severity.value = "${severity}";
        form.elements.exposure.value = "${exposure}";
        form.elements.controllability.value = "${controllability}";
        form.dispatchEvent(new Event("change", { bubbles: true }));
        return document.querySelector("#asil-preview").textContent;
      })()`);
      assert(actual === "QM", `${severity}/${exposure}/${controllability} should derive QM`);
    }
    await click("#hara-dialog .dialog-close");
  });

  await test("AMR SIL assessment derives SIL 4 and supports edit and delete", async () => {
    await click('[data-view="sil"]');
    const before = await count("#sil-body tr");
    await click("#add-sil-btn");
    assert(await isOpen("#sil-dialog"), "SIL dialog did not open");
    await click("#sil-dialog .dialog-close");
    assert(!await isOpen("#sil-dialog"), "SIL dialog close button failed");
    await click("#add-sil-btn");
    await fill('#sil-form [name="assessmentId"]', "SIL-TEST");
    await fill('#sil-form [name="safetyFunction"]', "Test AMR protective stop");
    await fill('#sil-form [name="hazardousEvent"]', "AMR fails to stop before collision.");
    await fill('#sil-form [name="consequence"]', "C4");
    await fill('#sil-form [name="frequency"]', "F2");
    await fill('#sil-form [name="avoidance"]', "P2");
    await fill('#sil-form [name="demand"]', "W3");
    assert(await evaluate(`document.querySelector("#sil-preview").textContent`) === "SIL 4", "SIL preview did not derive SIL 4");
    await click("#sil-dialog .dialog-actions .primary");
    assert(await count("#sil-body tr") === before + 1, "SIL assessment was not added");
    assert(await evaluate(`document.querySelector("#sil-body tr:last-child").textContent.includes("SIL 4")`), "saved SIL assessment does not show SIL 4");
    await click("#sil-body tr:last-child [data-edit-sil]");
    await fill('#sil-form [name="evidence"]', "Updated stopping-distance report");
    await click("#sil-dialog .dialog-actions .primary");
    assert(await evaluate(`document.querySelector("#sil-body tr:last-child").textContent.includes("Updated stopping-distance")`), "SIL assessment was not edited");
    await click("#sil-body tr:last-child [data-delete-sil]");
    assert(await count("#sil-body tr") === before, "SIL assessment was not deleted");
  });

  await test("AMR risk graph derives each target SIL boundary", async () => {
    await click("#add-sil-btn");
    for (const [consequence, frequency, avoidance, demand, expected] of [
      ["C1", "F1", "P1", "W1", "No SIL"],
      ["C1", "F1", "P2", "W2", "SIL 1"],
      ["C2", "F1", "P2", "W2", "SIL 2"],
      ["C3", "F1", "P2", "W2", "SIL 3"],
      ["C4", "F1", "P2", "W2", "SIL 4"],
      ["C4", "F2", "P2", "W3", "SIL 4"]
    ]) {
      const actual = await evaluate(`(() => {
        const form = document.querySelector("#sil-form");
        form.elements.consequence.value = "${consequence}";
        form.elements.frequency.value = "${frequency}";
        form.elements.avoidance.value = "${avoidance}";
        form.elements.demand.value = "${demand}";
        form.dispatchEvent(new Event("change", { bubbles: true }));
        return document.querySelector("#sil-preview").textContent;
      })()`);
      assert(actual === expected, `${consequence}/${frequency}/${avoidance}/${demand} derived ${actual}, expected ${expected}`);
    }
    await click("#sil-dialog .dialog-close");
  });

  await test("quantitative safety calculator derives PFH and PFDavg", async () => {
    await click('[data-view="quantitative"]');
    await evaluate(`state.quantitative.components = []; save();`);
    await click("#add-quant-component-btn");
    assert(await isOpen("#quant-component-dialog"), "quantitative component dialog did not open");
    await click("#quant-component-dialog .dialog-close");
    assert(!await isOpen("#quant-component-dialog"), "quantitative component dialog close button failed");
    await click("#add-quant-component-btn");
    await fill('#quant-component-form [name="role"]', "Test obstacle detection");
    await fill('#quant-component-form [name="lambdaTotal"]', "1e-6");
    await fill('#quant-component-form [name="dangerousFraction"]', "0.5");
    await fill('#quant-component-form [name="diagnosticCoverage"]', "0.8");
    await fill('#quant-component-form [name="proofTestHours"]', "8760");
    await click("#quant-component-dialog .dialog-actions .primary");
    assert(await count("#quant-body tr") === 1, "quantitative component was not added");
    assert(await evaluate(`document.querySelector("#quant-results").textContent.includes("1.00e-7")`), "PFH residual rate was not calculated");
    await fill("#quant-mode", "low");
    assert(await evaluate(`document.querySelector("#quant-results").textContent.includes("4.38e-4")`), "PFDavg was not calculated");
    await click("#quant-body [data-edit-quant]");
    await fill('#quant-component-form [name="channels"]', "2");
    await fill('#quant-component-form [name="beta"]', "0.05");
    await click("#quant-component-dialog .dialog-actions .primary");
    assert(await evaluate(`document.querySelector("#quant-body").textContent.includes("β 0.05")`), "redundant channel beta factor was not displayed");
    await click("#quant-body [data-delete-quant]");
    assert(await count("#quant-body tr") === 0, "quantitative component was not deleted");
  });

  await test("quantitative safety guidance flags high-SIL architecture review", async () => {
    await evaluate(`state.quantitative = structuredClone(seed.quantitative); save();`);
    await evaluate(`state.quantitative.components.forEach(row => { row.lambdaTotal = 1e-9; }); save();`);
    await fill("#quant-mode", "continuous");
    await fill("#quant-target", "SIL 3");
    await fill("#quant-architecture", "1oo1");
    assert(await evaluate(`document.querySelector("#quant-guidance").textContent.includes("redundant-architecture review")`), "high-SIL redundancy guidance is missing");
    await fill("#quant-architecture", "1oo2");
    assert(!await evaluate(`document.querySelector("#quant-guidance").textContent.includes("needs an explicit redundant-architecture review")`), "redundant architecture selection did not update guidance");
  });

  await test("FMEDA evaluates symbolic rates and rolls up diagnostics", async () => {
    await evaluate(`state.fmeda = structuredClone(seed.fmeda); save();`);
    await click('[data-view="fmeda"]');
    assert(await evaluate(`document.querySelector("#fmeda-summary").textContent.includes("8.00e-8")`), "seeded FMEDA λDU rollup is missing");
    assert(await evaluate(`document.querySelector("#fmeda-summary").textContent.includes("90.0%")`), "seeded FMEDA diagnostic coverage is missing");
    await click("#add-constant-btn");
    assert(await isOpen("#constant-dialog"), "constant dialog did not open");
    await fill('#constant-form [name="symbol"]', "lambda_brake");
    await fill('#constant-form [name="value"]', "4e-7");
    await fill('#constant-form [name="description"]', "Brake release failure rate");
    await click("#constant-dialog .dialog-actions .primary");
    assert(await evaluate(`document.querySelector("#constant-list").textContent.includes("lambda_brake")`), "symbolic constant was not added");
    await click("#add-fmeda-btn");
    assert(await isOpen("#fmeda-dialog"), "FMEDA dialog did not open");
    await click("#fmeda-dialog .dialog-close");
    assert(!await isOpen("#fmeda-dialog"), "FMEDA dialog close button failed");
    await click("#add-fmeda-btn");
    await fill('#fmeda-form [name="failureMode"]', "Brake does not release diagnostic stop");
    await fill('#fmeda-form [name="localEffect"]', "Brake state mismatch");
    await fill('#fmeda-form [name="endEffect"]', "AMR remains stopped");
    await fill('#fmeda-form [name="classification"]', "safe");
    await fill('#fmeda-form [name="expression"]', "lambda_brake * (1 + 0.5)");
    assert(await evaluate(`document.querySelector("#expression-preview").textContent`) === "6.00e-7", "symbolic expression preview is incorrect");
    await click("#fmeda-dialog .dialog-actions .primary");
    assert(await count("#fmeda-body tr") === 4, "FMEDA row was not added");
    await click("#fmeda-body tr:last-child [data-edit-fmeda]");
    await fill('#fmeda-form [name="expression"]', "unknown_symbol * 2");
    assert(await evaluate(`document.querySelector("#expression-preview").textContent`) === "Invalid", "unknown symbol was not rejected");
    await fill('#fmeda-form [name="expression"]', "lambda_brake");
    await click("#fmeda-dialog .dialog-actions .primary");
    await click("#fmeda-body tr:last-child [data-delete-fmeda]");
    assert(await count("#fmeda-body tr") === 3, "FMEDA row was not deleted");
    await click('[data-delete-constant="lambda_brake"]');
    assert(!await evaluate(`document.querySelector("#constant-list").textContent.includes("lambda_brake")`), "unused symbolic constant was not deleted");
  });

  await test("FMEDA λDU handoff updates quantitative safety", async () => {
    await click("#sync-fmeda-btn");
    await click('[data-view="quantitative"]');
    assert(await evaluate(`document.querySelector("#quant-body").textContent.includes("SCAN")`), "FMEDA handoff did not preserve architecture component");
    assert(await evaluate(`document.querySelector("#quant-body").textContent.includes("8.00e-8")`), "FMEDA handoff did not update scanner λDU rate");
  });

  await test("PlantUML import updates referenced components", async () => {
    await click('[data-view="architecture"]');
    await fill("#plantuml-source", '@startuml\ncomponent "Test controller" as TEST_CTRL\nnode "Test arm" as TEST_ARM\n@enduml');
    await click("#parse-btn");
    assert(await count("#component-list .component-item") === 2, "PlantUML import did not update components");
    assert(await evaluate(`document.querySelector("#component-list").textContent.includes("TEST_ARM")`), "PlantUML alias is missing");
  });

  await test("PlantUML editor autocompletes keywords and snippets", async () => {
    await fill("#plantuml-source", "comp");
    assert(!await evaluate(`document.querySelector("#plantuml-completions").hidden`), "PlantUML completion menu did not open");
    assert(await evaluate(`document.querySelector("#plantuml-completions").textContent.includes("component")`), "component completion is missing");
    await evaluate(`document.querySelector("#plantuml-source").dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true }))`);
    assert(await evaluate(`document.querySelector("#plantuml-source").value`) === 'component "" as ALIAS', "PlantUML snippet was not inserted");
    assert(await evaluate(`document.querySelector("#plantuml-source").selectionStart`) === 11, "PlantUML snippet cursor was not placed inside the component name");
    assert(await evaluate(`document.querySelector("#plantuml-completions").hidden`), "PlantUML completion menu did not close after insertion");
    await fill("#plantuml-source", '@startuml\ncomponent "Test controller" as TEST_CTRL\nnode "Test arm" as TEST_ARM\n@enduml');
  });

  await test("PlantUML render button displays generated diagram", async () => {
    await click("#render-btn");
    await retry(async () => { assert(await count("#diagram-preview img") === 1, "rendered diagram image did not appear"); });
    assert(await evaluate(`document.querySelector("#render-status").textContent`) === "Diagram rendered", "diagram render status did not report success");
    assert(await evaluate(`document.querySelector("#diagram-preview img").alt`) === "Rendered PlantUML architecture diagram", "rendered diagram alt text is missing");
  });

  await test("lifecycle assurance executes V&V and derives traceability", async () => {
    await click('[data-view="assurance"]');
    assert(await count("#assurance-board .assurance-record-group") === 9, "lifecycle assurance record groups are incomplete");
    await evaluate(`fillAssuranceForm("evidence")`);
    await fill('#assurance-fields [name="id"]', "EV-TEST");
    await fill('#assurance-fields [name="title"]', "Load retention evidence");
    await fill('#assurance-fields [name="kind"]', "Test report");
    await fill('#assurance-fields [name="reference"]', "reports/load-retention.pdf");
    await fill('#assurance-fields [name="version"]', "1.0");
    await fill('#assurance-fields [name="status"]', "Approved");
    await click('#assurance-form button[value="default"]');
    assert(await evaluate(`state.assurance.evidence.some(item => item.id === "EV-TEST" && item.status === "Approved")`), "approved evidence was not saved");

    await evaluate(`fillAssuranceForm("tests")`);
    await fill('#assurance-fields [name="id"]', "VT-TEST");
    await fill('#assurance-fields [name="title"]', "Workpiece retention validation");
    await fill('#assurance-fields [name="requirement"]', "SR-03");
    await fill('#assurance-fields [name="objective"]', "Validate retention after loss of power");
    await fill('#assurance-fields [name="expected"]', "Workpiece remains retained");
    await fill('#assurance-fields [name="actual"]', "Workpiece remained retained in all trials");
    await fill('#assurance-fields [name="configuration"]', "Baseline B1");
    await fill('#assurance-fields [name="status"]', "Passed");
    await fill('#assurance-fields [name="evidence"]', "EV-TEST");
    await click('#assurance-form button[value="default"]');
    assert(await evaluate(`testCoverage("SR-03").covered`), "passed V&V with approved evidence did not cover the requirement");
    assert(await evaluate(`document.querySelector("#traceability-body").textContent.includes("VT-TEST")`), "traceability matrix did not show the V&V record");
    await click('[data-view="requirements"]');
    assert(await evaluate(`[...document.querySelectorAll("#requirement-list .requirement")].find(item => item.textContent.includes("SR-03")).textContent.includes("Verified")`), "requirement status was not derived from V&V evidence");
  });

  await test("lifecycle assurance prevents unsupported closure", async () => {
    await click('[data-view="assurance"]');
    await evaluate(`fillAssuranceForm("tests")`);
    await fill('#assurance-fields [name="id"]', "VT-NO-EVIDENCE");
    await fill('#assurance-fields [name="title"]', "Unsupported pass");
    await fill('#assurance-fields [name="requirement"]', "SR-04");
    await fill('#assurance-fields [name="objective"]', "Attempt unsupported closure");
    await fill('#assurance-fields [name="expected"]', "A measurable result");
    await fill('#assurance-fields [name="actual"]', "Claimed pass");
    await fill('#assurance-fields [name="configuration"]', "Unknown configuration");
    await fill('#assurance-fields [name="status"]', "Passed");
    await click('#assurance-form button[value="default"]');
    assert(await evaluate(`window.__lastAlert.includes("approved evidence")`), "unsupported V&V pass did not report the evidence requirement");
    assert(!await evaluate(`state.assurance.tests.some(item => item.id === "VT-NO-EVIDENCE")`), "unsupported V&V pass was saved");
    await evaluate(`document.querySelector("#assurance-dialog").close()`);
  });

  await test("blank workspace clears all preloaded worksheet data", async () => {
    await evaluate(`state = blankWorkspace(); save();`);
    assert(await evaluate(`document.querySelector("#component-count").textContent`) === "0", "reset did not clear architecture components");
    await click('[data-view="fmea"]');
    assert(await count("#fmea-body tr") === 0, "reset did not clear FMEA rows");
    assert(await count("#hara-body tr") === 0, "reset did not clear HARA rows");
    assert(await count("#sil-body tr") === 0, "reset did not clear SIL assessments");
    assert(await count("#quant-body tr") === 0, "reset did not clear quantitative components");
    assert(await count("#fmeda-body tr") === 0, "reset did not clear FMEDA rows");
    assert(await evaluate(`Object.values(state.assurance).every(items => items.length === 0)`), "reset did not clear lifecycle assurance records");
  });

  await test("existing browser workspaces migrate to include new analysis data", async () => {
    await evaluate(`(() => { const workspace = JSON.parse(localStorage.getItem("safeguard-cobot-workspace-v1")); delete workspace.hara; delete workspace.safetyGoals; delete workspace.silAssessments; delete workspace.quantitative; delete workspace.fmeda; localStorage.removeItem("safeguard-workspaces-v1"); localStorage.removeItem("safeguard-active-workspace-v1"); localStorage.setItem("safeguard-cobot-workspace-v1", JSON.stringify(workspace)); location.reload(); })()`);
    await retry(async () => { assert(await count("#hara-body tr") === 2, "legacy workspace did not receive HARA seed data"); });
    assert(await count("#goal-list .requirement") === 2, "legacy workspace did not receive safety goals");
    assert(await count("#sil-body tr") === 1, "legacy workspace did not receive AMR SIL assessment data");
    assert(await count("#quant-body tr") === 3, "legacy workspace did not receive quantitative safety data");
    assert(await count("#fmeda-body tr") === 3, "legacy workspace did not receive FMEDA data");
    assert(await count("#assurance-board .assurance-record-group") === 9, "legacy workspace did not receive lifecycle assurance data");
  });

  await test("save initiates JSON download", async () => {
    await evaluate(`HTMLAnchorElement.prototype.click = function () { window.__download = this.download; };`);
    await click("#export-btn");
    assert(await evaluate(`window.__download`) === "cobot-safety-case.praxis.json", "save project file did not initiate expected portable JSON download");
    assert(await evaluate(`projectEnvelope().format`) === "praxis-studio-workspace", "export envelope format is missing");
    assert(await evaluate(`parseProject(JSON.stringify({ ...projectEnvelope(), format: "safeguard-safety-workspace" })).name`) === "Cobot safety case", "legacy project format is no longer supported");
    assert(await evaluate(`projectEnvelope().version`) === 1, "export envelope version is missing");
  });

  assert(browserErrors.length === 0, `browser reported exceptions:\n${browserErrors.join("\n")}`);
  console.log("All browser smoke tests passed.");
} catch (error) {
  console.error(error.message);
  if (browserErrors.length) console.error(browserErrors.join("\n"));
  if (ws?.readyState === WebSocket.OPEN) {
    console.error("Loaded URL:", await evaluate("location.href"));
    console.error("Loaded scripts:", await evaluate(`[...document.scripts].map(x => x.src).join(", ")`));
  }
  process.exitCode = 1;
} finally {
  ws?.close();
  browser.kill();
  server.stop();
}
