#!/usr/bin/env bun

import { cac } from "cac";
import { mkdir, rm, readdir } from "node:fs/promises";
import { join, dirname } from "path";
import { cwd } from "process";
import { parse, stringify } from "yaml";

const GITHUB_REPO = "myWsq/RavenJS";
const GITHUB_RAW_URL = `https://raw.githubusercontent.com/${GITHUB_REPO}`;
const DEFAULT_ROOT = "raven";

interface CLIOptions {
  verbose?: boolean;
  root?: string;
}

interface RegistryModule {
  files: string[];
  dependencies?: Record<string, string>;
}

interface Registry {
  version: string;
  modules: Record<string, RegistryModule>;
}

const registry = (await Bun.file("./registry.json").json()) as Registry;

function getRoot(options: CLIOptions): string {
  return options.root || process.env.RAVEN_ROOT || DEFAULT_ROOT;
}

async function log(message: string, options?: CLIOptions) {
  if (options?.verbose) {
    console.log(message);
  }
}

async function error(message: string) {
  console.error(`\x1b[31mError:\x1b[0m ${message}`);
  process.exit(1);
}

async function info(message: string) {
  console.log(`\x1b[36mINFO:\x1b[0m ${message}`);
}

async function success(message: string) {
  console.log(`\x1b[32m✓\x1b[0m ${message}`);
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

  log(`Downloading ${moduleName} files...`, options);

  const modifiedFiles: string[] = [];
  const downloads = module.files.map(async (file: string) => {
    const url = `${GITHUB_RAW_URL}/v${version}/modules/${moduleName}/${file}`;
    const destPath = join(destDir, moduleName, file);
    log(`  Downloading ${file}...`, options);
    await downloadFile(url, destPath);
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

  if (await Bun.file(ravenDir).exists()) {
    const empty = await isDirEmpty(ravenDir);
    if (!empty) {
      await error(
        `RavenJS is already initialized at ${root}/. Use 'raven update' to update.`,
      );
      return;
    }
  }

  const version = registry.version;

  await ensureDir(join(targetDir, root));

  const modifiedFiles: string[] = [];
  const coreFiles = await downloadModule(
    "core",
    version,
    join(targetDir, root),
    options,
  );
  modifiedFiles.push(...coreFiles);

  await createRavenYaml(join(targetDir, root), version);
  modifiedFiles.push(join(targetDir, root, "raven.yaml"));

  success("RavenJS initialized successfully!");

  console.log("\n### Modified Files:");
  for (const file of modifiedFiles) {
    console.log(`  - ${file}`);
  }

  const coreModule = registry.modules["core"];
  if (
    coreModule?.dependencies &&
    Object.keys(coreModule.dependencies).length > 0
  ) {
    console.log("\n### Required Dependencies:");
    for (const [pkg, ver] of Object.entries(coreModule.dependencies)) {
      console.log(`  - ${pkg}@${ver}`);
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
    console.log(`Available modules: ${available.join(", ")}`);
    await error(`Unknown module: ${moduleName}`);
    return;
  }

  const targetDir = cwd();
  const root = getRoot(options);
  const ravenDir = join(targetDir, root);

  if (!(await Bun.file(ravenDir).exists())) {
    await error(`RavenJS not initialized at ${root}/. Run 'raven init' first.`);
    return;
  }

  log(`Adding ${moduleName}...`, options);

  let version: string;
  try {
    version = await loadRavenYaml(ravenDir);
  } catch (e: any) {
    await error(e.message);
    return;
  }

  const modifiedFiles = await downloadModule(
    moduleName,
    version,
    ravenDir,
    options,
  );

  success(`${moduleName} added successfully!`);

  console.log("\n### Modified Files:");
  for (const file of modifiedFiles) {
    console.log(`  - ${file}`);
  }

  const module = registry.modules[moduleName];
  if (module?.dependencies && Object.keys(module.dependencies).length > 0) {
    console.log("\n### Required Dependencies:");
    for (const [pkg, ver] of Object.entries(module.dependencies)) {
      console.log(`  - ${pkg}@${ver}`);
    }
  }

  console.log(`
The module has been added to ${root}/${moduleName}/
See ${root}/${moduleName}/README.md for usage.
`);
}

async function cmdUpdate(options: CLIOptions) {
  const targetDir = cwd();
  const root = getRoot(options);
  const ravenDir = join(targetDir, root);

  if (!(await Bun.file(ravenDir).exists())) {
    await error(`RavenJS not initialized at ${root}/. Run 'raven init' first.`);
    return;
  }

  info(`Updating RavenJS in ${targetDir}...`);

  let version: string;
  try {
    version = await loadRavenYaml(ravenDir);
  } catch (e: any) {
    await error(e.message);
    return;
  }

  const modifiedFiles: string[] = [];
  const allDependencies: Record<string, string> = {};

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

  await createRavenYaml(ravenDir, version);
  modifiedFiles.push(join(ravenDir, "raven.yaml"));

  success("RavenJS updated successfully!");

  console.log("\n### Modified Files:");
  for (const file of modifiedFiles) {
    console.log(`  - ${file}`);
  }

  if (Object.keys(allDependencies).length > 0) {
    console.log("\n### Required Dependencies:");
    for (const [pkg, ver] of Object.entries(allDependencies)) {
      console.log(`  - ${pkg}@${ver}`);
    }
  }
}

async function cmdSelfUpdate(options: CLIOptions) {
  info("Checking for updates...");

  info("Run the following command to update:");
  console.log(`
  npm install -g @ravenjs/cli
  # or
  bunx @ravenjs/cli@latest
  `);
}

const cli = cac("raven");

cli.version(registry.version).help();

cli
  .option("--root <dir>", "RavenJS root directory (default: raven)")
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
