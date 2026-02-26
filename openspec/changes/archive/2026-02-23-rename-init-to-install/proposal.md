## Why

The `init` command name is less intuitive for the primary action of installing RavenJS into a project. Renaming to `install` better aligns with common CLI conventions (e.g., `npm install`, `bun install`) and makes the purpose immediately clear to users.

## What Changes

- **Rename** the `raven init` command to `raven install` (subcommand name change)
- **Update** all user-facing messages, help text, and error hints from "init" to "install"
- **Update** specs to reflect the new command name
- **Update** e2e and any unit tests referencing `init`
- **Update** documentation (README, skills, onboard guides) that mention `raven init`
- **No backward compatibility**—`raven init` will be removed entirely

## Capabilities

### New Capabilities

- None

### Modified Capabilities

- `cli-tool`: Change requirement "init 命令初始化项目" to "install 命令安装项目"
- `registry-based-install`: Update scenario references from `raven init` to `raven install`
- `cli-output-styling`: Update examples referencing init to install
- `module-documentation`: Update references from `raven init` to `raven install`

## Impact

- **CLI**: `packages/cli/index.ts` — rename command, update `cmdInit` → `cmdInstall`, error messages
- **Tests**: `tests/e2e/cli.test.ts` — change all `init` calls and assertions to `install`
- **Specs**: All listed capability specs above
- **Docs**: `.claude/commands/`, `.claude/skills/`, `install.sh` (if it mentions init), README
