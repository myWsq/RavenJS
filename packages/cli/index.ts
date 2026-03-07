#!/usr/bin/env bun

import { Command } from "commander";
import {
  access,
  copyFile,
  mkdir,
  readdir,
  readFile,
  rename,
  rm,
  stat,
  writeFile,
} from "fs/promises";
import { basename, dirname, isAbsolute, join, resolve } from "path";
import { cwd } from "process";
import { createHash, randomUUID } from "crypto";
import { fileURLToPath } from "url";

import { spinner as makeSpinner, log } from "@clack/prompts";
import pc from "picocolors";
import { parse, stringify } from "yaml";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = "raven";
const RAVENJS_PREFIXES = ["@ravenjs/", "@raven.js/"];
const SYNC_FAIL_AFTER_BACKUP_ENV = "RAVEN_SYNC_TEST_FAIL_AFTER_BACKUP";

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

interface RavenYamlConfig {
  version: string;
  language?: string;
}

interface ModuleInfo {
  name: string;
  description?: string;
  installed: boolean;
  installDir?: string;
}

interface StatusResult {
  modules: ModuleInfo[];
  version?: string;
  language?: string;
  modifiedFiles?: string[];
  fileHashes?: Record<string, string>;
}

interface InstalledModuleState {
  installedModules: string[];
  removedModules: string[];
  passthroughFiles: string[];
}

interface ModuleWriteResult {
  modifiedFiles: string[];
  dependencies: Record<string, string>;
}

interface SyncBuildResult extends ModuleWriteResult {
  stagingDir: string;
  desiredModules: string[];
}

function loadCliVersion(): string {
  return process.env.RAVEN_CLI_VERSION ?? "0.0.0";
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
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
    const registryPath = process.env.RAVEN_DEFAULT_REGISTRY_PATH;
    candidates.push(isAbsolute(registryPath) ? registryPath : resolve(cwd(), registryPath));
  }
  candidates.push(join(__dirname, "registry.json"));

  for (const candidate of candidates) {
    if (await fileExists(candidate)) {
      const content = await readFile(candidate, "utf-8");
      return JSON.parse(content) as Registry;
    }
  }

  console.error("registry.json not found. Run 'bun run build' in packages/cli first.");
  process.exit(1);
}

function getRoot(options: CLIOptions): string {
  return options.root || process.env.RAVEN_ROOT || DEFAULT_ROOT;
}

function getRavenDir(options: CLIOptions): string {
  return join(cwd(), getRoot(options));
}

async function verboseLog(message: string, options?: CLIOptions) {
  if (options?.verbose) {
    console.log(message);
  }
}

