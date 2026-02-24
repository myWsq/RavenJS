#!/usr/bin/env bun
// @ts-nocheck
import { mkdir, writeFile, chmod, copyFile } from "fs/promises";
import { join } from "path";

const args = process.argv.slice(2);
const versionArg = args[0];
const outDirArg = args[1];

if (!versionArg || !outDirArg) {
  console.error("Usage: create-main-package.ts <version> <out-dir>");
  console.error("Expected 2 arguments");
  process.exit(1);
}

const targets = [
  "linux-x64",
  "linux-arm64",
  "darwin-x64",
  "darwin-arm64",
  "windows-x64",
];

const packageName = "@raven.js/cli";

async function main() {
  const packageDir = join(outDirArg, packageName.replace("/", "-"));
  await mkdir(packageDir, { recursive: true });

  const optionalDependencies: Record<string, string> = {};
  for (const target of targets) {
    optionalDependencies[`@raven.js/cli-${target}`] = versionArg;
  }

  const pkg = {
    name: packageName,
    version: versionArg,
    description: "CLI tool for RavenJS framework",
    bin: {
      raven: "./raven",
    },
    optionalDependencies,
    keywords: ["ravenjs", "cli", "framework", "typescript"],
    repository: {
      type: "git",
      url: "https://github.com/myWsq/RavenJS.git",
    },
    files: ["raven", "README.md", "registry.json"],
  };

  await writeFile(join(packageDir, "package.json"), JSON.stringify(pkg, null, 2));

  const wrapperScript = `#!/usr/bin/env bun
import { spawn } from "bun";
import { existsSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const registryPath = resolve(__dirname, "registry.json");
if (!existsSync(registryPath)) {
  console.error("registry.json not found at " + registryPath);
  process.exit(1);
}

const knownWindowsPackages = { "win32 x64": "@raven.js/cli-windows-x64" };
const knownUnixlikePackages = {
  "linux x64": "@raven.js/cli-linux-x64",
  "linux arm64": "@raven.js/cli-linux-arm64",
  "darwin x64": "@raven.js/cli-darwin-x64",
  "darwin arm64": "@raven.js/cli-darwin-arm64",
};

function pkgAndSubpathForCurrentPlatform() {
  const platformKey = \`\${process.platform} \${process.arch}\`;
  if (platformKey in knownWindowsPackages) {
    return { pkg: knownWindowsPackages[platformKey], subpath: "raven.exe" };
  }
  if (platformKey in knownUnixlikePackages) {
    return { pkg: knownUnixlikePackages[platformKey], subpath: "raven" };
  }
  throw new Error(\`Unsupported platform: \${platformKey}\`);
}

const { pkg, subpath } = pkgAndSubpathForCurrentPlatform();
const resolved = await import.meta.resolve(\`\${pkg}/\${subpath}\`);
const binaryPath = resolved.startsWith("file:") ? fileURLToPath(resolved) : resolved;

const proc = spawn([binaryPath, ...process.argv.slice(2)], {
  stdio: ["inherit", "inherit", "inherit"],
  env: { ...process.env, RAVEN_DEFAULT_REGISTRY_PATH: registryPath, RAVEN_CLI_VERSION: ${JSON.stringify(versionArg)} },
});
const exitCode = await proc.exited;
process.exit(exitCode ?? 0);
`;

  const binPath = join(packageDir, "raven");
  await writeFile(binPath, wrapperScript);
  await chmod(binPath, 0o755);

  const registrySourcePath = join(import.meta.dir, "..", "registry.json");
  await copyFile(registrySourcePath, join(packageDir, "registry.json"));

  const readme = `# @raven.js/cli

CLI tool for RavenJS framework.

## Installation

\`\`\`bash
npm install -g @raven.js/cli
\`\`\`

## Usage

\`\`\`bash
raven --help
\`\`\`

## Updating

\`\`\`bash
npm update -g @raven.js/cli
\`\`\`

For more information, see https://github.com/myWsq/RavenJS
`;
  await writeFile(join(packageDir, "README.md"), readme);

  console.log(`Created main package at: ${packageDir}`);
  console.log(`Package name: ${packageName}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
