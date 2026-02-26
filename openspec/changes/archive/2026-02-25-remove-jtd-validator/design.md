## Context

The `jtd-validator` module is currently a part of the RavenJS ecosystem, providing JTD-based validation. It is referenced in the CLI tools (as an installable module), in AI skills (as a capability), and in various documentation and specs. The decision has been made to remove this module entirely.

## Goals / Non-Goals

**Goals:**

- Completely remove the `modules/jtd-validator` directory and all its contents.
- Remove the capability to install `jtd-validator` via the RavenJS CLI (`raven add`).
- Remove all references to `jtd-validator` in AI skills (`raven-add`, `raven-use`, etc.) to prevent AI from suggesting it.
- Remove references in documentation and specifications.
- Ensure the codebase builds and tests pass after removal.

**Non-Goals:**

- Implementing a replacement validation library in this change.
- modifying the core framework architecture beyond removing dependencies on `jtd-validator`.

## Decisions

- **Direct Deletion**: The `modules/jtd-validator` directory will be deleted.
- **CLI Registry Update**: The CLI's internal list of modules or registry mechanism will be updated to remove `jtd-validator`. The `add` command will be modified to no longer recognize `jtd-validator`.
- **Skill Updates**: AI skill files (markdown) will be edited to remove text related to `jtd-validator`.
- **Spec Updates**: Specs will be updated to reflect the removal.

## Risks / Trade-offs

- **Breaking Change**: Users attempting to run `raven add jtd-validator` will encounter an error (e.g., "unknown module").
- **Documentation Gaps**: If `jtd-validator` was the only recommended validation method, users might be left without a clear validation story until a replacement is introduced.
- **Mitigation**: Ensure release notes clearly state the removal.
