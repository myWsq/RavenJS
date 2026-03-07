# Conventions

Read the [overview](./overview.md) first if you want the big picture before the reference-style rules.

This document is the compact reference for file placement, naming, and lightweight extension rules.

Use this document after you know which layers you need and want the expected directory layout, naming, and export shape.

## Directory Layout

```text
<app_root>/
├── interface/
│   ├── create-order.interface.ts
│   ├── get-order.interface.ts
│   └── get-user-profile.interface.ts
│
├── command/
│   ├── submit-order.command.ts
│   ├── pay-order.command.ts
│   └── create-refund.command.ts
│
├── query/
│   ├── list-order.query.ts
│   ├── search-order.query.ts
│   └── list-user-order.query.ts
│
├── projection/
│   ├── paged-order-id.projection.ts
│   ├── order-summary.projection.ts
│   └── user-order-stat.projection.ts
│
├── dto/
│   ├── order-item.dto.ts
│   ├── order.dto.ts
│   └── user-profile.dto.ts
│
├── entity/
│   ├── order/
│   │   ├── order.entity.ts
│   │   └── order.repository.ts
│   ├── order-item/
│   │   └── order-item.entity.ts
│   └── user/
│       ├── user.entity.ts
│       └── user.repository.ts
│
├── infra/
│   ├── database/
│   │   └── sql-client.ts
│   └── external/
│       └── payment-gateway.ts
│
├── app.ts
├── plugins/
│   ├── database.plugin.ts
│   ├── auth.plugin.ts
│   └── error.plugin.ts
└── scopes.ts                           # optional, shared scope keys in one file
```

`<app_root>/` means the directory that contains all Raven app code. In many projects this is `src/`, but the pattern does not require that exact directory name.

In `entity/`, each subdirectory is one entity module.
In `interface/`, files are named by one API entrypoint each.
In `command/`, files are named by write intent.
In `query/`, files are named by query intent.
In `projection/`, files are named by the result model itself.

## Naming Rules

Business files keep the original rule:

```text
{module-name}.{type}.ts
```

| Suffix           | Layer                       | Example                        |
| ---------------- | --------------------------- | ------------------------------ |
| `.interface.ts`  | Interface                   | `create-order.interface.ts`    |
| `.entity.ts`     | Entity                      | `order.entity.ts`              |
| `.repository.ts` | Entity                      | `order.repository.ts`          |
| `.command.ts`    | Command                     | `submit-order.command.ts`      |
| `.query.ts`      | Query                       | `list-order.query.ts`          |
| `.projection.ts` | Projection                  | `paged-order-id.projection.ts` |
| `.dto.ts`        | DTO                         | `order.dto.ts`                 |
| `.plugin.ts`     | Runtime Assembly            | `auth.plugin.ts`               |
| `scopes.ts`      | Runtime Assembly (optional) | `scopes.ts`                    |

Use fixed entrypoint names for runtime assembly:

- `<app_root>/app.ts`
- `<app_root>/infra/...`

## Optional Extensions

This pattern stays intentionally light.

Do not add more layers by default.

Use `Command` when a write workflow is reused across:

- HTTP handlers
- queue consumers
- cron jobs
- agent-invoked tasks

Use `Query` when a complex query is reused across entrypoints.

Until then:

- a single interface file is enough for orchestration
- entity is enough for business rules

Single-module object export rule:

- when a file is centered on one object module such as `CreateOrderInterface`, `OrderRepository`, `SubmitOrderCommand`, `ListOrderQuery`, or `ScopeKeys`, keep `export const Name = { memberA, memberB }` on the last line
- define the detailed members above that line, for example `const body`, `const response`, `const handler`, `const load`, `const save`, or `const execute`
- do not split that pattern into `const Name = ...` plus a trailing `export { Name }`
- this rule is for object-style module files; classes, functions, and state declarations can keep normal named exports
