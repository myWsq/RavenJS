## Why

当前 CLI 的 `raven guide <module>` 命令输出是固定写死的（README + 所有源码），无法由各模块自定义。这导致：(1) 模块无法自行决定 AI Agent 应学习什么；(2) 内容结构统一，无法适应不同模块的差异化需求。将指南内容交由各模块通过 GUIDE.md 自行维护，可让每个模块自主说明 AI Agent 应如何学习该模块，CLI 只负责读取并输出即可。

## What Changes

- **修改**：`raven guide <module>` 命令改为读取并输出该模块的 `GUIDE.md` 文件内容，不再输出 README + 源码
- **新增**：每个 registry 模块必须提供 `GUIDE.md` 文件，用于说明 AI Agent 如何学习该模块
- **新增**： registry.json 生成（`packages/cli/scripts/build.ts`）时，若任一模块缺少 `GUIDE.md` 则直接报错退出
- **BREAKING**：依赖 `raven guide` 输出 README+源码 形态的 Agent 或技能需适配新输出格式；现有模块需补全 GUIDE.md

## Capabilities

### New Capabilities

- `module-guide-requirement`: 定义 registry 模块必须包含 GUIDE.md 的约束，以及 registry 生成时的校验逻辑

### Modified Capabilities

- `cli-tool`: `raven guide` 输出改为模块 GUIDE.md 内容；registry 生成脚本需在缺少 GUIDE.md 时报错

## Impact

- `packages/cli/index.ts`: `cmdGuide` 改为读取并输出 GUIDE.md
- `packages/cli/scripts/build.ts`: `scanModules`/`generateRegistry` 增加 GUIDE.md 存在性校验
- `modules/*/`: 每个模块需提供 GUIDE.md（如 modules/core 已有空文件，需补全内容）
- `packages/ai/raven-learn/skill.md` 等：引用 guide 输出的技能需确认与新格式兼容
- `tests/e2e/cli.test.ts`: Guide 命令相关测试需更新
