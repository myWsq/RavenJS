## Context

`modules/core/pattern/conventions.md` 目前把业务代码目录树写成固定的 `src/`，并把运行时装配入口写成 `src/raven/app.ts`。这套表述最初是为了给出一个直观示例，但在当前 RavenJS 语境里已经带来两个问题：

1. 它把“通常使用 `src/`”误读成“只能使用 `src/`”。
2. 它把运行时装配额外包进 `raven/` 目录，和仓库、模块、安装目录中的 `raven` 命名叠加后，形成 `raven/raven` 的双层心智负担。

本次变更只涉及 pattern 文档与对应规范，不调整运行时代码、CLI 安装行为或目录扫描逻辑。目标是让 Agent 在学习文档时先理解“目录职责”，而不是先记忆一个过度具体的路径字符串。

## Goals / Non-Goals

**Goals:**

- 用语义化占位符 `<app_root>` 表达 Raven app 的业务代码根目录，并明确其通常映射到 `src/`
- 将运行时装配入口从 `<app_root>/raven/` 平铺到 `<app_root>/`
- 让 pattern 文档、学习结构规范与示例路径使用一致术语
- 通过 spec delta 固化这一目录表达，避免后续文档回退到 `src/raven`

**Non-Goals:**

- 不修改 RavenJS 运行时的真实目录扫描或加载机制
- 不改变 CLI 的安装根目录、模块下载位置或 `raven/` 相关命令语义
- 不要求所有使用者立刻重命名自己项目中的实际目录
- 不在本次变更中扩展新的 pattern 层级或新的 runtime 能力

## Decisions

### 决策 1：用 `<app_root>` 表达业务代码根目录，而不是固定写死 `src/`

**选择**：在 pattern 文档中统一使用 `<app_root>` 作为占位符，并显式说明它表示“包含 Raven app 全部代码的目录”，通常是 `src/`，但也可以是项目约定的其它目录。

**备选方案**：

- 继续使用 `src/`，只在旁边补一句“也可以不是 src”
- 改成 `<project_root>/src` 一类更长的写法

**否决理由**：

- 保留 `src/` 作为主表达，Agent 仍然会优先把它当成强约束
- `<project_root>/src` 仍然把默认目录写进占位符里，没有真正消除误导

### 决策 2：运行时装配文件直接放在 `<app_root>/` 下

**选择**：将 `app.ts`、`plugins/`、`scopes.ts` 视为和 `interface/`、`entity/`、`infra/` 并列的一层结构，文档统一改为 `<app_root>/app.ts`、`<app_root>/plugins/*`、`<app_root>/scopes.ts`。

**备选方案**：

- 保留 `<app_root>/raven/`，只解释“这是历史命名”
- 仅在示例中平铺，但命名规则和说明文字继续保留 `src/raven/app.ts`

**否决理由**：

- 保留 `raven/` 嵌套会继续强化“Raven app 要放在 raven 目录里”的误解
- 示例与规则不一致会让 Agent 在生成代码时回到旧路径

### 决策 3：把变更限定为 pattern 文档与学习结构规范

**选择**：本次只修改 `modules/core/pattern/*` 和相关 OpenSpec 规范，不触碰 CLI、安装器或仓库真实目录结构。

**备选方案**：

- 顺带修改 CLI 或模板生成器，让脚手架自动产出 `<app_root>/app.ts`
- 同步修改其它与 `raven/` 相关的安装或模块目录约定

**否决理由**：

- 用户请求针对的是 pattern 目录结构表达，不是运行时能力或安装行为
- 将目录示例调整与安装根目录调整绑在一起，会把一个文档约定问题扩大成跨系统重构

### 决策 4：在 `core-learning-structure` 中补充术语一致性约束

**选择**：除新增 `pattern-directory-structure` 能力外，同时更新 `core-learning-structure` 的相关 requirement，要求 GUIDE / README 指向的 pattern 文档使用与当前推荐结构一致的路径术语。

**备选方案**：

- 只新增独立 spec，不修改现有学习结构 spec

**否决理由**：

- `core-learning-structure` 已负责约束 Agent 的学习入口；如果不补这一层，pattern 文档与学习入口之间仍可能出现术语漂移

## Risks / Trade-offs

- **[Risk] `<app_root>` 过于抽象，读者不知道实际该用哪个目录**  
  **Mitigation**：在 requirement 与文档正文里明确写出“通常是 `src/`，但不强制限定”。

- **[Risk] 其他文档或技能继续引用 `src/raven`，导致新旧术语并存**  
  **Mitigation**：实现阶段对仓库做一次路径搜索，至少清理 `modules/core/pattern/*` 中的旧引用，并检查学习入口文档是否需要同步措辞。

- **[Risk] 平铺 runtime assembly 后，读者误以为 `app.ts` 必须位于项目根目录**  
  **Mitigation**：始终把路径写成 `<app_root>/app.ts`，避免只写裸 `app.ts`。

## Migration Plan

1. 为 `pattern-directory-structure` 新增 spec，定义 `<app_root>` 与平铺 runtime assembly 的规范。
2. 更新 `core-learning-structure` delta，使学习结构要求与新的路径术语一致。
3. 在实现阶段修改 `modules/core/pattern/conventions.md`、`modules/core/pattern/runtime-assembly.md` 及必要的关联文档。
4. 通过全文检索确认 pattern 文档中不再残留 `src/raven` 作为推荐路径。

本次变更无部署步骤，也无运行时回滚需求；若需要撤回，只需回退文档与 spec 变更。

## Open Questions

- 暂无阻塞性问题。若后续发现 skill、模板或 README 之外的资产仍大量复用旧路径，再单独提出一致性修正 change。
