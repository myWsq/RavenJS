#!/usr/bin/env bun

import { Command } from "commander";
import { mkdir, readdir, stat, readFile, writeFile, access } from "fs/promises";
import { join, dirname, resolve, isAbsolute } from "path";
import { cwd } from "process";
import { createHash } from "crypto";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
import pc from "picocolors";
import { spinner as makeSpinner, log } from "@clack/prompts";
import { parse, stringify } from "yaml";

function loadCliVersion(): string {
  return process.env.RAVEN_CLI_VERSION ?? "0.0.0";
}

const DEFAULT_ROOT = "raven";

interface CLIOptions {
  verbose?: boolean;
  root?: string;
  prerelease?: boolean;
  registry?: string;
  language?: string;
}

interface RegistryModule {
  files: string[];
  fileMapping?: Record<string, string>;
  dependencies?: Record<string, string>;
  dependsOn?: string[];
  description?: string;
}

interface Registry {
  version: string;
  modules: Record<string, RegistryModule>;
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function loadRegistry(options?: { registry?: string }): Promise<Registry> {
  const candidates: string[] = [];
  if (options?.registry) {
    candidates.push(
      isAbsolute(options.registry) ? options.registry : resolve(cwd(), options.registry),
    );
  }
  if (process.env.RAVEN_DEFAULT_REGISTRY_PATH) {
    const p = process.env.RAVEN_DEFAULT_REGISTRY_PATH;
    candidates.push(isAbsolute(p) ? p : resolve(cwd(), p));
  }
  candidates.push(join(__dirname, "registry.json"));

  for (const p of candidates) {
    if (await fileExists(p)) {
      const content = await readFile(p, "utf-8");
      return JSON.parse(content) as Registry;
    }
  }
  console.error("registry.json not found. Run 'bun run build' in packages/cli first.");
  process.exit(1);
}

function getRoot(options: CLIOptions): string {
  return options.root || process.env.RAVEN_ROOT || DEFAULT_ROOT;
}

async function verboseLog(message: string, options?: CLIOptions) {
  if (options?.verbose) {
    console.log(message);
  }
}

function error(message: string): never {
  // Use stderr for programmatic consumption (e.g. tests, piping). @clack/prompts
  // log.error writes to stdout which breaks stderr-based assertions.
  console.error(message);
  process.exit(1);
}

function success(message: string) {
  log.success(message);
}

function printSectionHeader(title: string) {
  log.step(title);
}

function printListItem(item: string) {
  log.message(item, { symbol: pc.dim("-") });
}

async function ensureDir(path: string) {
  try {
    await mkdir(path, { recursive: true });
  } catch (e: any) {
    if (e.code !== "EEXIST") throw e;
  }
}

async function isDirEmpty(path: string): Promise<boolean> {
  try {
    const entries = await readdir(path);
    return entries.length === 0;
  } catch (e: any) {
    if (e.code === "ENOENT") return true;
    throw e;
  }
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch (e: any) {
    if (e.code === "ENOENT") return false;
    throw e;
  }
}

async function ensureRavenInstalled(
  options: CLIOptions,
): Promise<{ ravenDir: string; version: string }> {
  const targetDir = cwd();
  const root = getRoot(options);
  const ravenDir = join(targetDir, root);

  if (!(await pathExists(ravenDir))) {
    error(`RavenJS not installed at ${root}/. Run 'raven init' first.`);
  }

  const yamlPath = join(ravenDir, "raven.yaml");
  try {
    const content = await readFile(yamlPath, "utf-8");
    const config = parse(content) as RavenYamlConfig;
    if (!config?.version) {
      error("Invalid raven.yaml: version field is missing");
    }
    return { ravenDir, version: config.version };
  } catch (e: any) {
    error(`Failed to load raven.yaml: ${e.message}`);
  }
}

function getModuleNames(registry: Registry): string[] {
  return Object.keys(registry.modules);
}

function getInstallOrder(moduleName: string, registry: Registry, installed: Set<string>): string[] {
  const result: string[] = [];
  const visited = new Set<string>();
  const recStack = new Set<string>();
  const path: string[] = [];
  let cycle: string[] | null = null;

  function visit(name: string) {
    if (recStack.has(name)) {
      const idx = path.indexOf(name);
      cycle = path.slice(idx).concat(name);
      return;
    }
    if (visited.has(name)) return;
    visited.add(name);
    recStack.add(name);
    path.push(name);

    const mod = registry.modules[name];
    if (mod?.dependsOn) {
      for (const dep of mod.dependsOn) {
        if (registry.modules[dep]) visit(dep);
      }
    }
    if (!installed.has(name)) {
      result.push(name);
    }
    path.pop();
    recStack.delete(name);
  }

  visit(moduleName);
  if (cycle !== null) {
    error(`Circular dependency: ${(cycle as string[]).join(" -> ")}`);
  }
  return result;
}

const RAVENJS_PREFIX = "@raven.js/";

function replaceRavenImports(content: string, fromModuleDir: string, registry: Registry): string {
  const moduleNames = Object.keys(registry.modules);
  let out = content;
  const depth = fromModuleDir.split("/").filter(Boolean).length;
  const prefix = depth > 0 ? "../".repeat(depth) : "./";
  for (const modName of moduleNames) {
    const pkg = `${RAVENJS_PREFIX}${modName}`;
    const rel = prefix + modName;

    const dq = new RegExp(`from\\s+"${pkg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`, "g");
    const sq = new RegExp(`from\\s+'${pkg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}'`, "g");
    out = out.replace(dq, `from "${rel}"`).replace(sq, `from '${rel}'`);
  }
  return out;
}

const SOURCE_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx"];

function isSourceFile(file: string): boolean {
  return SOURCE_EXTENSIONS.some((ext) => file.endsWith(ext));
}

async function installModule(
  registry: Registry,
  moduleName: string,
  destDir: string,
  options?: CLIOptions,
  targetSubdir?: string,
): Promise<string[]> {
  const module = registry.modules[moduleName];
  if (!module) {
    throw new Error(`Module ${moduleName} not found in registry`);
  }

  verboseLog(`Installing ${moduleName} files...`, options);

  const embeddedSourceDir = join(__dirname, "source");
  const fromModuleDir = targetSubdir ?? moduleName;

  const modifiedFiles: string[] = [];
  const copies = module.files.map(async (file: string) => {
    let destPath: string;

    if (module.fileMapping?.[file]) {
      destPath = join(destDir, module.fileMapping[file]);
    } else if (targetSubdir) {
      destPath = join(destDir, targetSubdir, file);
    } else {
      destPath = join(destDir, moduleName, file);
    }

    verboseLog(`  Copying ${file}...`, options);

    const srcPath = join(embeddedSourceDir, moduleName, file);
    if (!(await fileExists(srcPath))) {
      throw new Error(`Missing embedded source file: ${srcPath}`);
    }

    let content = await readFile(srcPath, "utf-8");

    if (isSourceFile(file)) {
      content = replaceRavenImports(content, fromModuleDir, registry);
    }

    await ensureDir(dirname(destPath));
    await writeFile(destPath, content);
    modifiedFiles.push(destPath);
  });

  await Promise.all(copies);
  return modifiedFiles;
}

async function cmdInit(options: CLIOptions) {
  const registry = await loadRegistry(options);
  const targetDir = cwd();
  const root = getRoot(options);
  const ravenDir = join(targetDir, root);

  verboseLog(`Initializing RavenJS in ${targetDir}`, options);

  const version = registry.version;
  const modifiedFiles: string[] = [];

  const ravenRootExists = await pathExists(ravenDir);
  const ravenYamlPath = join(ravenDir, "raven.yaml");
  const ravenYamlExists = await pathExists(ravenYamlPath);

  const doInit = async () => {
    if (!ravenRootExists || !ravenYamlExists) {
      await ensureDir(ravenDir);
      await createRavenYaml(ravenDir, version, options?.language);
      modifiedFiles.push(ravenYamlPath);
    }
  };

  if (options?.verbose) {
    await doInit();
  } else {
    const s = makeSpinner();
    s.start("Initializing raven root...");
    try {
      await doInit();
    } catch (e: any) {
      s.stop("Initialization failed");
      error(e.message);
    }
    s.stop("Initializing raven root...");
  }

  success(
    "RavenJS raven root initialized. Install AI skills with: install-raven (or npx install-raven).",
  );

  printSectionHeader("Modified Files");
  for (const file of modifiedFiles) {
    printListItem(file);
  }

  printSectionHeader("Status");
  const status = await getStatus(registry, options);
  console.log(JSON.stringify(status));
}

interface RavenYamlConfig {
  version: string;
  language?: string;
}

async function createRavenYaml(destDir: string, version: string, language?: string) {
  const data: RavenYamlConfig = { version };
  if (language !== undefined) {
    data.language = language;
  }
  const content = stringify(data);
  await writeFile(join(destDir, "raven.yaml"), content);
}

async function getInstalledModules(ravenDir: string, registry: Registry): Promise<Set<string>> {
  const installed = new Set<string>();
  for (const name of getModuleNames(registry)) {
    const modDir = join(ravenDir, name);
    if ((await pathExists(modDir)) && !(await isDirEmpty(modDir))) {
      installed.add(name);
    }
  }
  return installed;
}

async function cmdAdd(moduleName: string, options: CLIOptions) {
  const registry = await loadRegistry(options);
  if (!moduleName) {
    error(`Please specify a module to add. Available: ${getModuleNames(registry).join(", ")}`);
  }

  const available = getModuleNames(registry);

  if (!available.includes(moduleName)) {
    error(`Unknown module: ${moduleName}`);
  }

  const { ravenDir } = await ensureRavenInstalled(options);

  const installed = await getInstalledModules(ravenDir, registry);
  const order = getInstallOrder(moduleName, registry, installed);

  try {
    const modifiedFiles: string[] = [];
    const allDependencies: Record<string, string> = {};
    for (const name of order) {
      const files = await installModule(registry, name, ravenDir, options);
      modifiedFiles.push(...files);
      const mod = registry.modules[name];
      if (mod?.dependencies) {
        Object.assign(allDependencies, mod.dependencies);
      }
    }

    // Two JSON lines for Agent: add result + status in one call to save tokens.
    console.log(
      JSON.stringify({
        success: true,
        moduleName,
        modifiedFiles,
        dependencies: allDependencies,
      }),
    );
    const status = await getStatus(registry, options);
    console.log(JSON.stringify(status));
  } catch (e: any) {
    error(e.message);
  }
}

// === SECTION: Status ===

interface ModuleInfo {
  name: string;
  description?: string;
  installed: boolean;
  /** 模块目录的绝对路径 */
  installDir?: string;
}

interface StatusResult {
  modules: ModuleInfo[];
  version?: string;
  language?: string;
  modifiedFiles?: string[];
  fileHashes?: Record<string, string>;
}

async function computeFileHash(filePath: string): Promise<string> {
  const content = await readFile(filePath);
  return createHash("sha256").update(content).digest("hex");
}

async function getStatus(registry: Registry, options: CLIOptions): Promise<StatusResult> {
  const targetDir = cwd();
  const root = getRoot(options);
  const ravenDir = join(targetDir, root);

  let currentVersion: string | undefined;
  const modifiedFiles: string[] = [];
  const fileHashes: Record<string, string> = {};

  const knownModules = getModuleNames(registry).sort();
  const moduleStatus: ModuleInfo[] = [];
  let language: string | undefined;

  if (await pathExists(ravenDir)) {
    const yamlPath = join(ravenDir, "raven.yaml");
    try {
      const content = await readFile(yamlPath, "utf-8");
      const config = parse(content) as RavenYamlConfig;
      if (config?.version) {
        currentVersion = config.version;
      }
      if (config?.language !== undefined) {
        language = config.language;
      }
    } catch (_e) {
      // raven.yaml missing or invalid
    }

    for (const name of knownModules) {
      const modDir = join(ravenDir, name);
      const installed = (await pathExists(modDir)) && !(await isDirEmpty(modDir));
      const mod = registry.modules[name];
      moduleStatus.push({
        name,
        description: mod?.description,
        installed,
        installDir: resolve(modDir),
      });
    }

    // Compute file hashes for all files in raven/
    async function traverseDir(dir: string, baseDir: string) {
      const dirEntries = await readdir(dir, { withFileTypes: true });
      for (const e of dirEntries) {
        const fullPath = join(dir, e.name);
        const relPath = fullPath.slice(baseDir.length + 1);
        if (e.isDirectory()) {
          await traverseDir(fullPath, baseDir);
        } else {
          const hash = await computeFileHash(fullPath);
          fileHashes[relPath] = hash;
        }
      }
    }
    await traverseDir(ravenDir, ravenDir);
  }

  if (moduleStatus.length === 0) {
    for (const name of knownModules) {
      const mod = registry.modules[name];
      const modDir = join(ravenDir, name);
      moduleStatus.push({
        name,
        description: mod?.description,
        installed: false,
        installDir: resolve(modDir),
      });
    }
  }

  return {
    modules: moduleStatus,
    version: currentVersion,
    language: language ?? "English (default)",
    modifiedFiles,
    fileHashes,
  };
}

interface StatusCLIOptions extends CLIOptions {}

async function cmdStatus(options: StatusCLIOptions) {
  const registry = await loadRegistry(options);
  const status = await getStatus(registry, options);
  console.log(JSON.stringify(status));
}

const program = new Command("raven");
program.version(loadCliVersion());

program
  .option("--registry <path>", "Registry json path (default: same dir as CLI)")
  .option("--root <dir>", "RavenJS root directory (default: raven)")
  .option("-v, --verbose", "Verbose output");

program
  .command("init")
  .description(
    "Initialize raven root (directory and raven.yaml). Install AI skills with install-raven.",
  )
  .option("--language <lang>", "Language (stored in raven.yaml)")
  .action(function (this: { opts: () => CLIOptions }) {
    const opts = this.opts();
    cmdInit({ ...program.opts(), language: opts.language } as CLIOptions);
  });

program
  .command("add <module>")
  .description("Add a module (e.g., core)")
  .action((module: string) => cmdAdd(module, program.opts() as CLIOptions));

program
  .command("status")
  .description("Show RavenJS installation status (core, modules)")
  .action(() => cmdStatus(program.opts() as StatusCLIOptions));

program.parse();
