#!/usr/bin/env bun

import { cp, mkdir, readdir, writeFile, rm, exists } from "fs/promises";
import { join, dirname } from "path";
import { cwd } from "process";

const getSourceDir = (): string => {
  if (process.env.RAVEN_SOURCE_DIR) {
    return process.env.RAVEN_SOURCE_DIR;
  }
  return "/Users/bytedance/w/ravenjs";
};

const SOURCE_DIR: string = getSourceDir();

interface CLIOptions {
  verbose?: boolean;
}

async function log(message: string, options?: CLIOptions) {
  if (options?.verbose) {
    console.log(message);
  }
}

async function error(message: string) {
  console.error(`\x1b[31mError:\x1b[0m ${message}`);
  process.exit(1);
}

async function info(message: string) {
  console.log(`\x1b[36mINFO:\x1b[0m ${message}`);
}

async function success(message: string) {
  console.log(`\x1b[32m✓\x1b[0m ${message}`);
}

function getAvailableFeatures(): string[] {
  return ["jtd-validator"];
}

async function ensureDir(path: string) {
  try {
    await mkdir(path, { recursive: true });
  } catch (e: any) {
    if (e.code !== "EEXIST") throw e;
  }
}

async function isDirEmpty(path: string): Promise<boolean> {
  try {
    const entries = await readdir(path);
    return entries.length === 0;
  } catch (e: any) {
    if (e.code === "ENOENT") return true;
    throw e;
  }
}

async function copyPackage(src: string, dest: string, packageName: string) {
  await ensureDir(dest);
  
  const files = await readdir(src);
  
  for (const file of files) {
    if (file === "node_modules" || file === ".git") continue;
    if (file.endsWith(".test.ts") || file.endsWith(".bench.ts")) continue;
    
    const srcPath = join(src, file);
    const destPath = join(dest, file);
    
    const stat = await import("fs/promises").then(fs => fs.stat(srcPath));
    
    if (stat.isDirectory()) {
      await copyPackage(srcPath, destPath, packageName);
    } else {
      await cp(srcPath, destPath);
    }
  }
}

async function copyCoreToDest(destDir: string) {
  const coreSrc = join(SOURCE_DIR, "packages", "core");
  const coreDest = join(destDir, "src", "raven");
  
  info(`Copying core package from ${coreSrc} to ${coreDest}`);
  await copyPackage(coreSrc, coreDest, "core");
  
  await cp(
    join(SOURCE_DIR, "packages", "core", "README.md"),
    join(coreDest, "README.md")
  );
}

async function createSkillFile(destDir: string) {
  const skillDir = join(destDir, ".trae", "skills", "ravenjs");
  await ensureDir(skillDir);
  
  const skillContent = `# RavenJS Framework Skill

## Overview

This skill provides AI agents with the knowledge to use RavenJS framework effectively.

## Available Commands

### raven init
Initialize a new RavenJS project in the current directory.

\`\`\`bash
raven init
\`\`\`

Creates:
- \`src/raven/\` - Core framework code
- \`.trae/skills/ravenjs/SKILL.md\` - This skill file
- \`app.ts\` - Your application entry point

### raven add <feature>
Add additional features to your project.

\`\`\`bash
raven add jtd-validator
\`\`\`

Available features:
- \`jtd-validator\` - JTD schema validation

### raven update
Update RavenJS to the latest version.

\`\`\`bash
raven update
\`\`\`

**Note**: If you have local modifications, commit or stash them before updating.

## Framework Capabilities

### HTTP Server
- Start server with \`app.listen({ port: 3000 })\`
- Automatic runtime adaptation (Bun/Node.js)

### Routing
- HTTP methods: GET, POST, PUT, DELETE, PATCH
- Path parameters: \`/user/:id\`
- Route groups: \`app.group("/api", callback)\`

### State Management
- \`AppState<T>\` - Application-level state
- \`RequestState<T>\` - Request-level state
- Built-in states: BodyState, QueryState, ParamsState, HeadersState

### Lifecycle Hooks
- \`onRequest\` - Before request processing
- \`beforeHandle\` - Before handler execution
- \`beforeResponse\` - Before response is sent
- \`onError\` - On error occurrence

### Plugin System
- \`createPlugin(fn)\` - Create plugins
- \`app.register(plugin)\` - Register plugins

## Quick Start

\`\`\`typescript
import { Raven } from "./src/raven/index.ts";

const app = new Raven();

app.get("/", () => {
  return new Response("Hello, World!");
});

app.listen({ port: 3000 });
\`\`\`

## API Reference

See \`src/raven/README.md\` for complete API documentation.
`;

  await writeFile(join(skillDir, "SKILL.md"), skillContent);
}

