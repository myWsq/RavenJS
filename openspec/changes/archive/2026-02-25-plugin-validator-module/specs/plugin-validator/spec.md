## ADDED Requirements

### Requirement: withSchema function provides parameter validation

The plugin-validator module SHALL provide a `withSchema` higher-order function that wraps a handler function with schema-based validation for request parameters.

#### Scenario: Basic validation with body schema

- **WHEN** a handler is wrapped with `withSchema` containing a body schema, and a request with valid body is received
- **THEN** the handler SHALL be invoked with a Context containing the validated body

#### Scenario: Validation failure returns 400

- **WHEN** a handler is wrapped with `withSchema` containing a body schema, and the request body fails validation
- **THEN** a 400 status response SHALL be returned with validation error details

#### Scenario: No schema defined passes through

- **WHEN** a handler is wrapped with `withSchema` where no schema is provided for a parameter type (e.g., body is undefined)
- **THEN** the handler SHALL be invoked with that parameter set to undefined

### Requirement: Context provides validated parameters to handler

The withSchema function SHALL create a Context object that provides validated parameters to the handler.

#### Scenario: Context contains all validated parameters

- **WHEN** a handler is wrapped with schemas for body, query, params, and headers
- **THEN** the Context passed to the handler SHALL contain all four properties with their validated values

#### Scenario: Only defined schemas are validated

- **WHEN** a handler is wrapped with only a query schema
- **THEN** the body, params, and headers in the Context SHALL be undefined, and only query SHALL be validated

### Requirement: Validation uses Standard Schema interface

The plugin SHALL use the Standard Schema interface (from standard-schema.ts) for validation, enabling black-box validation without direct dependency on specific schema libraries.

#### Scenario: Validates using Standard Schema validate function

- **WHEN** a schema implementing Standard SchemaV1 is provided
- **THEN** the validate function SHALL be called with the appropriate request parameter

#### Scenario: Handles async validation

- **WHEN** the schema's validate function returns a Promise
- **THEN** the plugin SHALL await the result before proceeding

### Requirement: Error response format

When validation fails, the response SHALL contain structured error information.

#### Scenario: Validation error response structure

- **WHEN** validation fails
- **THEN** the response SHALL have status 400 and contain a JSON body with the issues array from the validation result

### Requirement: Handler execution after successful validation

After all validations pass, the handler SHALL be executed with the validated parameters.

#### Scenario: Handler receives validated values

- **WHEN** all schema validations pass
- **THEN** the handler SHALL be called with Context containing the validated output from each schema
