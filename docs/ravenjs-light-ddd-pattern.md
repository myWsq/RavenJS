# RavenJS Pattern: Interface Unit + Entity + Command + Query + Projection + Runtime Assembly

## Purpose

This pattern adapts a lightweight entity-centric server architecture to RavenJS.

It keeps the original design's core ideas:

- `Interface` as the organization unit for inbound APIs
- `Entity` as the carrier of business rules
- `Repository` as direct persistence logic
- `Command` as the abstraction for reusable write workflows
- `Query` as the abstraction for complex reusable queries
- `Projection` as the read-only query result model
- `DTO` as the only schema atom source, preferably declared with `SchemaClass`

It adds one RavenJS-specific layer:

- `Runtime Assembly` for app composition, plugin wiring, state injection, lifecycle hooks, and error mapping

The goal is to keep business code pure while still fitting RavenJS's real architecture:

- plugins for reusable runtime composition
- plugin-local `AppState` / `RequestState`
- `withSchema()` for request validation
- lifecycle hooks for cross-cutting concerns
- clear repository/query boundaries:
  `Repository` handles entity persistence,
  `Command` orchestrates reusable write workflows,
  `Query` returns `Projection` for complex reusable queries,
  `Projection` models query results,
  and `DTO` remains the external contract

---

## Core Idea

RavenJS is not a traditional "controller + service + repository" framework.

Its real runtime model is:

- a logic-layer app
- direct route registration in `app.ts`
- plugin-based runtime composition
- lifecycle-driven request processing
- scoped state injection

So the RavenJS-friendly version of this architecture is:

```text
Interface Unit
  -> validates input
  -> simple write path: uses Entity + Repository
  -> reusable write path: uses Command
  -> query path: uses Query + Projection
  -> maps result to DTO

Entity
  -> owns write-side entities and repositories
  -> contains business rules

Command
  -> orchestrates multi-entity write workflows
  -> may define transaction boundaries

Projection
  -> models query results
  -> stays read-only and anemic

Query
  -> holds complex reusable SQL / ORM queries
  -> returns Projection

Runtime Assembly
  -> assembles app.ts
  -> provides infra dependencies
  -> writes request context state
  -> maps framework errors to HTTP responses
```

This keeps business concepts stable and keeps Raven-specific concerns in one place.

---

## Repository / Command / Query Boundary

The core tension of this pattern is not read/write separation.

It is keeping `Repository` small and stable while still giving reusable write and query logic a home.

Use this split:

```text
Repository
  -> returns Entity
  -> persists Entity

Command
  -> orchestrates write workflows
  -> coordinates multiple Entity / Repository operations

Query
  -> returns Projection
  -> handles complex reusable queries
```

Rules:

- `Repository` only mediates `Entity <-> DB`
- if a write workflow spans multiple entities and is worth reusing, use `Command`
- `Repository` may query, but only when the result is still that model itself
- if the result is cascading, aggregated, joined, or otherwise no longer "the model itself", use `Query + Projection`
- not every write workflow needs a `Command`
- only extract a `Command` when the write logic is both reusable and beyond a single entity path
- not every SQL statement needs a `Query`
- only extract a `Query` when the SQL is both complex and worth reusing
- DTO remains the external contract at the interface boundary

---

## Core Concepts

| Concept            | Responsibility                                                     | RavenJS Mapping                                                          |
| ------------------ | ------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| `Interface Unit`   | One API entrypoint, including input schema, output schema, handler | `withSchema()` handler + route registration                              |
| `Entity`           | Pure in-memory business model and behavior                         | plain TypeScript class/value object                                      |
| `Repository`       | Persistence and hydration for an entity itself                     | namespace or function collection, usually reading infra from `AppState`  |
| `Command`          | Reusable write workflow orchestration                              | namespace or function collection                                         |
| `Query`            | Complex reusable query logic                                       | namespace or function collection                                         |
| `Projection`       | Read-only query result model                                       | `SchemaClass` model                                                      |
| `DTO`              | Schema atom, TS type, entity-to-JSON mapper                        | `SchemaClass` + runtime `Schema` + mapper                                |
| `Infra`            | Database client, external gateway, cache, mailer                   | plain technical adapters                                                 |
| `Runtime Assembly` | Composition root, plugins, colocated states, hooks, error mapping  | `definePlugin`, plugin-local `AppState`, `RequestState`, lifecycle hooks |