async function createAppEntry(destDir: string) {
  const appContent = `import { Raven } from "./src/raven/index.ts";

const app = new Raven();

app.get("/", () => {
  return new Response("Hello, World!");
});

app.listen({ port: 3000 });
console.log("Server running at http://localhost:3000");
`;

  await writeFile(join(destDir, "app.ts"), appContent);
}

async function cmdInit(args: string[], options: CLIOptions) {
  const targetDir = args[0] ? join(cwd(), args[0]) : cwd();
  
  log(`Initializing RavenJS in ${targetDir}`, options);
  
  const srcRavenDir = join(targetDir, "src", "raven");
  
  if (await exists(srcRavenDir)) {
    const empty = await isDirEmpty(srcRavenDir);
    if (!empty) {
      await error("RavenJS is already initialized in this directory. Use 'raven update' to update.");
      return;
    }
  }
  
  await ensureDir(join(targetDir, "src"));
  
  await copyCoreToDest(targetDir);
  await createSkillFile(targetDir);
  await createAppEntry(targetDir);
  
  success("RavenJS initialized successfully!");
  console.log(`
Next steps:
  1. cd ${targetDir}
  2. bun run app.ts
  3. Open http://localhost:3000
`);
}

async function cmdAdd(args: string[], options: CLIOptions) {
  const feature = args[0];
  
  if (!feature) {
    await error("Please specify a feature to add. Available: jtd-validator");
    return;
  }
  
  const available = getAvailableFeatures();
  
  if (!available.includes(feature)) {
    console.log(`Available features: ${available.join(", ")}`);
    await error(`Unknown feature: ${feature}`);
    return;
  }
  
  const targetDir = cwd();
  const srcRavenDir = join(targetDir, "src", "raven");
  
  if (!await exists(srcRavenDir)) {
    await error("RavenJS not initialized. Run 'raven init' first.");
    return;
  }
  
  log(`Adding ${feature}...`, options);
  
  const featureSrc = join(SOURCE_DIR, "packages", feature);
  const featureDest = join(srcRavenDir, feature);
  
  await copyPackage(featureSrc, featureDest, feature);
  
  const specSrc = join(SOURCE_DIR, "packages", feature, "README.md");
  if (await exists(specSrc)) {
    await cp(specSrc, join(featureDest, "README.md"));
  }
  
  success(`${feature} added successfully!`);
  console.log(`
The feature has been added to src/raven/${feature}/
See src/raven/${feature}/README.md for usage.
`);
}

async function cmdUpdate(args: string[], options: CLIOptions) {
  const targetDir = args[0] ? join(cwd(), args[0]) : cwd();
  
  info("Checking for local modifications...");
  
  const srcRavenDir = join(targetDir, "src", "raven");
  
  if (!await exists(srcRavenDir)) {
    await error("RavenJS not initialized. Run 'raven init' first.");
    return;
  }
  
  info(`Updating RavenJS in ${targetDir}...`);
  
  await rm(srcRavenDir, { recursive: true, force: true });
  
  await copyCoreToDest(targetDir);
  
  const features = getAvailableFeatures();
  for (const feature of features) {
    const featureDest = join(srcRavenDir, feature);
    if (await exists(featureDest)) {
      const featureSrc = join(SOURCE_DIR, "packages", feature);
      await rm(featureDest, { recursive: true, force: true });
      await copyPackage(featureSrc, featureDest, feature);
      
      const specSrc = join(SOURCE_DIR, "packages", feature, "README.md");
      if (await exists(specSrc)) {
        await cp(specSrc, join(featureDest, "README.md"));
      }
    }
  }
  
  success("RavenJS updated successfully!");
}

function printHelp() {
  console.log(`
RavenJS CLI - AI-First Web Framework

Usage:
  raven <command> [options]

Commands:
  init              Initialize a new RavenJS project
  add <feature>     Add a feature (e.g., jtd-validator)
  update            Update RavenJS to latest version
  help              Show this help message

Examples:
  raven init
  raven add jtd-validator
  raven update

For more information, see: https://github.com/your-username/ravenjs
`);
}

async function main() {
  const args = Bun.argv.slice(2);
  const command = args[0];
  
  const verboseIndex = args.indexOf("--verbose");
  const options: CLIOptions = {
    verbose: verboseIndex !== -1,
  };
  
  if (verboseIndex !== -1) {
    args.splice(verboseIndex, 1);
  }
  
  switch (command) {
    case "init":
      await cmdInit(args.slice(1), options);
      break;
    case "add":
      await cmdAdd(args.slice(1), options);
      break;
    case "update":
      await cmdUpdate(args.slice(1), options);
      break;
    case "help":
    case "--help":
    case "-h":
      printHelp();
      break;
    default:
      if (!command) {
        printHelp();
        break;
      }
      await error(`Unknown command: ${command}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