function error(message: string): never {
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

async function readRavenYamlConfig(ravenDir: string): Promise<RavenYamlConfig> {
  const yamlPath = join(ravenDir, "raven.yaml");
  const content = await readFile(yamlPath, "utf-8");
  const config = parse(content) as RavenYamlConfig;

  if (!config?.version) {
    throw new Error("Invalid raven.yaml: version field is missing");
  }

  return config;
}

async function ensureRavenInstalled(
  options: CLIOptions,
): Promise<{ ravenDir: string; config: RavenYamlConfig }> {
  const root = getRoot(options);
  const ravenDir = getRavenDir(options);

  if (!(await pathExists(ravenDir))) {
    error(`RavenJS not installed at ${root}/. Run 'raven init' first.`);
  }

  try {
    const config = await readRavenYamlConfig(ravenDir);
    return { ravenDir, config };
  } catch (e: any) {
    error(`Failed to load raven.yaml: ${getErrorMessage(e)}`);
  }
}

function getModuleNames(registry: Registry): string[] {
  return Object.keys(registry.modules);
}

function resolveModuleOrder(
  seedModules: string[],
  registry: Registry,
  options?: {
    installed?: Set<string>;
    includeInstalled?: boolean;
  },
): string[] {
  const installed = options?.installed ?? new Set<string>();
  const includeInstalled = options?.includeInstalled ?? false;
  const result: string[] = [];
  const visited = new Set<string>();
  const recStack = new Set<string>();
  const path: string[] = [];
  let cycle: string[] | null = null;

  function visit(name: string) {
    if (recStack.has(name)) {
      const index = path.indexOf(name);
      cycle = path.slice(index).concat(name);
      return;
    }
    if (visited.has(name)) return;

    const module = registry.modules[name];
    if (!module) {
      throw new Error(`Module ${name} not found in registry`);
    }

    visited.add(name);
    recStack.add(name);
    path.push(name);

    for (const dependency of module.dependsOn ?? []) {
      visit(dependency);
      if (cycle !== null) {
        return;
      }
    }

    if (includeInstalled || !installed.has(name)) {
      result.push(name);
    }

    path.pop();
    recStack.delete(name);
  }

  for (const moduleName of [...seedModules].sort()) {
    visit(moduleName);
    if (cycle !== null) {
      break;
    }
  }

  if (cycle !== null) {
    throw new Error(`Circular dependency: ${cycle.join(" -> ")}`);
  }

  return result;
}

function getInstallOrder(moduleName: string, registry: Registry, installed: Set<string>): string[] {
  return resolveModuleOrder([moduleName], registry, {
    installed,
    includeInstalled: false,
  });
}

function replaceRavenImports(content: string, fromModuleDir: string, registry: Registry): string {
  const moduleNames = getModuleNames(registry);
  const depth = fromModuleDir.split("/").filter(Boolean).length;
  const prefix = depth > 0 ? "../".repeat(depth) : "./";
  let output = content;

  for (const moduleName of moduleNames) {
    const relativePath = prefix + moduleName;
    for (const packagePrefix of RAVENJS_PREFIXES) {
      const packageName = `${packagePrefix}${moduleName}`;
      const escapedPackageName = packageName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const doubleQuoteImport = new RegExp(`from\\s+"${escapedPackageName}"`, "g");
      const singleQuoteImport = new RegExp(`from\\s+'${escapedPackageName}'`, "g");
      output = output
        .replace(doubleQuoteImport, `from "${relativePath}"`)
        .replace(singleQuoteImport, `from '${relativePath}'`);
    }
  }

  return output;
}

const SOURCE_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx"];

function isSourceFile(file: string): boolean {
  return SOURCE_EXTENSIONS.some((extension) => file.endsWith(extension));
}

function getModuleDestinationPath(
  destDir: string,
  moduleName: string,
  file: string,
  module: RegistryModule,
  targetSubdir?: string,
): string {
  if (module.fileMapping?.[file]) {
    return join(destDir, module.fileMapping[file]);
  }

  const targetDir = targetSubdir ?? moduleName;
  return join(destDir, targetDir, file);
}

function getModuleOutputPaths(
  moduleNames: string[],
  registry: Registry,
  destDir: string,
): string[] {
  const outputPaths: string[] = [];

  for (const moduleName of moduleNames) {
    const module = registry.modules[moduleName];
    if (!module) {
      continue;
    }

    for (const file of module.files) {
      outputPaths.push(getModuleDestinationPath(destDir, moduleName, file, module));
    }
  }

  return outputPaths;
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

  await verboseLog(`Installing ${moduleName} files...`, options);

  const embeddedSourceDir = join(__dirname, "source");
  const fromModuleDir = targetSubdir ?? moduleName;
  const modifiedFiles: string[] = [];

  const copies = module.files.map(async (file) => {
    const destinationPath = getModuleDestinationPath(
      destDir,
      moduleName,
      file,
      module,
      targetSubdir,
    );
    const sourcePath = join(embeddedSourceDir, moduleName, file);

    await verboseLog(`  Copying ${file}...`, options);

    if (!(await fileExists(sourcePath))) {
      throw new Error(`Missing embedded source file: ${sourcePath}`);
    }

    let content = await readFile(sourcePath, "utf-8");
    if (isSourceFile(file)) {
      content = replaceRavenImports(content, fromModuleDir, registry);
    }

    await ensureDir(dirname(destinationPath));
    await writeFile(destinationPath, content);
    modifiedFiles.push(destinationPath);
  });

  await Promise.all(copies);
  return modifiedFiles;
}

async function installModules(
  moduleNames: string[],
  registry: Registry,
  destDir: string,
  options?: CLIOptions,
): Promise<ModuleWriteResult> {
  const modifiedFiles: string[] = [];
  const dependencies: Record<string, string> = {};

  for (const moduleName of moduleNames) {
    const files = await installModule(registry, moduleName, destDir, options);
    modifiedFiles.push(...files);

    const module = registry.modules[moduleName];
    if (module?.dependencies) {
      Object.assign(dependencies, module.dependencies);
    }
  }

  return {
    modifiedFiles,
    dependencies,
  };
}

async function createRavenYaml(destDir: string, version: string, language?: string) {
  const data: RavenYamlConfig = { version };
  if (language !== undefined) {
    data.language = language;
  }
  const content = stringify(data);
  await writeFile(join(destDir, "raven.yaml"), content);
}

async function copyRootPassthroughFiles(
  sourceDir: string,
  destDir: string,
  passthroughFiles: string[],
): Promise<void> {
  await Promise.all(
    passthroughFiles.map(async (fileName) => {
      await copyFile(join(sourceDir, fileName), join(destDir, fileName));
    }),
  );
}

async function getInstalledModuleState(
  ravenDir: string,
  registry: Registry,
): Promise<InstalledModuleState> {
  const knownModules = new Set(getModuleNames(registry));
  const installedModules: string[] = [];
  const removedModules: string[] = [];
  const passthroughFiles: string[] = [];

  const entries = await readdir(ravenDir, { withFileTypes: true });
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    if (entry.name === "raven.yaml") {
      continue;
    }

    const fullPath = join(ravenDir, entry.name);

    if (entry.isDirectory()) {
      if (knownModules.has(entry.name)) {
        if (!(await isDirEmpty(fullPath))) {
          installedModules.push(entry.name);
        }
      } else {
        removedModules.push(entry.name);
      }
      continue;
    }

    passthroughFiles.push(entry.name);
  }

  return {
    installedModules,
    removedModules,
    passthroughFiles,
  };
}

