## Context

RavenJS 现有 pattern 已经说明 `AppState` 只应用于 runtime dependency，也把“默认把 `Repository` 注册成 `AppState`”列为反模式，但它还没有系统定义一种面向可复用 service/helper 的模块形态。

结果是 Agent 很容易沿用传统框架中的 Service 心智：先写单例 class，再把依赖注入进去，最后为了全局复用继续引入 `AppState`。这套思路和 RavenJS 的实际机制并不匹配，因为 ScopedState 已经提供了按需读取依赖的能力，函数本身就能在调用点访问 `AppState` / `RequestState`。

本次变更只涉及 pattern 与技能规范，不触碰 Raven runtime、状态 API 或已有插件机制。目标是把 `Object Style Service` 定义成 RavenJS 的默认 service 形态，并明确 `Repository` 是它的一种特化类型。

## Goals / Non-Goals

**Goals:**

- 系统定义 `Object Style Service`，给 Agent 一个可以直接套用的 service 组织方式
- 明确 `AppState` / `RequestState` 的判断标准，避免把“共享”“可复用”误当成进入 state 的理由
- 明确 `Repository` 是 `Object Style Service` 的一个特化类型，而不是独立参考物
- 让 RavenJS 技能在 Pattern Plan 阶段显式完成一次 dependency placement 判断
- 让 pattern 文档同时提供正例与反例，方便 Agent 直接套用

**Non-Goals:**

- 不修改 `defineAppState`、`defineRequestState`、plugin `load()` 或其它运行时 API
- 不修改 `Entity`、`DTO` 等本来就有 class 形态的现有 pattern
- 不把 `Object Style Service` 扩张成新的强制目录层；本次聚焦于模块形态与依赖读取方式
- 不在本次变更中扩展新的业务分层概念

## Decisions

### 决策 1：先定义 `Object Style Service`，再用它与 runtime state 做边界区分

**选择**：文档与技能统一使用三个判断问题：

1. 这个依赖是否需要由 plugin `load()` 初始化并写入？
2. 它是否需要依赖 Raven scope 或 request / app lifetime？
3. 它是否必须通过 `State` 才能在 hook、handler 或其它 runtime 边界中被一致读取？

只有这些问题成立时，才推荐 `AppState` / `RequestState`。若只是普通 helper、轻量 service 或其它无特殊 runtime 生命周期的复用逻辑，则默认写成 `Object Style Service`：plain object / function collection，直接模块导出。

**备选方案**：

- 继续沿用“长生命周期依赖可以用 `AppState`”的宽泛描述
- 只新增一个反模式，不给出正向 `Object Style Service` 建议

**否决理由**：

- “长生命周期”过于宽泛，仍然会让 Agent 把任何共享 helper 判成 `AppState`
- 只有反模式没有正向标准，无法指导 Agent 在写码前稳定生成 service 代码

### 决策 2：把 `Repository` 重写为 `Object Style Service` 的一个特化类型

**选择**：在 pattern 文档中明确指出，`Repository` 不是一个拿来“参考”的孤立模式，而是 `Object Style Service` 在 entity persistence 场景下的专名。普通 helper/service 与 `Repository` 共享相同的 object-module 形态，只是职责不同。

**备选方案**：

- 保持现状，只在 `Repository` 一节顺带补一句“其它 helper 也差不多”
- 为 service 单独引入强制性的目录层

**否决理由**：

- 只在 `Repository` 一节旁敲侧击，概念仍然不够稳定
- 新增强制目录层会把一个模块形态问题扩大成新的架构约束

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

- **[Risk] `Object Style Service` 被误解成新的全局 `service/` 层。**  
  **Mitigation**：在 conventions 中明确它是模块形态，不是强制目录；文件应放在所服务的 domain/infra 附近。

- **[Risk] 技能增加一步判断后，文档显得更重。**  
  **Mitigation**：把判断压缩成 2-3 个短问题，放入 Pattern Plan 与 anti-pattern 对照中，保持可执行而不是展开成长篇理论。

## Migration Plan

1. 为 `pattern-object-style-service` 新增 spec，固化 `Object Style Service`、ScopedState 与 runtime state 的边界。
2. 为 `pattern-guided-skills` 增加 delta，要求技能在 Pattern Plan 中完成 dependency placement 判断，并优先采用 `Object Style Service`。
3. 实现阶段更新 `modules/core/pattern/overview.md`、`layer-responsibilities.md`、`runtime-assembly.md`、`conventions.md`、`anti-patterns.md`，补充概念定义、正反例与命名规则。
4. 实现阶段同步检查 `packages/install-raven/skills/raven-use/SKILL.md`、`raven-learn/SKILL.md` 等技能入口，确保不会默认生成 class + `AppState` 组合。

本次变更无运行时迁移、部署步骤或数据回滚需求；若需要撤回，只需回退对应文档与技能规范。

## Open Questions

- 暂无阻塞性问题。若实现阶段发现现有 skill 文案已经隐含了错误偏好，再决定是否补充更多 capability，而不是在本次 proposal 中提前扩大范围。
