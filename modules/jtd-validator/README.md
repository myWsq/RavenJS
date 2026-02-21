# RavenJS JTD Validator

A data validation module for RavenJS based on JSON Type Definition (JTD) standard, providing type-safe request validation.

## Overview

JTD Validator uses RFC 8927 JSON Type Definition to validate request data. It provides compile-time type inference and supports validation for multiple data sources.

### Core Features

- **Type Safety**: Compile-time type inference
- **JTD Standard**: Uses RFC 8927 JSON Type Definition
- **Multi-source Validation**: Supports Body, Query, Params, Headers
- **Chainable API**: Supports `optional()` and `nullable()` modifiers

### Use Cases

- REST API request validation
- Form data validation
- Query parameter validation

---

## Quick Start

### Basic Usage

```typescript
import { J, useBody } from "./src/raven/jtd-validator/index.ts";

const UserSchema = J.object({
  name: J.string(),
  email: J.string(),
  age: J.int().optional(),
});

app.post("/users", () => {
  const user = useBody(UserSchema);
  // user type is inferred as { name: string; email: string; age?: number }
  return new Response(JSON.stringify(user));
});
```

---

## API Reference

### Schema DSL

#### `J`

JTD Schema builder.

```typescript
// Basic types
J.string()
J.boolean()
J.number()      // float64
J.int()         // int32

// Numeric types
J.int8()
J.int16()
J.int32()
J.uint8()
J.uint16()
J.uint32()
J.float32()
J.float64()
J.timestamp()

// Enum
J.enum(["active", "inactive"])

// Composite types
J.array(itemSchema)
J.record(valueSchema)
J.object({ ...fields })
```

#### `optional()`

Marks a field as optional.

```typescript
const schema = J.object({
  name: J.string(),
  age: J.int().optional(),  // age?: number
});
```

#### `nullable()`

Marks a field as nullable.

```typescript
const schema = J.object({
  name: J.string().nullable(),  // name: string | null
});
```

### Validation Hooks

#### `useBody<T>(schema)`

Validates request body.

```typescript
const schema = J.object({
  name: J.string(),
});

app.post("/submit", () => {
  const data = useBody(schema);
  return new Response("OK");
});
```

#### `useQuery<T>(schema)`

Validates query parameters.

```typescript
const schema = J.object({
  page: J.int(),
  limit: J.int().optional(),
});

app.get("/items", () => {
  const { page, limit } = useQuery(schema);
  return new Response(`Page ${page}`);
});
```

#### `useParams<T>(schema)`

Validates path parameters.

```typescript
const schema = J.object({
  id: J.string(),
});

app.get("/user/:id", () => {
  const { id } = useParams(schema);
  return new Response(`User ${id}`);
});
```

#### `useHeaders<T>(schema)`

Validates request headers.

```typescript
const schema = J.object({
  authorization: J.string(),
});

app.get("/secure", () => {
  const { authorization } = useHeaders(schema);
  return new Response("OK");
});
```

### Type Inference

#### `Infer<T>`

Infers TypeScript type from Schema.

```typescript
import { J, type Infer } from "./src/raven/jtd-validator/index.ts";

const UserSchema = J.object({
  name: J.string(),
  age: J.int().optional(),
});

type User = Infer<typeof UserSchema>;
// Equivalent to: { name: string; age?: number }
```

---

## Examples

### Complete Validation Example

```typescript
import { Raven } from "../core/index.ts";
import { J, useBody, useQuery } from "./index.ts";

const app = new Raven();

// POST /users - Create user
app.post("/users", () => {
  const user = useBody(J.object({
    name: J.string(),
    email: J.string(),
    age: J.int().optional(),
  }));
  
  // user type: { name: string; email: string; age?: number }
  return new Response(JSON.stringify(user), {
    headers: { "Content-Type": "application/json" }
  });
});

// GET /items - Paginated query
app.get("/items", () => {
  const { page, limit } = useQuery(J.object({
    page: J.int(),
    limit: J.int().optional(),
  }));
  
  // page: number, limit?: number
  return new Response(`Page ${page}, Limit ${limit ?? 10}`);
});

app.listen({ port: 3000 });
```

### Nested Object Validation

```typescript
const AddressSchema = J.object({
  city: J.string(),
  country: J.string(),
});

const UserSchema = J.object({
  name: J.string(),
  address: AddressSchema,
});

app.post("/submit", () => {
  const data = useBody(UserSchema);
  // data: { name: string; address: { city: string; country: string } }
  return new Response("OK");
});
```

### Array Validation

```typescript
const ItemsSchema = J.array(J.object({
  id: J.string(),
  quantity: J.int(),
}));

app.post("/order", () => {
  const items = useBody(ItemsSchema);
  // items: { id: string; quantity: number }[]
  return new Response("OK");
});
```

### Enum Validation

```typescript
const StatusSchema = J.enum(["pending", "approved", "rejected"]);

app.post("/status", () => {
  const status = useBody(J.object({
    status: StatusSchema,
  }));
  // status.status: "pending" | "approved" | "rejected"
  return new Response("OK");
});
```

---

## Design Intent

### Why JTD Instead of JSON Schema?

1. **Simpler**: JTD is more lightweight than JSON Schema
2. **Type Inference**: Easier to map to TypeScript types
3. **Sufficient Power**: Complete functionality for API validation scenarios

### Validation Timing

Validation automatically executes in the `beforeHandle` phase, eliminating the need to manually call validation functions. This provides:

- Cleaner Handler code
- Automatic 400 error response on validation failure
- Focus on business logic

---

## Caveats

### Must Use JTD Schema Objects

```typescript
// Correct
useBody(J.object({ name: J.string() }))

// Wrong - cannot directly pass JTD object
useBody({ type: "object", properties: { name: { type: "string" } } })
```

### optional() and nullable() Order

```typescript
// Both work
J.string().optional().nullable()  // string | null | undefined
J.string().nullable().optional()  // string | null | undefined
```

### Validation Failure Behavior

On validation failure, throws `RavenError.ERR_VALIDATION` with status code 400.

```typescript
// On validation failure, returns:
{
  "message": "/: Invalid body; name: required"
}
```

### Current Limitations

- Custom validation functions not supported
- Cross-field validation not supported
- Async validation not supported

---

## TypeScript Types

### Core Types

```typescript
type JTDType = 
  | "boolean" 
  | "string" 
  | "timestamp"
  | "float32" 
  | "float64"
  | "int8" | "int16" | "int32"
  | "uint8" | "uint16" | "uint32";

type JTDSchema = 
  | { type: JTDType; nullable?: true }
  | { enum: readonly string[]; nullable?: true }
  | { elements: JTDSchema; nullable?: true }
  | { values: JTDSchema; nullable?: true }
  | { properties: Record<string, JTDSchema>; optionalProperties?: Record<string, JTDSchema>; nullable?: true }
  | { discriminator: string; mapping: Record<string, JTDSchema> }
  | { ref: string }
  | Record<string, never>;

interface FieldSchema<T = JTDSchema> {
  readonly schema: T;
  optional(): FieldSchema<T>;
  nullable(): FieldSchema<T & { nullable: true }>;
}
```
