## 1. CLI status command

- [x] 1.1 Add `cmdStatus` function in `packages/cli/index.ts` that detects ai (.claude/), core (<root>/core/), modules (<root> subdirs matching registry)
- [x] 1.2 Implement human-readable output (ai: installed/not installed, core: ..., modules: [list])
- [x] 1.3 Add `--json` option to output machine-parseable JSON
- [x] 1.4 Register `raven status` command with cac, support --root and global options
- [x] 1.5 Ensure exit code 0 even when nothing is installed

## 2. Update AI skills and commands

- [x] 2.1 Update `packages/ai/install/skill.md`: instruct agent to run `raven status` to check installation, remove hardcoded raven/ check
- [x] 2.2 Update `packages/ai/install/command.md`: change "检查项目状态" step to use `raven status`, remove directory existence checks
- [x] 2.3 Update `packages/ai/add/skill.md`: instruct agent to run `raven status` to verify RavenJS before adding
- [x] 2.4 Update `packages/ai/add/command.md`: change "检查项目状态" step to use `raven status`