---

## Architecture

```text
┌──────────────────────────────────────────────────────────────┐
│                      Runtime Assembly                        │
│                                                              │
│  app.ts                                                      │
│  plugins/                                                    │
│  scopes.ts (optional)                                        │
│                                                              │
│  register infra plugins                                      │
│  register context plugins                                    │
│  register routes directly                                    │
│  register global error mapping                               │
└───────────────┬──────────────────────────────────────────────┘
                │
                ▼
┌──────────────────────────────────────────────────────────────┐
│                       Interface Unit                         │
│                                                              │
│  create-order.request.ts                                     │
│  create-order.response.ts                                    │
│  create-order.handler.ts                                     │
└───────────────┬──────────────────────────────┬───────────────┘
                │                              │
                ▼                              ▼
┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
│        Entity        │  │       Command        │  │        Query         │  │      Projection      │  │         DTO          │
│                      │  │                      │  │                      │  │                      │  │                      │
│  order/              │  │  submit-order...ts  │  │  list-order.query.ts │  │  paged-order-id...  │  │  order.dto.ts        │
│  order-item/         │  │  pay-order...ts     │  │  search-order...ts   │  │  order-summary...   │  │  order-item.dto.ts   │
│  user/               │  │                      │  │                      │  │                      │  │  user-profile.dto.ts │
└────────────┬─────────┘  └────────────┬─────────┘  └────────────┬─────────┘  └────────────┬─────────┘  └──────────────────────┘
             │                         │                         │                           │
             └─────────────────────────┴─────────────────────────┴──────────────┬────────────┘
                                                                                 ▼
┌──────────────────────────────────────────────────────────────┐
│                           Infra                              │
│                                                              │
│  sql client / external gateway / cache / mailer              │
└──────────────────────────────────────────────────────────────┘
```

---

## Directory Layout

```text
src/
├── interface/
│   ├── create-order/
│   │   ├── create-order.request.ts
│   │   ├── create-order.response.ts
│   │   └── create-order.handler.ts
│   ├── get-order/
│   │   ├── get-order.request.ts
│   │   ├── get-order.response.ts
│   │   └── get-order.handler.ts
│   └── get-user-profile/
│       ├── get-user-profile.request.ts
│       ├── get-user-profile.response.ts
│       └── get-user-profile.handler.ts
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
└── raven/
    ├── app.ts
    ├── plugins/
    │   ├── database.plugin.ts
    │   ├── auth.plugin.ts
    │   └── error.plugin.ts
    └── scopes.ts                       # optional, shared scope keys in one file
```

In `entity/`, each subdirectory is one entity module.
In `command/`, files are named by write intent.
In `query/`, files are named by query intent.
In `projection/`, files are named by the result model itself.

---

## Naming Rules

Business files keep the original rule:

```text
{module-name}.{type}.ts
```

| Suffix           | Layer                       | Example                        |
| ---------------- | --------------------------- | ------------------------------ |
| `.handler.ts`    | Interface                   | `create-order.handler.ts`      |
| `.request.ts`    | Interface                   | `create-order.request.ts`      |
| `.response.ts`   | Interface                   | `create-order.response.ts`     |
| `.entity.ts`     | Entity                      | `order.entity.ts`              |
| `.repository.ts` | Entity                      | `order.repository.ts`          |
| `.command.ts`    | Command                     | `submit-order.command.ts`      |
| `.query.ts`      | Query                       | `list-order.query.ts`          |
| `.projection.ts` | Projection                  | `paged-order-id.projection.ts` |
| `.dto.ts`        | DTO                         | `order.dto.ts`                 |
| `.plugin.ts`     | Runtime Assembly            | `auth.plugin.ts`               |
| `scopes.ts`      | Runtime Assembly (optional) | `scopes.ts`                    |

Use fixed entrypoint names for runtime assembly:

