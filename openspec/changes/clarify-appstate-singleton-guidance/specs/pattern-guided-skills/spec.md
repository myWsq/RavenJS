## ADDED Requirements

### Requirement: 技能在 Pattern Plan 中必须判断 dependency placement

RavenJS 的写码与学习技能 SHALL 在 Agent 规划可复用依赖时，显式判断该依赖属于 runtime state 还是 `Object Style Service`。技能 MUST NOT 因其需要复用就默认写成 class 或引入 `AppState`。若依赖不需要由 Raven runtime 管理初始化、生命周期或作用域，技能 SHALL 优先保持 plain object / function collection 的直接导出模块。

#### Scenario: Pattern Plan 遇到普通 Object Style Service

- **WHEN** Agent 在 Pattern Plan 中规划一个轻量 service、helper 或其它可复用模块
- **THEN** 技能 SHALL 要求其先判断该依赖是否真的需要 plugin 写入与 state 读取
- **AND** 若答案是否定的，SHALL 指导 Agent 采用 `Object Style Service`，而不是默认写成 class 或创建 `AppState`

#### Scenario: Pattern Plan 识别 Repository 是特化 Object Style Service

- **WHEN** Agent 在 Pattern Plan 中规划一个承担 `Entity <-> DB` 的模块
- **THEN** 技能 SHALL 指导 Agent 将其视为 `Repository`
- **AND** SHALL 明确这是 `Object Style Service` 的特化命名，而不是另一套 class-based service 模式

#### Scenario: Pattern Plan 遇到真正的 runtime dependency

- **WHEN** Agent 在 Pattern Plan 中规划数据库客户端、配置、缓存客户端、当前用户上下文或其它明确依赖 runtime 生命周期的对象
- **THEN** 技能 SHALL 指导 Agent 进入 `modules/core/pattern/runtime-assembly.md` 的学习路径
- **AND** SHALL 根据其生命周期选择 `AppState` 或 `RequestState`
