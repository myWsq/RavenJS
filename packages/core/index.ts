// =============================================================================
// Public API - 用户应该使用的导出
// =============================================================================

// Core
export { Raven, Context, RavenContext } from "./main.ts";

// Error Handling
export { RavenError, isRavenError } from "./main.ts";

// State Management
export {
  createAppState,
  createRequestState,
  ScopedState,
  AppState,
  RequestState,
  BodyState,
  QueryState,
  ParamsState,
  HeadersState,
} from "./main.ts";

// Handler & Plugin
export { createHandler, createPlugin, HandlerBuilder } from "./main.ts";

// JTD Schema Builder & Type Inference
export { J, useBody, useQuery, useParams, useHeaders } from "./main.ts";

// Types
export type {
  ServerConfig,
  StateOptions,
  ErrorContext,
  Handler,
  HandlerFn,
  Plugin,
  OnRequestHook,
  BeforeHandleHook,
  BeforeResponseHook,
  OnErrorHook,
  JTDSchema,
  JTDType,
  Infer,
} from "./main.ts";

// =============================================================================
// Internal API - 框架内部或测试使用，不建议用户直接使用
// =============================================================================

export {
  currentAppStorage,
  requestStorage,
  RadixRouter,
  BunAdapter,
  NodeAdapter,
} from "./main.ts";

export type {
  RavenInstance,
  ServerAdapter,
  RouteMatch,
  RoutePipeline,
} from "./main.ts";