- `src/raven/app.ts`
- `src/infra/...`

---

## Layer Responsibilities

### 1. Interface Unit

An interface unit is the inbound API organization unit.

Each interface gets one folder with three files:

- `{name}.request.ts`
- `{name}.response.ts`
- `{name}.handler.ts`

In RavenJS:

- `request.ts` defines request schemas by source: `body`, `query`, `params`, `headers`
- `response.ts` defines the response schema from DTO schema atoms
- `handler.ts` usually exports a Raven handler directly via `withSchema()`

The handler does:

1. validate input
2. for entity paths, construct or load entities
3. for entity paths, call entity behavior or invoke a command
4. persist through repository, invoke a command, or execute a query
5. map to DTO
6. build `Response`

The handler does not own core business rules.

Repository/query rule at the interface layer:

- if you need an `Entity`, go through `Repository`
- if a reusable write workflow spans multiple entities, go through `Command`
- if you need a reusable complex query result, go through `Query + Projection`
- simple one-off SQL may stay in the handler
- do not create a `Command` unless the write workflow is both reusable and beyond a single entity path
- do not create a `Query` unless the SQL is both complex and worth reusing
- DTO is still required at the interface boundary

Typical schema files in an interface unit:

```ts
// create-order.request.ts
export namespace CreateOrderRequestSchema {
  export const body = z.object({
    userId: z.string(),
    items: z.array(
      z.object({
        productId: OrderItemDTO._shape.productId,
        productName: OrderItemDTO._shape.productName,
        unitPrice: OrderItemDTO._shape.unitPrice,
        quantity: OrderItemDTO._shape.quantity,
      }),
    ),
  });
}

// create-order.response.ts
export const CreateOrderResponseSchema = z.object(OrderDTO._shape);
```

Request schema rules in RavenJS:

- split by source: `body`, `query`, `params`, `headers`
- export request schemas through an interface-prefixed namespace, for example `CreateOrderRequestSchema.body`
- only declare the parts the interface actually needs
- reuse DTO fields explicitly from `DTO._shape`
- do not assume request field names must match DTO field names
- pass real runtime schemas to `withSchema()`, not `SchemaClass` itself

Recommended handler shape:

```ts
export const createOrderHandler = withSchema(CreateOrderRequestSchema, async (ctx) => {
  const order = OrderEntity.create({
    userId: ctx.body.userId,
  });

  for (const item of ctx.body.items) {
    order.addItem(
      new OrderItemEntity(item.productId, item.productName, item.unitPrice, item.quantity),
    );
  }

  order.submit();

  const saved = await OrderRepository.save(order);
  const dto = OrderDTO.fromEntity(saved);

  return Response.json(CreateOrderResponseSchema.parse(dto), { status: 201 });
});
```

This keeps the handler:

- schema-aware
- framework-adapted
- Raven-native
- business-light

The business rule still lives in the entity.

Projection path example:

```ts
export const listOrderHandler = withSchema(ListOrderRequestSchema, async (ctx) => {
  const projection = await ListOrderQuery.execute({
    page: ctx.query.page,
    pageSize: ctx.query.pageSize,
  });

  const dto = ListOrderDTO.fromProjection(projection);
  return Response.json(ListOrderResponseSchema.parse(dto));
});
```

Command path example:

```ts
export const submitOrderHandler = withSchema(SubmitOrderRequestSchema, async (ctx) => {
  const order = await SubmitOrderCommand.execute({
    orderId: ctx.body.orderId,
    paymentId: ctx.body.paymentId,
  });

  const dto = OrderDTO.fromEntity(order);
  return Response.json(SubmitOrderResponseSchema.parse(dto));
});
```

### 2. Projection

Projection is the query result model.

It is parallel to DTO, but it is not the external contract.

Projection rules:

- Projection is anemic and read-only
- Projection may use `SchemaClass`
- Projection has no forward creation logic
- Projection is only produced by `Query`
- Projection may be converted to DTO
- Projection files are named by the result model itself, for example `paged-order-id.projection.ts`

Recommended shape:

