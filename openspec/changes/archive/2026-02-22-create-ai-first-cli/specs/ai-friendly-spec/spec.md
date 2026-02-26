## ADDED Requirements

### Requirement: AI 友好的 SPEC.md 格式

RavenJS SHALL 为 core 包提供 AI 友好的规格文档，包含 AI Agent 理解和使用框架所需的所有信息。

#### Scenario: SPEC.md 包含 Overview

- **WHEN** AI Agent 读取 SPEC.md
- **THEN** 文档包含框架能力边界、适用场景、核心概念的概述

#### Scenario: SPEC.md 包含 Quick Start

- **WHEN** AI Agent 读取 SPEC.md
- **THEN** 文档包含最小可用示例代码（hello world）

#### Scenario: SPEC.md 包含 API Reference

- **WHEN** AI Agent 读取 SPEC.md
- **THEN** 文档列出所有导出函数、类、类型的签名和使用方式

#### Scenario: SPEC.md 包含 Examples

- **WHEN** AI Agent 读取 SPEC.md
- **THEN** 文档包含常见场景的完整代码示例

#### Scenario: SPEC.md 包含 Design Intent

- **WHEN** AI Agent 读取 SPEC.md
- **THEN** 文档解释关键设计决策的原因，帮助 Agent 理解"为什么"

#### Scenario: SPEC.md 包含 Caveats

- **WHEN** AI Agent 读取 SPEC.md
- **THEN** 文档列出已知限制、注意事项、常见错误

### Requirement: SKILL.md 帮助 AI 使用 CLI

RavenJS SHALL 提供 SKILL.md，帮助 Trae/Cursor 等 AI IDE 理解如何使用 CLI 工具。

#### Scenario: SKILL.md 定义可用命令

- **WHEN** AI Agent 加载 SKILL
- **THEN** 文档列出所有 CLI 命令及其用法

#### Scenario: SKILL.md 描述框架能力

- **WHEN** AI Agent 加载 SKILL
- **THEN** 文档描述 RavenJS 框架的核心能力
