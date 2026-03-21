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
import { basename, dirname, isAbsolute, join, relative, resolve } from "path";
import { cwd } from "process";
import { randomUUID } from "crypto";
import { fileURLToPath } from "url";

import { spinner as makeSpinner, log } from "@clack/prompts";
import pc from "picocolors";
import { parse, stringify } from "yaml";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = "raven";
const CORE_PACKAGE_NAMES = ["@ravenjs/core", "@raven.js/core"];
const SOURCE_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx"];
const SYNC_FAIL_AFTER_BACKUP_ENV = "RAVEN_SYNC_TEST_FAIL_AFTER_BACKUP";

interface CLIOptions {
  verbose?: boolean;
  root?: string;
  registry?: string;
  language?: string;
}

interface ManagedDirInfo {
  files: string[];
}

interface SourceManifest {
  version: string;
  core: ManagedDirInfo;
}

interface RavenYamlConfig {
  version: string;
  language?: string;
}

interface StatusResult {
  installed: boolean;
  installDir: string;
  rootDir: string;
  version?: string;
  language?: string;
}

interface ManagedState {
  coreInstalled: boolean;
  passthroughFiles: string[];
  legacyDirs: string[];
}

interface SyncBuildResult {
  stagingDir: string;
  modifiedFiles: string[];
}

interface GitCommandResult {
  exitCode: number;
  stdout: string;
  stderr: string;
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
    if (e.code !== "EEXIST") {
      throw e;
    }
  }
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch (e: any) {
    if (e.code === "ENOENT") {
      return false;
    }
    throw e;
  }
}

async function isDirEmpty(path: string): Promise<boolean> {
  try {
    const entries = await readdir(path);
    return entries.length === 0;
  } catch (e: any) {
    if (e.code === "ENOENT") {
      return true;
    }
    throw e;
  }
}

function runGitCommand(args: string[]): GitCommandResult {
  const proc = Bun.spawnSync({
    cmd: ["git", ...args],
    cwd: cwd(),
    stdout: "pipe",
    stderr: "pipe",
  });

  return {
    exitCode: proc.exitCode,
    stdout: Buffer.from(proc.stdout).toString("utf-8"),
    stderr: Buffer.from(proc.stderr).toString("utf-8"),
  };
}

function isGitUnavailable(result: GitCommandResult): boolean {
  const stderr = result.stderr.toLowerCase();
  return (
    result.exitCode === 127 ||
    stderr.includes("command not found") ||
    stderr.includes("no such file or directory")
  );
}

function ensureGitWorktreeForSync(): void {
  const insideWorktree = runGitCommand(["rev-parse", "--is-inside-work-tree"]);
  if (insideWorktree.exitCode !== 0) {
    if (isGitUnavailable(insideWorktree)) {
      error("Git is required for 'raven sync'. Install Git first.");
    }

    error(
      "raven sync requires a Git worktree. Initialize Git or create a recoverable backup first.",
    );
  }
}

function toGitPathspec(path: string): string {
  return relative(cwd(), path).replace(/\\/g, "/");
}

function getManagedGitPathspecs(ravenDir: string, managedState: ManagedState): string[] {
  const pathspecs = [
    join(ravenDir, "raven.yaml"),
    getCoreDir(ravenDir),
    ...managedState.legacyDirs.map((dir) => join(ravenDir, dir)),
  ];

  return [...new Set(pathspecs.map(toGitPathspec))].sort();
}

function ensureManagedRavenPathsClean(ravenDir: string, managedState: ManagedState): void {
  const status = runGitCommand([
    "status",
    "--porcelain",
    "--untracked-files=all",
    "--",
    ...getManagedGitPathspecs(ravenDir, managedState),
  ]);
  if (status.exitCode !== 0) {
    if (isGitUnavailable(status)) {
      error("Git is required for 'raven sync'. Install Git first.");
    }

    error(`Failed to inspect Git worktree: ${status.stderr.trim() || "unknown git error"}`);
  }

  if (status.stdout.trim() !== "") {
    const rootLabel = toGitPathspec(ravenDir);
    error(
      `raven sync requires clean managed Raven paths. Commit, stash, or back up changes under ${rootLabel}/raven.yaml, ${rootLabel}/core/, and managed legacy directories first.`,
    );
  }
}

function getRoot(options: CLIOptions): string {
  return options.root || process.env.RAVEN_ROOT || DEFAULT_ROOT;
}

function getRavenDir(options: CLIOptions): string {
  return join(cwd(), getRoot(options));
}

function getCoreDir(rootDir: string): string {
  return join(rootDir, "core");
}

async function verboseLog(message: string, options?: CLIOptions) {
  if (options?.verbose) {
    console.log(message);
  }
}

async function loadManifest(options?: { registry?: string }): Promise<SourceManifest> {
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
    if (await pathExists(candidate)) {
      const content = await readFile(candidate, "utf-8");
      return JSON.parse(content) as SourceManifest;
    }
  }

  error("registry.json not found. Run 'bun run build' in packages/cli first.");
}

