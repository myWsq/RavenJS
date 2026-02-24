import { readdir, readFile, writeFile } from "fs/promises";
import { join } from "path";

const ROOT_DIR = join(import.meta.dir, "..", "..", "..");
const MODULES_DIR = join(ROOT_DIR, "modules");
const AI_PACKAGE_DIR = join(ROOT_DIR, "packages", "ai");
const OUTPUT_DIR = join(ROOT_DIR, "packages", "cli");
const OUTPUT_FILE = join(OUTPUT_DIR, "registry.json");

const RAVENJS_PREFIX = "@ravenjs/";

function extractDependsOn(pkg: { dependencies?: Record<string, string>; devDependencies?: Record<string, string> }): string[] {
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  const dependsOn: string[] = [];
  for (const key of Object.keys(deps)) {
    if (key.startsWith(RAVENJS_PREFIX)) {
      const moduleName = key.slice(RAVENJS_PREFIX.length);
      if (moduleName && !dependsOn.includes(moduleName)) {
        dependsOn.push(moduleName);
      }
    }
  }
  return dependsOn;
}

function detectCycle(modules: Record<string, { dependsOn: string[] }>): string[] | null {
  const visited = new Set<string>();
  const recStack = new Set<string>();
  const path: string[] = [];
  function visit(name: string): string[] | null {
    if (recStack.has(name)) {
      const idx = path.indexOf(name);
      return path.slice(idx).concat(name);
    }
    if (visited.has(name)) return null;
    visited.add(name);
    recStack.add(name);
    path.push(name);

    const mod = modules[name];
    if (mod?.dependsOn) {
      for (const dep of mod.dependsOn) {
        if (modules[dep]) {
          const cycle = visit(dep);
          if (cycle) return cycle;
        }
      }
    }
    path.pop();
    recStack.delete(name);
    return null;
  }

  for (const name of Object.keys(modules)) {
    const cycle = visit(name);
    if (cycle) return cycle;
  }
  return null;
}

interface ModuleInfo {
  files: string[];
  dependencies: Record<string, string>;
  dependsOn: string[];
  description?: string;
}

interface Registry {
  version: string;
  modules: Record<string, ModuleInfo>;
  ai: { claude: Record<string, string> };
}

async function scanModules(): Promise<Record<string, ModuleInfo>> {
  const modules: Record<string, ModuleInfo> = {};

  const entries = await readdir(MODULES_DIR, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const moduleDir = join(MODULES_DIR, entry.name);
    const packageJsonPath = join(moduleDir, "package.json");

    try {
      const content = await readFile(packageJsonPath, "utf-8");
      const pkg = JSON.parse(content);

      if (!pkg.files) {
        console.warn(`Warning: ${entry.name} has no files field, skipping`);
        continue;
      }

      const dependsOn = extractDependsOn(pkg);
      modules[entry.name] = {
        files: pkg.files,
        dependencies: pkg.dependencies || {},
        dependsOn,
        description: pkg.description,
      };
    } catch (e) {
      console.warn(`Warning: Could not read package.json for ${entry.name}`);
    }
  }

  return modules;
}

async function scanAi(): Promise<{ claude: Record<string, string> }> {
  const packageJsonPath = join(AI_PACKAGE_DIR, "package.json");
  const content = await readFile(packageJsonPath, "utf-8");
  const pkg = JSON.parse(content);

  const claude = pkg.claude;
  if (!claude || typeof claude !== "object") {
    throw new Error("packages/ai/package.json must have a 'claude' mapping");
  }

  return { claude };
}

async function generateRegistry(): Promise<void> {
  const args = process.argv.slice(2);
  const argVersion = args[0];
  const envVersion =
    process.env.RAVEN_VERSION ||
    process.env.RELEASE_VERSION ||
    process.env.CLI_VERSION;
  const version = argVersion || envVersion;

  if (!version) {
    console.error("Error: Version argument required");
    console.error("Usage: bun run scripts/generate-registry.ts <version>");
    process.exit(1);
  }

  const [modules, ai] = await Promise.all([scanModules(), scanAi()]);

  const cycle = detectCycle(modules);
  if (cycle) {
    console.error(`Error: Circular dependency detected: ${cycle.join(" -> ")}`);
    process.exit(1);
  }

  const registry: Registry = {
    version,
    modules,
    ai,
  };

  await writeFile(OUTPUT_FILE, JSON.stringify(registry, null, 2));
  console.log(`Registry generated at ${OUTPUT_FILE}`);
  console.log(`Version: ${version}`);
  console.log(`Modules: ${Object.keys(modules).join(", ")}`);
  console.log(`AI: ${Object.keys(ai.claude).length} files (claude)`);
}

generateRegistry().catch(console.error);
