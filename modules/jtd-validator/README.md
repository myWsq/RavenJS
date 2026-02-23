# OVERVIEW

RavenJS JTD Validator is a request validation module built on [JSON Type Definition](https://jsontypedef.com/) (RFC 8927), providing compile-time type inference and runtime validation in a single schema declaration.

**Philosophy**: This is reference code, not an npm package to import. Copy it, modify it, learn from it, and use it directly in your project.

**Features**:
- Schema-driven type inference — define once, get both validation and TypeScript types
- Fluent builder API (`J.string()`, `J.object()`, `.optional()`, `.nullable()`)
- Four validation sources: `body`, `query`, `params`, `headers`
- Compiled validator cache — schemas are compiled once, reused across requests

---

# ARCHITECTURE

All logic lives in a single file `index.ts`, organized by `SECTION` comments:

```
index.ts
├── SECTION: JTD Schema Types        — JTDType, JTDBaseSchema, FieldSchema interface
├── SECTION: Field Schema Factory    — createField() internal constructor
├── SECTION: Type Inference Utilities — Infer<T> and supporting mapped types
├── SECTION: Schema DSL              — the J builder object
├── SECTION: Validation Engine       — Ajv instance, validator cache, validateAndReturn()
└── SECTION: Request Validation Helpers — useBody / useQuery / useParams / useHeaders
```

**How it fits into the request lifecycle** (from `@ravenjs/core`):

```
[processStates]  ← framework populates BodyState / QueryState / ParamsState / HeadersState
      │
      ▼
[beforeHandle]   ← call use*() here to validate early and short-circuit with 400
      │
      ▼
[handler()]      ← call use*() here for inline validation
```

`useBody` / `useQuery` / `useParams` / `useHeaders` read from the corresponding `RequestState`. They must be called inside a handler or `beforeHandle` hook — never at module scope.

---

# CORE CONCEPTS

## J — Schema builder

`J` is a fluent object that constructs `FieldSchema` values. Every method returns a `FieldSchema` with a generic parameter precise enough for `Infer<T>` to produce the correct TypeScript type.

| Method | JTD form | TypeScript type |
|---|---|---|
| `J.string()` | `{ type: "string" }` | `string` |
| `J.boolean()` | `{ type: "boolean" }` | `boolean` |
| `J.timestamp()` | `{ type: "timestamp" }` | `string` (ISO 8601) |
| `J.number()` | `{ type: "float64" }` | `number` |
| `J.int()` | `{ type: "int32" }` | `number` |
| `J.int8/16/32()` | `{ type: "int8/16/32" }` | `number` |
| `J.uint8/16/32()` | `{ type: "uint8/16/32" }` | `number` |
| `J.float32/64()` | `{ type: "float32/64" }` | `number` |
| `J.enum(["a","b"])` | `{ enum: [...] }` | `"a" \| "b"` |
| `J.array(item)` | `{ elements: ... }` | `T[]` |
| `J.record(value)` | `{ values: ... }` | `Record<string, T>` |
| `J.object(fields)` | `{ properties, optionalProperties }` | `{ ... }` |

**Chainable modifiers** (available on every `FieldSchema`):

- `.optional()` — marks the field optional inside a `J.object()` (moves it to `optionalProperties`)
- `.nullable()` — adds `nullable: true` to the JTD schema, expanding the TypeScript type to `T | null`

The two modifiers can be chained in any order: `J.string().optional().nullable()`.

## FieldSchema

The wrapper type returned by every `J.*` method. It holds the raw `JTDBaseSchema` in `.schema` and carries the optional flag via the `[OPTIONAL]` symbol property. You never construct this directly.

## Infer\<T\>

A utility type that extracts the TypeScript type from a `FieldSchema` or raw `JTDBaseSchema`:

```typescript
const UserSchema = J.object({
  id:    J.string(),
  age:   J.int().optional(),
  email: J.string().nullable(),
});

type User = Infer<typeof UserSchema>;
// { id: string; age?: number; email: string | null }
```

## Validation helpers

| Function | Reads from | Throws on failure |
|---|---|---|
| `useBody(schema)` | `BodyState` | `RavenError.ERR_VALIDATION` (400) |
| `useQuery(schema)` | `QueryState` | `RavenError.ERR_VALIDATION` (400) |
| `useParams(schema)` | `ParamsState` | `RavenError.ERR_VALIDATION` (400) |
| `useHeaders(schema)` | `HeadersState` | `RavenError.ERR_VALIDATION` (400) |

On validation failure the error is thrown as a `RavenError` with `statusCode: 400`. The framework's `onError` hook catches it; call `error.toResponse()` to serialize it to a structured JSON response.

---

# DESIGN DECISIONS

## Why JTD instead of JSON Schema?

JTD (RFC 8927) was chosen over JSON Schema for two reasons:

1. **Direct TypeScript mapping** — every JTD form maps 1-to-1 to a TypeScript type (object, array, scalar, enum). The `Infer<T>` utility only needs ~50 lines of conditional types to cover the entire spec.
2. **Simpler validation rules** — JTD has no `pattern`, `minimum`, `allOf`, `anyOf`, etc. This keeps the schema readable and prevents the validator from becoming a second type system.

For cross-field constraints or format checks (email, UUID, etc.) that JTD cannot express, add them manually in the handler after `use*()` returns.

## Why validate inside the handler, not in a dedicated hook?

`use*()` is a plain function call, not a hook registration. This is intentional:

- **Co-location** — the schema lives next to the code that consumes it
- **Selective validation** — different routes can share the same handler function but validate different subsets
- **No magic** — the call site makes it obvious when and what is being validated

You can still move `use*()` calls into a `beforeHandle` hook if you want to validate before business logic runs and short-circuit early.

## Why a schema cache keyed on object identity?

`getOrCompileValidator` uses a `WeakMap<object, ValidateFunction>` keyed on the raw schema object reference. Schemas defined at module scope (the common pattern) are created once and reused across every request, paying the Ajv compilation cost only once.

---

# GOTCHAS

## 1. `useQuery`, `useParams`, and `useHeaders` only receive strings — never use numeric types with them

`QueryState`, `ParamsState`, and `HeadersState` are typed and populated as `Record<string, string>`. Every value is a raw string extracted from the URL or header. JTD validation is strict: the value `"42"` does not satisfy `{ type: "int32" }`.

```typescript
// ❌ Wrong: "42" is a string, not an int32 — validation will always fail
app.get("/items", () => {
  const { page } = useQuery(J.object({ page: J.int() }));
});

// ✓ Correct: validate as string, then convert manually
app.get("/items", () => {
  const { page } = useQuery(J.object({ page: J.string() }));
  const pageNum = parseInt(page, 10);
});
```

The same rule applies to `useParams` and `useHeaders`. **Only `useBody` can use numeric, boolean, array, and nested object types**, because the JSON body is already parsed to native JavaScript values before validation.

## 2. `use*()` must be called inside a request context

These functions read from `RequestState`, which is only populated during an active request. Calling them at module scope, inside app setup code, or inside `onRequest` will throw `ERR_STATE_NOT_SET`.

```typescript
// ❌ Wrong: called outside a request
const data = useBody(MySchema);

// ✓ Correct: called inside a handler
app.post("/submit", () => {
  const data = useBody(MySchema); // ✓ RequestState is active here
  return Response.json(data);
});
```

## 3. Validation errors are thrown, not returned — wire up `onError`

`use*()` throws `RavenError.ERR_VALIDATION` on failure. If you don't register an `onError` handler, the framework falls through to its default 500 response. Register a handler to return a proper 400:

```typescript
import { isRavenError } from "@ravenjs/core";

app.onError((error) => {
  if (isRavenError(error)) {
    return error.toResponse(); // { error: "...", statusCode: 400, ... }
  }
  return new Response("Internal Server Error", { status: 500 });
});
```

## 4. `discriminator` and `ref` forms have no `J` builder

`JTDBaseSchema` includes `{ discriminator: string; mapping: ... }` and `{ ref: string }` in its type union because AJV supports them, but `J` does not expose builder methods for them. If you need tagged unions or schema references, construct the raw `JTDBaseSchema` object manually and wrap it with `createField()` — or add a `J.discriminator()` method yourself.

## 5. Schemas defined inline are recompiled on every call

The validator cache is keyed on object identity. An inline schema object is a new object on every call, so it gets compiled fresh every time:

```typescript
// ❌ Recompiled on every request — new object reference each call
app.post("/users", () => {
  const body = useBody(J.object({ name: J.string() })); // new schema object each time
});

// ✓ Define at module scope — compiled once, cached forever
const UserSchema = J.object({ name: J.string() });

app.post("/users", () => {
  const body = useBody(UserSchema); // same object reference → cache hit
});
```

---

# ANTI-PATTERNS

## Do not cast `use*()` return values — let inference do it

```typescript
// ❌ Redundant cast — Infer<T> already produced the correct type
const body = useBody(UserSchema) as { name: string };

// ✓ Trust the inferred type
const body = useBody(UserSchema); // type: { name: string }
```

## Do not use `J.object({})` to validate arbitrary JSON

An empty `J.object({})` produces `{}` as the JTD schema, which AJV treats as "accept anything". If you intentionally want to pass through unvalidated body data, read `BodyState` directly and cast:

```typescript
// ❌ Misleading — looks like validation but accepts everything
const data = useBody(J.object({}));

// ✓ Explicit about skipping validation
const data = BodyState.getOrFailed() as MyType;
```

## Do not validate the same source twice with different schemas

`use*()` validates `data` against `schema` and returns it. Calling `useBody()` twice with different schemas on the same request is wasteful and potentially confusing — extract everything you need in a single call with a combined schema.

```typescript
// ❌ Two passes over the same data
const { name } = useBody(J.object({ name: J.string() }));
const { age }  = useBody(J.object({ age: J.int() }));

// ✓ Single schema covering all required fields
const { name, age } = useBody(J.object({
  name: J.string(),
  age:  J.int(),
}));
```

---

# USAGE EXAMPLES

## Basic body validation

```typescript
import { J, useBody } from "./index.ts";

const CreateUserSchema = J.object({
  name:  J.string(),
  email: J.string(),
  age:   J.int().optional(),
});

app.post("/users", () => {
  const user = useBody(CreateUserSchema);
  // user: { name: string; email: string; age?: number }
  return Response.json({ created: user.name });
});
```

## Path parameter validation (strings only)

```typescript
import { J, useParams } from "./index.ts";

app.get("/users/:id", () => {
  const { id } = useParams(J.object({ id: J.string() }));
  return Response.json({ id });
});
```

## Query parameter validation (strings only)

```typescript
import { J, useQuery } from "./index.ts";

app.get("/items", () => {
  const { page, sort } = useQuery(J.object({
    page: J.string(),
    sort: J.enum(["asc", "desc"]).optional(),
  }));
  const pageNum = parseInt(page, 10);
  return Response.json({ page: pageNum, sort: sort ?? "asc" });
});
```

## Header validation

```typescript
import { J, useHeaders } from "./index.ts";

app.get("/secure", () => {
  const { authorization } = useHeaders(J.object({
    authorization: J.string(),
  }));
  // authorization: string
  return Response.json({ token: authorization });
});
```

## Nullable and optional fields

```typescript
const ProfileSchema = J.object({
  username:  J.string(),
  bio:       J.string().nullable(),     // string | null
  website:   J.string().optional(),     // may be absent
  age:       J.int().optional().nullable(), // may be absent or null
});

type Profile = Infer<typeof ProfileSchema>;
// { username: string; bio: string | null; website?: string; age?: number | null }
```

## Nested objects

```typescript
const AddressSchema = J.object({
  street: J.string(),
  city:   J.string(),
  zip:    J.string(),
});

const OrderSchema = J.object({
  item:     J.string(),
  quantity: J.int(),
  address:  AddressSchema,
});

app.post("/orders", () => {
  const order = useBody(OrderSchema);
  return Response.json({ city: order.address.city });
});
```

## Array validation

```typescript
const ItemsSchema = J.array(J.object({
  id:       J.string(),
  quantity: J.int(),
}));

app.post("/cart", () => {
  const items = useBody(ItemsSchema);
  // items: Array<{ id: string; quantity: number }>
  return Response.json({ count: items.length });
});
```

## Enum validation

```typescript
const StatusSchema = J.object({
  status: J.enum(["pending", "approved", "rejected"]),
});

app.patch("/order/:id/status", () => {
  const { status } = useBody(StatusSchema);
  // status: "pending" | "approved" | "rejected"
  return Response.json({ status });
});
```

## String-keyed map (record)

```typescript
const MetaSchema = J.record(J.string());

app.post("/meta", () => {
  const meta = useBody(MetaSchema);
  // meta: Record<string, string>
  return Response.json(meta);
});
```

## Extracting the type for reuse

```typescript
import { J, type Infer } from "./index.ts";

const UserSchema = J.object({
  name: J.string(),
  age:  J.int().optional(),
});

export type User = Infer<typeof UserSchema>;
// { name: string; age?: number }

export async function createUser(user: User) { /* ... */ }
```

## Validation in `beforeHandle` (early short-circuit)

```typescript
import { J, useBody, useHeaders } from "./index.ts";

const AuthHeaderSchema = J.object({ authorization: J.string() });
const CreateSchema = J.object({ name: J.string() });

app.beforeHandle(() => {
  // validate authorization header for ALL routes registered after this hook
  useHeaders(AuthHeaderSchema); // throws 400 if missing; add your own auth check after
});

app.post("/resources", () => {
  const { name } = useBody(CreateSchema);
  return Response.json({ name });
});
```

## Full error handling integration

```typescript
import { Raven } from "@ravenjs/core";
import { isRavenError } from "@ravenjs/core";
import { J, useBody } from "./index.ts";

const app = new Raven();

app.onError((error) => {
  if (isRavenError(error)) {
    return error.toResponse();
    // { error: "ERR_VALIDATION", message: "/name: must be string", statusCode: 400 }
  }
  return new Response("Internal Server Error", { status: 500 });
});

const Schema = J.object({ name: J.string() });

app.post("/test", () => {
  const { name } = useBody(Schema); // throws ERR_VALIDATION if invalid
  return Response.json({ name });
});

await app.listen({ port: 3000 });
```
