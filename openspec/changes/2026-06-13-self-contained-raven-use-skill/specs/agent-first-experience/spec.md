## MODIFIED Requirements

### Requirement: RavenJS as Agent Teaching Tool

RavenJS SHALL be positioned as an Agent teaching tool rather than a traditional npm framework. The primary audience SHALL be AI Agents, not human developers directly. The teaching outcome SHALL include not only understanding RavenJS APIs and architecture, but also understanding and applying RavenJS pattern boundaries when generating or updating project code. The teaching material SHALL be carried entirely by the self-contained `raven-use` skill (its `reference/*` docs), not by docs shipped inside the installed `@raven.js/core` package.

#### Scenario: Agent learns from the skill

- **WHEN** an Agent uses the `raven-use` SKILL
- **THEN** the Agent SHALL understand RavenJS's design philosophy, architecture, request lifecycle, and pattern entrypoints from the skill's self-contained `reference/*` docs
- **AND** the Agent SHALL know which documents to read for business layering versus runtime assembly
- **AND** the Agent SHALL NOT be required to read teaching docs from the installed `@raven.js/core` package; it MAY consult `dist/index.d.mts` only to confirm exact type signatures

#### Scenario: Agent generates code based on teaching

- **WHEN** an Agent has learned RavenJS
- **THEN** the Agent SHALL write project code that imports the public API from the installed `@raven.js/core` package (runtime APIs from the root, contract authoring from the frontend-safe `@raven.js/core/contract` subentry)
- **AND** the Agent SHALL organize new code according to RavenJS pattern instead of only imitating API usage

#### Scenario: Agent updates existing RavenJS code

- **WHEN** an Agent evolves an existing RavenJS project after learning the framework
- **THEN** the Agent SHALL preserve or improve pattern boundaries during the update
- **AND** the Agent SHALL avoid introducing documented anti-patterns as part of the change