```ts
export class PagedOrderIdProjection extends SchemaClass({
  ids: z.array(z.string()),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
}) {}
```

### 3. DTO

DTO stays the single schema atom source.

With `SchemaClass`, the recommended DTO form in RavenJS is no longer "Schema + Type + Mapper" as three fully separate artifacts.

Instead, prefer:

- a DTO class declared with `SchemaClass(...)`
- a runtime `Schema` derived from that DTO shape
- `fromEntity` or `fromEntities` mapper methods

Recommended shape:

```ts
import { SchemaClass } from "@raven.js/schema-validator";
import { z } from "zod";

export class OrderDTO extends SchemaClass({
  id: z.string(),
  userId: z.string(),
  totalAmount: z.number(),
  createdAt: z.string(),
}) {
  static fromEntity(order: OrderEntity) {
    return new OrderDTO({
      id: order.id!,
      userId: order.userId,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt.toISOString(),
    });
  }
}
```

This gives:

- the class itself as the DTO type
- `_shape` as reusable schema atoms
- a full runtime schema can be built only where actual validation is needed

RavenJS note:

- `SchemaClass` is type inference only; it does not validate at runtime
- request validation must still use a real runtime schema with `withSchema()`
- response validation remains optional defensive validation
- avoid relying on `transform`, `coerce`, or `default` inside `SchemaClass` shapes unless a real runtime schema is applied separately
- Zod is a fine default because it works with `@raven.js/schema-validator`

DTO rules:

- DTO may aggregate multiple entities
- DTO may nest other DTO schema atoms
- DTO should expose schema atoms through `_shape`
- build `z.object(DTO._shape)` only at the usage site when a full runtime schema is actually needed
- DTO is required for both write responses and read views
- DTO must not import Raven APIs
- DTO is for transport shape, not business rules

`SchemaClass` is a good fit for DTOs because DTOs are mainly declaration and mapping objects.

It is not the right default base for entities, because entities usually need stronger invariants and explicit behavior-focused construction.

### 4. Entity

The entity layer is the business core for write-side behavior.

In the simplified version here, it mainly contains:

- entities
- repositories

This pattern intentionally uses a simplified, entity-centric model and refers to all business models uniformly as `Entity`.

Rules:

- pure TypeScript only
- no `Request`, `Response`, `RavenContext`, `BodyState`, `AppState`, or hooks
- entity should be a rich model with business behavior, not a data bag
- each entity should live in its own module
- repository stays with the entity module that owns write-side persistence
- repository only mediates entity persistence and reverse persistence
- use `static create()` for forward construction from input
- keep the constructor for reverse hydration from persistence
- entity methods usually mutate the current instance
- setter-like methods should usually return `void`
- cross-entity orchestration should not live inside entities

#### Forward vs Reverse Construction

Entity creation has two paths, and they should not be mixed.

- forward construction means input -> entity
- reverse construction means database record -> entity

Forward construction should go through `static create(...)`.

Why:

- request input is incomplete and business-oriented
- this is where invariant checks usually belong
- default fields such as `id`, `status`, `createdAt`, `updatedAt` are often assigned here

Reverse construction should go through the constructor.

Why:

- persistence data is already complete
- it is restoring an existing entity, not creating a new business fact
- constructor params usually match storage shape, not request shape
- this path should focus on hydration, not repeat create-time business validation

Typical rule:

- `create(...)` validates and initializes
- `constructor(record)` restores
- `load()` uses the constructor
- handler write paths use `create(...)`

Minimal example:

```ts
// order-item.entity.ts
export class OrderItemEntity {
  constructor(
    public readonly productId: string,
    public readonly productName: string,
    public readonly unitPrice: number,
    public readonly quantity: number,
  ) {}

  get amount() {
    return this.unitPrice * this.quantity;
  }
}
```

