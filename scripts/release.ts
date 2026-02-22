import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { $ } from "bun";
import {
	intro,
	outro,
	select,
	confirm,
	text,
	spinner,
	log,
	isCancel,
	cancel,
} from "@clack/prompts";

interface Version {
	major: number;
	minor: number;
	patch: number;
	prerelease: string | null;
	prereleaseNumber: number | null;
}

function parseVersion(versionStr: string): Version {
	const match = versionStr.match(/^(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/);
	if (!match) {
		throw new Error(`Invalid version format: ${versionStr}`);
	}

	const [, majorStr, minorStr, patchStr, prerelease] = match;
	const version: Version = {
		major: parseInt(majorStr || "0", 10),
		minor: parseInt(minorStr || "0", 10),
		patch: parseInt(patchStr || "0", 10),
		prerelease: null,
		prereleaseNumber: null,
	};

	if (prerelease) {
		const prereleaseMatch = prerelease.match(/^(.+?)(?:\.(\d+))?$/);
		if (prereleaseMatch) {
			version.prerelease = prereleaseMatch[1] || null;
			version.prereleaseNumber = prereleaseMatch[2]
				? parseInt(prereleaseMatch[2], 10)
				: null;
		}
	}

	return version;
}

function formatVersion(version: Version): string {
	let result = `${version.major}.${version.minor}.${version.patch}`;
	if (version.prerelease) {
		result += `-${version.prerelease}`;
		if (version.prereleaseNumber !== null) {
			result += `.${version.prereleaseNumber}`;
		}
	}
	return result;
}

function generateNextVersions(
	current: Version,
): { name: string; version: string }[] {
	const versions: { name: string; version: string }[] = [];

	if (current.prerelease) {
		const stableVersion: Version = {
			...current,
			prerelease: null,
			prereleaseNumber: null,
		};
		versions.push({
			name: "stable (转正式版本)",
			version: formatVersion(stableVersion),
		});

		const incrementedPrerelease: Version = { ...current };
		if (current.prereleaseNumber !== null) {
			incrementedPrerelease.prereleaseNumber = current.prereleaseNumber + 1;
		} else {
			incrementedPrerelease.prereleaseNumber = 1;
		}
		versions.push({
			name: "prerelease (修订)",
			version: formatVersion(incrementedPrerelease),
		});
	} else {
		const patchVersion: Version = { ...current, patch: current.patch + 1 };
		versions.push({ name: "patch", version: formatVersion(patchVersion) });

		const minorVersion: Version = {
			...current,
			minor: current.minor + 1,
			patch: 0,
		};
		versions.push({ name: "minor", version: formatVersion(minorVersion) });

		const majorVersion: Version = {
			...current,
			major: current.major + 1,
			minor: 0,
			patch: 0,
		};
		versions.push({ name: "major", version: formatVersion(majorVersion) });
	}

	return versions;
}

async function checkGitStatus(): Promise<boolean> {
	try {
		const status = await $`git status --porcelain`.text();
		return status.trim().length > 0;
	} catch {
		return true;
	}
}

async function updatePackageJson(version: string): Promise<void> {
	const rootDir = join(import.meta.dir, "..");
	const packageJsonPath = join(rootDir, "package.json");
	const content = await readFile(packageJsonPath, "utf-8");
	const pkg = JSON.parse(content);
	pkg.version = version;
	await writeFile(packageJsonPath, `${JSON.stringify(pkg, null, 2)}\n`);
}

async function commitAndTag(version: string): Promise<void> {
	const tagName = `v${version}`;
	await $`git add package.json`;
	await $`git commit -m "release: ${version}"`;
	await $`git tag ${tagName}`;
	await $`git push`;
	await $`git push origin ${tagName}`;
}

async function main() {
	intro("🚀 RavenJS Release");

	try {
		const hasUncommitted = await checkGitStatus();
		if (hasUncommitted) {
			log.error("存在未提交的代码，请先提交所有代码后再发布");
			process.exit(1);
		}

		const rootDir = join(import.meta.dir, "..");
		const packageJsonPath = join(rootDir, "package.json");
		const content = await readFile(packageJsonPath, "utf-8");
		const pkg = JSON.parse(content);
		const currentVersion = pkg.version;

		log.info(`当前版本: ${currentVersion}`);

		const parsedVersion = parseVersion(currentVersion);
		const nextVersions = generateNextVersions(parsedVersion);

		const options = nextVersions.map((v) => ({
			value: v.version,
			label: `${v.version} (${v.name})`,
		}));
		options.push({
			value: "__custom__",
			label: "自定义版本号",
		});

		const choice = await select({
			message: "选择下一个版本",
			options,
		});

		if (isCancel(choice)) {
			cancel("发布已取消");
			process.exit(0);
		}

		let selectedVersion: string;

		if (choice === "__custom__") {
			const customVersion = await text({
				message: "请输入自定义版本号",
				placeholder: "x.y.z 或 x.y.z-prerelease",
				validate(value: string | undefined) {
					if (!value?.trim()) return "请输入版本号";
					try {
						parseVersion(value);
						return undefined;
					} catch {
						return "版本号格式无效，请使用 x.y.z 或 x.y.z-prerelease 格式";
					}
				},
			});

			if (isCancel(customVersion)) {
				cancel("发布已取消");
				process.exit(0);
			}

			selectedVersion = customVersion;
		} else {
			selectedVersion = choice;
		}

		log.info(`选择的版本: ${selectedVersion}`);

		const shouldContinue = await confirm({
			message: "是否继续发布？",
		});

		if (isCancel(shouldContinue) || !shouldContinue) {
			cancel("发布已取消");
			return;
		}

		const s = spinner();

		s.start("更新 package.json...");
		await updatePackageJson(selectedVersion);
		s.stop("package.json 已更新");

		s.start("提交代码并打标签...");
		await commitAndTag(selectedVersion);
		s.stop("代码已提交并打标签");

		outro(`🎉 发布成功！版本 ${selectedVersion}，标签 v${selectedVersion}`);
	} catch (error) {
		log.error(`发布失败: ${error}`);
		process.exit(1);
	}
}

main();
