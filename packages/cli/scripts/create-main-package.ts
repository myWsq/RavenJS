#!/usr/bin/env bun
// @ts-nocheck
import { mkdir, writeFile, chmod } from "node:fs/promises";
import { join } from "node:path";

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
  await mkdir(join(packageDir, "bin"), { recursive: true });

  const optionalDependencies: Record<string, string> = {};
  for (const target of targets) {
    optionalDependencies[`@raven.js/cli-${target}`] = versionArg;
  }

  const pkg = {
    name: packageName,
    version: versionArg,
    description: "CLI tool for RavenJS framework",
    bin: {
      raven: "./bin/raven",
    },
    optionalDependencies,
    keywords: ["ravenjs", "cli", "framework", "typescript"],
    repository: {
      type: "git",
      url: "https://github.com/myWsq/RavenJS.git",
    },
    files: ["bin", "README.md"],
  };

  await writeFile(join(packageDir, "package.json"), JSON.stringify(pkg, null, 2));

  const wrapperScript = `#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

const knownWindowsPackages = {
  'win32 x64': '@raven.js/cli-windows-x64'
};

const knownUnixlikePackages = {
  'linux x64': '@raven.js/cli-linux-x64',
  'linux arm64': '@raven.js/cli-linux-arm64',
  'darwin x64': '@raven.js/cli-darwin-x64',
  'darwin arm64': '@raven.js/cli-darwin-arm64'
};

function pkgAndSubpathForCurrentPlatform() {
  let pkg;
  let subpath;
  const platformKey = \`\${process.platform} \${os.arch()}\`;
  
  if (platformKey in knownWindowsPackages) {
    pkg = knownWindowsPackages[platformKey];
    subpath = 'raven.exe';
  } else if (platformKey in knownUnixlikePackages) {
    pkg = knownUnixlikePackages[platformKey];
    subpath = 'raven';
  } else {
    throw new Error(\`Unsupported platform: \${platformKey}\`);
  }
  
  return { pkg, subpath };
}

function generateBinPath() {
  const { pkg, subpath } = pkgAndSubpathForCurrentPlatform();
  return require.resolve(\`\${pkg}/\${subpath}\`);
}

const binaryPath = generateBinPath();

const child = spawn(binaryPath, process.argv.slice(2), { stdio: 'inherit' });
child.on('exit', (code) => process.exit(code || 0));
`;

  const binPath = join(packageDir, "bin", "raven");
  await writeFile(binPath, wrapperScript);
  await chmod(binPath, 0o755);

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
