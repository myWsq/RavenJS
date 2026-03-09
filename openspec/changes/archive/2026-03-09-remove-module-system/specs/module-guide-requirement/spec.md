## ADDED Requirements

### Requirement: Raven 核心教学资产必须提供 GUIDE.md

RavenJS 唯一受管理的核心教学资产 SHALL 在其源码目录下提供 `GUIDE.md` 文件，用于说明 AI Agent 应如何学习 core API、源码结构、pattern 文档与官方示例入口。示例插件目录 MAY 提供独立文档，但 SHALL NOT 成为 CLI 构建通过的前置条件。

#### Scenario: core 缺少 GUIDE.md 时构建报错

- **WHEN** CLI 构建脚本扫描 Raven core 源码目录
- **AND** 该目录下不存在 `GUIDE.md`
- **THEN** 脚本 SHALL 输出错误信息并以非零状态码退出

#### Scenario: core 提供 GUIDE.md 时正常生成嵌入源码

- **WHEN** CLI 构建脚本扫描 Raven core 源码目录
- **AND** 该目录下存在 `GUIDE.md`
- **THEN** 脚本 SHALL 正常生成内嵌源码产物

## REMOVED Requirements

### Requirement: Registry 模块必须提供 GUIDE.md

**Reason**: RavenJS 2.0 不再围绕 registry 模块集合组织产品与构建流程，因此不再要求“每个模块”都具备独立 GUIDE。

**Migration**: 保留 core 的 `GUIDE.md` 作为唯一强制学习入口；示例插件如需额外说明，可在其目录中自行提供 README，但不参与构建校验。
