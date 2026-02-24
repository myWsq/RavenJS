## MODIFIED Requirements

### Requirement: 运行时抽象层

Raven 框架 SHALL 仅支持 Bun 运行时。框架不再提供 Node.js 运行时适配，启动时直接使用 Bun 原生 API（如 `Bun.serve`）。

#### Scenario: 在 Bun 下启动

- **WHEN** 框架在 Bun 运行时下启动
- **THEN** 框架使用 `BunAdapter` 及 `Bun.serve` 处理 HTTP 请求
- **AND** 服务器正常响应 HTTP 请求

#### Scenario: Node.js 环境不再支持

- **WHEN** 用户尝试在 Node.js 运行时下启动框架
- **THEN** 框架不保证正常工作
- **AND** 文档 SHALL 声明 ravenjs 为 Bun-only

## REMOVED Requirements

### Requirement: 成功检测 Node.js 环境

**Reason**：RavenJS 定位为 Bun-only，不再支持 Node.js 运行时。

**Migration**：使用 Bun 运行 ravenjs；若必须在 Node 下运行，需使用支持 Node 的旧版本或选择其他框架。

## MODIFIED Requirements (Additional)

### Requirement: Server can be started with configuration

The Raven framework SHALL provide a method to start an HTTP server with configurable port and optional hostname. 框架必须在 Bun 环境下通过统一的 API 启动。

#### Scenario: Start server with port only

- **WHEN** user calls `app.listen({ port: 3000 })`
- **THEN** server starts listening on port 3000
- **AND** server responds to HTTP requests when running on Bun

#### Scenario: Start server with port and hostname

- **WHEN** user calls `app.listen({ port: 3000, hostname: 'localhost' })`
- **THEN** server starts listening on port 3000 at localhost
- **AND** server responds to HTTP requests

#### Scenario: Default hostname when not specified

- **WHEN** user calls `app.listen({ port: 3000 })` without hostname
- **THEN** server uses default hostname ('0.0.0.0' for Bun)
- **AND** server responds to HTTP requests