function createSiblingTempPath(targetDir: string, label: string): string {
  return join(dirname(targetDir), `.${basename(targetDir)}-${label}-${randomUUID()}`);
}

async function buildSyncRoot(
  ravenDir: string,
  config: RavenYamlConfig,
  registry: Registry,
  moduleState: InstalledModuleState,
  options?: CLIOptions,
): Promise<SyncBuildResult> {
  const stagingDir = createSiblingTempPath(ravenDir, "sync");
  const desiredModules = resolveModuleOrder(moduleState.installedModules, registry, {
    includeInstalled: true,
  });

  await ensureDir(stagingDir);

  try {
    await copyRootPassthroughFiles(ravenDir, stagingDir, moduleState.passthroughFiles);
    await createRavenYaml(stagingDir, registry.version, config.language);
    const installResult = await installModules(desiredModules, registry, stagingDir, options);

    return {
      stagingDir,
      desiredModules,
      modifiedFiles: Array.from(
        new Set([
          join(ravenDir, "raven.yaml"),
          ...getModuleOutputPaths(desiredModules, registry, ravenDir),
        ]),
      ).sort(),
      dependencies: installResult.dependencies,
    };
  } catch (e) {
    await rm(stagingDir, { recursive: true, force: true }).catch(() => {});
    throw e;
  }
}

function maybeFailAfterBackupForTests() {
  // Test hook to exercise rollback after the live root has been moved aside.
  if (process.env[SYNC_FAIL_AFTER_BACKUP_ENV] === "1") {
    throw new Error("Simulated sync failure after backup");
  }
}

