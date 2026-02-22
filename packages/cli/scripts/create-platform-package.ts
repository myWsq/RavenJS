#!/usr/bin/env bun
// @ts-nocheck
import { mkdir, writeFile, copyFile } from "node:fs/promises";
import { join } from "node:path";

interface Target {
  os: string;
  cpu: string;
  target: string;
}

const TARGETS: Target[] = [
  { os: "linux", cpu: "x64", target: "linux-x64" },
  { os: "linux", cpu: "arm64", target: "linux-arm64" },
  { os: "darwin", cpu: "x64", target: "darwin-x64" },
  { os: "darwin", cpu: "arm64", target: "darwin-arm64" },
  { os: "win32", cpu: "x64", target: "windows-x64" },
];

const args = process.argv.slice(2);
const targetArg = args[0];
const versionArg = args[1];
const binaryPathArg = args[2];
const outDirArg = args[3];

if (!targetArg || !versionArg || !binaryPathArg || !outDirArg) {
  console.error("Usage: create-platform-package.ts <target> <version> <binary-path> <out-dir>");
  console.error("Available targets: linux-x64, linux-arm64, darwin-x64, darwin-arm64, windows-x64");
  process.exit(1);
}

const target = TARGETS.find((t) => t.target === targetArg);
if (!target) {
  console.error(`Unknown target: ${targetArg}`);
  process.exit(1);
}

const isWindows = targetArg.startsWith("windows-");
const binaryName = isWindows ? "raven.exe" : "raven";
const packageName = `@raven.js/cli-${targetArg}`;

async function main() {
  const packageDir = join(outDirArg, packageName.replace("/", "-"));
  const binDir = join(packageDir, "bin");
  await mkdir(binDir, { recursive: true });

  const pkg = {
    name: packageName,
    version: versionArg,
    description: "CLI tool for RavenJS framework",
    os: [target.os],
    cpu: [target.cpu],
    keywords: ["ravenjs", "cli", "framework", "typescript"],
    repository: {
      type: "git",
      url: "https://github.com/myWsq/RavenJS.git",
    },
    preferUnplugged: true,
    files: ["bin", "README.md"],
  };

  await writeFile(join(packageDir, "package.json"), JSON.stringify(pkg, null, 2));

  await copyFile(binaryPathArg, join(binDir, binaryName));

  const readme = `# ${packageName}

This is the platform-specific binary package for RavenJS CLI.
You should install the main package instead:

\`\`\`bash
npm install -g @raven.js/cli
\`\`\`

For more information, see https://github.com/myWsq/RavenJS
`;
  await writeFile(join(packageDir, "README.md"), readme);

  console.log(`Created platform package at: ${packageDir}`);
  console.log(`Package name: ${packageName}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
