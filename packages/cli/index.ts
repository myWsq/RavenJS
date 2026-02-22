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

async function verboseLog(message: string, options?: CLIOptions) {
  if (options?.verbose) {
    console.log(message);
  }
}

function error(message: string): never {
  log.error(message);
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

// === SECTION: Self-Update ===

import { gt as semverGt } from "semver";

const GITHUB_API_RELEASES = `https://api.github.com/repos/${GITHUB_REPO}/releases`;
const INSTALL_DIR = `${process.env.HOME || process.env.USERPROFILE || ""}/.local/bin`;
const INSTALL_PATH = `${INSTALL_DIR}/raven`;

function detectOs(): "linux" | "darwin" {
  switch (process.platform) {
    case "linux":
      return "linux";
    case "darwin":
      return "darwin";
    default:
      error(`unsupported OS: ${process.platform}`);
  }
}

function detectArch(): "x64" | "arm64" {
  switch (process.arch) {
    case "x64":
      return "x64";
    case "arm64":
      return "arm64";
    default:
      error(`unsupported architecture: ${process.arch}`);
  }
}

async function getLatestVersion(includePrerelease = false): Promise<string> {
  const response = await fetch(GITHUB_API_RELEASES);
  if (!response.ok) {
    error("failed to get latest version");
  }
  const releases = (await response.json()) as { tag_name: string }[];
  const tag = includePrerelease
    ? releases[0]?.tag_name
    : releases.map((r) => r.tag_name).find((t) => !t.includes("-"));
  if (!tag) {
    error("failed to get latest version");
  }
  return tag.replace(/^v/, "");
}

async function downloadBinary(
  version: string,
  os: string,
  arch: string,
): Promise<ArrayBuffer> {
  const url = `https://github.com/${GITHUB_REPO}/releases/download/v${version}/raven-${version}-${os}-${arch}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `download failed (${response.status}). Please check if version v${version} exists and supports ${os}-${arch}`,
    );
  }
  return response.arrayBuffer();
}

function isLocalBinInPath(): boolean {
  const pathEnv = process.env.PATH || "";
  return pathEnv.split(":").includes(INSTALL_DIR);
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
    verboseLog(`Using local source: ${sourcePath}`, options);
  }
  verboseLog(`Downloading ${moduleName} files...`, options);

  const modifiedFiles: string[] = [];
  const downloads = module.files.map(async (file: string) => {
    const destPath = join(destDir, moduleName, file);
    verboseLog(`  Downloading ${file}...`, options);
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

  verboseLog(`Initializing RavenJS in ${targetDir}`, options);

  const ravenDir = join(targetDir, root);

  if (await pathExists(ravenDir)) {
    const empty = await isDirEmpty(ravenDir);
    if (!empty) {
      error(
        `RavenJS is already initialized at ${root}/. Use 'raven update' to update.`,
      );
    }
  }

  const version = registry.version;
  const modifiedFiles: string[] = [];

  if (options?.verbose) {
    verboseLog(`Initializing RavenJS in ${targetDir}`, options);
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
    s.start("Initializing RavenJS...");
    try {
      await ensureDir(join(targetDir, root));
      const coreFiles = await downloadModule(
        "core",
        version,
        join(targetDir, root),
        options,
      );
      modifiedFiles.push(...coreFiles);
      s.stop("Initializing RavenJS...");
    } catch (e: any) {
      s.stop("Initialization failed");
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
    error(`RavenJS not initialized at ${root}/. Run 'raven init' first.`);
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

  if (!(await pathExists(ravenDir))) {
    error(`RavenJS not initialized at ${root}/. Run 'raven init' first.`);
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
    const s = makeSpinner();
    s.start("Updating RavenJS...");
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
      s.stop("Updating RavenJS...");
    } catch (e: any) {
      s.stop("Update failed");
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

async function cmdSelfUpdate(options: CLIOptions) {
  info("Checking for updates...");

  const os = detectOs();
  const arch = detectArch();

  let latestVersion: string;
  try {
    latestVersion = (await getLatestVersion(options.prerelease)).replace(/^v/, "");
  } catch (e: unknown) {
    error(e instanceof Error ? e.message : "failed to get latest version");
  }

  const currentVersion = (registry.version || "").replace(/^v/, "");

  let shouldUpdate: boolean;
  try {
    shouldUpdate = semverGt(latestVersion, currentVersion);
  } catch {
    shouldUpdate = false;
  }

  if (!shouldUpdate) {
    success("Already up to date");
    return;
  }

  info(`detected system: ${os}-${arch}`);
  info(`installing version: v${latestVersion}`);

  let buffer: ArrayBuffer;
  try {
    buffer = await downloadBinary(latestVersion, os, arch);
  } catch (e: unknown) {
    error(
      e instanceof Error
        ? e.message
        : `download failed. Please check if version v${latestVersion} exists and supports ${os}-${arch}`,
    );
  }

  if (!buffer || buffer.byteLength === 0) {
    error(
      `download failed - file is empty. Please check if version v${latestVersion} exists and supports ${os}-${arch}`,
    );
  }

  await ensureDir(INSTALL_DIR);
  const tempPath = `${INSTALL_PATH}.${process.pid}.tmp`;
  try {
    await Bun.write(tempPath, buffer);
    await chmod(tempPath, 0o755);
    await rename(tempPath, INSTALL_PATH);
  } finally {
    try {
      await rm(tempPath, { force: true });
    } catch {
      /* ignore cleanup (file may already be renamed away) */
    }
  }

  success(`installed successfully to: ${INSTALL_PATH}`);

  if (!isLocalBinInPath()) {
    log.warn(`${INSTALL_DIR} is not in your PATH`);
    log.warn("add it to your shell config (e.g., ~/.bashrc, ~/.zshrc):");
    log.message(`export PATH="$HOME/.local/bin:$PATH"`, { symbol: pc.dim("~") });
  }

  log.message("done! run 'raven --help' to get started", { symbol: pc.dim("~") });
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
  .option("--prerelease", "Include prerelease versions when checking for updates")
  .action((options) => cmdSelfUpdate(options as CLIOptions));

cli.parse();