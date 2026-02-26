## Why

The `jtd-validator` module is being removed from the codebase. This decision aims to streamline the framework and remove the specific JTD-based validation implementation. This includes removing the module source code, documentation, and all references in AI skills and CLI tools to ensure the system is consistent and does not advertise a missing feature.

## What Changes

- **BREAKING**: Remove `modules/jtd-validator/` directory and all its contents.
- **BREAKING**: Remove support for `raven add jtd-validator` in the CLI.
- Update AI skills (`raven-add`, `raven-use`, etc.) to remove references to `jtd-validator`.
- Update documentation and specs to remove mentions of `jtd-validator`.
- Clean up tests and benchmarks related to `jtd-validator`.

## Capabilities

### New Capabilities

- `remove-jtd-validator`: Execution of the removal process for the JTD validator module and its references.

### Modified Capabilities

- `cli-tool`: Remove the requirement and support for adding the `jtd-validator` module.
- `validator`: Deprecate and remove the validation specification provided by `jtd-validator`.

## Impact

- **Codebase**: `modules/jtd-validator` will be deleted.
- **CLI**: `packages/cli` will be modified to remove `jtd-validator` from known modules and `add` command.
- **AI**: `packages/ai` skills will be updated to stop suggesting or understanding `jtd-validator`.
- **Specs**: Existing specs referencing `jtd-validator` will be updated.
