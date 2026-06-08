# hono-engine Specification

## Purpose

TBD - created by archiving change rewrite-3x-hono-npm. Update Purpose after archive.

## Requirements

### Requirement: Hono 作为底层 HTTP 引擎

Raven 框架 SHALL 以 Hono 作为底层 HTTP / 路由 / serve 引擎，替换自研的 RadixRouter 与请求收发管线。`hono` SHALL 作为 peer dependency 声明，由用户项目安装。框架内部 SHALL 持有一个 Hono 实例并将契约路由注册到该实例。

#### Scenario: 框架内部使用 Hono 路由

- **WHEN** 通过 `registerContractRoute` 或方法注册（GET/POST/...）注册一条路由
- **THEN** 框架 SHALL 经由 `hono.on(method, path, ...)` 将其注册到内部 Hono 实例
- **AND** 不再使用自研 RadixRouter 进行匹配

#### Scenario: hono 作为 peer dependency

- **WHEN** 用户安装 `@raven.js/core`
- **THEN** `package.json` SHALL 将 `hono` 声明为 `peerDependencies`
- **AND** 文档 SHALL 要求用户在项目中安装 `hono`

### Requirement: Hono context 对应用作者隐藏

Raven 框架 SHALL 将 Hono 的 context 对象 `c` 视为内部实现细节。应用作者编写的 handler、hook、plugin SHALL NOT 接收或感知 `c`。请求相关信息 SHALL 仅通过 ambient state（`RavenContext` 等内建 state）与校验后的 `{ body, query, params, headers }` 暴露。

#### Scenario: handler 不接收 Hono context

- **WHEN** 应用作者定义一个 handler
- **THEN** 该 handler SHALL 仅接收校验后的 `{ body, query, params, headers }`
- **AND** SHALL NOT 出现 Hono `c` 参数

#### Scenario: 请求信息经 ambient state 暴露

- **WHEN** 业务代码在请求生命周期内需要访问原始请求
- **THEN** SHALL 通过内建 state（如 `RavenContext`）以 `.get()` / `.getOrFailed()` 读取
- **AND** 框架在根中间件中将 Hono `c` 抓入该 ambient context

### Requirement: 请求入口建立 per-request AsyncLocalStorage

Raven 框架 SHALL 在请求入口（`ready()` 返回的 fetch handler 内）建立 per-request 的 `AsyncLocalStorage` 存储（app scope 与 request scope），并在该上下文内 `await` 内部 Hono 实例的 `fetch`，使路由匹配、请求 schema 校验、ambient state 写入、业务 handler 调用、响应序列化以及 Hono 的 `onError`/`notFound` 收口均运行在同一 ambient 上下文中。框架 SHALL NOT 依赖“在路由注册之后再安装根中间件”的方式建立该上下文（Hono 中间件须先于路由注册才能包裹，故采用请求入口包裹 `hono.fetch` 的方式）。

#### Scenario: 请求作用域隔离

- **WHEN** 并发处理多个请求
- **THEN** 每个请求 SHALL 拥有独立的 request-scope state 存储
- **AND** 一个请求对 request state 的写入 SHALL NOT 影响其它并发请求

#### Scenario: Hono 错误/未命中收口落在同一上下文

- **WHEN** 路由 handler 抛错或路由未命中
- **THEN** Hono 的 `onError` / `notFound` 处理 SHALL 在该 per-request `AsyncLocalStorage` 上下文内执行
- **AND** SHALL 经由框架的 `onError` 钩子链产出响应（404 亦对 `onError` 可见）

### Requirement: 经官方 adapter 跨运行时 serve

Raven 框架 SHALL 暴露内部 Hono 实例（或等价的 fetch handler），使用户能够经 Hono 官方 adapter 在 Node + Bun + Deno（server 端）启动 HTTP 服务。框架 SHALL NOT 自带 serve / 端口监听实现，SHALL NOT 包含运行时检测兼容代码。目标运行时 SHALL NOT 包含 edge/Workers。

#### Scenario: 在 Node 下 serve

- **WHEN** 用户在 Node 运行时启动服务
- **THEN** 用户 SHALL 使用 `@hono/node-server` 之类官方 adapter 承载框架暴露的 Hono 实例
- **AND** 框架自身不提供监听端口的能力

#### Scenario: 在 Bun / Deno 下 serve

- **WHEN** 用户在 Bun 或 Deno 运行时启动服务
- **THEN** 用户 SHALL 将框架暴露的 fetch handler 交给运行时原生 fetch serve
- **AND** 无需任何运行时检测分支
