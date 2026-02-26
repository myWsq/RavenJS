## ADDED Requirements

### Requirement: Server can be started with configuration

The Raven framework SHALL provide a method to start an HTTP server with configurable port and optional hostname.

#### Scenario: Start server with port only

- **WHEN** user calls `app.listen({ port: 3000 })`
- **THEN** server starts listening on port 3000
- **AND** server responds to HTTP requests

#### Scenario: Start server with port and hostname

- **WHEN** user calls `app.listen({ port: 3000, hostname: 'localhost' })`
- **THEN** server starts listening on port 3000 at localhost
- **AND** server responds to HTTP requests

#### Scenario: Default hostname when not specified

- **WHEN** user calls `app.listen({ port: 3000 })` without hostname
- **THEN** server uses default hostname (typically '0.0.0.0' or Bun default)
- **AND** server responds to HTTP requests

### Requirement: Server handles HTTP requests

The Raven framework SHALL process incoming HTTP requests and return responses.

#### Scenario: Handle GET request

- **WHEN** server receives a GET request to any path
- **THEN** server processes the request
- **AND** server returns a Response object

#### Scenario: Handle POST request

- **WHEN** server receives a POST request with body
- **THEN** server processes the request
- **AND** server returns a Response object

#### Scenario: Handle different HTTP methods

- **WHEN** server receives requests with different HTTP methods (GET, POST, PUT, DELETE, etc.)
- **THEN** server processes each request appropriately
- **AND** server returns appropriate Response objects

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
