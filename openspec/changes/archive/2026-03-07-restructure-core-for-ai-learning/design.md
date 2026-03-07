## Context

当前 `modules/core` 的主要问题不是功能缺失，而是教学结构失真。`index.ts` 目前承担了过多角色：既是公共入口，又是错误系统、状态系统、插件系统、请求生命周期和路由注册的主要实现文件；同时 `router.ts`、`schema.ts`、`standard-schema.ts` 又以另一种粒度存在，形成“大入口 + 少量旁路文件”的混合结构。

这种结构对人工维护尚可，但对 AI 不友好。Agent 在读取 `core` 时通常会先寻找：

1. 入口文件在哪里
2. 请求生命周期在哪里
3. 状态/插件/路由分别属于哪一层
4. 公共 API 和内部辅助逻辑的边界在哪里

当前组织会迫使 Agent 先整体扫描大文件，再手动恢复概念边界。考虑到 RavenJS 已明确定位为 Agent 教学工具，本次设计优先优化“可学习性、可定位性、可局部修改性”，而不是延续当前文件历史。

约束：

- 不要求向后兼容
- 不以“尽量少改文件”为目标
- 不能把 `core` 拆成大量难以导航的微型文件，仍需保持适中的阅读颗粒度

## Goals / Non-Goals

**Goals:**

- 让 `modules/core` 的目录结构直接映射 Agent 的心智模型，而不是映射历史演化过程
- 让 `index.ts` 成为清晰的公共导出入口，而不是主要实现载体
- 将请求生命周期拆解为可单独阅读和修改的阶段性模块
- 将状态、路由、Schema、错误、插件等核心概念按职责边界分离
- 让 `README.md`、`GUIDE.md`、测试结构与新的源码分层保持一致，形成稳定学习路径
- 允许为提高清晰度而重命名、合并或拆分现有文件

**Non-Goals:**

- 不引入新的框架功能或 API 能力
- 不承诺维持当前导出路径、类型位置或内部符号命名
- 不重构 `modules/core` 之外与本次结构无直接关系的模块
- 不把每一个函数拆成单独文件；目标是概念清晰，不是文件数量最大化

## Decisions

### 决策 1：按“概念边界 + 生命周期阶段”组织目录，而不是按历史文件延续

**选择**：将 `modules/core` 重组为少量高语义目录，典型目标结构如下：

```text
modules/core/
  index.ts
  README.md
  GUIDE.md
  PLUGIN.md
  app/
    raven.ts
    types.ts
  runtime/
    dispatch-request.ts
    process-states.ts
    handle-response.ts
    handle-error.ts
    load-plugins.ts
  state/
    storage.ts
    descriptors.ts
    builtins.ts
  schema/
    with-schema.ts
    validation.ts
    schema-class.ts
    standard-schema.ts
  routing/
    radix-router.ts
  context/
    context.ts
  error/
    raven-error.ts
```

允许在实现时根据代码体量做小幅调整，但必须保持“一个目录对应一个核心概念”的原则。

**备选**：

- 保持 `index.ts` 大文件，仅继续使用 section comments
- 只把 `index.ts` 拆成 `main.ts + utils/*`

**否决理由**：这两种方案都仍然要求 Agent 先从文件内部恢复概念结构，而不是从目录结构直接获得结构信息。

---

### 决策 2：`index.ts` 只做公共导出清单，不承载核心实现

**选择**：`modules/core/index.ts` 仅保留分组清晰的 re-export，成为“公共 API 地图”。核心实现移动到概念目录中，`index.ts` 不再包含请求处理、状态实现、错误类实现等主体逻辑。

**备选**：保留部分实现于 `index.ts`，把其余逻辑拆到子文件。

**否决理由**：只要 `index.ts` 仍承载真实逻辑，Agent 就无法把它视为纯入口地图，检索和编辑路径仍会混淆。

---

### 决策 3：将请求处理流水线拆为显式阶段文件

**选择**：把 `Raven` 类中的私有请求处理流程按阶段拆出到 `runtime/`，至少形成以下可独立追踪的模块：

- 请求分发与路由匹配
- `processStates` 请求数据解析与校验
- `beforeResponse` 响应处理
- `onError` 错误转换
- 插件加载与 `ready()` 初始化阶段

`raven.ts` 保持为组合根，负责暴露 API、组装这些阶段，并让读者一眼看到高层调用关系。

**备选**：继续把这些逻辑作为 `Raven` 类的私有方法保留在同一文件。

