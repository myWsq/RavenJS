## Why

当前 `modules/core` 以少量大文件承载过多职责，尤其 `index.ts` 同时混合了错误系统、状态系统、插件加载、路由注册、请求分发与生命周期处理。对于 RavenJS 这种以 Agent 学习为核心定位的项目，这种组织方式会放大 AI 的阅读成本，降低“应该先看哪里、修改哪里、某段逻辑属于哪一层”的可判断性。

现在需要把 `core` 从“便于人工一次性通读的大文件”重构为“按概念边界和运行时阶段组织的教学型结构”。这样 AI 在阅读、检索、局部修改和跨文件追踪时都能更快建立正确心智模型，也更符合 RavenJS 作为 Agent teacher 的定位。

## What Changes

- **BREAKING** 重构 `modules/core` 的源码组织，不再以当前的大型入口文件作为主要实现载体，而改为按核心概念和生命周期阶段拆分目录与文件
- **BREAKING** 允许重新定义现有文件边界，包括拆分 `index.ts`、合并/移动现有 `router.ts`、`schema.ts`、`standard-schema.ts` 等文件，兼容性不作为约束
- 为 `core` 建立明确的 AI 学习路径：入口层、公共 API 层、内部运行时层、独立概念模块层之间的职责边界清晰可追踪
- 将“公共导出面”和“内部实现细节”分离，减少 AI 在编辑内部实现时误触公共入口的概率
- 调整 `modules/core/README.md`、`modules/core/GUIDE.md` 以及相关测试组织，使文档与测试结构映射新的源码布局

## Capabilities

### New Capabilities

- `core-learning-structure`: 定义 `modules/core` 面向 AI 学习与理解的源码组织约束，包括概念分层、学习路径和导出边界

### Modified Capabilities

- `core-framework`: 强化 core 作为 Agent 教学参考实现的要求，使核心实现需要以更可学习、可定位、可局部修改的结构呈现

## Impact

- 受影响代码：`modules/core/**`
- 受影响文档：`modules/core/README.md`、`modules/core/GUIDE.md`、可能还有 `modules/core/PLUGIN.md`
- 受影响测试：`tests/unit/core/**`，需要按新的模块边界调整或补充
- API 与导出：可能调整公共导出入口、类型定义位置和内部符号布局；本次变更明确不考虑兼容性
