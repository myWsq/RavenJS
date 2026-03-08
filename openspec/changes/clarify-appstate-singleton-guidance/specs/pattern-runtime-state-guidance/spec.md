## ADDED Requirements

### Requirement: Pattern 文档必须以 runtime ownership 判断是否使用 State

RavenJS 的 pattern 文档 SHALL 使用“是否需要由 Raven runtime 管理初始化、生命周期或作用域”来判断一个依赖是否进入 `AppState` / `RequestState`。对于不需要 runtime state 的可复用 helper / service，文档 SHALL 默认指导 Agent 采用 `Repository` 风格的 object module，而 MUST NOT 先写成 class 或共享实例再默认将其提升为 state。

#### Scenario: 普通单例模块不因单例身份进入 AppState

- **WHEN** Agent 或开发者设计一个轻量 service、helper、repository 风格模块或其它可直接模块导出的依赖
- **THEN** pattern 文档 SHALL 指导其优先保持为 plain object / function collection 的直接导出模块
- **AND** SHALL 不要求仅因“全局只需要一个实例”就引入 `defineAppState()`、plugin `load()` 或额外 state 声明

#### Scenario: 真正由 Raven runtime 托管的依赖进入 State

- **WHEN** 一个依赖需要由 plugin 初始化写入、依赖 scope 隔离，或代表 request / app 生命周期中的 runtime context
- **THEN** pattern 文档 SHALL 指导 Agent 使用 `AppState` 或 `RequestState`
- **AND** SHALL 明确区分 app-level shared dependency 与 request-level derived context

### Requirement: Pattern 文档必须提供“参考 Repository object，而不是 class + AppState”的指导

RavenJS 的 pattern 文档 SHALL 将 `Repository` 作为可复用 helper / service 的参考模式之一，说明某个模块即使会复用、即使内部读取真正的 infra state，也应优先写成 object module，而不是因为需要共享就写成 class + `AppState`。文档同时 SHALL 将“先写单例 class，再把它提升为 `AppState`”列为显式反模式。

#### Scenario: Agent 比较 Repository 与普通 service 的放置方式

- **WHEN** Agent 设计一个会复用的 service 或 helper，并参考 `Repository` 的组织方式
- **THEN** pattern 文档 SHALL 说明其可以像 `Repository` 一样采用 object-export 结构
- **AND** SHALL 明确“参考的是模块形态与依赖放置方式”，而不是要求它必须属于 entity 目录

#### Scenario: 自检识别把普通单例升格为 AppState 的坏味道

- **WHEN** Agent 审查一个仅包裹普通方法调用或薄薄技术适配的 helper/service，并发现它被写成 singleton class 并注册成 `AppState`
- **THEN** pattern 文档 SHALL 将该设计识别为反模式
- **AND** SHALL 推荐改回 `Repository` 风格 object module，而不是继续增加 class 与 state ceremony
