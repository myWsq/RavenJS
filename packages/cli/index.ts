#!/usr/bin/env bun

import { cac } from "cac";
import { mkdir, rm, readdir, stat } from "fs/promises";
import { join, dirname, resolve, isAbsolute } from "path";
import { cwd } from "process";
import pc from "picocolors";
import { spinner as makeSpinner, log } from "@clack/prompts";
import { parse, stringify } from "yaml";

function loadCliVersion(): string {
  return process.env.RAVEN_CLI_VERSION ?? "0.0.0";
}

const GITHUB_REPO = "myWsq/RavenJS";
const GITHUB_RAW_URL = `https://raw.githubusercontent.com/${GITHUB_REPO}`;
const DEFAULT_ROOT = "raven";

interface CLIOptions {
  verbose?: boolean;
  root?: string;
  source?: string;
  prerelease?: boolean;
  registry?: string;
}

interface RegistryModule {
  files: string[];
  fileMapping?: Record<string, string>;
  dependencies?: Record<string, string>;
  dependsOn?: string[];
  description?: string;
}

interface RegistryAi {
  claude: Record<string, string>;
}

interface Registry {
  version: string;
  modules: Record<string, RegistryModule>;
  ai: RegistryAi;
}

async function loadRegistry(options?: { registry?: string }): Promise<Registry> {
  const registryArg = options?.registry ?? process.env.RAVEN_DEFAULT_REGISTRY_PATH;
  if (!registryArg) {
    console.error("RAVEN_DEFAULT_REGISTRY_PATH is required (or use --registry)");
    process.exit(1);
  }
  const path = isAbsolute(registryArg) ? registryArg : resolve(cwd(), registryArg);
  return (await Bun.file(path).json()) as Registry;
}

function getRoot(options: CLIOptions): string {
  return options.root || process.env.RAVEN_ROOT || DEFAULT_ROOT;
}

function getSource(options: CLIOptions): string | undefined {
  return options.source || process.env.RAVEN_SOURCE;
}

