# OVERVIEW

@raven.js/schema-validator is a framework-agnostic validation module for RavenJS, built on [Standard Schema](https://standardschema.dev).

**Features**:

- **Library Agnostic**: Works with Zod, Valibot, ArkType, or any Standard Schema compliant library.
- **Full Request Validation**: Validates Body, Query, Params, and Headers.
- **Type Safety**: Infers types from schemas for the handler context.
- **Automatic Error Handling**: Throws structured `ValidationError` on failure.
- **SchemaClass**: Builds a class from an object of schemas for type inference only (e.g. `{ id: z.string(), price: z.number() }`); no runtime validation.

---

# ARCHITECTURE

**Validation lifecycle**:

```
incoming request
      │
      ▼
[processStates]       ← Core populates BodyState / QueryState / etc.
      │
      ▼
[withSchema wrapper]  ← Intercepts execution
      │
      ├─► Validates Body/Query/Params/Headers against schemas
      │      │
      │      ▼
      │   Validation Failed ──► Throws ValidationError ──► [onError hook]
      │
      ▼
   Validation Passed
      │
      ▼
[handler(ctx)]        ← Receives typed context with validated data
      │
      ▼
outgoing response
```

---

# CORE CONCEPTS

## Standard Schema

This module relies on the [Standard Schema](https://standardschema.dev) interface. This means it doesn't depend on a specific validation library. You can use:

- **Zod**: `bun add zod`
- **Valibot**: `bun add valibot`
- **ArkType**: `bun add arktype`

Any library that implements the Standard Schema spec works out of the box.

## `withSchema` Wrapper

The primary API is a higher-order function that wraps your handler. It transforms a **schema-aware handler** (which accepts a context argument) into a **standard RavenJS handler** (zero-argument).

It is recommended to define the handler directly within `withSchema` to leverage type inference automatically:

```typescript
const schema = {
  body: z.object({ name: z.string() }),
};

// Define handler inline for automatic type inference
const createHandler = withSchema(schema, (ctx) => {
  // ctx.body is automatically typed as { name: string }
  return Response.json(ctx.body);
});

app.post("/route", createHandler);
```

## Context Integration

While RavenJS Core uses global state (`BodyState`, etc.) for dependency injection, `schema-validator` passes a **typed context object** to your handler. This provides the best of both worlds:

- **Type Inference**: The `ctx` argument matches your schema types.
- **Runtime Integration**: The validator reads from RavenJS's internal states automatically.

## SchemaClass

`SchemaClass(shape)` returns a **base class** for **type inference only**. Prefer **extending** it so the class can be used as a type and extended with methods.

- **Parameter**: A shape (plain object of schemas), e.g. `{ id: z.string(), price: z.number() }` (not a single `z.object(...)`).
- **Static and instance `_shape`**: The class and each instance expose this shape as `_shape`.

```typescript
import { SchemaClass } from "@raven.js/schema-validator";
import { z } from "zod";

class User extends SchemaClass({ name: z.string(), age: z.number() }) {}

const user: User = new User({ name: "alice", age: 30 });
user.name; // string
user.age; // number
user._shape; // shape object
User._shape; // same, on the class
```

---

# DESIGN DECISIONS

## Why Standard Schema?

By adopting Standard Schema, RavenJS avoids vendor lock-in. You are not forced to use Zod or any specific library. This aligns with RavenJS's philosophy of being a "reference implementation" that is flexible and adaptable.

## Why a wrapper function instead of middleware?

RavenJS hooks (`beforeHandle`) are void functions that cannot easily pass typed data to the handler.

- **Middleware approach**: Validation runs in a hook, puts result in a weak-map or untyped state. Handler manually casts data.
- **Wrapper approach**: The wrapper function _knows_ the schema types and passes them directly to the handler function as an argument. This enables 100% type safety without manual casting.

---

# GOTCHAS

## 1. Validation throws `ValidationError`

When validation fails, `withSchema` throws a `ValidationError`. It does **not** return a 400 Response automatically. You must handle this error, typically in a global `onError` hook.

```typescript
import { isValidationError } from "@raven.js/schema-validator";

app.onError((err) => {
  if (isValidationError(err)) {
    return Response.json({ issues: err.bodyIssues }, { status: 400 });
  }
});
```

## 2. Handler signature changes

When using `withSchema`, your handler function **must** accept a context argument, unlike standard RavenJS handlers which are zero-argument.

```typescript
// Standard handler
const standard = () => new Response();

// Schema handler
const schemaHandler = (ctx) => new Response();
```

## 3. Schema libraries must be installed separately

This package does not bundle Zod or Valibot. You must install your preferred validation library in your project.

---

# USAGE EXAMPLES

## Minimal (Zod)

```typescript
import { z } from "zod";
import { withSchema } from "@raven.js/schema-validator";
import { Raven } from "@raven.js/core";

const schema = {
  body: z.object({
    username: z.string(),
  }),
};

// Define handler directly inside withSchema for best developer experience
const createUser = withSchema(schema, (ctx) => {
  // ctx.body is typed: { username: string }
  return new Response(`Hello ${ctx.body.username}`);
});

const app = new Raven();
app.post("/user", createUser);
```

## Validating Multiple Sources

```typescript
const schema = {
  body: z.object({ name: z.string() }),
  query: z.object({ page: z.string().transform(Number) }),
  headers: z.object({ "x-api-key": z.string() }),
};

const handler = withSchema(schema, (ctx) => {
  const { name } = ctx.body;
  const { page } = ctx.query;
  const apiKey = ctx.headers["x-api-key"];
  return Response.json({ name, page, apiKey });
});
```

## SchemaClass (extend for type and methods)

```typescript
import { SchemaClass } from "@raven.js/schema-validator";
import { z } from "zod";

class Product extends SchemaClass({ id: z.string(), price: z.number() }) {}

const p: Product = new Product({ id: "x", price: 99 });
// Product is usable as a type; add methods on the class as needed
```

## Global Error Handling

```typescript
import { isValidationError } from "@raven.js/schema-validator";

app.onError((error) => {
  if (isValidationError(error)) {
    return new Response(
      JSON.stringify({
        error: "Validation Failed",
        details: {
          body: error.bodyIssues,
          query: error.queryIssues,
        },
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
  return new Response("Internal Error", { status: 500 });
});
```

---

# ANTI-PATTERNS

## Do not validate manually inside handler

```typescript
// ❌ Manual validation loses type inference benefits and clutters logic
app.post("/user", async () => {
  const rawBody = BodyState.getOrFailed();
  const result = UserSchema.safeParse(rawBody); // ❌
  if (!result.success) return new Response("Error", { status: 400 });
  // ...
});

// ✓ Use withSchema to separate validation from logic
app.post(
  "/user",
  withSchema({ body: UserSchema }, (ctx) => {
    // ...
  }),
);
```

## Do not separate handler definition from schema

```typescript
// ❌ Defining handler separately requires manual type definition or complex inference
const handler = (ctx: any) => { ... };
const wrapped = withSchema(schema, handler);

// ✓ Define inline for automatic type inference
const wrapped = withSchema(schema, (ctx) => {
  // ctx is fully typed here!
});
```
