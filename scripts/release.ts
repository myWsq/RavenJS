import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { $ } from "bun";
import { createInterface } from "node:readline";

interface Version {
	major: number;
	minor: number;
	patch: number;
	prerelease: string | null;
	prereleaseNumber: number | null;
}

const rl = createInterface({
	input: process.stdin,
	output: process.stdout,
});

function question(prompt: string): Promise<string> {
	return new Promise((resolve) => {
		rl.question(prompt, resolve);
	});
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
	console.log("🚀 RavenJS Release Script\n");

	try {
		const hasUncommitted = await checkGitStatus();
		if (hasUncommitted) {
			console.error("❌ 存在未提交的代码，请先提交所有代码后再发布");
			rl.close();
			process.exit(1);
		}

		const rootDir = join(import.meta.dir, "..");
		const packageJsonPath = join(rootDir, "package.json");
		const content = await readFile(packageJsonPath, "utf-8");
		const pkg = JSON.parse(content);
		const currentVersion = pkg.version;

		console.log(`当前版本: ${currentVersion}\n`);

		const parsedVersion = parseVersion(currentVersion);
		const nextVersions = generateNextVersions(parsedVersion);

		console.log("请选择下一个版本：");
		nextVersions.forEach((v, index) => {
			console.log(`  ${index + 1}. ${v.version} (${v.name})`);
		});
		console.log(`  ${nextVersions.length + 1}. 自定义版本号`);

		let selectedVersion: string;
		while (true) {
			const choice = await question("\n请输入选项编号: ");
			const choiceNum = parseInt(choice, 10);

			if (choiceNum >= 1 && choiceNum <= nextVersions.length) {
				const selected = nextVersions[choiceNum - 1];
				if (selected) {
					selectedVersion = selected.version;
					break;
				}
			} else if (choiceNum === nextVersions.length + 1) {
				selectedVersion = await question("请输入自定义版本号: ");
				try {
					parseVersion(selectedVersion);
					break;
				} catch {
					console.error(
						"❌ 版本号格式无效，请使用 x.y.z 或 x.y.z-prerelease 格式",
					);
				}
			} else {
				console.error("❌ 无效的选项");
			}
		}

		console.log(`\n选择的版本: ${selectedVersion}`);

		const confirm = await question("\n是否继续发布？(y/n): ");
		if (confirm.toLowerCase() !== "y" && confirm.toLowerCase() !== "yes") {
			console.log("✅ 发布已取消");
			rl.close();
			return;
		}

		console.log("\n📝 更新 package.json...");
		await updatePackageJson(selectedVersion);

		console.log("🔧 提交代码并打标签...");
		await commitAndTag(selectedVersion);

		console.log("\n🎉 发布成功！");
		console.log(`版本: ${selectedVersion}`);
		console.log(`标签: v${selectedVersion}`);
	} catch (error) {
		console.error("\n❌ 发布失败:", error);
		process.exit(1);
	} finally {
		rl.close();
	}
}

main();
