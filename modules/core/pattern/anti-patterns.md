# Anti-Patterns

Read the [overview](./overview.md) first if you want the big picture before the review-style failure modes.

This document is the compact reference for common design mistakes when applying the RavenJS entity-centric pattern.

Use this document during review or final self-check to catch boundary mistakes before you finish a change.

## 1. Entity Imports Raven APIs

Bad:

- entity imports `RavenContext`
- repository imports `BodyState`
- entity method returns `Response`

Why it is wrong:

- entity layer becomes framework-coupled
- tests get heavier
- reuse gets harder

## 2. Repository as `AppState` by Default

Bad:

- registering every repository into `AppState` even when it is just a thin DB wrapper
- handler requires a large manual `deps` object for ordinary Raven runtime dependencies

Why it is wrong:

- it adds ceremony without buying much
- it fights Raven's natural State-based DI style

## 3. Business Logic in Hooks

Bad:

- order confirmation logic in `beforeHandle`

Why it is wrong:

- hooks should prepare context, not replace entity behavior

## 4. Write Handler Bypasses Entity Rules

Bad:

- write handler updates business state with raw SQL and skips entity behavior

Why it is wrong:

- business rules become duplicated and transport-bound

Allowed:

- simple one-off SQL may stay in the handler
- reusable write workflows should move into `Command`
- complex reusable queries should move into `Query + Projection`

## 5. Massive All-in-One Plugin

Bad:

- one plugin owns database, auth, billing, user, and all routes

Why it is wrong:

- composition becomes opaque
- reuse and scoped state isolation get harder

Related smell:

- moving ordinary route registration into plugins without gaining reuse or isolation

## 6. Using `onRequest` for Route-Aware Logic

Bad:

- auth logic in `onRequest` that depends on `params.id`

Why it is wrong:

- route context is not fully assembled there
- use `beforeHandle` instead

## 7. Repository `save()` Mutates Business Fields Implicitly

Bad:

- `save()` assigns `entity.id`, timestamps, or other business-visible fields as a hidden side effect
- DTO mapping relies on `save()` having mutated the same entity instance behind the scenes

Why it is wrong:

- business invariants become implicit instead of visible in code
- mappers and handlers need non-null assertions or lifecycle knowledge to look safe
- persistence and domain state changes get coupled in a way that is harder to reason about

Prefer:

- assign ids and other create-time defaults explicitly during forward construction
- let `save()` persist the current explicit state
- if persistence-generated values must be observed, expose them via an explicit reload or hydration step
