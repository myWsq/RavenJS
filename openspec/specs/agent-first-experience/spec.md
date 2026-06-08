# Agent First Experience Specification

## Purpose

定义 RavenJS 作为 Agent 教学工具的定位与能力，使 AI Agent 成为主要受众。

## Requirements

### Requirement: RavenJS as Agent Teaching Tool

RavenJS SHALL be positioned as an Agent teaching tool rather than a traditional npm framework. The primary audience SHALL be AI Agents, not human developers directly. The teaching outcome SHALL include not only understanding RavenJS APIs and architecture, but also understanding and applying RavenJS pattern boundaries when generating or updating project code.

#### Scenario: Agent learns from RavenJS

- **WHEN** an Agent uses the `raven-use` SKILL
- **THEN** the Agent SHALL understand RavenJS's design philosophy, architecture, and pattern entrypoints from the docs shipped in the installed `@raven.js/core` package
- **AND** the Agent SHALL know which documents to read for business layering versus runtime assembly

#### Scenario: Agent generates code based on teaching

- **WHEN** an Agent has learned RavenJS
- **THEN** the Agent SHALL write project code that imports the public API from the installed `@raven.js/core` package
- **AND** the Agent SHALL organize new code according to RavenJS pattern instead of only imitating API usage

#### Scenario: Agent updates existing RavenJS code

- **WHEN** an Agent evolves an existing RavenJS project after learning the framework
- **THEN** the Agent SHALL preserve or improve pattern boundaries during the update
- **AND** the Agent SHALL avoid introducing documented anti-patterns as part of the change

### Requirement: Bootstrap via the npm package

RavenJS SHALL be bootstrapped by installing the `@raven.js/core` npm package (with its `hono` peer) as a normal dependency, as documented in the README Quick Start. RavenJS SHALL NOT ship a dedicated bootstrap/install skill — installing the package is an ordinary npm operation.

#### Scenario: Agent bootstraps a project

- **WHEN** an Agent sets up a new RavenJS project
- **THEN** the Agent SHALL install `@raven.js/core` and `hono` via the project's package manager and wire a runtime-appropriate serve entry per the README Quick Start

### Requirement: Project evolution by Agent, framework upgrades via npm

After bootstrap, evolution of the user's project code SHALL be performed by the Agent. The framework itself SHALL be distributed and upgraded as the `@raven.js/core` npm package — upgrades are ordinary version bumps, not Agent-managed source edits.

#### Scenario: Agent evolves project code over time

- **WHEN** the user's project needs changes
- **THEN** the Agent SHALL modify the project code directly, following RavenJS pattern boundaries

#### Scenario: Framework upgrades are npm version bumps

- **WHEN** the user wants a newer RavenJS version
- **THEN** they SHALL upgrade the `@raven.js/core` npm dependency (e.g. `npm install @raven.js/core@latest`) and consult MIGRATION.md for breaking changes
- **AND** the Agent SHALL NOT edit framework source inside `node_modules`
