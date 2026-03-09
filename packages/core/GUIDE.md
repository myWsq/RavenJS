# REQUIRED READING

To understand the public API, runtime entrypoints, and source layout, read:

- [README.md](./README.md)
- [index.ts](./index.ts)
- [app/raven.ts](./app/raven.ts)

# PATTERN ENTRYPOINTS

Use the docs above to learn the public surface and source map. When the task is about how RavenJS code should be organized, switch to the pattern docs:

- Business code (`interface`, `entity`, `repository`, `command`, `query`, `dto`, query-result mapping) → [pattern/overview.md](./pattern/overview.md), then [pattern/layer-responsibilities.md](./pattern/layer-responsibilities.md), [pattern/conventions.md](./pattern/conventions.md), and [pattern/anti-patterns.md](./pattern/anti-patterns.md)
- Runtime assembly (`<app_root>/app.ts`, plugins, states, scopes, hooks) → [pattern/runtime-assembly.md](./pattern/runtime-assembly.md)
- Concrete plugin example → see the SQL plugin example in [pattern/runtime-assembly.md](./pattern/runtime-assembly.md) for a minimal database plugin that combines `defineAppState`, `definePlugin`, and `Bun.SQL`
- Review or final self-check → [pattern/anti-patterns.md](./pattern/anti-patterns.md)

For Agents, apply this boundary language while reading the pattern docs:

- `transport validation` lives in interface schema
- `domain invariants` live in entity behavior
- `persistence constraints` live in repository / DB

Quick test: if a rule still matters after HTTP disappears, it belongs in the entity.

# SOURCE MAP

| Document                                                                         | Read when…                                                                                                |
| -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| [app/types.ts](./app/types.ts)                                                   | You need the public handler / hook / plugin type surface.                                                 |
| [runtime/dispatch-request.ts](./runtime/dispatch-request.ts)                     | You want the end-to-end request lifecycle entry.                                                          |
| [runtime/handle-response-validation.ts](./runtime/handle-response-validation.ts) | You need the non-blocking response schema mismatch hook flow.                                             |
| [runtime/load-plugins.ts](./runtime/load-plugins.ts)                             | You need to understand `ready()`, plugin load order, or setter injection.                                 |
| [state/descriptors.ts](./state/descriptors.ts)                                   | You need `AppState` / `RequestState` / `StateSetter` / `StateView`.                                       |
| [state/storage.ts](./state/storage.ts)                                           | You need the AsyncLocalStorage and scope map layer.                                                       |
| [state/builtins.ts](./state/builtins.ts)                                         | You need built-in states like `RavenContext`, `ParamsState`, `QueryState`.                                |
| [schema/with-schema.ts](./schema/with-schema.ts)                                 | You need `withSchema`, schema-aware handler wrapping, or response DTO serialization.                      |
| [schema/validation.ts](./schema/validation.ts)                                   | You need `ValidationError` or request/response validation flow.                                           |
| [schema/schema-class.ts](./schema/schema-class.ts)                               | You need `SchemaClass` DTO-style inference.                                                               |
| [schema/standard-schema.ts](./schema/standard-schema.ts)                         | You need to integrate Zod/Valibot or implement Standard Schema support.                                   |
| [routing/radix-router.ts](./routing/radix-router.ts)                             | You need to understand or extend route matching.                                                          |
| [context/context.ts](./context/context.ts)                                       | You need the request context shape.                                                                       |
| [error/raven-error.ts](./error/raven-error.ts)                                   | You need the framework error model.                                                                       |
| [PLUGIN.md](./PLUGIN.md)                                                         | You are creating a plugin — covers `definePlugin`, all three state patterns, and plugin-specific gotchas. |
| [Bun Full Stack Documentation](https://bun.com/docs/bundler/fullstack.md)        | You need to understand how to use Bun's full stack features alongside Raven's fetch handler.              |
