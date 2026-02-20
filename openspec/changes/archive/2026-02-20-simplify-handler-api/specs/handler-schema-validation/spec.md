# handler-schema-validation Specification

## Purpose
该规范定义了 Raven 框架的 Handler Schema 校验机制，允许开发者通过 Handler 属性声明式地定义请求数据的校验规则，框架在请求生命周期内自动完成数据提取、校验和注入。

## Requirements

### Requirement: Handler 属性声明 (Handler Property Declaration)
开发者 SHALL 能够通过 Handler 的固定属性（`body`、`query`、`params`、`headers`）声明所需的请求数据。

#### Scenario: 声明 Handler 依赖的 Body
- **WHEN** 设置 `handler.body = bodyState`
- **THEN** 框架应当自动从 request body 读取数据并注入到该 State

#### Scenario: 声明 Handler 依赖的 Query
- **WHEN** 设置 `handler.query = queryState`
- **THEN** 框架应当自动从 URL query string 读取数据并注入到该 State

#### Scenario: 声明 Handler 依赖的 Params
- **WHEN** 设置 `handler.params = paramsState`
- **THEN** 框架应当自动从路由参数读取数据并注入到该 State

#### Scenario: 声明 Handler 依赖的 Headers
- **WHEN** 设置 `handler.headers = headersState`
- **THEN** 框架应当自动从 request headers 读取数据并注入到该 State

### Requirement: 自动数据注入与校验 (Auto Data Injection and Validation)
框架 MUST 在请求生命周期中自动处理声明的属性，并使用 Ajv 进行 JSON Schema 校验。

#### Scenario: 自动填充并验证 Body
- **WHEN** Handler 设置了 `body` 属性指向一个带 `schema` 的 State
- **AND** 发起一个带有合法 JSON Body 的 POST 请求
- **THEN** 在 Handler 执行前，该 State 应当被自动赋值为已校验的数据

#### Scenario: 自动填充 Query 参数
- **WHEN** Handler 设置了 `query` 属性指向一个带 `schema` 的 State
- **AND** 发起一个带有查询参数的 GET 请求
- **THEN** 在 Handler 执行前，该 State 应当被自动赋值为已校验的数据

#### Scenario: 校验失败拦截
- **WHEN** 请求数据不符合 State 定义的 JSON Schema
- **THEN** 框架应当自动中断请求并返回 400 响应
- **AND** 响应体应当包含 Ajv 校验错误的详细信息
- **AND** 不应执行 Handler 内部逻辑

### Requirement: Schema 库无关性 (Schema Library Agnostic)
Core 层 SHALL 只依赖标准 JSON Schema 对象，不与任何特定的 Schema 生成库（TypeBox、Zod 等）绑定。

#### Scenario: 使用原生 JSON Schema
- **WHEN** 创建 State 时传入标准 JSON Schema 对象 `{ type: 'object', properties: { ... } }`
- **THEN** 框架应当能够正确使用 Ajv 进行校验

#### Scenario: 通过插件使用 TypeBox
- **WHEN** 用户安装 `@ravenjs/typebox` 插件并使用其提供的工厂函数
- **THEN** 应当获得完整的 TypeScript 类型推断能力
- **AND** 生成的 Schema 应当被 Core 正确识别和校验

### Requirement: 简洁的 Handler 创建 (Simple Handler Creation)
框架 SHALL 提供简洁的 `createHandler` API，无需额外配置对象。

#### Scenario: 创建 Handler 并声明依赖
- **WHEN** 调用 `createHandler(() => { ... })`
- **AND** 在返回的 Handler 上设置 `handler.body = bodyState`
- **THEN** 框架应当在请求时自动处理数据注入和校验
