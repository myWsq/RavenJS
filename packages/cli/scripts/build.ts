#!/usr/bin/env bun
import { access, copyFile, mkdir, readFile, readdir, rm, writeFile } from "fs/promises";
import { dirname, join } from "path";

const CLI_DIR = join(import.meta.dir, "..");
const ROOT_DIR = join(CLI_DIR, "..", "..");
const CORE_DIR = join(ROOT_DIR, "packages", "core");
const EXAMPLES_DIR = join(ROOT_DIR, "examples");
const DIST_DIR = join(CLI_DIR, "dist");
const REGISTRY_IN_DIST = join(DIST_DIR, "registry.json");
const SOURCE_IN_DIST = join(DIST_DIR, "source");

const EXCLUDED_NAMES = new Set(["node_modules", "package.json"]);

interface ManagedDirInfo {
  files: string[];
}

interface SourceManifest {
  version: string;
  core: ManagedDirInfo;
  examples: Record<string, ManagedDirInfo>;
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function getFiles(rootDir: string): Promise<string[]> {
  const files: string[] = [];

  async function walk(currentDir: string, currentRelDir = ""): Promise<void> {
    const entries = await readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      if (EXCLUDED_NAMES.has(entry.name)) {
        continue;
      }

      const relPath = currentRelDir ? join(currentRelDir, entry.name) : entry.name;
      const absPath = join(currentDir, entry.name);

      if (entry.isDirectory()) {
        await walk(absPath, relPath);
        continue;
      }

      files.push(relPath);
    }
  }

  await walk(rootDir);
  return files.sort();
}

async function ensureCoreGuideExists(): Promise<void> {
  const guidePath = join(CORE_DIR, "GUIDE.md");
  if (!(await pathExists(guidePath))) {
    console.error("Error: packages/core is missing GUIDE.md.");
    process.exit(1);
  }
}

async function scanExamples(): Promise<Record<string, ManagedDirInfo>> {
  const examples: Record<string, ManagedDirInfo> = {};

  if (!(await pathExists(EXAMPLES_DIR))) {
    return examples;
  }

  const entries = await readdir(EXAMPLES_DIR, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const exampleDir = join(EXAMPLES_DIR, entry.name);
    const files = await getFiles(exampleDir);
    if (files.length === 0) {
      continue;
    }

    examples[entry.name] = { files };
  }

  return examples;
}

async function getVersion(): Promise<string> {
  const content = await readFile(join(CLI_DIR, "package.json"), "utf-8");
  const pkg = JSON.parse(content) as { version?: string };
  return pkg.version ?? "0.0.0";
}

async function generateManifest(outputPaths: string[]): Promise<SourceManifest> {
  await ensureCoreGuideExists();

  const manifest: SourceManifest = {
    version: await getVersion(),
    core: { files: await getFiles(CORE_DIR) },
    examples: await scanExamples(),
  };

  const content = JSON.stringify(manifest, null, 2);
  for (const outputPath of outputPaths) {
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, content);
  }

  console.log(
    `Source manifest generated (version: ${manifest.version}, examples: ${
      Object.keys(manifest.examples).join(", ") || "none"
    })`,
  );

  return manifest;
}

async function copyManagedSources(manifest: SourceManifest, outputDirs: string[]): Promise<void> {
  for (const outDir of outputDirs) {
    await rm(outDir, { recursive: true, force: true });
    await mkdir(outDir, { recursive: true });
  }

  const copies: Promise<void>[] = [];

  for (const file of manifest.core.files) {
    const srcPath = join(CORE_DIR, file);
    for (const outDir of outputDirs) {
      const destPath = join(outDir, "core", file);
      copies.push(
        mkdir(dirname(destPath), { recursive: true }).then(() => copyFile(srcPath, destPath)),
      );
    }
  }

  for (const [exampleName, example] of Object.entries(manifest.examples)) {
    const exampleDir = join(EXAMPLES_DIR, exampleName);

    for (const file of example.files) {
      const srcPath = join(exampleDir, file);
      for (const outDir of outputDirs) {
        const destPath = join(outDir, "examples", exampleName, file);
        copies.push(
          mkdir(dirname(destPath), { recursive: true }).then(() => copyFile(srcPath, destPath)),
        );
      }
    }
  }

  await Promise.all(copies);

  const totalFiles =
    manifest.core.files.length +
    Object.values(manifest.examples).reduce((sum, example) => sum + example.files.length, 0);

  console.log(
    `Managed sources copied (core files: ${manifest.core.files.length}, total files: ${totalFiles})`,
  );
}

async function main() {
  const registryOnly = process.argv.includes("--registry-only");

  const manifest = await generateManifest([REGISTRY_IN_DIST]);
  await copyManagedSources(manifest, [SOURCE_IN_DIST]);

  if (registryOnly) {
    return;
  }

  await mkdir(DIST_DIR, { recursive: true });
  await Bun.build({
    entrypoints: [join(CLI_DIR, "index.ts")],
    outdir: DIST_DIR,
    target: "node",
    naming: "raven",
    sourcemap: "linked",
    packages: "external",
  });
  console.log("CLI built to dist/raven");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
