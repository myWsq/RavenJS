## Why

当前 RavenJS pattern 已经说明 `Repository` 不应该默认注册成 `AppState`，但对“可复用 helper / service 应该按 `Repository` 风格写成 object，而不是写成单例 class 再挂到 `AppState`”还不够明确，导致 Agent 容易先包一层 class，再额外引入 state。这样会增加不必要的 plugin 与 state ceremony，也会偏离 RavenJS 更直接的 object-module 风格。

## What Changes

- 补充 RavenJS pattern 对可复用 helper / service 的写法说明：默认参考 `Repository` 写成 object module，而不是先写成单例 class。
- 增加一套可执行的判定标准，明确只有在依赖需要由 Raven runtime 管理生命周期、作用域或 plugin 初始化写入时，才应进入 `AppState` / `RequestState`。
- 在 pattern 文档中加入正反例，说明何时应参考 `Repository` 的 object-export 方式，何时才应使用 plugin-local state。
- 更新技能约束，让 Agent 在 RavenJS 写码前显式判断“这是 runtime state，还是 `Repository` 风格 object module”，而不是把 helper 默认实现成 class + `AppState`。

## Capabilities

### New Capabilities

- `pattern-runtime-state-guidance`: 定义 RavenJS pattern 文档中 `AppState`、`RequestState` 与 `Repository` 风格 object module 之间的边界，避免把 helper / service 默认写成 class + state。

### Modified Capabilities

- `pattern-guided-skills`: 要求 RavenJS 技能在生成代码前判断依赖是否真的需要 runtime state，并优先采用 `Repository` 风格 object module，而不是默认写成 class + `AppState`。

## Impact

- 受影响文档：`modules/core/pattern/runtime-assembly.md`、`modules/core/pattern/anti-patterns.md`，以及任何需要引用该边界判断的技能说明。
- 受影响规范：新增 `pattern-runtime-state-guidance` spec，并修改 `pattern-guided-skills` 的相关 requirement。
- 对 RavenJS 运行时代码、公开 API 和模块接口没有直接影响；主要影响 pattern 文档、Agent 决策和生成代码的一致性。