```ts
// order.entity.ts
import { OrderItemEntity } from "../order-item/order-item.entity";

export class OrderEntity {
  public id: string | null;
  public readonly userId: string;
  public status: "draft" | "submitted";
  public readonly items: OrderItemEntity[];
  public readonly createdAt: Date;
  public updatedAt: Date;

  static create(params: { userId: string }) {
    if (!params.userId) {
      throw new Error("userId is required");
    }

    const now = new Date();
    return new OrderEntity({
      id: crypto.randomUUID(),
      userId: params.userId,
      status: "draft",
      items: [],
      createdAt: now,
      updatedAt: now,
    });
  }

  constructor(record: {
    id: string | null;
    userId: string;
    status: "draft" | "submitted";
    items: OrderItemEntity[];
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.id = record.id;
    this.userId = record.userId;
    this.status = record.status;
    this.items = record.items;
    this.createdAt = record.createdAt;
    this.updatedAt = record.updatedAt;
  }

  addItem(item: OrderItemEntity): void {
    this.items.push(item);
    this.updatedAt = new Date();
  }

  submit(): void {
    if (this.status !== "draft") {
      throw new Error("order cannot be submitted");
    }

    if (this.items.length === 0) {
      throw new Error("order must contain at least one item");
    }

    this.status = "submitted";
    this.updatedAt = new Date();
  }

  get totalAmount() {
    return this.items.reduce((sum, item) => sum + item.amount, 0);
  }
}

// order.repository.ts
export namespace OrderRepository {
  export async function load(id: string) {
    const sql = DBState.getOrFailed();
    const [orderRow] =
      await sql`select id, user_id, status, created_at, updated_at from orders where id = ${id}`;

    if (!orderRow) {
      throw new Error("order not found");
    }

    const itemRows = await sql`
      select product_id, product_name, unit_price, quantity
      from order_items
      where order_id = ${id}
    `;

    return new OrderEntity({
      id: orderRow.id,
      userId: orderRow.user_id,
      status: orderRow.status,
      items: itemRows.map(
        (itemRow) =>
          new OrderItemEntity(
            itemRow.product_id,
            itemRow.product_name,
            itemRow.unit_price,
            itemRow.quantity,
          ),
      ),
      createdAt: orderRow.created_at,
      updatedAt: orderRow.updated_at,
    });
  }

  export async function save(order: OrderEntity) {
    const sql = DBState.getOrFailed();
    await sql`insert into orders ${sql({
      id: order.id,
      user_id: order.userId,
      status: order.status,
    })}`;
    return order;
  }
}
```

`bulkLoad` and `bulkSave` follow the same pattern.

Repository rules:

- use a namespace or function collection, not a class
- keep repository with the owning entity module
- default method set is `load`, `bulkLoad`, `save`, `bulkSave`
- do not expand repository into list/search/report style methods
- if an extra finder is unavoidable, it must still return the model itself
- `load` means the record must exist; if nullable semantics are needed, add a separate `find`
- if a result is no longer the model itself, it belongs to `Query + Projection`, not `Repository`
- repository may query, but only when it still returns the model itself
- in RavenJS, repository may directly read infra state such as `DBState`
- do not put request lifecycle logic into repository implementation

Pragmatic RavenJS note:

- `Entity` should stay pure
- `Repository` may be Raven-aware
- if a repository imports `DBState`, treat it as a persistence adapter that lives beside the entity layer, not as a pure entity object

### 5. Command

Command is the home for reusable write workflows.

Use it when one use case:

- writes multiple entities
- coordinates multiple repositories
- needs a clear transaction boundary
- is worth reusing across handlers, jobs, or consumers

Rules:

- Command files are flat and named by write intent, for example `submit-order.command.ts`
- Command orchestrates entities and repositories; it does not replace entity business rules
- Command must not become a SQL container
- Command must not return DTO directly
- Command may return `void`, an `Entity`, multiple entities, or a small result object
- if a write path only touches one entity and is not reused, the handler may stay direct

Minimal example:

```ts
// submit-order.command.ts
export namespace SubmitOrderCommand {
  export async function execute(params: {
    orderId: string;
    paymentId: string;
  }): Promise<OrderEntity> {
    const order = await OrderRepository.load(params.orderId);
    const payment = await PaymentRepository.load(params.paymentId);

    payment.capture();
    order.submit();

    await PaymentRepository.save(payment);
    await OrderRepository.save(order);

    return order;
  }
}
```