async function commitStagedRoot(ravenDir: string, stagingDir: string): Promise<void> {
  const backupDir = createSiblingTempPath(ravenDir, "backup");
  let backupCreated = false;
  let stagingCommitted = false;

  try {
    await rename(ravenDir, backupDir);
    backupCreated = true;

    maybeFailAfterBackupForTests();

    await rename(stagingDir, ravenDir);
    stagingCommitted = true;
  } catch (e) {
    if (backupCreated && !stagingCommitted) {
      try {
        if (await pathExists(ravenDir)) {
          await rm(ravenDir, { recursive: true, force: true });
        }
        await rename(backupDir, ravenDir);
        backupCreated = false;
      } catch (rollbackError) {
        throw new Error(
          `${getErrorMessage(e)}; rollback failed: ${getErrorMessage(rollbackError)}`,
        );
      }
    }

    throw e;
  } finally {
    if (!stagingCommitted) {
      await rm(stagingDir, { recursive: true, force: true }).catch(() => {});
    }

    if (stagingCommitted && backupCreated) {
      await rm(backupDir, { recursive: true, force: true }).catch(() => {});
    }
  }
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

async function cmdInit(options: CLIOptions) {
  const registry = await loadRegistry(options);
  const targetDir = cwd();
  const ravenDir = getRavenDir(options);

  await verboseLog(`Initializing RavenJS in ${targetDir}`, options);

  const modifiedFiles: string[] = [];
  const ravenRootExists = await pathExists(ravenDir);
  const ravenYamlPath = join(ravenDir, "raven.yaml");
  const ravenYamlExists = await pathExists(ravenYamlPath);

  const doInit = async () => {
    if (!ravenRootExists || !ravenYamlExists) {
      await ensureDir(ravenDir);
      await createRavenYaml(ravenDir, registry.version, options.language);
      modifiedFiles.push(ravenYamlPath);
    }
  };

  if (options.verbose) {
    await doInit();
  } else {
    const spinner = makeSpinner();
    spinner.start("Initializing raven root...");
    try {
      await doInit();
    } catch (e) {
      spinner.stop("Initialization failed");
      error(getErrorMessage(e));
    }
    spinner.stop("Initializing raven root...");
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

async function cmdAdd(moduleName: string, options: CLIOptions) {
  const registry = await loadRegistry(options);
  if (!moduleName) {
    error(`Please specify a module to add. Available: ${getModuleNames(registry).join(", ")}`);
  }

  if (!getModuleNames(registry).includes(moduleName)) {
    error(`Unknown module: ${moduleName}`);
  }

  const { ravenDir } = await ensureRavenInstalled(options);
  const installed = await getInstalledModules(ravenDir, registry);
  const order = getInstallOrder(moduleName, registry, installed);

  try {
    const result = await installModules(order, registry, ravenDir, options);
    console.log(
      JSON.stringify({
        success: true,
        moduleName,
        modifiedFiles: result.modifiedFiles,
        dependencies: result.dependencies,
      }),
    );
    const status = await getStatus(registry, options);
    console.log(JSON.stringify(status));
  } catch (e) {
    error(getErrorMessage(e));
  }
}

async function cmdSync(options: CLIOptions) {
  const registry = await loadRegistry(options);
  const { ravenDir, config } = await ensureRavenInstalled(options);
  const moduleState = await getInstalledModuleState(ravenDir, registry);

  try {
    const syncBuild = await buildSyncRoot(ravenDir, config, registry, moduleState, options);
    await commitStagedRoot(ravenDir, syncBuild.stagingDir);

    console.log(
      JSON.stringify({
        success: true,
        syncedModules: syncBuild.desiredModules,
        removedModules: moduleState.removedModules,
        modifiedFiles: syncBuild.modifiedFiles,
        dependencies: syncBuild.dependencies,
      }),
    );

    const status = await getStatus(registry, options);
    console.log(JSON.stringify(status));
  } catch (e) {
    error(getErrorMessage(e));
  }
}

async function computeFileHash(filePath: string): Promise<string> {
  const content = await readFile(filePath);
  return createHash("sha256").update(content).digest("hex");
}

async function getStatus(registry: Registry, options: CLIOptions): Promise<StatusResult> {
  const ravenDir = getRavenDir(options);
  const modifiedFiles: string[] = [];
  const fileHashes: Record<string, string> = {};
  const moduleStatus: ModuleInfo[] = [];
  const knownModules = getModuleNames(registry).sort();
  let currentVersion: string | undefined;
  let language: string | undefined;

  if (await pathExists(ravenDir)) {
    try {
      const config = await readRavenYamlConfig(ravenDir);
      currentVersion = config.version;
      language = config.language;
    } catch {
      // raven.yaml missing or invalid
    }

    for (const name of knownModules) {
      const moduleDir = join(ravenDir, name);
      const installed = (await pathExists(moduleDir)) && !(await isDirEmpty(moduleDir));
      const module = registry.modules[name];
      moduleStatus.push({
        name,
        description: module?.description,
        installed,
        installDir: resolve(moduleDir),
      });
    }

    async function traverseDir(dir: string, baseDir: string) {
      const entries = await readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        const relativePath = fullPath.slice(baseDir.length + 1);
        if (entry.isDirectory()) {
          await traverseDir(fullPath, baseDir);
        } else {
          fileHashes[relativePath] = await computeFileHash(fullPath);
        }
      }
    }

    await traverseDir(ravenDir, ravenDir);
  }

  if (moduleStatus.length === 0) {
    for (const name of knownModules) {
      const module = registry.modules[name];
      const moduleDir = join(ravenDir, name);
      moduleStatus.push({
        name,
        description: module?.description,
        installed: false,
        installDir: resolve(moduleDir),
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

async function cmdStatus(options: CLIOptions) {
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
  .action(async function (this: { opts: () => CLIOptions }) {
    const options = this.opts();
    await cmdInit({ ...program.opts(), language: options.language } as CLIOptions);
  });

program
  .command("add <module>")
  .description("Add a module (e.g., core)")
  .action(async (module: string) => {
    await cmdAdd(module, program.opts() as CLIOptions);
  });

program
  .command("sync")
  .description("Sync installed modules to registry, remove stale module directories atomically")
  .action(async () => {
    await cmdSync(program.opts() as CLIOptions);
  });

program
  .command("status")
  .description("Show RavenJS installation status (core, modules)")
  .action(async () => {
    await cmdStatus(program.opts() as CLIOptions);
  });

(async () => {
  await program.parseAsync();
})().catch((e) => {
  error(getErrorMessage(e));
});
