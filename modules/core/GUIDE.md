# REQUIRED READING

To understand the architecture, concepts, API, and usage, read:

- [README.md](./README.md)
- [index.ts](./index.ts)
- [app/raven.ts](./app/raven.ts)

# SOURCE MAP

| Document                                                                  | Read when…                                                                                                |
| ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| [app/types.ts](./app/types.ts)                                            | You need the public handler / hook / plugin type surface.                                                 |
| [runtime/dispatch-request.ts](./runtime/dispatch-request.ts)              | You want the end-to-end request lifecycle entry.                                                          |
| [runtime/load-plugins.ts](./runtime/load-plugins.ts)                      | You need to understand `ready()`, plugin load order, or setter injection.                                 |
| [state/descriptors.ts](./state/descriptors.ts)                            | You need `AppState` / `RequestState` / `StateSetter` / `StateView`.                                       |
| [state/storage.ts](./state/storage.ts)                                    | You need the AsyncLocalStorage and scope map layer.                                                       |
| [state/builtins.ts](./state/builtins.ts)                                  | You need built-in states like `RavenContext`, `ParamsState`, `QueryState`.                                |
| [schema/with-schema.ts](./schema/with-schema.ts)                          | You need `withSchema` and schema-aware handler wrapping.                                                  |
| [schema/validation.ts](./schema/validation.ts)                            | You need `ValidationError` or request validation flow.                                                    |
| [schema/schema-class.ts](./schema/schema-class.ts)                        | You need `SchemaClass` DTO-style inference.                                                               |
| [schema/standard-schema.ts](./schema/standard-schema.ts)                  | You need to integrate Zod/Valibot or implement Standard Schema support.                                   |
| [routing/radix-router.ts](./routing/radix-router.ts)                      | You need to understand or extend route matching.                                                          |
| [context/context.ts](./context/context.ts)                                | You need the request context shape.                                                                       |
| [error/raven-error.ts](./error/raven-error.ts)                            | You need the framework error model.                                                                       |
| [PLUGIN.md](./PLUGIN.md)                                                  | You are creating a plugin — covers `definePlugin`, all three state patterns, and plugin-specific gotchas. |
| [Bun Full Stack Documentation](https://bun.com/docs/bundler/fullstack.md) | You need to understand how to use Bun's full stack features alongside Raven's fetch handler.              |
