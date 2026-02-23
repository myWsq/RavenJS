#!/usr/bin/env bun

import { cac } from "cac";
import { readFileSync } from "node:fs";
import { mkdir, rm, readdir, stat } from "node:fs/promises";
import { join, dirname, resolve, isAbsolute } from "path";
import { cwd } from "process";
import pc from "picocolors";
import { spinner as makeSpinner, log } from "@clack/prompts";
import { parse, stringify } from "yaml";

function loadCliVersion(): string {
  try {
    const pkgPath = join(import.meta.dir, "package.json");
    const content = readFileSync(pkgPath, "utf-8");
    return JSON.parse(content).version;
  } catch {
    return "0.0.0";
  }
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
    error(`RavenJS not installed at ${root}/. Run 'raven install' first.`);
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

    if (sourcePath) {
      const primaryPath = join(sourcePath, "modules", moduleName, file);
      const fallbackPath = join(sourcePath, moduleName, file);
      let sourceFile: string;
      if (await Bun.file(primaryPath).exists()) {
        sourceFile = primaryPath;
      } else if (await Bun.file(fallbackPath).exists()) {
        sourceFile = fallbackPath;
      } else {
        throw new Error(`Missing local file: ${primaryPath}`);
      }
      await copyLocalFile(sourceFile, destPath);
    } else {
      const url = `${GITHUB_RAW_URL}/v${version}/modules/${moduleName}/${file}`;
      await downloadFile(url, destPath);
    }
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

  verboseLog(`Initializing RavenJS AI resources in ${targetDir}`, options);

  const dotClaudeDir = join(targetDir, ".claude");

  // Check if .claude already exists with content
  if (await pathExists(dotClaudeDir)) {
    const empty = await isDirEmpty(dotClaudeDir);
    if (!empty) {
      error(
        `AI resources already initialized at .claude/. Use 'raven update' to update.`,
      );
    }
  }

  const version = registry.version;
  const modifiedFiles: string[] = [];

  if (options?.verbose) {
    verboseLog(`Initializing RavenJS AI resources in ${targetDir}`, options);
    await ensureDir(dotClaudeDir);
    const aiFiles = await downloadAiResources(registry, version, targetDir, options);
    modifiedFiles.push(...aiFiles);
  } else {
    const s = makeSpinner();
    s.start("Initializing RavenJS AI resources...");
    try {
      await ensureDir(dotClaudeDir);
      const aiFiles = await downloadAiResources(registry, version, targetDir, options);
      modifiedFiles.push(...aiFiles);
      s.stop("Initializing RavenJS AI resources...");
    } catch (e: any) {
      s.stop("Initialization failed");
      error(e.message);
    }
  }

  success("RavenJS AI resources initialized successfully!");

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

async function cmdInstall(options: CLIOptions) {
  const registry = await loadRegistry(options);
  const targetDir = cwd();
  const root = getRoot(options);

  verboseLog(`Installing RavenJS in ${targetDir}`, options);

  const ravenDir = join(targetDir, root);

  if (await pathExists(ravenDir)) {
    const empty = await isDirEmpty(ravenDir);
    if (!empty) {
      error(`RavenJS is already installed at ${root}/. Use 'raven update' to update.`);
    }
  }

  const version = registry.version;
  const modifiedFiles: string[] = [];
  const dependencies: Record<string, string> = {};

  try {
    await ensureDir(join(targetDir, root));
    const coreFiles = await downloadModule(
      registry,
      "core",
      version,
      join(targetDir, root),
      options,
    );
    modifiedFiles.push(...coreFiles);

    await createRavenYaml(join(targetDir, root), version);
    modifiedFiles.push(join(targetDir, root, "raven.yaml"));

    const coreModule = registry.modules["core"];
    if (coreModule?.dependencies) {
      Object.assign(dependencies, coreModule.dependencies);
    }

    console.log(JSON.stringify({ success: true, modifiedFiles, dependencies }));
  } catch (e: any) {
    error(e.message);
  }
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

  try {
    const modifiedFiles = await downloadModule(registry, moduleName, version, ravenDir, options);
    const module = registry.modules[moduleName];
    const dependencies = module?.dependencies || {};

    console.log(JSON.stringify({ success: true, moduleName, modifiedFiles, dependencies }));
  } catch (e: any) {
    error(e.message);
  }
}

async function cmdUpdate(options: CLIOptions) {
  const registry = await loadRegistry(options);
  const targetDir = cwd();
  const root = getRoot(options);
  const ravenDir = join(targetDir, root);
  const dotClaudeDir = join(targetDir, ".claude");

  // Check if at least one of raven/ or .claude/ exists
  const ravenExists = await pathExists(ravenDir);
  const dotClaudeExists = await pathExists(dotClaudeDir);

  if (!ravenExists && !dotClaudeExists) {
    error(`RavenJS not installed. Run 'raven install' or 'raven init' first.`);
  }

  let version: string = registry.version;
  if (ravenExists) {
    try {
      const yamlPath = join(ravenDir, "raven.yaml");
      const content = await Bun.file(yamlPath).text();
      const config = parse(content) as RavenYamlConfig;
      if (!config?.version) {
        error("Invalid raven.yaml: version field is missing");
      }
      version = config.version;
    } catch (e: any) {
      error(`Failed to load raven.yaml: ${e.message}`);
    }
  }

  try {
    const modifiedFiles: string[] = [];
    const allDependencies: Record<string, string> = {};

    // Update framework modules if raven/ exists
    if (ravenExists) {
      const availableModules = getModuleNames(registry);
      for (const moduleName of availableModules) {
        const moduleDir = join(ravenDir, moduleName);
        if (await Bun.file(moduleDir).exists()) {
          await rm(moduleDir, { recursive: true, force: true });
        }
        const files = await downloadModule(
          registry,
          moduleName,
          version,
          ravenDir,
          options,
        );
        modifiedFiles.push(...files);

        const module = registry.modules[moduleName];
        if (module?.dependencies) {
          for (const [pkg, ver] of Object.entries(module.dependencies)) {
            allDependencies[pkg] = ver;
          }
        }
      }
    }

    // Update AI resources if .claude/ exists
    if (dotClaudeExists) {
      verboseLog("Updating AI resources...", options);
      const aiFiles = await downloadAiResources(registry, version, targetDir, options);
      modifiedFiles.push(...aiFiles);
    }

    if (ravenExists) {
      await createRavenYaml(ravenDir, version);
      modifiedFiles.push(join(ravenDir, "raven.yaml"));
    }

    console.log(JSON.stringify({ success: true, modifiedFiles, dependencies: allDependencies }));
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    error(errorMessage);
  }
}

// === SECTION: Status ===

interface StatusResult {
  core: { installed: boolean };
  modules: string[];
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

  let coreInstalled = false;
  const installedModules: string[] = [];
  let currentVersion: string | undefined;
  const modifiedFiles: string[] = [];
  const fileHashes: Record<string, string> = {};

  if (await pathExists(ravenDir)) {
    const yamlPath = join(ravenDir, "raven.yaml");
    const content = await Bun.file(yamlPath).text();
    const config = parse(content) as RavenYamlConfig;
    if (config?.version) {
      currentVersion = config.version;
    }

    const coreDir = join(ravenDir, "core");
    coreInstalled =
      (await pathExists(coreDir)) && !(await isDirEmpty(coreDir));

    const knownModules = getModuleNames(registry);
    const entries = await readdir(ravenDir, { withFileTypes: true });
    for (const entry of entries) {
      if (
        entry.isDirectory() &&
        entry.name !== "core" &&
        knownModules.includes(entry.name)
      ) {
        const modDir = join(ravenDir, entry.name);
        if (!(await isDirEmpty(modDir))) {
          installedModules.push(entry.name);
        }
      }
    }
    installedModules.sort();

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

  return {
    core: { installed: coreInstalled },
    modules: installedModules,
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

async function cmdFetch(options: CLIOptions) {
  const registry = await loadRegistry(options);
  console.log(JSON.stringify({
    success: true,
    version: registry.version,
    modules: getModuleNames(registry),
    registry
  }));
}

async function cmdDiff(options: CLIOptions) {
  const registry = await loadRegistry(options);
  const { ravenDir, version } = await ensureRavenInstalled(options);

  const diffs: { path: string; localHash: string; remoteHash: string }[] = [];

  try {
    const localStatus = await getStatus(registry, options);
    const localHashes = localStatus.fileHashes || {};

    for (const moduleName of Object.keys(registry.modules)) {
      const module = registry.modules[moduleName];
      if (!module) continue;
      for (const file of module.files) {
        const destRelPath = module.fileMapping?.[file] || `${moduleName}/${file}`;
        const localHash = localHashes[destRelPath];
        if (localHash) {
          try {
            const sourcePath = resolveSourcePath(getSource(options));
            let remoteContent: string;
            if (sourcePath) {
              const primaryPath = join(sourcePath, "modules", moduleName, file);
              const fallbackPath = join(sourcePath, moduleName, file);
              if (await Bun.file(primaryPath).exists()) {
                remoteContent = await Bun.file(primaryPath).text();
              } else if (await Bun.file(fallbackPath).exists()) {
                remoteContent = await Bun.file(fallbackPath).text();
              } else {
                continue;
              }
            } else {
              const url = `${GITHUB_RAW_URL}/v${version}/modules/${moduleName}/${file}`;
              const response = await fetch(url);
              if (!response.ok) continue;
              remoteContent = await response.text();
            }
            const remoteHasher = new Bun.CryptoHasher("sha256");
            remoteHasher.update(remoteContent);
            const remoteHash = remoteHasher.digest("hex");
            if (localHash !== remoteHash) {
              diffs.push({ path: destRelPath, localHash, remoteHash });
            }
          } catch (_e) {
            // ignore errors for individual files
          }
        }
      }
    }
  } catch (e) {
    // ignore
  }

  console.log(JSON.stringify({
    success: true,
    hasDifferences: diffs.length > 0,
    differences: diffs
  }));
}

async function cmdExplain(options: CLIOptions) {
  const targetDir = cwd();
  const root = getRoot(options);
  const ravenDir = join(targetDir, root);

  const installed = await pathExists(ravenDir);

  console.log(JSON.stringify({
    success: true,
    name: "RavenJS",
    description: "A lightweight, AI-first web framework",
    installed,
    commands: [
      "init", "install", "add", "update", "status",
      "fetch", "diff", "explain", "guide"
    ]
  }));
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
    console.log(`Failed to list modules: ${e}`);
    process.exit(1);
  }

  const moduleDir = join(ravenDir, moduleName);
  if (!(await pathExists(moduleDir))) {
    console.log(`Module '${moduleName}' not found.`);
    if (availableModules.length > 0) {
      console.log(`Available modules: ${availableModules.join(", ")}`);
    }
    process.exit(1);
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
        const ext = entry.name.split(".").pop();
        let language = "text";
        if (ext === "ts" || ext === "tsx") language = "typescript";
        else if (ext === "js" || ext === "jsx") language = "javascript";
        else if (ext === "json") language = "json";
        else if (ext === "md") continue;

        const relPath = fullPath.slice(baseDir.length + 1);
        const content = await Bun.file(fullPath).text();
        output.push(`<code path="${relPath}">`);
        output.push(`\`\`\`${language}`);
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
  .command("install", "Install RavenJS into the current project")
  .action((options) => cmdInstall(options as CLIOptions));

cli
  .command("add <module>", "Add a module (e.g., jtd-validator)")
  .action((module, options) => cmdAdd(module, options as CLIOptions));

cli
  .command("update", "Update RavenJS to latest version")
  .action((options) => cmdUpdate(options as CLIOptions));

cli
  .command("status", "Show RavenJS installation status (core, modules)")
  .action((options) => cmdStatus(options as StatusCLIOptions));

cli
  .command("fetch", "Fetch RavenJS registry information")
  .action((options) => cmdFetch(options as CLIOptions));

cli
  .command("diff", "Show differences between local and remote files")
  .action((options) => cmdDiff(options as CLIOptions));

cli
  .command("explain", "Explain RavenJS and available commands")
  .action((options) => cmdExplain(options as CLIOptions));

cli
  .command("guide <module>", "Get guide for a specific module (outputs README and source code)")
  .action((moduleName, options) => cmdGuide(moduleName, options as CLIOptions));

cli.parse();
