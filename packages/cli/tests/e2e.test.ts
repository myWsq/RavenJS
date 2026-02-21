import { afterEach, beforeAll, describe, expect, it } from "@ravenjs/testing";
import { mkdtemp, rm } from "fs/promises";
import { tmpdir } from "os";
import { join, resolve } from "path";

const isBun = typeof Bun !== "undefined";
const repoRoot = resolve(import.meta.dir, "..", "..", "..");
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
	const dir = await mkdtemp(join(tmpdir(), "raven-cli-"));
	tempDirs.push(dir);
	return dir;
}

describe("CLI e2e", () => {
	if (!isBun) {
		it("skipped in non-bun runtimes", () => {
			expect(true).toBe(true);
		});
		return;
	}

	const tempDirs: string[] = [];
	const sourcePath = repoRoot;

	beforeAll(async () => {
		await ensureRegistry();
	});

	afterEach(async () => {
		while (tempDirs.length > 0) {
			const dir = tempDirs.pop();
			if (dir) {
				await rm(dir, { recursive: true, force: true });
			}
		}
	});

	it("initializes project from local source", async () => {
		const projectDir = await createTempDir(tempDirs);
		const result = await runCli(
			["init", "--root", "app", "--source", sourcePath],
			projectDir,
		);
		expect(result.exitCode).toBe(0);
		const yamlExists = await Bun.file(
			join(projectDir, "app", "raven.yaml"),
		).exists();
		const coreExists = await Bun.file(
			join(projectDir, "app", "core", "main.ts"),
		).exists();
		expect(yamlExists).toBe(true);
		expect(coreExists).toBe(true);
	});

	it("adds module and updates from local source", async () => {
		const projectDir = await createTempDir(tempDirs);
		const initResult = await runCli(
			["init", "--root", "app", "--source", sourcePath],
			projectDir,
		);
		expect(initResult.exitCode).toBe(0);
		const addResult = await runCli(
			["add", "jtd-validator", "--root", "app", "--source", sourcePath],
			projectDir,
		);
		expect(addResult.exitCode).toBe(0);
		const moduleExists = await Bun.file(
			join(projectDir, "app", "jtd-validator", "main.ts"),
		).exists();
		expect(moduleExists).toBe(true);
		const updateResult = await runCli(
			["update", "--root", "app", "--source", sourcePath],
			projectDir,
		);
		expect(updateResult.exitCode).toBe(0);
		const yamlExists = await Bun.file(
			join(projectDir, "app", "raven.yaml"),
		).exists();
		expect(yamlExists).toBe(true);
	});
});
