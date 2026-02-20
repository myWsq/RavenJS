## Why

目前的 Handler 验证方案通常采用侵入性的方式（如直接在 Handler 上附加 Schema），这与 Ravenjs 基于 `ScopedState` 的设计哲学不完全契合。Ravenjs 强调状态的解耦和按需访问。为了保持这一哲学，我们需要增强现有的 `ScopedState` 体系，使其本身就具备携带 JSON Schema 的能力。

同时，为保持 `@ravenjs/core` 的精简和可扩展性，核心只依赖标准 JSON Schema 规范和 Ajv 进行运行时校验，而 Schema 生成库（如 TypeBox、Zod、Valibot 等）应该通过插件机制接入，由用户自行选择。

## What Changes

- **ENHANCEMENT**: 扩展 `ScopedState` 体系，允许在创建时可选地绑定标准 JSON Schema 对象和数据源（Body/Query/Params）。
- **NEW**: 引入 "State Slot" 机制，允许在路由注册或 `createHandler` 时声明该 Handler 依赖的带 Schema 的 `ScopedState`。
- **MODIFICATION**: 扩展 `Raven.handleRequest` 流程，支持 Slots 的自动解析、校验和状态填充。
- **NEW**: 提供插件扩展点，允许第三方 Schema 库（TypeBox、Zod 等）以插件形式集成，提供更好的类型推断体验。

## Capabilities

### New Capabilities
- `state-slots-validation`: 提供基于 `ScopedState` 的声明式校验与数据自动注入能力。

### Modified Capabilities
- `routing-system`: 扩展路由定义，支持声明 Handler 所需的 State Slots。
- `scoped-state`: 增强现有的 `ScopedState`，使其支持可选的 JSON Schema 绑定。

## Impact

- `packages/core/utils/state.ts`: 扩展 `ScopedState` 及其子类，增加可选的 `schema` (标准 JSON Schema) 和 `source` 属性。
- `packages/core/main.ts`: 路由注册逻辑和请求处理生命周期需要支持 Slots 的解析与自动填充。
- `packages/core/package.json`: 仅添加 `ajv` 作为运行时校验依赖。
- Schema 生成库（TypeBox 等）作为可选的独立插件包提供，不污染 core。
