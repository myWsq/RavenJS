#!/usr/bin/env bun

import { cac } from "cac";
import { mkdir, rm, readdir, stat } from "node:fs/promises";
import { join, dirname, resolve, isAbsolute } from "path";
import { cwd } from "process";
import pc from "picocolors";
import ora from "ora";
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
}

interface RegistryModule {
  files: string[];
  dependencies?: Record<string, string>;
}

interface Registry {
  version: string;
  modules: Record<string, RegistryModule>;
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

async function log(message: string, options?: CLIOptions) {
  if (options?.verbose) {
    console.log(message);
  }
}

function error(message: string): never {
  console.error(pc.red("Error:") + " " + message);
  process.exit(1);
}

function info(message: string) {
  console.log(pc.cyan("info") + " " + pc.dim(message));
}

function success(message: string) {
  console.log(pc.green("✓") + " " + message);
}

function printSectionHeader(title: string) {
  console.log("\n" + pc.bold(pc.dim(title)));
}

function printListItem(item: string) {
  console.log("  " + pc.dim("-") + " " + item);
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
): Promise<string[]> {
  const module = registry.modules[moduleName];
  if (!module) {
    throw new Error(`Module ${moduleName} not found in registry`);
  }

  const sourcePath = resolveSourcePath(getSource(options || {}));
  if (sourcePath) {
    log(`Using local source: ${sourcePath}`, options);
  }
  log(`Downloading ${moduleName} files...`, options);

  const modifiedFiles: string[] = [];
  const downloads = module.files.map(async (file: string) => {
    const destPath = join(destDir, moduleName, file);
    log(`  Downloading ${file}...`, options);
    if (sourcePath) {
      const primaryPath = join(sourcePath, "modules", moduleName, file);
      const fallbackPath = join(sourcePath, moduleName, file);
      const sourceFile = (await Bun.file(primaryPath).exists())
        ? primaryPath
        : fallbackPath;
      await copyLocalFile(sourceFile, destPath);
    } else {
      const url = `${GITHUB_RAW_URL}/v${version}/modules/${moduleName}/${file}`;
      await downloadFile(url, destPath);
    }
    modifiedFiles.push(join(destDir, moduleName, file));
  });

  await Promise.all(downloads);
  return modifiedFiles;
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

async function cmdInit(options: CLIOptions) {
  const targetDir = cwd();
  const root = getRoot(options);

  log(`Initializing RavenJS in ${targetDir}`, options);

  const ravenDir = join(targetDir, root);

  if (await pathExists(ravenDir)) {
    const empty = await isDirEmpty(ravenDir);
    if (!empty) {
      await error(
        `RavenJS is already initialized at ${root}/. Use 'raven update' to update.`,
      );
      return;
    }
  }

  const version = registry.version;
  const modifiedFiles: string[] = [];

  if (options?.verbose) {
    log(`Initializing RavenJS in ${targetDir}`, options);
    await ensureDir(join(targetDir, root));
    const coreFiles = await downloadModule(
      "core",
      version,
      join(targetDir, root),
      options,
    );
    modifiedFiles.push(...coreFiles);
  } else {
    const spinner = ora("Initializing RavenJS...").start();
    try {
      await ensureDir(join(targetDir, root));
      const coreFiles = await downloadModule(
        "core",
        version,
        join(targetDir, root),
        options,
      );
      modifiedFiles.push(...coreFiles);
      spinner.succeed();
    } catch (e: any) {
      spinner.fail();
      error(e.message);
    }
  }

  await createRavenYaml(join(targetDir, root), version);
  modifiedFiles.push(join(targetDir, root, "raven.yaml"));

  success("RavenJS initialized successfully!");

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
    await error(
      `Please specify a module to add. Available: ${getModuleNames().join(", ")}`,
    );
    return;
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
    await error(`RavenJS not initialized at ${root}/. Run 'raven init' first.`);
    return;
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
    log(`Adding ${moduleName}...`, options);
    modifiedFiles = await downloadModule(moduleName, version, ravenDir, options);
  } else {
    const spinner = ora(`Adding ${moduleName}...`).start();
    try {
      modifiedFiles = await downloadModule(
        moduleName,
        version,
        ravenDir,
        options,
      );
      spinner.succeed();
    } catch (e: any) {
      spinner.fail();
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

  console.log(
    "\n" +
      pc.dim(
        `The module has been added to ${root}/${moduleName}/\nSee ${root}/${moduleName}/README.md for usage.`,
      ),
  );
}

async function cmdUpdate(options: CLIOptions) {
  const targetDir = cwd();
  const root = getRoot(options);
  const ravenDir = join(targetDir, root);

  if (!(await pathExists(ravenDir))) {
    await error(`RavenJS not initialized at ${root}/. Run 'raven init' first.`);
    return;
  }

  let version: string;
  try {
    version = await loadRavenYaml(ravenDir);
  } catch (e: any) {
    error(e.message);
    return;
  }

  const modifiedFiles: string[] = [];
  const allDependencies: Record<string, string> = {};

  if (options?.verbose) {
    try {
      info(`Updating RavenJS in ${targetDir}...`);
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
    } catch (e: unknown) {
      error(e instanceof Error ? e.message : String(e));
    }
  } else {
    const spinner = ora("Updating RavenJS...").start();
    try {
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
      spinner.succeed();
    } catch (e: any) {
      spinner.fail();
      error(e.message);
    }
  }

  await createRavenYaml(ravenDir, version);
  modifiedFiles.push(join(ravenDir, "raven.yaml"));

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

function cmdSelfUpdate(_options: CLIOptions) {
  info("Checking for updates...");
  console.log(
    "\n" +
      pc.dim("Run the following command to update:") +
      "\n\n" +
      pc.cyan("  npm install -g @ravenjs/cli") +
      "\n" +
      pc.dim("  # or") +
      "\n" +
      pc.cyan("  bunx @ravenjs/cli@latest") +
      "\n",
  );
}

const cli = cac("raven");

cli.version(registry.version).help();

cli
  .option("--root <dir>", "RavenJS root directory (default: raven)")
  .option("--source <path>", "Local module source path (default: github)")
  .option("--verbose, -v", "Verbose output");

cli
  .command("init", "Initialize a new RavenJS project")
  .action((options) => cmdInit(options as CLIOptions));

cli
  .command("add <module>", "Add a module (e.g., jtd-validator)")
  .action((module, options) => cmdAdd(module, options as CLIOptions));

cli
  .command("update", "Update RavenJS to latest version")
  .action((options) => cmdUpdate(options as CLIOptions));

cli
  .command("self-update", "Update RavenJS CLI to latest version")
  .action((options) => cmdSelfUpdate(options as CLIOptions));

cli.parse();