function resolveSourcePath(source?: string): string | undefined {
  if (!source || source === "github") return undefined;
  return isAbsolute(source) ? source : resolve(cwd(), source);
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

async function ensureRavenInstalled(options: CLIOptions): Promise<{ ravenDir: string; version: string }> {
  const targetDir = cwd();
  const root = getRoot(options);
  const ravenDir = join(targetDir, root);

  if (!(await pathExists(ravenDir))) {
    error(`RavenJS not installed at ${root}/. Run 'raven init' first.`);
  }

  const yamlPath = join(ravenDir, "raven.yaml");
  try {
    const content = await Bun.file(yamlPath).text();
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

function getInstallOrder(
  moduleName: string,
  registry: Registry,
  installed: Set<string>,
): string[] {
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

const RAVENJS_PREFIX = "@ravenjs/";

function replaceRavenImports(
  content: string,
  fromModuleDir: string,
  registry: Registry,
): string {
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

async function downloadFile(url: string, destPath: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status}`);
  }
  const content = await response.text();
  await ensureDir(dirname(destPath));
  await Bun.write(destPath, content);
}

async function copyLocalFile(srcPath: string, destPath: string): Promise<void> {
  const exists = await Bun.file(srcPath).exists();
  if (!exists) {
    throw new Error(`Missing local file: ${srcPath}`);
  }
  await ensureDir(dirname(destPath));
  await Bun.write(destPath, Bun.file(srcPath));
}

const SOURCE_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx"];

function isSourceFile(file: string): boolean {
  return SOURCE_EXTENSIONS.some((ext) => file.endsWith(ext));
}

async function downloadModule(
  registry: Registry,
  moduleName: string,
  version: string,
  destDir: string,
  options?: CLIOptions,
  targetSubdir?: string,
): Promise<string[]> {
  const module = registry.modules[moduleName];
  if (!module) {
    throw new Error(`Module ${moduleName} not found in registry`);
  }

  const sourcePath = resolveSourcePath(getSource(options || {}));
  if (sourcePath) {
    verboseLog(`Using local source: ${sourcePath}`, options);
  }
  verboseLog(`Downloading ${moduleName} files...`, options);

  const fromModuleDir = targetSubdir ?? moduleName;

  const modifiedFiles: string[] = [];
  const downloads = module.files.map(async (file: string) => {
    let destPath: string;

    if (module.fileMapping && module.fileMapping[file]) {
      destPath = join(destDir, module.fileMapping[file]);
    } else if (targetSubdir) {
      destPath = join(destDir, targetSubdir, file);
    } else {
      destPath = join(destDir, moduleName, file);
    }

    verboseLog(`  Downloading ${file}...`, options);

    let content: string;
    if (sourcePath) {
      const primaryPath = join(sourcePath, "modules", moduleName, file);
      const fallbackPath = join(sourcePath, moduleName, file);
      const src = (await Bun.file(primaryPath).exists())
        ? primaryPath
        : (await Bun.file(fallbackPath).exists())
          ? fallbackPath
          : "";
      if (!src) throw new Error(`Missing local file: ${primaryPath}`);
      content = await Bun.file(src).text();
    } else {
      const url = `${GITHUB_RAW_URL}/v${version}/modules/${moduleName}/${file}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to download ${url}: ${response.status}`);
      content = await response.text();
    }

    if (isSourceFile(file)) {
      content = replaceRavenImports(content, fromModuleDir, registry);
    }

    await ensureDir(dirname(destPath));
    await Bun.write(destPath, content);
    modifiedFiles.push(destPath);
  });

  await Promise.all(downloads);
  return modifiedFiles;
}

async function downloadAiResources(
  registry: Registry,
  version: string,
  destDir: string,
  options?: CLIOptions,
): Promise<string[]> {
  const ai = registry.ai;
  if (!ai?.claude) {
    throw new Error("AI resources not found in registry");
  }

  const mapping = ai.claude;
  const entries = Object.entries(mapping);

  const sourcePath = resolveSourcePath(getSource(options || {}));
  if (sourcePath) {
    verboseLog(`Using local source: ${sourcePath}`, options);
  }
  verboseLog("Downloading AI resources...", options);

  const modifiedFiles: string[] = [];
  const downloads = entries.map(async ([file, destRel]) => {
    const destPath = join(destDir, destRel);
    verboseLog(`  Downloading ${file}...`, options);

    if (sourcePath) {
      const sourceFile = join(sourcePath, "packages", "ai", file);
      await copyLocalFile(sourceFile, destPath);
    } else {
      const url = `${GITHUB_RAW_URL}/v${version}/packages/ai/${file}`;
      await downloadFile(url, destPath);
    }
    modifiedFiles.push(destPath);
  });

  await Promise.all(downloads);
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
      await createRavenYaml(ravenDir, version);
      modifiedFiles.push(ravenYamlPath);
    }

    const dotClaudeDir = join(targetDir, ".claude");
    await ensureDir(dotClaudeDir);
    const aiFiles = await downloadAiResources(registry, version, targetDir, options);
    modifiedFiles.push(...aiFiles);
  };

  if (options?.verbose) {
    await doInit();
  } else {
    const s = makeSpinner();
    s.start("Initializing RavenJS...");
    try {
      await doInit();
    } catch (e: any) {
      s.stop("Initialization failed");
      error(e.message);
    }
    s.stop("Initializing RavenJS...");
  }

  success("RavenJS initialized successfully!");

  printSectionHeader("Modified Files");
  for (const file of modifiedFiles) {
    printListItem(file);
  }
}

interface RavenYamlConfig {
  version: string;
}

async function createRavenYaml(destDir: string, version: string) {
  const content = stringify({ version });
  await Bun.write(join(destDir, "raven.yaml"), content);
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

  const { ravenDir, version } = await ensureRavenInstalled(options);

  const installed = await getInstalledModules(ravenDir, registry);
  const order = getInstallOrder(moduleName, registry, installed);

  try {
    const modifiedFiles: string[] = [];
    const allDependencies: Record<string, string> = {};
    for (const name of order) {
      const files = await downloadModule(registry, name, version, ravenDir, options);
      modifiedFiles.push(...files);
      const mod = registry.modules[name];
      if (mod?.dependencies) {
        Object.assign(allDependencies, mod.dependencies);
      }
    }

    console.log(JSON.stringify({ success: true, moduleName, modifiedFiles, dependencies: allDependencies }));
  } catch (e: any) {
    error(e.message);
  }
}

// === SECTION: Status ===

interface ModuleStatus {
  name: string;
  installed: boolean;
  description?: string;
}

interface StatusResult {
  modules: ModuleStatus[];
  version?: string;
  latestVersion?: string;
  modifiedFiles?: string[];
  fileHashes?: Record<string, string>;
}

async function computeFileHash(filePath: string): Promise<string> {
  const content = await Bun.file(filePath).bytes();
  const hasher = new Bun.CryptoHasher("sha256");
  hasher.update(content);
  return hasher.digest("hex");
}

async function getStatus(registry: Registry, options: CLIOptions): Promise<StatusResult> {
  const targetDir = cwd();
  const root = getRoot(options);
  const ravenDir = join(targetDir, root);

  let currentVersion: string | undefined;
  const modifiedFiles: string[] = [];
  const fileHashes: Record<string, string> = {};

  const knownModules = getModuleNames(registry).sort();
  const moduleStatus: ModuleStatus[] = [];

  if (await pathExists(ravenDir)) {
    const yamlPath = join(ravenDir, "raven.yaml");
    try {
      const content = await Bun.file(yamlPath).text();
      const config = parse(content) as RavenYamlConfig;
      if (config?.version) {
        currentVersion = config.version;
      }
    } catch (_e) {
      // raven.yaml missing or invalid
    }

    for (const name of knownModules) {
      const modDir = join(ravenDir, name);
      const installed =
        (await pathExists(modDir)) && !(await isDirEmpty(modDir));
      const mod = registry.modules[name];
      moduleStatus.push({ 
        name, 
        installed,
        description: mod?.description,
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

  // Try to get latest version from GitHub
  let latestVersion: string | undefined;
  try {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
    );
    if (response.ok) {
      const data = await response.json();
      latestVersion = data.tag_name.replace(/^v/, "");
    }
  } catch (e) {
    // ignore if can't fetch latest version
  }

  if (moduleStatus.length === 0) {
    for (const name of knownModules) {
      const mod = registry.modules[name];
      moduleStatus.push({ name, installed: false, description: mod?.description });
    }
  }

  return {
    modules: moduleStatus,
    version: currentVersion,
    latestVersion,
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

async function cmdGuide(moduleName: string, options: CLIOptions) {
  const { ravenDir } = await ensureRavenInstalled(options);

  const availableModules: string[] = [];
  try {
    const entries = await readdir(ravenDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name !== ".") {
        availableModules.push(entry.name);
      }
    }
  } catch (e) {
    error(`Failed to list modules: ${e}`);
  }

  const moduleDir = join(ravenDir, moduleName);
  if (!(await pathExists(moduleDir))) {
    error(
      `Module '${moduleName}' not found.${availableModules.length > 0 ? ` Available: ${availableModules.join(", ")}` : ""}`,
    );
  }

  const output: string[] = [];

  const readmePath = join(moduleDir, "README.md");
  if (await pathExists(readmePath)) {
    const readmeContent = await Bun.file(readmePath).text();
    output.push("<readme>");
    output.push(readmeContent);
    output.push("</readme>");
    output.push("");
  }

  async function collectCodeFiles(dir: string, baseDir: string) {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        await collectCodeFiles(fullPath, baseDir);
      } else if (entry.isFile()) {
        const relPath = fullPath.slice(baseDir.length + 1);
        const content = await Bun.file(fullPath).text();
        output.push(`<code>`);
        output.push(`File: ${relPath}`);
        output.push(`\`\`\``);
        output.push(content);
        output.push("```");
        output.push("</code>");
        output.push("");
      }
    }
  }

  await collectCodeFiles(moduleDir, moduleDir);

  console.log(output.join("\n"));
}

const cli = cac("raven");
cli.version(loadCliVersion()).help();

cli
  .option(
    "--registry <path>",
    "Registry json path (default: RAVEN_DEFAULT_REGISTRY_PATH)",
  )
  .option("--root <dir>", "RavenJS root directory (default: raven)")
  .option("--source <path>", "Local module source path (default: github)")
  .option("--verbose, -v", "Verbose output");

cli
  .command("init", "Initialize RavenJS AI resources")
  .action((options) => cmdInit(options as CLIOptions));

cli
  .command("add <module>", "Add a module (e.g., jtd-validator)")
  .action((module, options) => cmdAdd(module, options as CLIOptions));


cli
  .command("status", "Show RavenJS installation status (core, modules)")
  .action((options) => cmdStatus(options as StatusCLIOptions));


cli
  .command("guide <module>", "Get guide for a specific module (outputs README and source code)")
  .action((moduleName, options) => cmdGuide(moduleName, options as CLIOptions));

cli.parse();
