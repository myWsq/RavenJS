import { afterEach, beforeAll, describe, expect, it } from "bun:test";
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join, resolve } from "path";

const isBun = typeof Bun !== "undefined";
const repoRoot = resolve(import.meta.dir, "..", "..");
const cliDistDir = join(repoRoot, "packages", "cli", "dist");
const cliPath = join(cliDistDir, "raven");
const registryPath = join(cliDistDir, "registry.json");

async function runCommand(cmd: string[], cwd: string, env?: Record<string, string>) {
  if (!isBun) {
    throw new Error("Bun runtime is required for CLI e2e tests");
  }
  const proc = Bun.spawn({
    cmd,
    cwd,
    env: { ...process.env, ...env },
    stdout: "pipe",
    stderr: "pipe",
  });
  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  const exitCode = await proc.exited;
  return { exitCode, stdout, stderr };
}

async function ensureBuilt() {
  const result = await runCommand(
    ["bun", "run", "scripts/build.ts"],
    join(repoRoot, "packages", "cli"),
  );
  if (result.exitCode !== 0) {
    throw new Error(result.stderr || result.stdout);
  }
}

async function runCli(args: string[], cwd: string, env?: Record<string, string>) {
  return runCommand(["bun", cliPath, ...args], cwd, env);
}

async function runGit(args: string[], cwd: string, env?: Record<string, string>) {
  return runCommand(["git", ...args], cwd, env);
}

