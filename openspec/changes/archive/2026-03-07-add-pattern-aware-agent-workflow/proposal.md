## Why

RavenJS 已经明确定位为面向 Agent 的教学型框架，但当前 `pattern` 更像高质量参考文档，而不是 Agent 在学习、生成和自检时必须执行的工作流约束。这会导致 Agent 学会了 API，却未必稳定遵守分层边界、命名约定和 anti-pattern 规则，最终削弱代码可读性与可维护性。

## What Changes

- 新增一套面向 RavenJS AI 技能的 pattern-aware 工作流，要求 Agent 在写代码前先完成 pattern 学习、任务分类和结构规划。
- 要求 `raven-learn` / `raven-use` 这类技能把 `modules/core/pattern/*` 作为业务代码任务的显式学习入口，而不是只读 API 和源码。
- 为 Agent 增加生成前后的 pattern 自检约束，包括分层边界、文件布局、命名规则和常见 anti-pattern 检查。
- 更新 core 的 GUIDE / README 学习路径，使 Agent 能明确知道什么时候应该先看 pattern、什么时候应该看 runtime / schema / plugin 细节。

## Capabilities

### New Capabilities

- `pattern-guided-skills`: 定义 RavenJS AI 技能在学习、规划、生成和自检阶段如何显式消费 pattern 文档并据此约束代码产出。

### Modified Capabilities

- `agent-first-experience`: 扩展 Agent 学习与生成的目标，使“学会 RavenJS”不仅包括理解 API 和架构，也包括能按 RavenJS pattern 稳定组织代码。
- `core-learning-structure`: 调整 core 的 GUIDE / README 学习路径要求，使 pattern 文档成为处理业务代码与运行时装配任务时的显式阅读入口。

## Impact

- 受影响技能与教学入口：`packages/install-raven/skills/raven-learn/SKILL.md`、`packages/install-raven/skills/raven-use/SKILL.md`、可能相关的 `raven-setup` / `raven-add` 指引。
- 受影响文档：`modules/core/GUIDE.md`、`modules/core/README.md`、`modules/core/pattern/*` 的入口组织方式。
- 受影响的 Agent 行为：代码生成前需要进行 pattern 分类与结构计划，生成后需要执行 anti-pattern 自检。
