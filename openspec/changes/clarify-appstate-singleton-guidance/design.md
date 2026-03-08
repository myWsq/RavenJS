## Context

RavenJS 现有 pattern 已经覆盖了两条相关信号：

1. `modules/core/pattern/runtime-assembly.md` 说明 `AppState` 只应用于长生命周期的 runtime dependency。
2. `modules/core/pattern/anti-patterns.md` 已把“默认把 `Repository` 注册成 `AppState`”列为反模式。

但这两条信号还不足以阻止 Agent 做更宽泛的错误泛化：只要看到“想复用”“只要一个实例”，就先包一层 class，再引入 `defineAppState()`、plugin `load()` 和 state 读取。这会把本来可以像 `Repository` 一样直接导出的 object module，误塑造成 Raven runtime dependency，也会让简单 helper 背上不必要的 class / plugin / state ceremony。

本次变更只涉及 pattern 与技能规范，不触碰 Raven runtime、状态 API 或已有插件机制。目标是让 Agent 先判断“这个依赖是否需要 Raven runtime 管理”，再决定是否引入 state。

## Goals / Non-Goals

**Goals:**

- 明确 `AppState` / `RequestState` 的判断标准，避免把“共享”“可复用”误当成进入 state 的理由
- 把 `Repository` 风格的 object module 提升为普通 helper / service 的默认参考模式
- 让 RavenJS 技能在 Pattern Plan 阶段显式完成一次 dependency placement 判断
- 让 pattern 文档同时提供正例与反例，方便 Agent 直接套用

**Non-Goals:**

- 不修改 `defineAppState`、`defineRequestState`、plugin `load()` 或其它运行时 API
- 不修改 `Entity`、`DTO` 等本来就有 class 形态的现有 pattern
- 不强制所有模块都长得像 `Repository`；本次聚焦于可复用 helper / service 的默认写法
- 不在本次变更中扩展新的业务分层概念

## Decisions

### 决策 1：先判断是否需要 runtime state，再决定是否采用 object module

**选择**：文档与技能统一使用三个判断问题：

1. 这个依赖是否需要由 plugin `load()` 初始化并写入？
2. 它是否需要依赖 Raven scope 或 request / app lifetime？
3. 它是否必须通过 `State` 才能在 hook、handler 或其它 runtime 边界中被一致读取？

只有这些问题成立时，才推荐 `AppState` / `RequestState`。若只是普通 helper、轻量 service 或其它无特殊 runtime 生命周期的复用逻辑，则默认按 `Repository` 一样写成 object module 并直接导出。

**备选方案**：

- 继续沿用“长生命周期依赖可以用 `AppState`”的宽泛描述
- 只新增一个反模式，不给出正向 object-module 建议

**否决理由**：

- “长生命周期”过于宽泛，仍然会让 Agent 把任何共享 helper 判成 `AppState`
- 只有反模式没有正向标准，无法指导 Agent 在写码前做稳定决策

### 决策 2：把 `Repository` 作为 helper / service 的默认写法参考

**选择**：在 pattern 文档中明确指出，可复用 helper / service 若不需要 runtime state，可以参考 `Repository` 的组织方式：用 plain object 或 function collection 组织成员，直接模块导出，按需读取真正的 infra state，而不是先写成 class 再注册成 `AppState`。

**备选方案**：

- 为 service 单独引入一套命名与目录规范
- 只说“不进 `AppState`”，但不管它最后写成什么形态

**否决理由**：

- 新增 service 专属模式会把一个边界判断问题扩大成新的分层设计
- 只限制 state、不提供推荐写法，Agent 仍然可能继续生成多余的 singleton class

### 决策 3：同时修改 runtime pattern 与技能规范

**选择**：新增一个独立的 pattern capability 固化 state 边界，同时在 `pattern-guided-skills` 中新增 requirement，要求技能在 Pattern Plan 阶段显式判断 dependency placement。

**备选方案**：

- 只改 pattern 文档，不改技能
- 只改技能提示，不立 spec

**否决理由**：

- 只改文档，Agent 仍可能跳过该段内容而沿用旧偏好
- 只改技能，不立 spec，后续文档容易回退或表达漂移

## Risks / Trade-offs

- **[Risk] 文档把“不要默认用 `AppState`”表述得过强，导致 Agent 连数据库客户端这类真正的 runtime dependency 也不敢放进 state。**  
  **Mitigation**：同时给出必须使用 state 的正例，明确 plugin 初始化、scope、request context 仍然属于 state 适用场景。

- **[Risk] `Repository` 作为参考模式后，Agent 误解为所有 helper 都必须和 repository 一样放在 entity 附近。**  
  **Mitigation**：强调“参考的是 object-export 方式与依赖放置判断，不是目录位置”；目录仍按各自职责决定。

- **[Risk] 技能增加一步判断后，文档显得更重。**  
  **Mitigation**：把判断压缩成 2-3 个短问题，放入 Pattern Plan 与 anti-pattern 对照中，保持可执行而不是展开成长篇理论。

## Migration Plan

1. 为 `pattern-runtime-state-guidance` 新增 spec，固化 object module 与 runtime state 的边界。
2. 为 `pattern-guided-skills` 增加 delta，要求技能在 Pattern Plan 中完成 dependency placement 判断，并优先采用 object module。
3. 实现阶段更新 `modules/core/pattern/runtime-assembly.md` 与 `modules/core/pattern/anti-patterns.md`，补充正反例与可执行判定语句。
4. 实现阶段同步检查 `packages/install-raven/skills/raven-use/SKILL.md`、`raven-learn/SKILL.md` 等技能入口，确保不会默认生成 class + `AppState` 组合。

本次变更无运行时迁移、部署步骤或数据回滚需求；若需要撤回，只需回退对应文档与技能规范。

## Open Questions

- 暂无阻塞性问题。若实现阶段发现现有 skill 文案已经隐含了错误偏好，再决定是否补充更多 capability，而不是在本次 proposal 中提前扩大范围。
