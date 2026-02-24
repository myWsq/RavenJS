import { afterEach, beforeAll, describe, expect, it } from "bun:test";
import { mkdtemp, rm, readFile, access } from "fs/promises";
import { tmpdir } from "os";
import { join, resolve } from "path";

const isBun = typeof Bun !== "undefined";
const repoRoot = resolve(import.meta.dir, "..", "..");
const cliPath = join(repoRoot, "packages", "cli", "index.ts");
const registryPath = join(repoRoot, "packages", "cli", "registry.json");
const buildScriptPath = join(repoRoot, "packages", "cli", "scripts", "build.ts");

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

async function ensureRegistry(version = "0.0.0") {
	const exists = await Bun.file(registryPath).exists();
	if (exists) return;
	const result = await runCommand(
		["bun", "run", buildScriptPath, version, "--registry-only"],
		repoRoot,
	);
	if (result.exitCode !== 0) {
		throw new Error(result.stderr || result.stdout);
	}
}

async function runCli(args: string[], cwd: string) {
	return runCommand(["bun", "run", cliPath, ...args], cwd);
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

describe("CLI E2E", () => {
	let tempDirs: string[] = [];

	beforeAll(async () => {
		await ensureRegistry();
	});

	afterEach(async () => {
		await Promise.all(tempDirs.map((dir) => rm(dir, { recursive: true, force: true }).catch(() => {})));
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
			const result = await runCli(["init", "--source", repoRoot], cwd);

			expect(result.exitCode).toBe(0);

			const ravenDir = join(cwd, "raven");
			expect(await fileExists(ravenDir)).toBe(true);
			expect(await fileExists(join(ravenDir, "raven.yaml"))).toBe(true);
		});

		it("should init with custom root directory", async () => {
			const cwd = await createTempDir(tempDirs);
			const result = await runCli(["init", "--root", "my-raven", "--source", repoRoot], cwd);

			expect(result.exitCode).toBe(0);

			const ravenDir = join(cwd, "my-raven");
			expect(await fileExists(ravenDir)).toBe(true);
			expect(await fileExists(join(ravenDir, "raven.yaml"))).toBe(true);
		});

		it("should be idempotent when root exists (only updates AI resources)", async () => {
			const cwd = await createTempDir(tempDirs);
			await runCli(["init", "--source", repoRoot], cwd);
			const yamlPath = join(cwd, "raven", "raven.yaml");
			const before = await readFile(yamlPath, "utf-8");

			const result = await runCli(["init", "--source", repoRoot], cwd);
			expect(result.exitCode).toBe(0);
			const after = await readFile(yamlPath, "utf-8");
			expect(after).toBe(before);
		});

		it("should create valid raven.yaml", async () => {
			const cwd = await createTempDir(tempDirs);
			await runCli(["init", "--source", repoRoot], cwd);

			const yamlContent = await readFile(join(cwd, "raven", "raven.yaml"), "utf-8");
			expect(yamlContent).toContain("version:");
		});

		it("should show verbose output with --verbose", async () => {
			const cwd = await createTempDir(tempDirs);
			const result = await runCli(["init", "--source", repoRoot, "--verbose"], cwd);

			expect(result.exitCode).toBe(0);
			expect(result.stdout).toContain("Using local source");
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
			const coreMod = findModule(out.modules, "core");
			expect(coreMod?.installed).toBe(false);
		});

		it("should output JSON with valid structure (modules with name and installed)", async () => {
			const cwd = await createTempDir(tempDirs);
			const result = await runCli(["status"], cwd);

			expect(result.exitCode).toBe(0);
			const json = JSON.parse(result.stdout.trim());
			expect(json).toHaveProperty("modules");
			expect(Array.isArray(json.modules)).toBe(true);
			for (const m of json.modules) {
				expect(m).toHaveProperty("name");
				expect(m).toHaveProperty("installed");
			}
		});

		it("should show core installed after add core", async () => {
			const cwd = await createTempDir(tempDirs);
			await runCli(["init", "--source", repoRoot], cwd);
			await runCli(["add", "core", "--source", repoRoot], cwd);

			const result = await runCli(["status"], cwd);

			expect(result.exitCode).toBe(0);
			const out = JSON.parse(result.stdout.trim());
			expect(findModule(out.modules, "core")?.installed).toBe(true);
		});

		it("should show modules after add", async () => {
			const cwd = await createTempDir(tempDirs);
			await runCli(["init", "--source", repoRoot], cwd);
			await runCli(["add", "schema-validator", "--source", repoRoot], cwd);

			const result = await runCli(["status"], cwd);

			expect(result.exitCode).toBe(0);
			const out = JSON.parse(result.stdout.trim());
			expect(findModule(out.modules, "core")?.installed).toBe(true);
			expect(findModule(out.modules, "schema-validator")?.installed).toBe(true);
		});

		it("should respect --root option", async () => {
			const cwd = await createTempDir(tempDirs);
			await runCli(["init", "--root", "my-raven", "--source", repoRoot], cwd);
			await runCli(["add", "core", "--root", "my-raven", "--source", repoRoot], cwd);

			const result = await runCli(["status", "--root", "my-raven"], cwd);

			expect(result.exitCode).toBe(0);
			const json = JSON.parse(result.stdout.trim());
			expect(findModule(json.modules, "core")?.installed).toBe(true);
		});
	});

	describe("Add Command", () => {
		it("should add a module and auto-install dependencies", async () => {
			const cwd = await createTempDir(tempDirs);
			await runCli(["init", "--source", repoRoot], cwd);

			const result = await runCli(["add", "schema-validator", "--source", repoRoot], cwd);

			expect(result.exitCode).toBe(0);
			const out = JSON.parse(result.stdout.trim());
			expect(out.success).toBe(true);
			expect(out.moduleName).toBe("schema-validator");

			const coreDir = join(cwd, "raven", "core");
			const moduleDir = join(cwd, "raven", "schema-validator");
			expect(await fileExists(coreDir)).toBe(true);
			expect(await fileExists(moduleDir)).toBe(true);
			expect(await fileExists(join(moduleDir, "index.ts"))).toBe(true);
		});

		it("should replace @raven.js/core with relative path in copied files", async () => {
			const cwd = await createTempDir(tempDirs);
			await runCli(["init", "--source", repoRoot], cwd);
			await runCli(["add", "schema-validator", "--source", repoRoot], cwd);

			const mainTs = await readFile(join(cwd, "raven", "schema-validator", "index.ts"), "utf-8");
			expect(mainTs).toContain('from "../core"');
			expect(mainTs).not.toContain("@raven.js/core");
		});

		it("should fail when project not initialized", async () => {
			const cwd = await createTempDir(tempDirs);
			const result = await runCli(["add", "schema-validator", "--source", repoRoot], cwd);

			expect(result.exitCode).not.toBe(0);
			expect(result.stderr).toContain("raven init");
		});

		it("should fail for unknown module", async () => {
			const cwd = await createTempDir(tempDirs);
			await runCli(["init", "--source", repoRoot], cwd);

			const result = await runCli(["add", "unknown-module", "--source", repoRoot], cwd);

			expect(result.exitCode).not.toBe(0);
			expect(result.stderr).toContain("Unknown module");
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
			const result = await runCli(["--root", "custom-root", "init", "--source", repoRoot], cwd);

			expect(result.exitCode).toBe(0);
			expect(await fileExists(join(cwd, "custom-root"))).toBe(true);
		});

		it("should accept --source option with init", async () => {
			const cwd = await createTempDir(tempDirs);
			const result = await runCli(["init", "--source", repoRoot], cwd);

			expect(result.exitCode).toBe(0);
		});

		it("should accept -v as verbose shortcut", async () => {
			const cwd = await createTempDir(tempDirs);
			const result = await runCli(["init", "--source", repoRoot, "-v"], cwd);

			expect(result.exitCode).toBe(0);
			expect(result.stdout).toContain("Using local source");
		});
	});
});
