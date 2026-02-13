## Why

RavenJS 需要一个专门的目录来存放官方提供的插件，以保持核心库（core）的精简，同时为开发者提供开箱即用的功能（如高级路由、日志等）。当前正在构建的路由系统应当作为插件系统的核心应用场景之一进行整合。

## What Changes

- 在 `packages/` 目录下新建 `plugins/` 子项目。
- 配置 `packages/plugins` 的基础架构（package.json, tsconfig 等）。
- 调整路由系统的实现逻辑：将 Context 的组装延迟到 `onRequest` 钩子执行之后。
- 确保 Context 对象包含从路由中提取的 `params` 和 `query` 数据。

## Capabilities

### New Capabilities
- `official-plugins-infrastructure`: 提供官方插件的目录结构、构建配置及基础工具类。

### Modified Capabilities
- `routing-system`: 修改路由匹配逻辑，支持将 `params` 和 `query` 注入到 Context 中。
- `lifecycle-hooks`: 调整 `onRequest` 钩子与 Context 组装的先后顺序。

## Impact

- `packages/` 目录结构。
- `Raven` 实例的 Context 初始化逻辑。
- 路由系统与核心生命周期的集成方式。