### 6. Query

Query is the home for complex reusable queries.

Rules:

- Query files are flat and named by query intent, for example `list-order.query.ts`
- Query always returns `Projection`
- even `ids` or `ids + meta` should be wrapped in `Projection`
- Query is for complex and reusable queries
- simple one-off SQL should usually stay in the handler
- Query must not return DTO directly
- Query must not hydrate Entity directly

Minimal example:

```ts
// list-order.query.ts
export namespace ListOrderQuery {
  export async function execute(params: {
    page: number;
    pageSize: number;
  }): Promise<PagedOrderIdProjection> {
    const sql = DBState.getOrFailed();
    const rows = await sql`
      select id
      from orders
      order by created_at desc
      limit ${params.pageSize}
      offset ${(params.page - 1) * params.pageSize}
    `;

    const [{ count }] = await sql`select count(*)::int as count from orders`;

    return new PagedOrderIdProjection({
      ids: rows.map((row) => row.id),
      total: count,
      page: params.page,
      pageSize: params.pageSize,
    });
  }
}
```

### 7. Infra

Infra is pure technical capability:

- SQL client
- external HTTP gateway
- cache
- mailer
- queue producer

Infra does not know about handlers, DTO, or Raven lifecycle.

### 8. Runtime Assembly

This is the RavenJS-specific layer.

It owns:

- app composition
- direct route registration
- plugin registration for reusable runtime concerns
- state declaration colocated with plugins
- lifecycle hook placement
- error-to-response mapping

This layer is the only place that should deeply know RavenJS.

---

## State Rules

RavenJS introduces runtime state. Use it carefully.

### `AppState`

Use `AppState` only for long-lived runtime dependencies:

- database client
- config
- cache client
- mailer
- feature flags

Do not use `AppState` as a business model store.

### `RequestState`

Use `RequestState` only for per-request derived context:

- current user
- tenant
- transaction
- trace id
- permission snapshot

Do not store persistent business data in `RequestState`.

### Declaration rules

In RavenJS, `State` should normally be declared together with the plugin that writes it.

Why:

- only plugins actually register and initialize runtime state
- only plugin `load()` has the framework-supported write path through `set(...)`
- colocating declaration and write ownership makes scope and lifecycle obvious

Recommended pattern:

```ts
// database.plugin.ts
export const DBState = defineAppState<Bun.SQL>({ name: "db" });

export function databasePlugin(config: Bun.SQL.Options) {
  return definePlugin({
    name: "database",
    load(_app, set) {
      set(DBState, new Bun.SQL(config));
    },
  });
}
```

```ts
// auth.plugin.ts
export const CurrentUserState = defineRequestState<User>({ name: "current-user" });

export function authPlugin() {
  return definePlugin({
    name: "auth",
    load(app, set) {
      app.beforeHandle(async () => {
        const token = HeadersState.getOrFailed().authorization;
        const user = await resolveCurrentUser(token);
        set(CurrentUserState, user);
      });
    },
  });
}
```

Do not create a standalone `raven/state/` directory by default.

### What can be declared separately?

Usually not `State` itself.

The thing that is sometimes worth declaring separately is a shared `ScopeKey`.

Keep all shared scope keys in one file when you need them:

```ts
// scopes.ts
export namespace ScopeKeys {
  export const ANALYTICS_DB = Symbol("analytics-db");
}
```

```ts
// app.ts
app.register(databasePlugin(analyticsConfig), ScopeKeys.ANALYTICS_DB);
```

```ts
// reporting.plugin.ts
const sql = DBState.in(ScopeKeys.ANALYTICS_DB).getOrFailed();
```

If a scope key is only used inside one plugin, keep it inline instead of extracting it.

### Preferred access pattern

At Raven runtime, dependency injection should primarily happen through `State`.

Use this split:

1. `AppState` for shared runtime dependencies such as database clients
2. `RequestState` for per-request derived context
3. plain constructor params only inside pure object construction

This keeps Raven's DI model consistent while still allowing entity objects to stay plain.

### Scope rules

When a dependency has multiple runtime instances:

