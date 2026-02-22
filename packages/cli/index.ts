#!/usr/bin/env bun

import { cac } from "cac";
import { mkdir, rm, readdir, stat, chmod, rename } from "node:fs/promises";
import { join, dirname, resolve, isAbsolute } from "path";
import { cwd } from "process";
import pc from "picocolors";
import { spinner as makeSpinner, log } from "@clack/prompts";
import { parse, stringify } from "yaml";

// @ts-ignore -- registry.json should generated dynamically
import registryPath from "./registry.json" with { type: "file" };
const GITHUB_REPO = "myWsq/RavenJS";
const GITHUB_RAW_URL = `https://raw.githubusercontent.com/${GITHUB_REPO}`;
const DEFAULT_ROOT = "raven";

interface CLIOptions {
  verbose?: boolean;
  root?: string;
  source?: string;
  prerelease?: boolean;
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

const registry = (await Bun.file(registryPath as unknown as string).json()) as Registry;

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

function info(message: string) {
  log.info(message);
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

function getModuleNames(): string[] {
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
    const aiFiles = await downloadAiResources(version, targetDir, options);
    modifiedFiles.push(...aiFiles);
  } else {
    const s = makeSpinner();
    s.start("Initializing RavenJS AI resources...");
    try {
      await ensureDir(dotClaudeDir);
      const aiFiles = await downloadAiResources(version, targetDir, options);
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

async function loadRavenYaml(ravenDir: string): Promise<string> {
  const yamlPath = join(ravenDir, "raven.yaml");
  try {
    const content = await Bun.file(yamlPath).text();
    const config = parse(content) as RavenYamlConfig;
    if (!config?.version) {
      throw new Error("Invalid raven.yaml: version field is missing");
    }
    return config.version;
  } catch (e: any) {
    throw new Error(`Failed to load raven.yaml: ${e.message}`);
  }
}

async function createRavenYaml(destDir: string, version: string) {
  const content = stringify({ version });
  await Bun.write(join(destDir, "raven.yaml"), content);
}

async function cmdInstall(options: CLIOptions) {
  const targetDir = cwd();
  const root = getRoot(options);

  verboseLog(`Installing RavenJS in ${targetDir}`, options);

  const ravenDir = join(targetDir, root);

  if (await pathExists(ravenDir)) {
    const empty = await isDirEmpty(ravenDir);
    if (!empty) {
      error(
        `RavenJS is already installed at ${root}/. Use 'raven update' to update.`,
      );
    }
  }

  const version = registry.version;
  const modifiedFiles: string[] = [];

  if (options?.verbose) {
    verboseLog(`Installing RavenJS in ${targetDir}`, options);
    await ensureDir(join(targetDir, root));
    const coreFiles = await downloadModule(
      "core",
      version,
      join(targetDir, root),
      options,
    );
    modifiedFiles.push(...coreFiles);
  } else {
    const s = makeSpinner();
    s.start("Installing RavenJS...");
    try {
      await ensureDir(join(targetDir, root));
      const coreFiles = await downloadModule(
        "core",
        version,
        join(targetDir, root),
        options,
      );
      modifiedFiles.push(...coreFiles);
      s.stop("Installing RavenJS...");
    } catch (e: any) {
      s.stop("Installation failed");
      error(e.message);
    }
  }

  await createRavenYaml(join(targetDir, root), version);
  modifiedFiles.push(join(targetDir, root, "raven.yaml"));

  success("RavenJS installed successfully!");

  printSectionHeader("Modified Files");
  for (const file of modifiedFiles) {
    printListItem(file);
  }

  const coreModule = registry.modules["core"];
  if (
    coreModule?.dependencies &&
    Object.keys(coreModule.dependencies).length > 0
  ) {
    printSectionHeader("Required Dependencies");
    for (const [pkg, ver] of Object.entries(coreModule.dependencies)) {
      printListItem(`${pkg}@${ver}`);
    }
  }
}

async function cmdAdd(moduleName: string, options: CLIOptions) {
  if (!moduleName) {
    error(
      `Please specify a module to add. Available: ${getModuleNames().join(", ")}`,
    );
  }

  const available = getModuleNames();

  if (!available.includes(moduleName)) {
    info(`Available modules: ${available.join(", ")}`);
    error(`Unknown module: ${moduleName}`);
    return;
  }

  const targetDir = cwd();
  const root = getRoot(options);
  const ravenDir = join(targetDir, root);

  if (!(await pathExists(ravenDir))) {
    error(`RavenJS not installed at ${root}/. Run 'raven install' first.`);
  }

  let version: string;
  try {
    version = await loadRavenYaml(ravenDir);
  } catch (e: any) {
    error(e.message);
    return;
  }

  let modifiedFiles: string[];
  if (options?.verbose) {
    verboseLog(`Adding ${moduleName}...`, options);
    modifiedFiles = await downloadModule(moduleName, version, ravenDir, options);
  } else {
    const s = makeSpinner();
    s.start(`Adding ${moduleName}...`);
    try {
      modifiedFiles = await downloadModule(
        moduleName,
        version,
        ravenDir,
        options,
      );
      s.stop(`Adding ${moduleName}...`);
    } catch (e: any) {
      s.stop("Add failed");
      error(e.message);
    }
  }

  success(`${moduleName} added successfully!`);

  printSectionHeader("Modified Files");
  for (const file of modifiedFiles) {
    printListItem(file);
  }

  const module = registry.modules[moduleName];
  if (module?.dependencies && Object.keys(module.dependencies).length > 0) {
    printSectionHeader("Required Dependencies");
    for (const [pkg, ver] of Object.entries(module.dependencies)) {
      printListItem(`${pkg}@${ver}`);
    }
  }

  log.message(
    `The module has been added to ${root}/${moduleName}\nSee ${root}/${moduleName}/README.md for usage.`,
    { symbol: pc.dim("~") },
  );
}

async function cmdUpdate(options: CLIOptions) {
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
      version = await loadRavenYaml(ravenDir);
    } catch (e: any) {
      error(e.message);
      return;
    }
  }

  const modifiedFiles: string[] = [];
  const allDependencies: Record<string, string> = {};

  if (options?.verbose) {
    try {
      info(`Updating RavenJS in ${targetDir}...`);

      // Update framework modules if raven/ exists
      if (ravenExists) {
        const availableModules = getModuleNames();
        for (const moduleName of availableModules) {
          const moduleDir = join(ravenDir, moduleName);
          if (await Bun.file(moduleDir).exists()) {
            await rm(moduleDir, { recursive: true, force: true });
          }
          const files = await downloadModule(
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
        const aiFiles = await downloadAiResources(version, targetDir, options);
        modifiedFiles.push(...aiFiles);
      }
    } catch (e: unknown) {
      error(e instanceof Error ? e.message : String(e));
    }
  } else {
    const s = makeSpinner();
    s.start("Updating RavenJS...");
    try {
      // Update framework modules if raven/ exists
      if (ravenExists) {
        const availableModules = getModuleNames();
        for (const moduleName of availableModules) {
          const moduleDir = join(ravenDir, moduleName);
          if (await Bun.file(moduleDir).exists()) {
            await rm(moduleDir, { recursive: true, force: true });
          }
          const files = await downloadModule(moduleName, version, ravenDir, options);
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
        const aiFiles = await downloadAiResources(version, targetDir, options);
        modifiedFiles.push(...aiFiles);
      }

      s.stop("Updating RavenJS...");
    } catch (e: any) {
      s.stop("Update failed");
      error(e.message);
    }
  }

  if (ravenExists) {
    await createRavenYaml(ravenDir, version);
    modifiedFiles.push(join(ravenDir, "raven.yaml"));
  }

  success("RavenJS updated successfully!");

  printSectionHeader("Modified Files");
  for (const file of modifiedFiles) {
    printListItem(file);
  }

  if (Object.keys(allDependencies).length > 0) {
    printSectionHeader("Required Dependencies");
    for (const [pkg, ver] of Object.entries(allDependencies)) {
      printListItem(`${pkg}@${ver}`);
    }
  }
}

// === SECTION: Status ===

interface StatusResult {
  core: { installed: boolean };
  modules: string[];
}

async function getStatus(options: CLIOptions): Promise<StatusResult> {
  const targetDir = cwd();
  const root = getRoot(options);
  const ravenDir = join(targetDir, root);

  let coreInstalled = false;
  const installedModules: string[] = [];
  if (await pathExists(ravenDir)) {
    const coreDir = join(ravenDir, "core");
    coreInstalled =
      (await pathExists(coreDir)) && !(await isDirEmpty(coreDir));

    const knownModules = getModuleNames();
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
  }

  return {
    core: { installed: coreInstalled },
    modules: installedModules,
  };
}

interface StatusCLIOptions extends CLIOptions {
  json?: boolean;
}

async function cmdStatus(options: StatusCLIOptions) {
  const status = await getStatus(options);
  if (options.json) {
    console.log(JSON.stringify(status));
    return;
  }
  printSectionHeader("RavenJS Status");
  printListItem(`core: ${status.core.installed ? "installed" : "not installed"}`);
  printListItem(
    `modules: ${status.modules.length > 0 ? status.modules.join(", ") : "none"}`,
  );
}

const cli = cac("raven");

cli.version(registry.version).help();

cli
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
  .option("--json", "Output as JSON for programmatic use")
  .action((options) => cmdStatus(options as StatusCLIOptions));

cli.parse();
