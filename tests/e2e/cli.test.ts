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

async function readManifest() {
  return JSON.parse(await readFile(registryPath, "utf-8")) as {
    version: string;
    core: { files: string[] };
    examples: Record<string, { files: string[] }>;
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

    it("should show version with --version", async () => {
      const cwd = await createTempDir(tempDirs);
      const result = await runCli(["--version"], cwd);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatch(/\d+\.\d+\.\d+/);
    });
  });

  describe("Init Command", () => {
    it("should init with default root and install core plus examples", async () => {
      const cwd = await createTempDir(tempDirs);
      const result = await runCli(["init"], cwd);

      expect(result.exitCode).toBe(0);

      const ravenDir = join(cwd, "raven");
      expect(await fileExists(join(ravenDir, "raven.yaml"))).toBe(true);
      expect(await fileExists(join(ravenDir, "core", "index.ts"))).toBe(true);
      expect(await fileExists(join(ravenDir, "examples", "sql-plugin", "index.ts"))).toBe(true);
    });

    it("should init with custom root directory", async () => {
      const cwd = await createTempDir(tempDirs);
      const result = await runCli(["init", "--root", "my-raven"], cwd);

      expect(result.exitCode).toBe(0);
      expect(await fileExists(join(cwd, "my-raven", "core", "index.ts"))).toBe(true);
    });

    it("should be idempotent when root exists", async () => {
      const cwd = await createTempDir(tempDirs);
      await runCli(["init"], cwd);
      const yamlPath = join(cwd, "raven", "raven.yaml");
      const before = await readFile(yamlPath, "utf-8");

      const result = await runCli(["init"], cwd);
      expect(result.exitCode).toBe(0);

      const after = await readFile(yamlPath, "utf-8");
      expect(after).toBe(before);
    });

    it("should write --language to raven.yaml", async () => {
      const cwd = await createTempDir(tempDirs);
      const result = await runCli(["init", "--language", "Chinese"], cwd);

      expect(result.exitCode).toBe(0);
      const yamlContent = await readFile(join(cwd, "raven", "raven.yaml"), "utf-8");
      expect(yamlContent).toContain("language: Chinese");
    });
  });

  describe("Status Command", () => {
    it("should exit 0 in empty directory", async () => {
      const cwd = await createTempDir(tempDirs);
      const result = await runCli(["status"], cwd);

      expect(result.exitCode).toBe(0);
      const out = JSON.parse(result.stdout.trim());
      expect(out.installed).toBe(false);
      expect(out).toHaveProperty("rootDir");
      expect(out).toHaveProperty("installDir");
      expect(out.language).toBe("English (default)");
      expect(out).not.toHaveProperty("modules");
    });

    it("should report installed core after init", async () => {
      const cwd = await createTempDir(tempDirs);
      await runCli(["init"], cwd);

      const result = await runCli(["status"], cwd);

      expect(result.exitCode).toBe(0);
      const out = JSON.parse(result.stdout.trim());
      expect(out.installed).toBe(true);
      expect(out.installDir.endsWith("/raven/core")).toBe(true);
    });

    it("should respect --root option", async () => {
      const cwd = await createTempDir(tempDirs);
      await runCli(["init", "--root", "my-raven"], cwd);

      const result = await runCli(["status", "--root", "my-raven"], cwd);

      expect(result.exitCode).toBe(0);
      const json = JSON.parse(result.stdout.trim());
      expect(json.installed).toBe(true);
      expect(json.rootDir.endsWith("/my-raven")).toBe(true);
    });
  });

  describe("Sync Command", () => {
    it("should remove leftover files by rebuilding core and examples", async () => {
      const cwd = await createTempDir(tempDirs);
      await initGitRepo(cwd);
      await runCli(["init"], cwd);
      await commitAll(cwd, "baseline");

      const staleCoreFile = join(cwd, "raven", "core", "extra.ts");
      const staleExampleFile = join(cwd, "raven", "examples", "sql-plugin", "extra.ts");
      await writeFile(staleCoreFile, "export const stale = true;\n");
      await writeFile(staleExampleFile, "export const stale = true;\n");
      await commitAll(cwd, "add stale files");

      const result = await runCli(["sync"], cwd);

      expect(result.exitCode).toBe(0);
      const lines = result.stdout.trim().split("\n").filter(Boolean);
      expect(lines.length).toBe(2);

      const syncResult = JSON.parse(lines[0] || "{}");
      expect(syncResult.success).toBe(true);
      expect(syncResult.removedDirectories).toEqual([]);
      expect(await fileExists(staleCoreFile)).toBe(false);
      expect(await fileExists(staleExampleFile)).toBe(false);
    });

    it("should remove legacy module directories during sync", async () => {
      const cwd = await createTempDir(tempDirs);
      await initGitRepo(cwd);
      await runCli(["init"], cwd);
      await commitAll(cwd, "baseline");

      const legacyDir = join(cwd, "raven", "sql");
      await mkdir(legacyDir, { recursive: true });
      await writeFile(join(legacyDir, "index.ts"), "export {};\n");
      await commitAll(cwd, "add legacy module dir");

      const result = await runCli(["sync"], cwd);

      expect(result.exitCode).toBe(0);
      const lines = result.stdout.trim().split("\n").filter(Boolean);
      const syncResult = JSON.parse(lines[0] || "{}");
      expect(syncResult.removedDirectories).toEqual(["sql"]);
      expect(await fileExists(legacyDir)).toBe(false);
    });

    it("should restore missing core during sync", async () => {
      const cwd = await createTempDir(tempDirs);
      await initGitRepo(cwd);
      await runCli(["init"], cwd);
      await commitAll(cwd, "baseline");

      const coreDir = join(cwd, "raven", "core");
      await rm(coreDir, { recursive: true, force: true });
      await commitAll(cwd, "remove core manually");

      const result = await runCli(["sync"], cwd);

      expect(result.exitCode).toBe(0);
      expect(await fileExists(join(coreDir, "index.ts"))).toBe(true);
    });

    it("should keep the original root when staging fails", async () => {
      const cwd = await createTempDir(tempDirs);
      const brokenRegistryDir = await createTempDir(tempDirs);
      await initGitRepo(cwd);
      await runCli(["init"], cwd);
      await commitAll(cwd, "baseline");

      const yamlPath = join(cwd, "raven", "raven.yaml");
      const coreIndexPath = join(cwd, "raven", "core", "index.ts");
      const beforeYaml = await readFile(yamlPath, "utf-8");
      const beforeCore = await readFile(coreIndexPath, "utf-8");

      const manifest = await readManifest();
      manifest.version = "9.9.9";
      manifest.core.files = [...manifest.core.files, "missing.ts"];

      const brokenRegistryPath = join(brokenRegistryDir, "broken-registry.json");
      await writeFile(brokenRegistryPath, JSON.stringify(manifest, null, 2));

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
      await commitAll(cwd, "baseline");

      const yamlPath = join(cwd, "raven", "raven.yaml");
      const markerFile = join(cwd, "raven", "examples", "sql-plugin", "marker.ts");
      const beforeYaml = await readFile(yamlPath, "utf-8");
      await writeFile(markerFile, "export const keepMe = true;\n");
      await commitAll(cwd, "add rollback marker");

      const result = await runCli(["sync"], cwd, {
        RAVEN_SYNC_TEST_FAIL_AFTER_BACKUP: "1",
      });

      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain("Simulated sync failure after backup");
      expect(await readFile(yamlPath, "utf-8")).toBe(beforeYaml);
      expect(await fileExists(markerFile)).toBe(true);
      expect(await fileExists(join(cwd, "raven", "core", "index.ts"))).toBe(true);
    });

    it("should fail outside a Git worktree without modifying raven root", async () => {
      const cwd = await createTempDir(tempDirs);
      await runCli(["init"], cwd);

      const yamlPath = join(cwd, "raven", "raven.yaml");
      const beforeYaml = await readFile(yamlPath, "utf-8");

      const result = await runCli(["sync"], cwd);

      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain("Git worktree");
      expect(await readFile(yamlPath, "utf-8")).toBe(beforeYaml);
    });
  });

  describe("Removed module workflow", () => {
    it("should reject the removed add command", async () => {
      const cwd = await createTempDir(tempDirs);
      const result = await runCli(["add", "core"], cwd);

      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain("unknown command");
    });
  });
});
