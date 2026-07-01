import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";

type ProjectRegistry = {
  version: number;
  workspaces: Array<{ id: string; name: string; updatedAt: string; data: unknown }>;
  closedWorkspaces: Array<{ id: string; name: string; updatedAt: string; data: unknown }>;
};

const emptyRegistry = (): ProjectRegistry => ({ version: 1, workspaces: [], closedWorkspaces: [] });

export class ProjectService {
  private registry = emptyRegistry();
  private loaded = false;
  private readonly storagePath: string;
  private readonly legacyStoragePath: string;

  constructor(storagePath?: string) {
    this.storagePath = storagePath || join(import.meta.dir, "..", ".asasbits-data", "projects.json");
    this.legacyStoragePath = storagePath ? "" : join(import.meta.dir, "..", ".praxis-data", "projects.json");
  }

  private async load() {
    if (this.loaded) return;
    this.loaded = true;
    const file = Bun.file(this.storagePath);
    if (await file.exists()) {
      this.registry = this.validate(await file.json());
      return;
    }
    if (this.legacyStoragePath) {
      const legacyFile = Bun.file(this.legacyStoragePath);
      if (await legacyFile.exists()) {
        this.registry = this.validate(await legacyFile.json());
        await this.persist();
      }
    }
  }

  private validate(value: unknown): ProjectRegistry {
    if (!value || typeof value !== "object") throw new Error("Project registry must be an object.");
    const registry = value as Partial<ProjectRegistry>;
    if (!Array.isArray(registry.workspaces) || !Array.isArray(registry.closedWorkspaces)) throw new Error("Project registry lists are required.");
    for (const project of [...registry.workspaces, ...registry.closedWorkspaces]) {
      if (!project?.id || !project?.name || !project?.data) throw new Error("Each project requires an id, name, and data.");
    }
    return { version: Number(registry.version) || 1, workspaces: registry.workspaces, closedWorkspaces: registry.closedWorkspaces };
  }

  private async persist() {
    await mkdir(dirname(this.storagePath), { recursive: true });
    await Bun.write(this.storagePath, JSON.stringify(this.registry, null, 2));
  }

  async handle(request: Request) {
    await this.load();
    if (request.method === "GET") return Response.json(this.registry);
    if (request.method === "PUT") {
      try {
        this.registry = this.validate(await request.json());
        await this.persist();
        return Response.json(this.registry);
      } catch (error) {
        return new Response(error instanceof Error ? error.message : "Invalid project registry.", { status: 400 });
      }
    }
    return new Response("Method not allowed", { status: 405, headers: { allow: "GET, PUT" } });
  }
}
