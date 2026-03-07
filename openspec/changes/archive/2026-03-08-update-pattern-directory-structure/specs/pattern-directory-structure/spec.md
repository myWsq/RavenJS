## ADDED Requirements

### Requirement: Pattern 文档必须使用抽象的应用代码根目录

RavenJS 的 pattern 文档在描述业务代码目录时 SHALL 使用 `<app_root>` 作为根目录占位符，并 MUST 说明它表示“包含 Raven app 全部代码的目录”。文档 MAY 将 `src/` 作为常见实例，但 MUST NOT 将 `src/` 表达为唯一合法目录名。

#### Scenario: 默认示例仍可说明常见目录

- **WHEN** 文档展示一份推荐目录树或路径示例
- **THEN** 文档 SHALL 使用 `<app_root>` 作为根目录名
- **AND** SHALL 明确说明该占位符通常映射到 `src/`

#### Scenario: 非 src 目录不会被判定为偏离 pattern

- **WHEN** Agent 或开发者阅读 pattern 文档并在项目中使用 `app/`、`server/` 或其它目录作为 Raven app 根目录
- **THEN** 文档 SHALL 将其视为允许的目录映射
- **AND** SHALL 不把 `src/` 描述为唯一符合 pattern 的结构

### Requirement: Runtime Assembly 结构必须直接平铺在应用代码根目录下

RavenJS 的 pattern 文档在描述 runtime assembly 时 SHALL 将 `app.ts`、`plugins/` 与 `scopes.ts` 放在 `<app_root>/` 下，与 `interface/`、`entity/`、`infra/` 等目录并列，而 MUST NOT 将其作为 `<app_root>/raven/` 的子目录来描述。

#### Scenario: 目录布局示例不再出现嵌套 raven 目录

- **WHEN** 文档展示完整目录树
- **THEN** runtime assembly 部分 SHALL 直接显示 `<app_root>/app.ts`、`<app_root>/plugins/` 与 `<app_root>/scopes.ts`
- **AND** SHALL 不再把这些文件放到 `<app_root>/raven/` 下

#### Scenario: 运行时装配说明引用新的组合根路径

- **WHEN** 文档解释 route 注册、plugin 装配或全局错误处理应放在何处
- **THEN** 文档 SHALL 使用 `<app_root>/app.ts` 作为默认组合根路径
- **AND** SHALL 将直接注册路由与插件装配都描述为发生在该根目录下

#### Scenario: 组合根直接导出 app

- **WHEN** 文档展示 `<app_root>/app.ts` 的推荐形态
- **THEN** 文档 SHALL 将该文件描述为导出已完成注册的 `app`
- **AND** SHALL 将 `await app.ready()` 保留给实际的服务入口，而不是在 `<app_root>/app.ts` 内先包装成 `fetch`
