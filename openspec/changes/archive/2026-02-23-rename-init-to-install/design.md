## Context

The RavenJS CLI currently uses `raven init` to set up a new project by copying core code into the user's directory. The command name "init" is common for scaffolding but less aligned with install-centric CLIs (npm, bun, pnpm). This change renames the command to `install` for clarity and convention alignment.

## Goals / Non-Goals

**Goals:**
- Rename `init` subcommand to `install` in the CLI
- Update all user-facing text, error messages, and help strings
- Update all specs and tests to use the new command
- Update documentation and skills that reference `raven init`

**Non-Goals:**
- Changing command behavior or logic (only naming)
- Backward compatibility (no alias for `init`)
- Modifying add/update/self-update commands

## Decisions

1. **Subcommand name: `install`**
   - Aligns with package manager conventions (`npm install`, `bun install`)
   - Clearly communicates the action (installing RavenJS into the project)
   - Alternative considered: keep `init` — rejected per user requirement

2. **Internal function rename: `cmdInit` → `cmdInstall`**
   - Keeps naming consistent with the public command

3. **Error message hints**
   - Change "Run 'raven init' first" to "Run 'raven install' first" in add/update error paths

4. **Success message**
   - Change "RavenJS initialized successfully!" to "RavenJS installed successfully!"

## Risks / Trade-offs

- **Breaking change**: Users or scripts using `raven init` will break. Mitigation: documented as intentional; no backward compatibility per user requirement.
- **install.sh naming**: The `install.sh` script installs the CLI binary itself, not the project-scoped install. No change needed to that file name; it refers to installing the raven binary. Only update if it documents `raven init` in usage examples.
