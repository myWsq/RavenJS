## ADDED Requirements

### Requirement: Pattern 文档必须定义 Object Style Service

RavenJS 的 pattern 文档 SHALL 将 `Object Style Service` 定义为可复用 helper / service 的默认模块形态：使用 plain object 或 function collection 组织一组相关函数，并允许这些函数在需要时直接读取 ScopedState。文档 MUST NOT 把“单例 service class + 注入系统”描述为 RavenJS 的默认 service 组织方式。

#### Scenario: 独立函数按需读取 ScopedState

- **WHEN** Agent 或开发者设计一个可复用 helper / service
- **THEN** pattern 文档 SHALL 说明其中的独立函数可以直接读取 ScopedState
- **AND** SHALL 不要求先把这些函数包装成 class 再通过注入系统调用

#### Scenario: 一组函数组合成完整 Service

- **WHEN** 多个相关函数需要作为一个完整能力面对外暴露
- **THEN** pattern 文档 SHALL 指导 Agent 将它们组织成一个 `Object Style Service`
- **AND** SHALL 使用 object export 作为默认写法

### Requirement: Pattern 文档必须将 Repository 说明为一种 Object Style Service

RavenJS 的 pattern 文档 SHALL 将 `Repository` 说明为 `Object Style Service` 在 `Entity <-> DB` 场景下的特化类型。文档 SHALL 明确 `Repository` 与普通 `Object Style Service` 共享相同的 object-module 组织方式，只是责任边界更窄。

#### Scenario: Agent 区分 Repository 与普通 Object Style Service

- **WHEN** Agent 设计一个可复用 service，并判断它是否属于 `Entity <-> DB`
- **THEN** pattern 文档 SHALL 指导其在属于该边界时命名为 `Repository`
- **AND** 在不属于该边界时保持为普通 `Object Style Service`

#### Scenario: Repository 保持 Object Style Service 形态

- **WHEN** pattern 文档展示一个 `Repository`
- **THEN** 它 SHALL 使用 plain object 或 function collection 组织函数
- **AND** SHALL 不把 `Repository` 描述成需要 class 注入的特殊模式

### Requirement: Pattern 文档必须区分 Object Style Service 与 runtime state

RavenJS 的 pattern 文档 SHALL 使用“是否需要由 Raven runtime 管理初始化、生命周期或作用域”来判断一个依赖是否进入 `AppState` / `RequestState`。对于不需要 runtime state 的可复用能力，文档 SHALL 默认指导 Agent 使用 `Object Style Service`，而不是把普通 service 提升为 state。

#### Scenario: 普通 Object Style Service 不进入 AppState

- **WHEN** Agent 或开发者设计一个不需要 runtime-managed lifecycle 的可复用 service/helper
- **THEN** pattern 文档 SHALL 指导其保持为 `Object Style Service`
- **AND** SHALL 不要求仅因“全局只需要一个实例”就引入 `defineAppState()`、plugin `load()` 或额外 state 声明

#### Scenario: 真正由 Raven runtime 托管的依赖进入 State

- **WHEN** 一个依赖需要由 plugin 初始化写入、依赖 scope 隔离，或代表 request / app 生命周期中的 runtime context
- **THEN** pattern 文档 SHALL 指导 Agent 使用 `AppState` 或 `RequestState`
- **AND** SHALL 明确区分 `Object Style Service` 与 runtime state 的职责