async function createRavenYaml(destDir: string, version: string, language?: string) {
  const data: RavenYamlConfig = { version };
  if (language !== undefined) {
    data.language = language;
  }
  const content = stringify(data);
  await writeFile(join(destDir, "raven.yaml"), content);
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

async function ensureRavenInitialized(
  options: CLIOptions,
): Promise<{ ravenDir: string; config: RavenYamlConfig }> {
  const ravenDir = getRavenDir(options);
  if (!(await pathExists(ravenDir))) {
    error(`RavenJS not installed at ${getRoot(options)}/. Run 'raven init' first.`);
  }

  try {
    return {
      ravenDir,
      config: await readRavenYamlConfig(ravenDir),
    };
  } catch (e) {
    error(`Failed to load raven.yaml: ${getErrorMessage(e)}`);
  }
}

function isSourceFile(file: string): boolean {
  return SOURCE_EXTENSIONS.some((extension) => file.endsWith(extension));
}

function normalizeImportPath(path: string): string {
  const normalized = path.replace(/\\/g, "/");
  return normalized.startsWith(".") ? normalized : `./${normalized}`;
}

function rewriteCoreImports(content: string, destinationPath: string, ravenDir: string): string {
  const targetPath = normalizeImportPath(relative(dirname(destinationPath), getCoreDir(ravenDir)));
  let output = content;

  for (const packageName of CORE_PACKAGE_NAMES) {
    const escaped = packageName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    output = output
      .replace(new RegExp(`from\\s+"${escaped}"`, "g"), `from "${targetPath}"`)
      .replace(new RegExp(`from\\s+'${escaped}'`, "g"), `from '${targetPath}'`);
  }

  return output;
}

async function copyManagedFile(
  sourcePath: string,
  destinationPath: string,
  options?: CLIOptions,
  ravenDir?: string,
): Promise<void> {
  await verboseLog(`  Copying ${sourcePath} -> ${destinationPath}`, options);

  if (!(await pathExists(sourcePath))) {
    throw new Error(`Missing embedded source file: ${sourcePath}`);
  }

  let content = await readFile(sourcePath, "utf-8");
  if (ravenDir && isSourceFile(destinationPath)) {
    content = rewriteCoreImports(content, destinationPath, ravenDir);
  }

  await ensureDir(dirname(destinationPath));
  await writeFile(destinationPath, content);
}

async function installCore(manifest: SourceManifest, ravenDir: string, options?: CLIOptions) {
  const sourceRoot = join(__dirname, "source", "core");
  const coreDir = getCoreDir(ravenDir);

  for (const file of manifest.core.files) {
    await copyManagedFile(join(sourceRoot, file), join(coreDir, file), options);
  }
}

function getManagedOutputPaths(manifest: SourceManifest, ravenDir: string): string[] {
  const corePaths = manifest.core.files.map((file) => join(getCoreDir(ravenDir), file));

  return [join(ravenDir, "raven.yaml"), ...corePaths].sort();
}

async function installManagedAssets(
  manifest: SourceManifest,
  ravenDir: string,
  options?: CLIOptions,
): Promise<void> {
  await installCore(manifest, ravenDir, options);
}

async function getManagedState(ravenDir: string): Promise<ManagedState> {
  const passthroughFiles: string[] = [];
  const legacyDirs: string[] = [];
  const coreDir = getCoreDir(ravenDir);
  const coreInstalled = (await pathExists(coreDir)) && !(await isDirEmpty(coreDir));

  if (!(await pathExists(ravenDir))) {
    return {
      coreInstalled: false,
      passthroughFiles,
      legacyDirs,
    };
  }

  const entries = await readdir(ravenDir, { withFileTypes: true });
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    if (entry.name === "raven.yaml") {
      continue;
    }

    if (entry.isDirectory()) {
      if (entry.name === "core") {
        continue;
      }
      legacyDirs.push(entry.name);
      continue;
    }

    passthroughFiles.push(entry.name);
  }

  return {
    coreInstalled,
    passthroughFiles,
    legacyDirs,
  };
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

function createSiblingTempPath(targetDir: string, label: string): string {
  return join(dirname(targetDir), `.${basename(targetDir)}-${label}-${randomUUID()}`);
}

async function buildSyncRoot(
  ravenDir: string,
  config: RavenYamlConfig,
  manifest: SourceManifest,
  options?: CLIOptions,
): Promise<SyncBuildResult> {
  const stagingDir = createSiblingTempPath(ravenDir, "sync");
  const managedState = await getManagedState(ravenDir);

  await ensureDir(stagingDir);

  try {
    await copyRootPassthroughFiles(ravenDir, stagingDir, managedState.passthroughFiles);
    await createRavenYaml(stagingDir, manifest.version, config.language);
    await installManagedAssets(manifest, stagingDir, options);

    return {
      stagingDir,
      modifiedFiles: getManagedOutputPaths(manifest, ravenDir),
    };
  } catch (e) {
    await rm(stagingDir, { recursive: true, force: true }).catch(() => {});
    throw e;
  }
}

function maybeFailAfterBackupForTests() {
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

async function getStatus(manifest: SourceManifest, options: CLIOptions): Promise<StatusResult> {
  const ravenDir = getRavenDir(options);
  const installDir = resolve(getCoreDir(ravenDir));
  const rootDir = resolve(ravenDir);
  let version: string | undefined = manifest.version;
  let language = "English (default)";

  if (await pathExists(ravenDir)) {
    try {
      const config = await readRavenYamlConfig(ravenDir);
      version = config.version;
      language = config.language ?? language;
    } catch {
      // ignore malformed raven.yaml in status; still report expected locations
    }
  }

  const installed =
    (await pathExists(getCoreDir(ravenDir))) && !(await isDirEmpty(getCoreDir(ravenDir)));

  return {
    installed,
    installDir,
    rootDir,
    version,
    language,
  };
}

async function cmdInit(options: CLIOptions) {
  const manifest = await loadManifest(options);
  const ravenDir = getRavenDir(options);
  const coreDir = getCoreDir(ravenDir);
  const modifiedFiles: string[] = [];

  const doInit = async () => {
    const ravenDirExists = await pathExists(ravenDir);
    const ravenYamlPath = join(ravenDir, "raven.yaml");
    const yamlExists = await pathExists(ravenYamlPath);
    const coreInstalled = (await pathExists(coreDir)) && !(await isDirEmpty(coreDir));

    await verboseLog(`Initializing RavenJS in ${cwd()}`, options);

    if (!ravenDirExists) {
      await ensureDir(ravenDir);
    }

    if (!yamlExists) {
      await createRavenYaml(ravenDir, manifest.version, options.language);
      modifiedFiles.push(ravenYamlPath);
    }

    if (!coreInstalled) {
      await installCore(manifest, ravenDir, options);
      modifiedFiles.push(...manifest.core.files.map((file) => join(coreDir, file)));
    }
  };

  if (options.verbose) {
    await doInit();
  } else {
    const spinner = makeSpinner();
    spinner.start("Initializing RavenJS...");
    try {
      await doInit();
    } catch (e) {
      spinner.stop("Initialization failed");
      error(getErrorMessage(e));
    }
    spinner.stop("Initialization complete");
  }

  success("RavenJS initialized.");

  printSectionHeader("Managed Paths");
  if (modifiedFiles.length === 0) {
    printListItem("No changes (existing Raven core kept as-is)");
  } else {
    for (const file of modifiedFiles) {
      printListItem(file);
    }
  }
}

async function cmdSync(options: CLIOptions) {
  const manifest = await loadManifest(options);
  ensureGitWorktreeForSync();
  const { ravenDir, config } = await ensureRavenInitialized(options);
  const managedState = await getManagedState(ravenDir);
  ensureManagedRavenPathsClean(ravenDir, managedState);

  try {
    const syncBuild = await buildSyncRoot(ravenDir, config, manifest, options);
    await commitStagedRoot(ravenDir, syncBuild.stagingDir);

    console.log(
      JSON.stringify({
        success: true,
        removedDirectories: managedState.legacyDirs,
        modifiedFiles: syncBuild.modifiedFiles,
      }),
    );
    console.log(JSON.stringify(await getStatus(manifest, options)));
  } catch (e) {
    error(getErrorMessage(e));
  }
}

async function cmdStatus(options: CLIOptions) {
  const manifest = await loadManifest(options);
  console.log(JSON.stringify(await getStatus(manifest, options)));
}

const program = new Command("raven");
program.version(loadCliVersion());

program
  .option("--registry <path>", "Source manifest json path (default: same dir as CLI)")
  .option("--root <dir>", "RavenJS root directory (default: raven)")
  .option("-v, --verbose", "Verbose output");

program
  .command("init")
  .description("Initialize RavenJS root and install the managed core reference tree.")
  .option("--language <lang>", "Language (stored in raven.yaml)")
  .action(async function (this: { opts: () => CLIOptions }) {
    const options = this.opts();
    await cmdInit({ ...program.opts(), language: options.language } as CLIOptions);
  });

program
  .command("sync")
  .description("Sync the managed Raven core in a Git worktree with clean managed Raven paths.")
  .action(async () => {
    await cmdSync(program.opts() as CLIOptions);
  });

program
  .command("status")
  .description("Show RavenJS installation status for the managed core tree.")
  .action(async () => {
    await cmdStatus(program.opts() as CLIOptions);
  });

(async () => {
  await program.parseAsync();
})().catch((e) => {
  error(getErrorMessage(e));
});
