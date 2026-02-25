#!/usr/bin/env bun
import { readdir, readFile, writeFile, mkdir, copyFile } from "fs/promises";
import { join, dirname, relative } from "path";

const CLI_DIR = join(import.meta.dir, "..");
const ROOT_DIR = join(CLI_DIR, "..", "..");
const MODULES_DIR = join(ROOT_DIR, "modules");
const DIST_DIR = join(CLI_DIR, "dist");
const REGISTRY_IN_DIST = join(DIST_DIR, "registry.json");
const REGISTRY_IN_CLI = join(CLI_DIR, "registry.json");
const SOURCE_IN_DIST = join(DIST_DIR, "source");
const SOURCE_IN_CLI = join(CLI_DIR, "source");

const RAVENJS_PREFIXES = ["@ravenjs/", "@raven.js/"];

/** Module files excluded from registry and source copy (paths relative to module dir) */
const EXCLUDED_MODULE_FILES = new Set(["package.json"]);

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
}

async function getGitTrackedFiles(moduleDir: string): Promise<string[]> {
  const { $ } = await import("bun");
  const relPath = relative(ROOT_DIR, moduleDir);
  const proc = $`git ls-files ${relPath}`.cwd(ROOT_DIR);
  const output = await proc.text();
  const prefix = relPath + "/";
  return output
    .trim()
    .split("\n")
    .filter((f) => f)
    .map((f) => (f.startsWith(prefix) ? f.slice(prefix.length) : f))
    .filter((f) => f && !EXCLUDED_MODULE_FILES.has(f))
    .sort();
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

      const files = await getGitTrackedFiles(moduleDir);
      if (files.length === 0) {
        console.warn(`Warning: ${entry.name} has no git-tracked files (excluding ${[...EXCLUDED_MODULE_FILES].join(", ")}), skipping`);
        continue;
      }

      const guidePath = join(moduleDir, "GUIDE.md");
      const guideExists = await Bun.file(guidePath).exists();
      if (!guideExists) {
        console.error(`Error: Module '${entry.name}' is missing GUIDE.md. Each registry module must provide GUIDE.md.`);
        process.exit(1);
      }

      const dependsOn = extractDependsOn(pkg);
      modules[entry.name] = {
        files,
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

async function getVersion(): Promise<string> {
  const content = await readFile(join(CLI_DIR, "package.json"), "utf-8");
  const pkg = JSON.parse(content) as { version?: string };
  if (pkg.version) return pkg.version;
  return "0.0.0";
}

async function generateRegistry(outputPaths: string[]): Promise<Record<string, ModuleInfo>> {
  const version = await getVersion();
  const modules = await scanModules();

  const cycle = detectCycle(modules);
  if (cycle) {
    console.error(`Error: Circular dependency detected: ${cycle.join(" -> ")}`);
    process.exit(1);
  }

  const registry: Registry = { version, modules };
  const content = JSON.stringify(registry, null, 2);

  for (const p of outputPaths) {
    await mkdir(dirname(p), { recursive: true });
    await writeFile(p, content);
  }

  console.log(
    `Registry generated (version: ${version}, modules: ${Object.keys(modules).join(", ")})`,
  );

  return modules;
}

async function copyModuleSources(
  modules: Record<string, ModuleInfo>,
  outputDirs: string[],
): Promise<void> {
  for (const outDir of outputDirs) {
    await mkdir(outDir, { recursive: true });
  }

  const copies: Promise<void>[] = [];

  for (const [moduleName, moduleInfo] of Object.entries(modules)) {
    const srcModuleDir = join(MODULES_DIR, moduleName);

    for (const file of moduleInfo.files) {
      const srcPath = join(srcModuleDir, file);

      for (const outDir of outputDirs) {
        const destPath = join(outDir, moduleName, file);
        copies.push(
          mkdir(dirname(destPath), { recursive: true }).then(() =>
            copyFile(srcPath, destPath),
          ),
        );
      }
    }
  }

  await Promise.all(copies);

  const totalFiles = Object.values(modules).reduce((sum, m) => sum + m.files.length, 0);
  console.log(`Module sources copied (${Object.keys(modules).length} modules, ${totalFiles} files)`);
}

async function main() {
  const registryOnly = process.argv.includes("--registry-only");

  const modules = await generateRegistry([REGISTRY_IN_DIST, REGISTRY_IN_CLI]);
  await copyModuleSources(modules, [SOURCE_IN_DIST, SOURCE_IN_CLI]);

  if (registryOnly) {
    return;
  }

  await mkdir(DIST_DIR, { recursive: true });
  await Bun.build({
    entrypoints: [join(CLI_DIR, "index.ts")],
    outdir: DIST_DIR,
    target: "node",
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
