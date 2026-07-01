import { join, normalize } from "path";
import { buildApp } from "./scripts/build-app.ts";
import { ProjectService } from "./services/project-service.ts";

const root = import.meta.dir;
const port = Number(process.env.PORT || 8080);
const jar = join(root, "vendor", "plantuml.jar");
const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".md": "text/markdown", ".svg": "image/svg+xml" };
const projectService = new ProjectService();

export async function renderPlantUml(source) {
  const process = Bun.spawn(["java", "-Djava.awt.headless=true", "-jar", jar, "-tsvg", "-pipe"], {
    stdin: new Blob([source]),
    stdout: "pipe",
    stderr: "pipe"
  });
  const [svg, error, exitCode] = await Promise.all([new Response(process.stdout).text(), new Response(process.stderr).text(), process.exited]);
  if (exitCode !== 0 || !svg.includes("<svg")) throw new Error(error.trim() || "PlantUML did not produce an SVG diagram.");
  return svg;
}

export function startServer(serverPort = port) {
  return Bun.serve({
    port: serverPort,
    async fetch(request) {
      const url = new URL(request.url);
      if (url.pathname === "/api/projects") return projectService.handle(request);
      if (url.pathname === "/api/plantuml/render") {
        if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
        try {
          const source = await request.text();
          if (!source.trim()) return new Response("PlantUML source is required.", { status: 400 });
          return new Response(await renderPlantUml(source), { headers: { "content-type": "image/svg+xml; charset=utf-8" } });
        } catch (error) {
          return new Response(error.message, { status: 500 });
        }
      }
      const requested = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
      const path = normalize(join(root, requested));
      if (!path.startsWith(root)) return new Response("Not found", { status: 404 });
      const file = Bun.file(path);
      if (!await file.exists()) return new Response("Not found", { status: 404 });
      const extension = path.slice(path.lastIndexOf("."));
      return new Response(file, { headers: { "content-type": mime[extension] || "application/octet-stream" } });
    }
  });
}

if (import.meta.main) {
  await buildApp();
  const server = startServer();
  console.log(`AsasBits Studio running at http://localhost:${server.port}`);
}
