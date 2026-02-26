#!/usr/bin/env node
/**
 * install-raven — Install RavenJS AI skills into the project.
 * Only copies skills (e.g. to .claude/skills/). Does not install @raven.js/cli or create raven root.
 * After running, use raven-setup in your Agent to install the CLI and complete setup.
 */

import { cp, readdir } from "fs/promises";
import { join, dirname } from "path";
import { cwd } from "process";
import { fileURLToPath } from "url";
import { Command } from "commander";
import * as p from "@clack/prompts";

const __dirname = dirname(fileURLToPath(import.meta.url));

const IDE_VALUES = ["claude", "cursor", "trae"] as const;

/** IDE options: value, label, default skills path */
const IDE_OPTIONS = [
  { value: "claude", label: "Claude Code", path: ".claude/skills" },
  { value: "cursor", label: "Cursor", path: ".cursor/skills" },
  { value: "trae", label: "Trae", path: ".trae/skills" },
] as const;

function getSkillsRoot(): string {
  return join(__dirname, "skills");
}

/** Discover skill names from skills/ subdirs */
async function discoverSkillNames(skillsRoot: string): Promise<string[]> {
  const entries = await readdir(skillsRoot, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
}

async function copySkills(
  skillsRoot: string,
  skillNames: string[],
  targetRoot: string,
  projectRoot: string,
): Promise<void> {
  const normalized = targetRoot.replace(/\/$/, "");
  for (const name of skillNames) {
    const src = join(skillsRoot, name);
    const dest = join(projectRoot, normalized, name);
    await cp(src, dest, { recursive: true });
  }
}

function getTargetDirsForIdes(ideValues: string[]): string[] {
  const set = new Set<string>();
  for (const v of ideValues) {
    const opt = IDE_OPTIONS.find((o) => o.value === v);
    if (opt) set.add(opt.path);
  }
  return [...set];
}

async function runInstallToTargets(targetRoots: string[]): Promise<number> {
  const projectRoot = cwd();
  const skillsRoot = getSkillsRoot();
  const skillNames = await discoverSkillNames(skillsRoot);

  if (skillNames.length === 0) {
    p.log.error("No skills found in package (skills/).");
    return 1;
  }

  const s = p.spinner();
  s.start("Installing RavenJS skills…");

  try {
    for (const targetRoot of targetRoots) {
      await copySkills(skillsRoot, skillNames, targetRoot, projectRoot);
    }
    s.stop("Done");
    const uniqueDirs = [...new Set(targetRoots)];
    p.log.success(
      `Installed ${skillNames.length} skill(s) × ${uniqueDirs.length} location(s): ${uniqueDirs.join(", ")}`,
    );
    return 0;
  } catch (e: unknown) {
    s.stop("Failed");
    const msg = e instanceof Error ? e.message : String(e);
    p.log.error(`install-raven: ${msg}`);
    return 1;
  }
}

function printBanner(targetRoots: string[]): void {
  const projectRoot = cwd();
  const lines = [
    "",
    "  ╭─────────────────────────────────────────────────────────╮",
    "  │  RavenJS skills installed successfully                   │",
    "  ╰─────────────────────────────────────────────────────────╯",
    "",
    "  Next steps:",
    "  · Open the Agent chat and type: \x1b[1m\x1b[36m/raven-setup\x1b[0m",
    "",
    `  Installed to: ${targetRoots.map((t) => join(projectRoot, t)).join(", ")}`,
    "",
  ];
  for (const line of lines) {
    p.log.message(line);
  }
}

async function runInteractive(skipConfirm = false): Promise<number> {
  p.intro("install-raven");

  const ideResult = await p.multiselect({
    message: "Select IDE(s) to install skills for",
    options: IDE_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
    required: true,
  });

  if (p.isCancel(ideResult)) {
    p.cancel("Operation cancelled.");
    return 0;
  }

  const ideValues = ideResult as string[];
  if (ideValues.length === 0) {
    p.cancel("No IDE selected. Exiting.");
    return 0;
  }

  const targetDirs = getTargetDirsForIdes(ideValues);

  for (const d of targetDirs) {
    p.log.message(`  · ${d}`);
  }

  let confirmed = true;
  if (!skipConfirm) {
    const confirmResult = await p.confirm({
      message: "Install skills to the directories above?",
      initialValue: true,
    });
    if (p.isCancel(confirmResult)) {
      p.cancel("Operation cancelled.");
      return 0;
    }
    confirmed = confirmResult === true;
  }

  if (!confirmed) {
    p.cancel("Installation skipped.");
    return 0;
  }

  const code = await runInstallToTargets(targetDirs);
  if (code === 0) {
    printBanner(targetDirs);
    p.outro("You're all set!");
  }
  return code;
}

function parseIdeOption(ide: string): string[] {
  return ide
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function runNonInteractive(ideValues: string[]): Promise<number> {
  const invalid = ideValues.filter((v) => !IDE_VALUES.includes(v as (typeof IDE_VALUES)[number]));
  if (invalid.length > 0) {
    p.log.error(`Invalid --ide: ${invalid.join(", ")}. Choose from: ${IDE_VALUES.join(", ")}`);
    return Promise.resolve(1);
  }
  const targetDirs = getTargetDirsForIdes(ideValues);
  return runInstallToTargets(targetDirs).then((code) => {
    if (code === 0) {
      p.log.success(
        `Installed to ${targetDirs.map((d) => join(cwd(), d)).join(", ")}. Open Agent chat and type: \x1b[1m\x1b[36m/raven-setup\x1b[0m`,
      );
    }
    return code;
  });
}

const program = new Command();

program
  .name("install-raven")
  .description("Install RavenJS AI skills into the project (e.g. .claude/skills).")
  .option(
    "-i, --ide <ide>",
    `IDE(s) to install for: ${IDE_VALUES.join(", ")} (comma-separated for multiple)`,
  )
  .option("-y, --yes", "Skip confirmation in interactive mode")
  .addHelpText(
    "after",
    `
Without --ide and with a TTY: prompts for IDE selection.
With --ide: runs non-interactively (e.g. --ide claude or --ide claude,cursor).
`,
  )
  .action(async (opts: { ide?: string; yes?: boolean }) => {
    const isInteractive = process.stdin.isTTY && opts.ide === undefined;
    const code = isInteractive
      ? await runInteractive(Boolean(opts.yes))
      : await runNonInteractive(parseIdeOption(opts.ide ?? "claude"));
    process.exit(code);
  });

program.parse(process.argv);
