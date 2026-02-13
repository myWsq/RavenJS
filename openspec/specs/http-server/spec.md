# http-server Specification

## Purpose
TBD - created by archiving change basic-http-server. Update Purpose after archive.
## Requirements
### Requirement: Server can be started with configuration

The Raven framework SHALL provide a method to start an HTTP server with configurable port and optional hostname. 框架必须能够在 Bun 和 Node.js 环境下通过统一的 API 启动。

#### Scenario: Start server with port only
- **WHEN** user calls `app.listen({ port: 3000 })`
- **THEN** server starts listening on port 3000
- **AND** server responds to HTTP requests regardless of whether it's running on Bun or Node.js

#### Scenario: Start server with port and hostname
- **WHEN** user calls `app.listen({ port: 3000, hostname: 'localhost' })`
- **THEN** server starts listening on port 3000 at localhost
- **AND** server responds to HTTP requests

#### Scenario: Default hostname when not specified
- **WHEN** user calls `app.listen({ port: 3000 })` without hostname
- **THEN** server uses default hostname (Bun 下为 '0.0.0.0'，Node.js 下为 'localhost' 或 '0.0.0.0' 取决于实现)
- **AND** server responds to HTTP requests

### Requirement: Server handles HTTP requests

The Raven framework SHALL process incoming HTTP requests and return responses. 在请求处理过程中，必须按照定义的生命周期顺序执行已注册的钩子函数。

#### Scenario: Handle GET request
- **WHEN** server receives a GET request to any path
- **THEN** server processes the request
- **AND** server returns a standard Response object (Web Standards compliant)

#### Scenario: Handle POST request
- **WHEN** server receives a POST request with body
- **THEN** server processes the request
- **AND** server returns a Response object

#### Scenario: Handle different HTTP methods
- **WHEN** server receives requests with different HTTP methods (GET, POST, PUT, DELETE, etc.)
- **THEN** server processes each request appropriately
- **AND** server returns appropriate Response objects

#### Scenario: 生命周期钩子完整执行链
- **WHEN** 接收到一个标准的 GET 请求，且注册了所有类型的钩子
- **THEN** 执行顺序 MUST 为：onRequest -> (Context 创建) -> beforeHandle -> Handler -> beforeResponse
- **AND** 最终返回由钩子或 Handler 产生的 Response

#### Scenario: 处理过程中报错进入错误处理
- **WHEN** 在任何生命周期阶段（钩子或 Handler）发生错误
- **THEN** 框架 MUST 捕获该错误并调用 `onError` 钩子
- **AND** 返回由 `onError` 产生的 Response

### Requirement: Context provides request and response access

The Raven framework SHALL provide a Context object that encapsulates request and response information for use in request handlers.

#### Scenario: Context contains request information
- **WHEN** a request handler receives a Context object
- **THEN** context.request provides access to the incoming Request object
- **AND** context includes request method, URL, headers, and body

#### Scenario: Context allows setting response
- **WHEN** a request handler receives a Context object
- **THEN** context allows setting response status, headers, and body
- **AND** framework returns the response to the client

### Requirement: Server can be stopped

The Raven framework SHALL provide a method to stop the running server.

#### Scenario: Stop running server
- **WHEN** user calls `app.stop()` or similar method
- **THEN** server stops accepting new requests
- **AND** existing connections are gracefully closed