**否决理由**：对 AI 而言，“请求从哪里进入，依次经过哪些阶段”是最重要的问题之一；阶段不显式拆分，就很难被稳定检索和局部修改。

---

### 决策 4：状态系统按“存储机制 / 描述符 / 内置状态”三层拆分

**选择**：

- `state/storage.ts`：`AsyncLocalStorage`、`GLOBAL_SCOPE`、scope map 工具
- `state/descriptors.ts`：`ScopedState`、`AppState`、`RequestState`、工厂函数与 `StateView`
- `state/builtins.ts`：`RavenContext`、`BodyState`、`QueryState`、`ParamsState`、`HeadersState`

这样 Agent 在研究状态系统时可以先理解存储机制，再理解描述符模型，最后理解框架自带状态。

**备选**：

- 每个类单独一个文件
- 继续把状态系统留在 `index.ts`

**否决理由**：前者文件过碎，后者职责过重，都不利于教学型阅读。

---

### 决策 5：Schema 与路由保持独立概念模块，但补齐更明确的文件命名

**选择**：保留 Schema 和路由作为独立学习单元，并将文件命名调整为更直接的教学表达，例如 `routing/radix-router.ts`、`schema/validation.ts`、`schema/with-schema.ts`、`schema/schema-class.ts`。`standard-schema.ts` 继续存在，但归入 `schema/`，使其从属关系更明确。

**备选**：

- 继续保留当前顶层 `router.ts` / `schema.ts`
- 将路由与 Schema 混入 `raven.ts`

**否决理由**：顶层散落文件缺少层次关系；混入主类会再次加重入口文件负担。

---

### 决策 6：文档和测试必须映射新的源码结构，形成稳定学习路径

**选择**：

- `GUIDE.md` 只描述推荐阅读顺序与“遇到某类问题去看哪里”
- `README.md` 解释核心概念与架构故事，不再隐含单文件阅读前提
- `tests/unit/core` 按新的概念边界重组，至少在命名或目录层级上与源码结构一致

测试在这里不仅用于验证行为，也作为 Agent 的“可执行示例索引”。

**备选**：仅调整源码，不同步调整文档和测试。

**否决理由**：如果文档与测试仍指向旧结构，新的文件组织价值会被大幅削弱。

---

### 决策 7：兼容性不是约束，优先保证结构语义正确

**选择**：允许移除旧文件、重命名类型定义位置、调整导出分组，必要时直接删除仅为兼容旧结构而存在的过渡层。

**备选**：增加兼容 re-export、保留旧文件作为代理层。

**否决理由**：代理层会把旧结构继续暴露给 Agent，使“正确学习路径”和“历史兼容路径”并存，反而增加理解成本。

## Risks / Trade-offs

- **[Risk] 文件拆分过度，导致 Agent 需要频繁跨文件跳转**  
  **Mitigation**：以“一个文件回答一个完整问题”为原则控制颗粒度，避免无意义微拆分。

- **[Risk] 结构重排会带来较大 rename/move 变更，测试和文档容易短暂失真**  
  **Mitigation**：按目录分批迁移，每完成一个概念层就同步修正文档与对应测试。

- **[Risk] `raven.ts` 仍可能重新膨胀为新的大文件**  
  **Mitigation**：将请求流水线、插件加载、错误处理明确外提，要求 `raven.ts` 只保留组合与高层 API。

- **[Risk] 不考虑兼容性会破坏当前 import 习惯**  
  **Mitigation**：这是本次 change 的显式选择；通过 README/GUIDE 和导出地图提供新的标准入口。

## Migration Plan

1. 先定义新的目录骨架与导出边界，确定哪些概念模块是一级学习入口。
2. 将 `index.ts` 降级为纯导出文件，同时创建新的 `app/`、`runtime/`、`state/`、`schema/`、`routing/` 等目录。
3. 从 `Raven` 主流程开始拆分，把请求生命周期相关私有方法移动到 `runtime/`。
4. 拆分状态系统，再迁移错误、上下文、Schema、路由等独立概念。
5. 同步更新 `README.md`、`GUIDE.md`、`PLUGIN.md` 与测试结构。
6. 删除已失去价值的旧文件和仅用于过渡的中间层。

本次改动主要是源码重组，不涉及线上部署或回滚策略；若实现中需要回退，以 git 级别回退整个 change 为准。

## Open Questions

- `tests/unit/core` 最终采用目录重组还是保留平铺文件并统一重命名，可以在实现阶段根据测试体量决定；两者都必须与新的源码概念边界保持一致。
