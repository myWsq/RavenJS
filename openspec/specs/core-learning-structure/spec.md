# core-learning-structure Specification

## Purpose

定义 RavenJS `modules/core` 面向 Agent 学习与理解的源码组织约束，包括概念分层、公共导出边界、请求生命周期模块化表达，以及文档与测试的学习路径一致性。

## Requirements

### Requirement: Core 源码必须按主要概念边界组织

`modules/core` SHALL 以高语义概念为单位组织源码，使 Agent 可以直接从目录与文件命名识别主要学习入口。源码结构 MUST 明确区分应用组合根、请求运行时、状态系统、Schema、路由以及错误/上下文等核心概念，或使用同等清晰的命名表达这些边界。

互不直接同属一个概念层的实现 MUST NOT 长期混杂在同一个主要实现文件中。

#### Scenario: Agent 定位状态系统

- **WHEN** Agent 需要理解 `AppState`、`RequestState` 或 `StateSetter`
- **THEN** Agent SHALL 能从 `modules/core` 的目录或文件命名中直接找到专属状态模块
- **AND** 无需先通读路由或 Schema 的主要实现

#### Scenario: Agent 定位路由系统

- **WHEN** Agent 需要修改路由匹配或路径参数提取逻辑
- **THEN** Agent SHALL 能从 `modules/core` 的目录或文件命名中直接找到专属路由模块

### Requirement: 公共入口必须是清晰的导出地图

`modules/core/index.ts` SHALL 作为公共导出入口存在，并 MUST 主要承担导出地图职责。核心运行时逻辑、状态存储实现、错误处理主体逻辑和请求生命周期主体逻辑 MUST 位于其它专属模块中，而不是继续驻留在 `index.ts`。

#### Scenario: Agent 通过 index.ts 识别公共 API

- **WHEN** Agent 打开 `modules/core/index.ts`
- **THEN** Agent SHALL 能快速识别 core 的公共导出分组
- **AND** 无需在该文件中解析请求分发或状态存储等主体实现

### Requirement: 请求生命周期必须映射为显式运行时模块

core 的请求处理流水线 SHALL 通过显式命名的运行时模块表达至少以下阶段：请求分发/路由匹配、请求数据处理与 Schema 校验、响应后处理、错误响应转换，以及 `ready()` 相关的初始化/插件加载阶段。

这些阶段 MAY 由多个文件组合实现，但 MUST 以文件边界表达，而不是只作为单一大文件中的隐式私有段落存在。

#### Scenario: Agent 修改请求校验阶段

- **WHEN** Agent 需要修改请求体解析、header/query/params 组装或 Schema 校验逻辑
- **THEN** Agent SHALL 能找到专门负责该阶段的运行时或 Schema 模块进行修改

#### Scenario: Agent 修改错误响应阶段

- **WHEN** Agent 需要调整未捕获错误如何转换为最终 `Response`
- **THEN** Agent SHALL 能找到专门负责错误处理的模块进行修改

### Requirement: 文档与测试必须映射新的学习结构

`modules/core/GUIDE.md`、`modules/core/README.md` 和 `tests/unit/core` SHALL 与新的源码结构保持一致，向 Agent 提供与源码边界对应的学习路径和可执行示例。对于业务代码与运行时装配任务，GUIDE / README MUST 进一步区分“理解 API / 源码实现”与“理解 pattern / 分层规则”两类入口，并显式链接到 `modules/core/pattern/*` 中对应的文档。

#### Scenario: GUIDE 指向真实阅读路径

- **WHEN** Agent 阅读 `modules/core/GUIDE.md`
- **THEN** 文档 SHALL 使用当前真实存在的目录或文件作为阅读入口
- **AND** 说明“理解某类问题时应该看哪里”

#### Scenario: GUIDE 为业务代码任务分流到 pattern 文档

- **WHEN** Agent 需要设计 `interface`、`entity`、`repository`、`command`、`query`、`projection` 或 `dto` 等业务代码结构
- **THEN** `modules/core/GUIDE.md` 或 `modules/core/README.md` SHALL 显式指向 `modules/core/pattern/overview.md`
- **AND** SHALL 继续把 Agent 分流到 `layer-responsibilities.md`、`conventions.md` 或 `anti-patterns.md` 等对应文档

#### Scenario: GUIDE 为 runtime assembly 任务分流到 Raven 专属规则

- **WHEN** Agent 需要处理 plugin、state、hook 或 `app.ts` 组合根问题
- **THEN** `modules/core/GUIDE.md` 或 `modules/core/README.md` SHALL 显式指向 `modules/core/pattern/runtime-assembly.md`
- **AND** SHALL 区分该入口与单纯源码浏览入口

#### Scenario: 测试结构映射概念边界

- **WHEN** Agent 浏览 `tests/unit/core`
- **THEN** 测试文件或目录 SHALL 以新的核心概念边界命名或分组
- **AND** Agent SHALL 能从测试名称推断对应源码模块
