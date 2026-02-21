# Module Documentation Specification

## Purpose

This specification defines the requirements for module-level documentation in RavenJS. Each package must include a `README.md` file that serves as the source-level documentation for AI agents and developers.

## Requirements

### Requirement: README.md as Source-Level Dependency

Each RavenJS package MUST contain a `README.md` file at its root level. This file is considered a source-level dependency and MUST be continuously maintained and iterated upon alongside code changes.

#### Scenario: Package includes README
- **WHEN** a new package is created in `packages/`
- **THEN** a `README.md` file MUST be created in the package root
- **AND** the README MUST document all public APIs

#### Scenario: Code change requires documentation update
- **WHEN** a public API is added, modified, or removed
- **THEN** the corresponding `README.md` MUST be updated
- **AND** the change MUST be tracked in the same commit as the code

### Requirement: README.md Language

All `README.md` files MUST be written in English.

#### Scenario: Writing documentation
- **WHEN** creating or updating a module's README
- **THEN** content MUST be in English
- **AND** code examples MAY use any language (TypeScript, JavaScript, etc.)

### Requirement: README.md Structure

Each module's `README.md` MUST include the following sections:

1. **Overview**: Brief description of the module's purpose and key features
2. **Quick Start**: Minimal working example
3. **API Reference**: Complete API documentation
4. **Examples**: Common usage scenarios with code examples
5. **Design Intent**: Rationale behind key design decisions
6. **Caveats**: Known limitations, edge cases, and common pitfalls

#### Scenario: Documentation completeness
- **WHEN** AI Agent reads a module's README
- **THEN** the agent should be able to use the module without reading source code
- **AND** the agent should understand the design rationale

### Requirement: README.md for CLI Tools

CLI tools that copy packages (such as `raven init`) MUST also copy the `README.md` file to the destination.

#### Scenario: CLI copies package
- **WHEN** CLI command copies a package to user directory
- **THEN** the `README.md` file MUST be included in the copy
- **AND** SKILL.md references should point to the copied README

### Requirement: README.md is Primary Documentation

The `README.md` file is the primary source of truth for module documentation. It takes precedence over auto-generated API docs.

#### Scenario: Conflict between docs
- **WHEN** README and auto-generated docs conflict
- **THEN** README is considered the source of truth
- **AND** auto-generated docs should be updated to match README

## Maintenance Guidelines

### When to Update README

- Adding new public API
- Modifying existing API behavior
- Adding new features
- Fixing bugs that affect usage
- Adding new examples
- Documenting known limitations

### Writing Style

- Be concise but complete
- Use code examples liberally
- Explain "why" not just "what"
- Include type signatures for TypeScript code
- Cross-reference related modules when applicable
