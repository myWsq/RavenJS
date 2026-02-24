#!/usr/bin/env bun
import { readdir, readFile, writeFile, mkdir } from "fs/promises";
import { join, dirname } from "path";

const CLI_DIR = join(import.meta.dir, "..");
const ROOT_DIR = join(CLI_DIR, "..", "..");
const MODULES_DIR = join(ROOT_DIR, "modules");
const AI_PACKAGE_DIR = join(ROOT_DIR, "packages", "ai");
const DIST_DIR = join(CLI_DIR, "dist");
const REGISTRY_IN_DIST = join(DIST_DIR, "registry.json");
const REGISTRY_IN_CLI = join(CLI_DIR, "registry.json");

const RAVENJS_PREFIXES = ["@ravenjs/", "@raven.js/"];

function extractDependsOn(pkg: {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}): string[] {
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  const dependsOn: string[] = [];
  for (const key of Object.keys(deps)) {
    const prefix = RAVENJS_PREFIXES.find((p) => key.startsWith(p));
    if (prefix) {
      const moduleName = key.slice(prefix.length);
      if (moduleName && !dependsOn.includes(moduleName)) {
        dependsOn.push(moduleName);
      }
    }
  }
  return dependsOn;
}

function detectCycle(
  modules: Record<string, { dependsOn: string[] }>,
): string[] | null {
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
    } catch {
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

async function getVersion(): Promise<string> {
  const content = await Bun.file(join(CLI_DIR, "package.json")).text();
  const pkg = JSON.parse(content) as { version?: string };
  if (pkg.version) return pkg.version;
  return "0.0.0";
}

async function generateRegistry(outputPaths: string[]): Promise<void> {
  const version = await getVersion();
  const [modules, ai] = await Promise.all([scanModules(), scanAi()]);

  const cycle = detectCycle(modules);
  if (cycle) {
    console.error(`Error: Circular dependency detected: ${cycle.join(" -> ")}`);
    process.exit(1);
  }

  const registry: Registry = { version, modules, ai };
  const content = JSON.stringify(registry, null, 2);

  for (const p of outputPaths) {
    await mkdir(dirname(p), { recursive: true });
    await writeFile(p, content);
  }

  console.log(
    `Registry generated (version: ${version}, modules: ${Object.keys(modules).join(", ")})`,
  );
}

async function main() {
  const registryOnly = process.argv.includes("--registry-only");

  await generateRegistry([REGISTRY_IN_DIST, REGISTRY_IN_CLI]);

  if (registryOnly) {
    return;
  }

  await mkdir(DIST_DIR, { recursive: true });
  await Bun.build({
    entrypoints: [join(CLI_DIR, "index.ts")],
    outdir: DIST_DIR,
    target: "bun",
    naming: "raven",
    sourcemap: "linked",
    packages: "external",
  });
  console.log("CLI built to dist/raven");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
