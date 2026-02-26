## MODIFIED Requirements

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

The Raven framework SHALL process incoming HTTP requests and return responses. 在 Node.js 下必须支持标准的 Request/Response 对象。

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
