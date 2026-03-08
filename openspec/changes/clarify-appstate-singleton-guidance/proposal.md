## Why

当前 RavenJS pattern 还没有系统定义 `Object Style Service`。这导致 Agent 容易沿用传统“单例 Service class + 注入系统”的思路，先包一层 class，再额外引入 `AppState`。但在 RavenJS 里，独立函数本身就可以按需读取 ScopedState；如果需要把一组函数组织成完整 Service，也更适合直接导出 object module。`Repository` 也应被明确描述为这种 `Object Style Service` 的一种，而不是被当作单独参考对象。

## What Changes

- 系统定义 `Object Style Service`：说明它是 RavenJS 中可复用 service/helper 的默认模块形态，使用 plain object 或 function collection 组织函数。
- 明确说明 RavenJS 的 ScopedState 可以在独立函数中按需读取，因此普通 service 不需要先变成单例 class 再注入系统。
- 说明当一组函数需要作为完整 Service 暴露时，应采用 `Object Style Service` 写法；并明确 `Repository` 是一种专门面向 `Entity <-> DB` 的 `Object Style Service`。
- 更新技能约束，让 Agent 在 RavenJS 写码前显式判断“这是 runtime state，还是 `Object Style Service`”，而不是继续沿用 class + `AppState` 的默认偏好。

## Capabilities

### New Capabilities

- `pattern-object-style-service`: 定义 RavenJS pattern 文档中的 `Object Style Service` 概念、它与 ScopedState 的关系，以及 `Repository` 作为其特化类型的定位。

### Modified Capabilities

- `pattern-guided-skills`: 要求 RavenJS 技能在生成代码前判断依赖是否真的需要 runtime state，并优先采用 `Object Style Service`，而不是默认写成 class + `AppState`。

## Impact

- 受影响文档：`modules/core/pattern/overview.md`、`modules/core/pattern/layer-responsibilities.md`、`modules/core/pattern/runtime-assembly.md`、`modules/core/pattern/conventions.md`、`modules/core/pattern/anti-patterns.md`，以及相关技能说明。
- 受影响规范：新增 `pattern-object-style-service` spec，并修改 `pattern-guided-skills` 的相关 requirement。
- 对 RavenJS 运行时代码、公开 API 和模块接口没有直接影响；主要影响 pattern 文档、Agent 决策和生成代码的一致性。
