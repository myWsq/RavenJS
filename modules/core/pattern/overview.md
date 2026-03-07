# RavenJS Entity-Centric Pattern

This document is the entrypoint for the pattern. Read this file first, then go deeper by topic.

Use this document when the task is about business-facing RavenJS code structure: `interface`, `entity`, `repository`, `command`, `query`, `projection`, and `dto`.

## Reading Guide

- Overview: this file
- [Layer Responsibilities](./layer-responsibilities.md): handler, DTO, entity, repository, command, query, and projection rules
- [Runtime Assembly](./runtime-assembly.md): plugins, `AppState`, `RequestState`, lifecycle placement, and composition root
- [Conventions](./conventions.md): directory layout, naming, and optional extensions
- [Anti-Patterns](./anti-patterns.md): common mistakes and review smells

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
- `withSchema()` for request validation and optional response shaping
- lifecycle hooks for cross-cutting concerns
- clear repository/query boundaries:
  `Repository` handles entity persistence,
  `Command` orchestrates reusable write workflows,
  `Query` returns `Projection` for complex reusable queries,
  `Projection` models query results,
  and `DTO` remains the external contract

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
- `Repository.save(...)` should persist the entity's already-explicit state, not assign business-visible fields implicitly as a side effect
- if a write workflow spans multiple entities and is worth reusing, use `Command`
- `Repository` may query, but only when the result is still that model itself
- if the result is cascading, aggregated, joined, or otherwise no longer "the model itself", use `Query + Projection`
- not every write workflow needs a `Command`
- only extract a `Command` when the write logic is both reusable and beyond a single entity path
- not every SQL statement needs a `Query`
- only extract a `Query` when the SQL is both complex and worth reusing
- DTO remains the external contract at the interface boundary

## Core Concepts

| Concept            | Responsibility                                                     | RavenJS Mapping                                                                |
| ------------------ | ------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| `Interface Unit`   | One API entrypoint, including input schema, output schema, handler | single exported interface object + `withSchema()` handler + route registration |
| `Entity`           | Pure in-memory business model and behavior                         | plain TypeScript class/value object                                            |
| `Repository`       | Persistence and hydration for an entity itself                     | object or function collection, usually reading infra from `AppState`           |
| `Command`          | Reusable write workflow orchestration                              | object or function collection                                                  |
| `Query`            | Complex reusable query logic                                       | object or function collection                                                  |
| `Projection`       | Read-only query result model                                       | `SchemaClass` model                                                            |
| `DTO`              | Schema atom, TS type, entity-to-JSON mapper                        | `SchemaClass` + runtime `Schema` + mapper                                      |
| `Infra`            | Database client, external gateway, cache, mailer                   | plain technical adapters                                                       |
| `Runtime Assembly` | Composition root, plugins, colocated states, hooks, error mapping  | `definePlugin`, plugin-local `AppState`, `RequestState`, lifecycle hooks       |

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
│  create-order.interface.ts                                   │
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

## Default Flow

### Write Path

1. Interface validates request input.
2. Handler either constructs an entity directly or delegates to a `Command`.
3. Entity owns the business rule transitions.
4. Repository persists the entity's current explicit state.
5. Handler maps the final result to a DTO and either returns that DTO through `withSchema(...response)` or builds a manual `Response` when HTTP details must be customized.

### Read Path

1. Interface validates query, params, or headers.
2. Handler calls a `Query` when the read is complex and reusable.
3. Query returns a `Projection`.
4. Handler maps the projection to a DTO.
5. Handler builds the response.

## Adoption Rules

- Keep handler code schema-aware and business-light.
- Keep entity code pure TypeScript.
- Keep repository focused on entity persistence and hydration.
- Prefer invariants that are explicit in code before persistence; avoid patterns that require `save()` to backfill ids or similar fields invisibly.
- Use `Command` only for reusable multi-entity write workflows.
- Use `Query + Projection` only for complex reusable reads.
- Keep `DTO` as the transport contract at the boundary.
- Keep RavenJS-specific concerns inside runtime assembly.

## Next Read

- If you are shaping handlers or deciding where logic belongs, read [Layer Responsibilities](./layer-responsibilities.md).
- If you are wiring plugins, states, hooks, or the app entrypoint, read [Runtime Assembly](./runtime-assembly.md).
- If you are naming files, arranging folders, or choosing lightweight extensions, read [Conventions](./conventions.md).
- If you are reviewing for common mistakes or design smells, read [Anti-Patterns](./anti-patterns.md).