async function createTempDir(tempDirs: string[]) {
  const tmp = await mkdtemp(join(tmpdir(), "raven-cli-test-"));
  tempDirs.push(tmp);
  return tmp;
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function initGitRepo(cwd: string) {
  let result = await runGit(["init"], cwd);
  if (result.exitCode !== 0) {
    throw new Error(result.stderr || result.stdout);
  }

  result = await runGit(["config", "user.email", "raven@example.com"], cwd);
  if (result.exitCode !== 0) {
    throw new Error(result.stderr || result.stdout);
  }

  result = await runGit(["config", "user.name", "Raven Test"], cwd);
  if (result.exitCode !== 0) {
    throw new Error(result.stderr || result.stdout);
  }
}

async function commitAll(cwd: string, message: string) {
  let result = await runGit(["add", "."], cwd);
  if (result.exitCode !== 0) {
    throw new Error(result.stderr || result.stdout);
  }

  result = await runGit(["commit", "-m", message, "--no-gpg-sign"], cwd, {
    GIT_AUTHOR_NAME: "Raven Test",
    GIT_AUTHOR_EMAIL: "raven@example.com",
    GIT_COMMITTER_NAME: "Raven Test",
    GIT_COMMITTER_EMAIL: "raven@example.com",
  });
  if (result.exitCode !== 0) {
    throw new Error(result.stderr || result.stdout);
  }
}

async function readRegistry() {
  return JSON.parse(await readFile(registryPath, "utf-8")) as {
    version: string;
    modules: Record<string, { files: string[]; dependsOn?: string[] }>;
  };
}

describe("CLI E2E", () => {
  let tempDirs: string[] = [];

  beforeAll(async () => {
    await ensureBuilt();
  });

  afterEach(async () => {
    await Promise.all(
      tempDirs.map((dir) => rm(dir, { recursive: true, force: true }).catch(() => {})),
    );
    tempDirs = [];
  });

  describe("Help and Version", () => {
    it("should show help with --help", async () => {
      const cwd = await createTempDir(tempDirs);
      const result = await runCli(["--help"], cwd);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("Usage:");
      expect(result.stdout).toContain("raven");
    });

    it("should show help with -h", async () => {
      const cwd = await createTempDir(tempDirs);
      const result = await runCli(["-h"], cwd);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("Usage:");
    });

    it("should show version with --version", async () => {
      const cwd = await createTempDir(tempDirs);
      const result = await runCli(["--version"], cwd);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatch(/\d+\.\d+\.\d+/);
    });
  });

  describe("Init Command", () => {
    it("should init with default root and create raven dir", async () => {
      const cwd = await createTempDir(tempDirs);
      const result = await runCli(["init"], cwd);

      expect(result.exitCode).toBe(0);

      const ravenDir = join(cwd, "raven");
      expect(await fileExists(ravenDir)).toBe(true);
      expect(await fileExists(join(ravenDir, "raven.yaml"))).toBe(true);
    });

    it("should init with custom root directory", async () => {
      const cwd = await createTempDir(tempDirs);
      const result = await runCli(["init", "--root", "my-raven"], cwd);

      expect(result.exitCode).toBe(0);

      const ravenDir = join(cwd, "my-raven");
      expect(await fileExists(ravenDir)).toBe(true);
      expect(await fileExists(join(ravenDir, "raven.yaml"))).toBe(true);
    });

    it("should be idempotent when root exists (does not modify raven root or raven.yaml)", async () => {
      const cwd = await createTempDir(tempDirs);
      await runCli(["init"], cwd);
      const yamlPath = join(cwd, "raven", "raven.yaml");
      const before = await readFile(yamlPath, "utf-8");

      const result = await runCli(["init"], cwd);
      expect(result.exitCode).toBe(0);
      const after = await readFile(yamlPath, "utf-8");
      expect(after).toBe(before);
    });

    it("should create valid raven.yaml", async () => {
      const cwd = await createTempDir(tempDirs);
      await runCli(["init"], cwd);

      const yamlContent = await readFile(join(cwd, "raven", "raven.yaml"), "utf-8");
      expect(yamlContent).toContain("version:");
    });

    it("should write --language to raven.yaml", async () => {
      const cwd = await createTempDir(tempDirs);
      const result = await runCli(["init", "--language", "Chinese"], cwd);

      expect(result.exitCode).toBe(0);
      const yamlContent = await readFile(join(cwd, "raven", "raven.yaml"), "utf-8");
      expect(yamlContent).toContain("language: Chinese");
    });

    it("should show verbose output with --verbose", async () => {
      const cwd = await createTempDir(tempDirs);
      const result = await runCli(["init", "--verbose"], cwd);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("Initializing RavenJS");
    });
  });

  function findModule(mods: { name: string; installed: boolean }[], name: string) {
    return mods.find((m) => m.name === name);
  }

  describe("Status Command", () => {
    it("should exit 0 in empty directory", async () => {
      const cwd = await createTempDir(tempDirs);
      const result = await runCli(["status"], cwd);

      expect(result.exitCode).toBe(0);
      const out = JSON.parse(result.stdout.trim());
      expect(Array.isArray(out.modules)).toBe(true);
      expect(out).toHaveProperty("language");
      expect(out.language).toBe("English (default)");
      const coreMod = findModule(out.modules, "core");
      expect(coreMod?.installed).toBe(false);
    });

    it("should output JSON with language field", async () => {
      const cwd = await createTempDir(tempDirs);
      await runCli(["init", "--language", "English"], cwd);
      const result = await runCli(["status"], cwd);

      expect(result.exitCode).toBe(0);
      const json = JSON.parse(result.stdout.trim());
      expect(json).toHaveProperty("language", "English");
    });

    it("should output JSON with valid structure (modules with name and installed)", async () => {
      const cwd = await createTempDir(tempDirs);
      const result = await runCli(["status"], cwd);

      expect(result.exitCode).toBe(0);
      const json = JSON.parse(result.stdout.trim());
      expect(json).toHaveProperty("modules");
      expect(Array.isArray(json.modules)).toBe(true);
      expect(json).not.toHaveProperty("modifiedFiles");
      expect(json).not.toHaveProperty("fileHashes");
      for (const m of json.modules) {
        expect(m).toHaveProperty("name");
        expect(m).toHaveProperty("installed");
      }
    });

    it("should show core installed after add core", async () => {
      const cwd = await createTempDir(tempDirs);
      await runCli(["init"], cwd);
      await runCli(["add", "core"], cwd);

      const result = await runCli(["status"], cwd);

      expect(result.exitCode).toBe(0);
      const out = JSON.parse(result.stdout.trim());
      expect(findModule(out.modules, "core")?.installed).toBe(true);
    });

    it("should show modules after add", async () => {
      const cwd = await createTempDir(tempDirs);
      await runCli(["init"], cwd);
      await runCli(["add", "sql"], cwd);

      const result = await runCli(["status"], cwd);

      expect(result.exitCode).toBe(0);
      const out = JSON.parse(result.stdout.trim());
      expect(findModule(out.modules, "core")?.installed).toBe(true);
      expect(findModule(out.modules, "sql")?.installed).toBe(true);
      expect(findModule(out.modules, "schema-validator")).toBeUndefined();
    });

    it("should respect --root option", async () => {
      const cwd = await createTempDir(tempDirs);
      await runCli(["init", "--root", "my-raven"], cwd);
      await runCli(["add", "core", "--root", "my-raven"], cwd);

      const result = await runCli(["status", "--root", "my-raven"], cwd);

      expect(result.exitCode).toBe(0);
      const json = JSON.parse(result.stdout.trim());
      expect(findModule(json.modules, "core")?.installed).toBe(true);
    });
  });

  describe("Add Command", () => {
    it("should add a module and auto-install dependencies", async () => {
      const cwd = await createTempDir(tempDirs);
      await runCli(["init"], cwd);

      const result = await runCli(["add", "sql"], cwd);

      expect(result.exitCode).toBe(0);
      // add outputs two JSON lines: add result + status (for Agent, one call saves tokens)
      const lines = result.stdout.trim().split("\n").filter(Boolean);
      expect(lines.length).toBe(2);

      const addResult = JSON.parse(lines[0] || "{}");
      expect(addResult.success).toBe(true);
      expect(addResult.moduleName).toBe("sql");
      expect(Array.isArray(addResult.modifiedFiles)).toBe(true);
      expect(typeof addResult.dependencies).toBe("object");

      const status = JSON.parse(lines[1] || "{}");
      expect(status).toHaveProperty("modules");
      expect(Array.isArray(status.modules)).toBe(true);
      expect(findModule(status.modules, "core")?.installed).toBe(true);
      expect(findModule(status.modules, "sql")?.installed).toBe(true);
      expect(findModule(status.modules, "schema-validator")).toBeUndefined();

      const coreDir = join(cwd, "raven", "core");
      const moduleDir = join(cwd, "raven", "sql");
      expect(await fileExists(coreDir)).toBe(true);
      expect(await fileExists(moduleDir)).toBe(true);
      expect(await fileExists(join(moduleDir, "index.ts"))).toBe(true);
    });

    it("should replace @raven.js/core with relative path in copied files", async () => {
      const cwd = await createTempDir(tempDirs);
      await runCli(["init"], cwd);
      await runCli(["add", "sql"], cwd);

      const mainTs = await readFile(join(cwd, "raven", "sql", "index.ts"), "utf-8");
      expect(mainTs).toContain('from "../core"');
      expect(mainTs).not.toContain("@raven.js/core");
    });

    it("should fail when project not initialized", async () => {
      const cwd = await createTempDir(tempDirs);
      const result = await runCli(["add", "sql"], cwd);

      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain("raven init");
    });

    it("should reject removed schema-validator module", async () => {
      const cwd = await createTempDir(tempDirs);
      await runCli(["init"], cwd);

      const result = await runCli(["add", "schema-validator"], cwd);

      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain("Unknown module");
    });

    it("should fail for unknown module", async () => {
      const cwd = await createTempDir(tempDirs);
      await runCli(["init"], cwd);

      const result = await runCli(["add", "unknown-module"], cwd);

      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain("Unknown module");
    });
  });

  describe("Sync Command", () => {
    it("should remove leftover files by rebuilding installed modules", async () => {
      const cwd = await createTempDir(tempDirs);
      await initGitRepo(cwd);
      await runCli(["init"], cwd);
      await runCli(["add", "sql"], cwd);
      await commitAll(cwd, "baseline");

      const extraFile = join(cwd, "raven", "sql", "extra.ts");
      await writeFile(extraFile, "export const stale = true;\n");
      await commitAll(cwd, "add stale file");

      const result = await runCli(["sync"], cwd);

      expect(result.exitCode).toBe(0);
      const lines = result.stdout.trim().split("\n").filter(Boolean);
      expect(lines.length).toBe(2);

      const syncResult = JSON.parse(lines[0] || "{}");
      expect(syncResult.success).toBe(true);
      expect(syncResult.syncedModules).toEqual(["core", "sql"]);
      expect(syncResult.removedModules).toEqual([]);

      expect(await fileExists(extraFile)).toBe(false);

      const status = JSON.parse(lines[1] || "{}");
      expect(findModule(status.modules, "core")?.installed).toBe(true);
      expect(findModule(status.modules, "sql")?.installed).toBe(true);
    });

    it("should remove module directories that are no longer in the registry", async () => {
      const cwd = await createTempDir(tempDirs);
      await initGitRepo(cwd);
      await runCli(["init"], cwd);
      await runCli(["add", "core"], cwd);
      await commitAll(cwd, "baseline");

      const legacyDir = join(cwd, "raven", "legacy-module");
      await mkdir(legacyDir, { recursive: true });
      await writeFile(join(legacyDir, "index.ts"), "export {};\n");
      await commitAll(cwd, "add legacy module");

      const result = await runCli(["sync"], cwd);

      expect(result.exitCode).toBe(0);
      const lines = result.stdout.trim().split("\n").filter(Boolean);
      const syncResult = JSON.parse(lines[0] || "{}");
      expect(syncResult.removedModules).toEqual(["legacy-module"]);
      expect(await fileExists(legacyDir)).toBe(false);
    });

    it("should restore missing dependsOn modules during sync", async () => {
      const cwd = await createTempDir(tempDirs);
      await initGitRepo(cwd);
      await runCli(["init"], cwd);
      await runCli(["add", "sql"], cwd);
      await commitAll(cwd, "baseline");

      const coreDir = join(cwd, "raven", "core");
      await rm(coreDir, { recursive: true, force: true });
      expect(await fileExists(coreDir)).toBe(false);
      await commitAll(cwd, "remove core manually");

      const result = await runCli(["sync"], cwd);

      expect(result.exitCode).toBe(0);
      expect(await fileExists(join(coreDir, "index.ts"))).toBe(true);

      const lines = result.stdout.trim().split("\n").filter(Boolean);
      const syncResult = JSON.parse(lines[0] || "{}");
      expect(syncResult.syncedModules).toEqual(["core", "sql"]);
    });

    it("should keep the original root when staging fails", async () => {
      const cwd = await createTempDir(tempDirs);
      const brokenRegistryDir = await createTempDir(tempDirs);
      await initGitRepo(cwd);
      await runCli(["init"], cwd);
      await runCli(["add", "core"], cwd);
      await commitAll(cwd, "baseline");

      const yamlPath = join(cwd, "raven", "raven.yaml");
      const coreIndexPath = join(cwd, "raven", "core", "index.ts");
      const beforeYaml = await readFile(yamlPath, "utf-8");
      const beforeCore = await readFile(coreIndexPath, "utf-8");

      const registry = await readRegistry();
      registry.version = "9.9.9";
      registry.modules.core.files = [...registry.modules.core.files, "missing.ts"];

      const brokenRegistryPath = join(brokenRegistryDir, "broken-registry.json");
      await writeFile(brokenRegistryPath, JSON.stringify(registry, null, 2));

      const result = await runCli(["--registry", brokenRegistryPath, "sync"], cwd);

      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain("Missing embedded source file");
      expect(await readFile(yamlPath, "utf-8")).toBe(beforeYaml);
      expect(await readFile(coreIndexPath, "utf-8")).toBe(beforeCore);
    });

    it("should roll back the original root when the final swap fails", async () => {
      const cwd = await createTempDir(tempDirs);
      await initGitRepo(cwd);
      await runCli(["init"], cwd);
      await runCli(["add", "sql"], cwd);
      await commitAll(cwd, "baseline");

      const yamlPath = join(cwd, "raven", "raven.yaml");
      const extraFile = join(cwd, "raven", "sql", "extra.ts");
      const beforeYaml = await readFile(yamlPath, "utf-8");
      await writeFile(extraFile, "export const stillHereAfterRollback = true;\n");
      await commitAll(cwd, "add rollback marker");

      const result = await runCli(["sync"], cwd, {
        RAVEN_SYNC_TEST_FAIL_AFTER_BACKUP: "1",
      });

      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain("Simulated sync failure after backup");
      expect(await readFile(yamlPath, "utf-8")).toBe(beforeYaml);
      expect(await fileExists(extraFile)).toBe(true);
      expect(await fileExists(join(cwd, "raven", "sql", "index.ts"))).toBe(true);
    });

    it("should fail outside a Git worktree without modifying raven root", async () => {
      const cwd = await createTempDir(tempDirs);
      await runCli(["init"], cwd);
      await runCli(["add", "core"], cwd);

      const yamlPath = join(cwd, "raven", "raven.yaml");
      const beforeYaml = await readFile(yamlPath, "utf-8");

      const result = await runCli(["sync"], cwd);

      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain("Git worktree");
      expect(await readFile(yamlPath, "utf-8")).toBe(beforeYaml);
    });

    it("should fail in a dirty Git worktree without modifying raven root", async () => {
      const cwd = await createTempDir(tempDirs);
      await initGitRepo(cwd);
      await runCli(["init"], cwd);
      await runCli(["add", "core"], cwd);
      await commitAll(cwd, "baseline");

      const yamlPath = join(cwd, "raven", "raven.yaml");
      const beforeYaml = await readFile(yamlPath, "utf-8");
      await writeFile(join(cwd, "README.local.md"), "dirty\n");

      const result = await runCli(["sync"], cwd);

      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain("clean Git worktree");
      expect(await readFile(yamlPath, "utf-8")).toBe(beforeYaml);
    });
  });

  describe("Error Handling", () => {
    it("should show error for unknown option", async () => {
      const cwd = await createTempDir(tempDirs);
      const result = await runCli(["add", "core", "--unknown-option"], cwd);

      expect(result.exitCode).not.toBe(0);
    });
  });

  describe("Global Options", () => {
    it("should accept --root option with init", async () => {
      const cwd = await createTempDir(tempDirs);
      const result = await runCli(["--root", "custom-root", "init"], cwd);

      expect(result.exitCode).toBe(0);
      expect(await fileExists(join(cwd, "custom-root"))).toBe(true);
    });

    it("should accept -v as verbose shortcut", async () => {
      const cwd = await createTempDir(tempDirs);
      const result = await runCli(["init", "-v"], cwd);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("Initializing RavenJS");
    });
  });
});
