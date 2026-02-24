# RavenJS JTD Validator — AI Agent Learning Guide

This guide tells an AI Agent how to learn the jtd-validator module.

## What to Read (in order)

1. **README.md** — Overview, JTD schema builder, `useBody`/`useQuery`/`useParams`/`useHeaders`, gotchas, usage examples
2. **index.ts** — Single-file implementation organized by SECTION comments

## Key Concepts

- **J**: Fluent schema builder (`J.string()`, `J.object()`, `.optional()`, `.nullable()`)
- **Infer<T>**: TypeScript type inference from schema
- **useBody / useQuery / useParams / useHeaders**: Validate from corresponding RequestState; throw on failure

## Dependencies

- **@raven.js/core**: `BodyState`, `QueryState`, `ParamsState`, `HeadersState`, `RavenError`

## GOTCHAS

1. **Query, params, headers are strings** — Only `useBody` supports numeric/boolean/array/object. Use `J.string()` for query/params/headers, then convert manually.
2. **use*() must run inside request context** — Handler or beforeHandle only; never at module scope.
3. **Wire up onError** — `use*()` throws `RavenError.ERR_VALIDATION`; register `onError` to return 400.
4. **Define schemas at module scope** — Inline schemas are recompiled every request (cache is keyed on object identity).

## Import Paths

- From core: `import { BodyState, RavenError } from "@raven.js/core"`
- When copied: `from "../core"` for core, `from "./index.ts"` for validator

## Minimal Example

```typescript
import { Raven } from "../core";
import { J, useBody } from "./index.ts";

const app = new Raven();
const Schema = J.object({ name: J.string() });

app.post("/users", () => {
  const { name } = useBody(Schema);
  return Response.json({ created: name });
});
```

## USAGE EXAMPLES

See README.md: Basic body validation, path/query/header validation, nested objects, arrays, enums, beforeHandle, onError integration.
