#!/usr/bin/env bun
import { access, copyFile, mkdir, readFile, readdir, rm, writeFile } from "fs/promises";
import { dirname, join } from "path";

const CLI_DIR = join(import.meta.dir, "..");
const ROOT_DIR = join(CLI_DIR, "..", "..");
const CORE_DIR = join(ROOT_DIR, "packages", "core");
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
  };

  const content = JSON.stringify(manifest, null, 2);
  for (const outputPath of outputPaths) {
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, content);
  }

  console.log(`Source manifest generated (version: ${manifest.version})`);

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

  await Promise.all(copies);

  console.log(`Managed sources copied (core files: ${manifest.core.files.length})`);
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
