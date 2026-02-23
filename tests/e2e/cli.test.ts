import { afterEach, beforeAll, describe, expect, it } from "@ravenjs/testing";
import { mkdtemp, rm, readFile, access } from "fs/promises";
import { tmpdir } from "os";
import { join, resolve } from "path";

const isBun = typeof Bun !== "undefined";
const repoRoot = resolve(import.meta.dir, "..", "..");
const cliPath = join(repoRoot, "packages", "cli", "index.ts");
const registryPath = join(repoRoot, "packages", "cli", "registry.json");
const scriptPath = join(
	repoRoot,
	"packages",
	"cli",
	"scripts",
	"generate-registry.ts",
);

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
		["bun", "run", scriptPath, version],
		repoRoot,
	);
	if (result.exitCode !== 0) {
		throw new Error(result.stderr || result.stdout);
	}
}

async function runCli(args: string[], cwd: string) {
	return runCommand(["bun", "run", cliPath, ...args], cwd, {
		RAVEN_DEFAULT_REGISTRY_PATH: registryPath,
	});
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

	describe("Install Command", () => {
		it("should install a new project with default root", async () => {
			const cwd = await createTempDir(tempDirs);
			const result = await runCli(["install", "--source", repoRoot], cwd);

			expect(result.exitCode).toBe(0);
			const out = JSON.parse(result.stdout.trim());
			expect(out.success).toBe(true);
			expect(Array.isArray(out.modifiedFiles)).toBe(true);

			const ravenDir = join(cwd, "raven");
			expect(await fileExists(ravenDir)).toBe(true);
			expect(await fileExists(join(ravenDir, "raven.yaml"))).toBe(true);
			expect(await fileExists(join(ravenDir, "core", "main.ts"))).toBe(true);
			expect(await fileExists(join(ravenDir, "core", "index.ts"))).toBe(true);
		});

		it("should install with custom root directory", async () => {
			const cwd = await createTempDir(tempDirs);
			const result = await runCli(["install", "--root", "my-raven", "--source", repoRoot], cwd);

			expect(result.exitCode).toBe(0);

			const ravenDir = join(cwd, "my-raven");
			expect(await fileExists(ravenDir)).toBe(true);
			expect(await fileExists(join(ravenDir, "raven.yaml"))).toBe(true);
		});

		it("should fail when already installed", async () => {
			const cwd = await createTempDir(tempDirs);
			await runCli(["install", "--source", repoRoot], cwd);

			const result = await runCli(["install", "--source", repoRoot], cwd);
			expect(result.exitCode).not.toBe(0);
			expect(result.stderr).toContain("already installed");
		});

		it("should create valid raven.yaml", async () => {
			const cwd = await createTempDir(tempDirs);
			await runCli(["install", "--source", repoRoot], cwd);

			const yamlContent = await readFile(join(cwd, "raven", "raven.yaml"), "utf-8");
			expect(yamlContent).toContain("version:");
		});

		it("should show verbose output with --verbose", async () => {
			const cwd = await createTempDir(tempDirs);
			const result = await runCli(["install", "--source", repoRoot, "--verbose"], cwd);

			expect(result.exitCode).toBe(0);
			expect(result.stdout).toContain("Using local source");
		});
	});

	describe("Status Command", () => {
		it("should exit 0 in empty directory", async () => {
			const cwd = await createTempDir(tempDirs);
			const result = await runCli(["status"], cwd);

			expect(result.exitCode).toBe(0);
			const out = JSON.parse(result.stdout.trim());
			expect(out.core.installed).toBe(false);
			expect(out.modules).toEqual([]);
		});

		it("should output JSON with valid structure", async () => {
			const cwd = await createTempDir(tempDirs);
			const result = await runCli(["status"], cwd);

			expect(result.exitCode).toBe(0);
			const json = JSON.parse(result.stdout.trim());
			expect(json).toHaveProperty("core");
			expect(json.core).toEqual({ installed: false });
			expect(json).toHaveProperty("modules");
			expect(json.modules).toEqual([]);
		});

		it("should show core installed after install", async () => {
			const cwd = await createTempDir(tempDirs);
			await runCli(["install", "--source", repoRoot], cwd);

			const result = await runCli(["status"], cwd);

			expect(result.exitCode).toBe(0);
			const out = JSON.parse(result.stdout.trim());
			expect(out.core.installed).toBe(true);
			expect(out.modules).toEqual([]);
		});

		it("should show modules after add", async () => {
			const cwd = await createTempDir(tempDirs);
			await runCli(["install", "--source", repoRoot], cwd);
			await runCli(["add", "jtd-validator", "--source", repoRoot], cwd);

			const result = await runCli(["status"], cwd);

			expect(result.exitCode).toBe(0);
			const out = JSON.parse(result.stdout.trim());
			expect(out.core.installed).toBe(true);
			expect(out.modules).toContain("jtd-validator");
		});

		it("should output correct JSON after install", async () => {
			const cwd = await createTempDir(tempDirs);
			await runCli(["install", "--source", repoRoot], cwd);

			const result = await runCli(["status"], cwd);

			expect(result.exitCode).toBe(0);
			const json = JSON.parse(result.stdout.trim());
			expect(json.core).toEqual({ installed: true });
			expect(json.modules).toEqual([]);
		});

		it("should respect --root option", async () => {
			const cwd = await createTempDir(tempDirs);
			await runCli(["install", "--root", "my-raven", "--source", repoRoot], cwd);

			const result = await runCli(["status", "--root", "my-raven"], cwd);

			expect(result.exitCode).toBe(0);
			const json = JSON.parse(result.stdout.trim());
			expect(json.core.installed).toBe(true);
		});
	});

	describe("Add Command", () => {
		it("should add a module to existing project", async () => {
			const cwd = await createTempDir(tempDirs);
			await runCli(["install", "--source", repoRoot], cwd);

			const result = await runCli(["add", "jtd-validator", "--source", repoRoot], cwd);

			expect(result.exitCode).toBe(0);
			const out = JSON.parse(result.stdout.trim());
			expect(out.success).toBe(true);
			expect(out.moduleName).toBe("jtd-validator");

			const moduleDir = join(cwd, "raven", "jtd-validator");
			expect(await fileExists(moduleDir)).toBe(true);
			expect(await fileExists(join(moduleDir, "main.ts"))).toBe(true);
			expect(await fileExists(join(moduleDir, "index.ts"))).toBe(true);
		});

		it("should fail when project not installed", async () => {
			const cwd = await createTempDir(tempDirs);
			const result = await runCli(["add", "jtd-validator", "--source", repoRoot], cwd);

			expect(result.exitCode).not.toBe(0);
			expect(result.stderr).toContain("not installed");
		});

		it("should fail for unknown module", async () => {
			const cwd = await createTempDir(tempDirs);
			await runCli(["install", "--source", repoRoot], cwd);

			const result = await runCli(["add", "unknown-module", "--source", repoRoot], cwd);

			expect(result.exitCode).not.toBe(0);
			expect(result.stderr).toContain("Unknown module");
		});

		it("should show available modules on error", async () => {
			const cwd = await createTempDir(tempDirs);
			await runCli(["install", "--source", repoRoot], cwd);

			const result = await runCli(["add", "unknown-module", "--source", repoRoot], cwd);

			expect(result.exitCode).not.toBe(0);
			expect(result.stderr).toContain("Unknown module");
		});
	});

	describe("Update Command", () => {
		it("should update existing project", async () => {
			const cwd = await createTempDir(tempDirs);
			await runCli(["install", "--source", repoRoot], cwd);
			await runCli(["add", "jtd-validator", "--source", repoRoot], cwd);

			const result = await runCli(["update", "--source", repoRoot], cwd);

			expect(result.exitCode).toBe(0);
			const out = JSON.parse(result.stdout.trim());
			expect(out.success).toBe(true);
		});

		it("should fail when project not installed", async () => {
			const cwd = await createTempDir(tempDirs);
			const result = await runCli(["update", "--source", repoRoot], cwd);

			expect(result.exitCode).not.toBe(0);
			expect(result.stderr).toContain("not installed");
		});
	});

	describe("Error Handling", () => {
		it("should show error for unknown option", async () => {
			const cwd = await createTempDir(tempDirs);
			const result = await runCli(["install", "--unknown-option"], cwd);

			expect(result.exitCode).not.toBe(0);
		});
	});

	describe("Global Options", () => {
		it("should accept --root option with install", async () => {
			const cwd = await createTempDir(tempDirs);
			const result = await runCli(["--root", "custom-root", "install", "--source", repoRoot], cwd);

			expect(result.exitCode).toBe(0);
			expect(await fileExists(join(cwd, "custom-root"))).toBe(true);
		});

		it("should accept --source option with install", async () => {
			const cwd = await createTempDir(tempDirs);
			const result = await runCli(["install", "--source", repoRoot], cwd);

			expect(result.exitCode).toBe(0);
		});

		it("should accept -v as verbose shortcut", async () => {
			const cwd = await createTempDir(tempDirs);
			const result = await runCli(["install", "--source", repoRoot, "-v"], cwd);

			expect(result.exitCode).toBe(0);
			expect(result.stdout).toContain("Using local source");
		});
	});
});