- use `register(plugin, scopeKey)`
- read with `State.in(scopeKey)`

When a dependency is private to a plugin:

- use `app.use()` with a private `Symbol` scope

This matches Raven's existing plugin and state patterns.

---

## Runtime Registration

In RavenJS, runtime assembly should usually happen in `src/raven/app.ts`.

Use this split:

- register routes directly in `app.ts`
- use plugins for reusable runtime concerns
- register global `onError` handling in `app.ts` or a small reusable plugin
- keep feature code in `interface/`, not hidden behind route plugins by default

In practice, plugins here usually do one of two things:

- provide shared infra through `AppState`
- write per-request context through `RequestState`

Route handlers do not need to be wrapped in plugins by default.

Register them directly in `src/raven/app.ts` unless there is a concrete reason to hide route registration behind a plugin.

---

## Lifecycle Placement Rules

| Lifecycle        | Put Here                                                               | Do Not Put Here                                                  |
| ---------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `onRequest`      | logging, trace id, raw request guard, CORS, cheap rate limit           | logic that depends on route params, parsed body, validated input |
| `beforeHandle`   | auth, tenant resolution, transaction open, permission snapshot         | DTO mapping, entity construction, response shaping               |
| `handler`        | input-to-entity orchestration, command calls, query calls, DTO mapping | generic cross-cutting concerns shared by many routes             |
| `beforeResponse` | response headers, envelope, tracing headers                            | business decisions that should have happened earlier             |
| `onError`        | validation error mapping, business error mapping, fallback response    | core business logic                                              |
| `onLoaded`       | one-time startup checks and initialization                             | per-request logic                                                |

Important RavenJS constraint:

- if logic needs route `params`, `query`, or parsed `body`, prefer `beforeHandle`
- `onRequest` runs before full route context is assembled

---

## Composition Root Pattern

`src/raven/app.ts` should be the single composition root.

It should:

1. create the Raven app
2. register infra plugins
3. register context plugins
4. register routes directly
5. register global error mapping
6. export `await app.ready()`

Example shape:

```ts
const app = new Raven();

app.register(databasePlugin(process.env.DATABASE_URL!));
app.register(authPlugin());
app.register(errorPlugin());

app.post("/orders", createOrderHandler);
app.get("/orders/:id", getOrderHandler);

export const fetch = await app.ready();
```

This keeps framework assembly out of entity code and out of interface folders.

This is the default RavenJS style for this pattern:

- routes are visible in one place
- runtime concerns are still modular through plugins
- business code stays outside `app.ts`

---

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

- interface handler is enough for orchestration
- entity is enough for business rules

---

## Anti-Patterns

### 1. Entity imports Raven APIs

Bad:

- entity imports `RavenContext`
- repository imports `BodyState`
- entity method returns `Response`

Why it is wrong:

- entity layer becomes framework-coupled
- tests get heavier
- reuse gets harder

### 2. Repository as `AppState` by default

Bad:

- registering every repository into `AppState` even when it is just a thin DB wrapper
- handler requires a large manual `deps` object for ordinary Raven runtime dependencies

Why it is wrong:

- it adds ceremony without buying much
- it fights Raven's natural State-based DI style

### 3. Business logic in hooks

Bad:

- order confirmation logic in `beforeHandle`

Why it is wrong:

- hooks should prepare context, not replace entity behavior

### 4. Write handler bypasses entity rules

Bad:

- write handler updates business state with raw SQL and skips entity behavior

Why it is wrong:

- business rules become duplicated and transport-bound

Allowed:

- simple one-off SQL may stay in the handler
- reusable write workflows should move into `Command`
- complex reusable queries should move into `Query + Projection`

### 5. Massive all-in-one plugin

Bad:

- one plugin owns database, auth, billing, user, and all routes

Why it is wrong:

- composition becomes opaque
- reuse and scoped state isolation get harder

Related smell:

- moving ordinary route registration into plugins without gaining reuse or isolation

### 6. Using `onRequest` for route-aware logic

Bad:

- auth logic in `onRequest` that depends on `params.id`

Why it is wrong:

- route context is not fully assembled there
- use `beforeHandle` instead
