export { Raven, definePlugin } from "./app/raven.ts";
export {
  defineContract,
  isSerializableContractSchema,
  materializeContractSchema,
  materializeContractSchemas,
  type AnyContract,
  type Contract,
  type ContractSchemaKey,
  type ContractSchemas,
  type HttpMethod,
  type InferContractBodyInput,
  type InferContractHeadersInput,
  type InferContractParamsInput,
  type InferContractQueryInput,
  type InferContractResponseOutput,
  type MaterializedContractSchemas,
  type RavenContractArtifact,
  type RavenContractBundle,
  type RavenContractSchemaRef,
  type RavenContractSchemaRefs,
  type RequestContractSchemaKey,
  type SerializableContractSchema,
  type SerializableContractSchemas,
} from "./contract/index.ts";

export type {
  BeforeHandleHook,
  BeforeResponseHook,
  FetchHandler,
  Handler,
  OnErrorHook,
  OnLoadedHook,
  OnRequestHook,
  OnResponseValidationErrorHook,
  Plugin,
  ResponseValidationFailure,
  RavenInstance,
  RouteHandler,
} from "./app/types.ts";

export { Context } from "./context/context.ts";
export { RavenError, isRavenError, type ErrorContext } from "./error/raven-error.ts";

export {
  AppState,
  RequestState,
  ScopedState,
  defineAppState,
  defineRequestState,
  internalSet,
  type StateOptions,
  type StateSetter,
  type StateView,
} from "./state/descriptors.ts";
export {
  BodyState,
  HeadersState,
  ParamsState,
  QueryState,
  RavenContext,
} from "./state/builtins.ts";
export { currentAppStorage, requestStorage, type ScopeKey } from "./state/storage.ts";

export { RadixRouter, type RouteMatch } from "./routing/radix-router.ts";
export { registerContractRoute } from "./routing/register-contract-route.ts";

export {
  isSchemaAwareHandler,
  withSchema,
  type AnySchemaAwareHandler,
  type AnySchemas,
  type SchemaAwareHandler,
  type SchemaContext,
  type SchemaHandler,
  type Schemas,
  type ValidationSource,
} from "./schema/with-schema.ts";
export { SchemaClass } from "./schema/schema-class.ts";
export { ValidationError, isValidationError, validateRequestSchemas } from "./schema/validation.ts";
export {
  isStandardJSONSchema,
  materializeStandardJSONSchema,
  type CombinedSchemaV1,
  type JsonSchemaDirection,
  type StandardJSONSchemaV1,
  type StandardTypedV1,
} from "./schema/standard-json-schema.ts";
export type { StandardSchemaV1 } from "./schema/standard-schema.ts";
