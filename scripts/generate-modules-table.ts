// Generates the "Available Modules" table in README.md from modules/*/package.json description.
// Run on pre-commit so the table stays in sync. Usage: bun run scripts/generate-modules-table.ts

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..");
const MODULES_DIR = join(ROOT, "modules");
const README_PATH = join(ROOT, "README.md");

function getModuleDescription(moduleName: string): string {
  const pkgPath = join(MODULES_DIR, moduleName, "package.json");
  try {
    const content = readFileSync(pkgPath, "utf-8");
    const pkg = JSON.parse(content) as { description?: string };
    const desc = typeof pkg.description === "string" ? pkg.description.trim() : "";
    return desc || "—";
  } catch {
    return "—";
  }
}

function generateTable(): string {
  const dirs = readdirSync(MODULES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  // Non-breaking hyphen (U+2011) so the module column doesn't wrap at "-"
  const NBHYPHEN = "\u2011";
  const rows = dirs.map((name) => {
    const displayName = name.replace(/-/g, NBHYPHEN);
    const desc = getModuleDescription(name);
    return `| \`${displayName}\` | ${desc} | [README](modules/${name}/README.md) |`;
  });

  return [
    "| Module          | Description                                                                                    | Docs                                      |",
    "| --------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------- |",
    ...rows,
  ].join("\n");
}

function main(): void {
  const readme = readFileSync(README_PATH, "utf-8");
  const table = generateTable();

  const lines = readme.split("\n");
  const tableStartLineIdx = lines.findIndex(
    (l) => l.includes("| Module") && l.includes("| Description"),
  );
  const cliLineIdx = lines.findIndex((l) => l.trim() === "## CLI");

  if (tableStartLineIdx === -1 || cliLineIdx === -1) {
    console.error("README: could not find Available Modules table or ## CLI");
    process.exit(1);
  }

  const tableStartLine = lines[tableStartLineIdx];
  const cliLine = lines[cliLineIdx];
  if (tableStartLine === undefined || cliLine === undefined) {
    console.error("README: could not find Available Modules table or ## CLI");
    process.exit(1);
  }
  const startIdx = readme.indexOf(tableStartLine);
  const endIdx = readme.indexOf(cliLine);

  const before = readme.slice(0, startIdx);
  const after = readme.slice(endIdx);
  const newReadme = before + table + "\n\n" + after;

  if (newReadme !== readme) {
    writeFileSync(README_PATH, newReadme, "utf-8");
    console.log("README.md: Available Modules table updated.");
  }
}

main();
