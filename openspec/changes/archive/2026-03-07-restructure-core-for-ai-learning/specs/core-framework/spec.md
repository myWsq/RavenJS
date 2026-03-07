## MODIFIED Requirements

### Requirement: RavenJS as Agent Teaching Tool

RavenJS SHALL be positioned as an Agent teaching tool rather than a traditional npm framework. The framework code SHALL be provided as conceptually organized reference implementation for Agents to learn from, not as a dependency to import. 对 `core` 而言，源码结构 MUST 优先服务于 Agent 的学习、定位与局部修改，而不是优先保留历史文件形态。

#### Scenario: Agent learns from RavenJS code

- **WHEN** an Agent reads the RavenJS reference code and README.md
- **THEN** the Agent SHALL understand how to write code in RavenJS's style
- **AND** the Agent SHALL be able to generate similar code without requiring RavenJS as a dependency

#### Scenario: Agent locates core concepts from source layout

- **WHEN** an Agent needs to understand request lifecycle, state, schema, routing, or plugin-related behavior in `modules/core`
- **THEN** the source layout SHALL allow the Agent to locate the relevant concept through directory and file boundaries
- **AND** the Agent SHALL NOT need to first read a single monolithic implementation file to identify ownership
