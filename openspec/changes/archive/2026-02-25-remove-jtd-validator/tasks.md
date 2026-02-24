## 1. Remove jtd-validator Module

- [x] 1.1 Delete `modules/jtd-validator/` directory and all its contents.
- [x] 1.2 Check root `package.json` and other `package.json` files for dependencies on `@ravenjs/jtd-validator` and remove them.

## 2. Update CLI

- [x] 2.1 Modify `packages/cli/dist/raven` (if source exists, otherwise just the source code) to remove `jtd-validator` from available modules.
- [x] 2.2 Modify `packages/cli/index.ts` (or relevant source file) to remove `add jtd-validator` command support.
- [x] 2.3 Update `packages/cli` registry or module list to exclude `jtd-validator`.
- [x] 2.4 Verify `raven add jtd-validator` fails with an "unknown module" error.
- [x] 2.5 Verify `raven status` does not list `jtd-validator`.

## 3. Update AI Skills

- [x] 3.1 Update `packages/ai/raven-add/skill.md` to remove mentions of `jtd-validator`.
- [x] 3.2 Update `packages/ai/raven-use/skill.md` to remove mentions of `jtd-validator`.
- [x] 3.3 Search for and remove `jtd-validator` references in any other `packages/ai/*/skill.md` files.

## 4. Cleanup and Verification

- [x] 4.1 Search for `jtd-validator` string in the entire codebase (excluding `openspec/changes/remove-jtd-validator/`) and remove remaining references (e.g., in comments, docs, tests).
- [x] 4.2 Run tests to ensure no regressions in CLI or Core.
