## ADDED Requirements

### Requirement: 框架知识以仓库内 skill 承载

RavenJS 的分层方法论、API 教学与 AI-native 定位 SHALL 全部以 skill 形态承载，置于本仓库内。skill SHALL 面向 AI Agent，教其使用已发布的 `@raven.js/core` npm 包 API 与分层写法，而非管理 vendored 源码。

#### Scenario: skill 教学 npm 包 API

- **WHEN** Agent 加载 RavenJS skill 编写应用代码
- **THEN** skill SHALL 指导从 `@raven.js/core` 导入并使用公共 API
- **AND** SHALL NOT 包含拷贝/同步框架源码的指令

#### Scenario: 分层方法论以 skill 表达

- **WHEN** Agent 处理业务代码组织（interface/entity/repository 等）
- **THEN** 对应 skill SHALL 提供分层判断与 pattern 自检指引
- **AND** 该方法论 SHALL NOT 依赖 vendoring 形态的 pattern 文档分发

### Requirement: skill 仅置于仓库、手动拷贝、无安装器

skill 文件 SHALL 仅存放于本仓库；用户接入时 SHALL 由文档引导手动拷贝到自己项目的 skill 目录。RavenJS SHALL NOT 提供任何 skill 安装器（不提供 `install-raven` 或等价 CLI）。

#### Scenario: 文档引导手动拷贝

- **WHEN** 用户希望在自己项目中使用 RavenJS skill
- **THEN** 文档 SHALL 说明从仓库手动拷贝 skill 到目标 skill 目录
- **AND** SHALL NOT 存在自动安装命令

#### Scenario: 无安装器

- **WHEN** 检查 3.x 的分发物
- **THEN** SHALL NOT 包含任何用于安装 skill 的可执行包或脚本
