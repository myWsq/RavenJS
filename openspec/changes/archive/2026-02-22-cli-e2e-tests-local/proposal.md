## Why

当前 CLI 缺少覆盖关键流程的端到端测试，且正式环境会从 GitHub 拉取代码，导致本地 e2e 难以稳定复现。需要补齐可本地运行的 e2e 用例，并兼容生产拉取逻辑，保证发布前可验证真实行为。

## What Changes

- 新增覆盖初始化、拉取、构建、运行等关键路径的 CLI e2e 测试用例
- 为 CLI 引入可在测试中替换 GitHub 拉取逻辑的本地模式
- 提供统一的测试夹具与环境隔离，保证本地与 CI 可重复运行

## Capabilities

### New Capabilities

- `cli-e2e-testing`: CLI 端到端测试能力与本地兼容拉取逻辑

### Modified Capabilities

- 无

## Impact

- CLI 测试基础设施与脚手架流程
- CI 中的 e2e 测试执行与稳定性
