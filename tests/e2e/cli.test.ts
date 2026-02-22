import { afterEach, beforeAll, describe, expect, it } from "@ravenjs/testing";
import { mkdtemp, rm } from "fs/promises";
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

async function runCommand(cmd: string[], cwd: string) {
	if (!isBun) {
		throw new Error("Bun runtime is required for CLI e2e tests");
	}
	const proc = Bun.spawn({
		cmd,
		cwd,
		stdout: "pipe",
		stderr: "pipe",
	});
	const stdout = await new Response(proc.stdout).text();
	const stderr = await new Response(proc.stderr).text();
	const exitCode = await proc.exited;
	return { exitCode, stdout, stderr };
}

async function ensureRegistry() {
	const exists = await Bun.file(registryPath).exists();
	if (exists) return;
	const result = await runCommand(
		["bun", "run", scriptPath, "0.0.0"],
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

describe("CLI E2E", () => {
	let tempDirs: string[] = [];

	beforeAll(async () => {
		await ensureRegistry();
	});

	afterEach(async () => {
		await Promise.all(tempDirs.map((dir) => rm(dir).catch(() => {})));
		tempDirs = [];
	});

	it("should run raven --help", async () => {
		const cwd = await createTempDir(tempDirs);
		const result = await runCli(["--help"], cwd);

		expect(result.exitCode).toBe(0);
		expect(result.stdout).toContain("Usage:");
	});

	it("should create a new project", async () => {
		const cwd = await createTempDir(tempDirs);
		const result = await runCli(["create", "my-app"], cwd);

		expect(result.exitCode).toBe(0);
	});

	it("should show error for unknown command", async () => {
		const cwd = await createTempDir(tempDirs);
		const result = await runCli(["unknown-command"], cwd);

		expect(result.exitCode).not.toBe(0);
	});
});
