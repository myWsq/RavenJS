// =============================================================================
// SECTION: Imports
// =============================================================================

import { AsyncLocalStorage } from "node:async_hooks";
import { RadixRouter } from "./router.ts";
import {
  isSchemaAwareHandler,
  validateRequestSchemas,
  type AnySchemaAwareHandler,
  type AnySchemas,
  type SchemaAwareHandler,
} from "./schema.ts";

// =============================================================================
// SECTION: Types & Interfaces
// =============================================================================

/**
 * Additional context information for errors.
 */
export interface ErrorContext {
  [key: string]: unknown;
}

/**
 * Scope key type for plugin-scoped state.
 */
export type ScopeKey = string | symbol;

/**
 * A scope-pinned read handle returned by `State.in(scopeKey)`.
 * Has no `in()` — scope is fixed at creation time.
 */
export interface StateView<T> {
  get(): T | undefined;
  getOrFailed(): T;
}

/**
 * Setter function provided to plugin.load() for writing state values.
 * Scope-bound: always writes to the scope determined at register() time.
 */
export type StateSetter = <T>(state: ScopedState<T>, value: T) => void;

/**
 * Core interface representing a Raven application instance.
 */
export interface RavenInstance {
  /** Internal storage for scoped application-level state. */
  scopedStateMaps: Map<ScopeKey, Map<symbol, any>>;
}

/**
 * Options for defining a new state.
 */
export interface StateOptions {
  /** Optional name for the state, useful for debugging. */
  name?: string;
}

/**
 * Standard FetchHandler type - a function that takes a Request and returns a Response.
 * Raven.handle implements this interface.
 */
export type FetchHandler = (request: Request) => Response | Promise<Response>;

/**
 * Request handler function type.
 */
export type Handler = () => Response | Promise<Response>;
export type RouteHandler = Handler | AnySchemaAwareHandler;

/**
 * Hook executed when a request is first received.
 * Returning a Response will short-circuit the request lifecycle.
 */
export type OnRequestHook = (request: Request) => void | Response | Promise<void | Response>;

/**
 * Hook executed before the main route handler.
 * Returning a Response will short-circuit the request lifecycle.
 */
export type BeforeHandleHook = () => void | Response | Promise<void | Response>;

/**
 * Hook executed before the response is sent to the client.
 * Can return a new Response to override the outgoing response.
 */
export type BeforeResponseHook = (response: Response) => void | Response | Promise<void | Response>;

/**
 * Hook executed when an error occurs during the request lifecycle.
 * Should return a Response to send to the client.
 */
export type OnErrorHook = (error: Error) => Response | Promise<Response> | void | Promise<void>;

/**
 * Hook executed after application plugins are fully loaded.
 * Runs once before the app starts serving requests.
 */
export type OnLoadedHook = (app: Raven) => void | Promise<void>;

/** Internal route data structure. */
interface RouteData {
  handler: Handler;
  schemas?: AnySchemas;
}

/**
 * Plugin object type for extending the Raven instance.
 */
export interface Plugin {
  /** Plugin name, shown in error messages for attribution. */
  name: string;
  /** Called during registration to set up routes, hooks, and initial state. */
  load(app: Raven, set: StateSetter): void | Promise<void>;
}

// =============================================================================
// SECTION: Error Handling
// =============================================================================

/**
 * Custom error class for Raven framework errors.
 */
export class RavenError extends Error {
  public readonly code: string;
  public readonly context: ErrorContext;
  public readonly statusCode?: number;
  public override readonly cause?: unknown;

  private constructor(code: string, message: string, context: ErrorContext, statusCode?: number) {
    super(message);
    this.code = code;
    this.context = context;
    this.statusCode = statusCode;
  }

  public setContext(context: ErrorContext): this {
    Object.assign(this.context, context);
    return this;
  }

  public static ERR_STATE_NOT_INITIALIZED(name: string): RavenError {
    return new RavenError(
      "ERR_STATE_NOT_INITIALIZED",
      `State is not initialized. Cannot access state: ${name}`,
      {},
    );
  }

  public static ERR_STATE_CANNOT_SET(name: string): RavenError {
    return new RavenError(
      "ERR_STATE_CANNOT_SET",
      `Cannot set value for state "${name}": Scope is not initialized.`,
      {},
    );
  }

  public static ERR_BAD_REQUEST(message: string): RavenError {
    return new RavenError("ERR_BAD_REQUEST", message, {}, 400);
  }

  public static ERR_UNKNOWN_ERROR(message: string): RavenError {
    return new RavenError("ERR_UNKNOWN_ERROR", message, {}, 500);
  }

  public toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      context: this.context,
      statusCode: this.statusCode,
      cause: this.cause,
      stack: this.stack,
    };
  }

  public toResponse(): Response {
    const status = this.statusCode ?? 500;
    return new Response(JSON.stringify({ message: this.message }), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }
}

Object.defineProperty(RavenError.prototype, "name", {
  value: "RavenError",
  writable: true,
  configurable: true,
});

/**
 * Type guard to check if a value is a RavenError.
 */
export function isRavenError(value: unknown): value is RavenError {
  return value instanceof RavenError;
}

// =============================================================================
// SECTION: Context & State Management
// =============================================================================

/**
 * Represents the current request context.
 */
export class Context {
  public readonly url: URL;

  constructor(
    public readonly request: Request,
    public params: Record<string, string> = {},
    public query: Record<string, string> = {},
  ) {
    this.url = new URL(request.url);
  }

  get method(): string {
    return this.request.method;
  }

  get headers(): Headers {
    return this.request.headers;
  }

  get body(): ReadableStream<Uint8Array> | null {
    return this.request.body;
  }
}

/** Storage for the current application instance. */
export const currentAppStorage = new AsyncLocalStorage<RavenInstance>();
/** Storage for the current request's scoped state maps. */
export const requestStorage = new AsyncLocalStorage<Map<ScopeKey, Map<symbol, any>>>();

/** Default scope key used when no scopeKey is specified at register(). */
const GLOBAL_SCOPE: unique symbol = Symbol("raven:global");

let stateCounter = 0;

function getOrCreateScopeMap(
  parent: Map<ScopeKey, Map<symbol, any>>,
  key: ScopeKey,
): Map<symbol, any> {
  let map = parent.get(key);
  if (!map) {
    map = new Map<symbol, any>();
    parent.set(key, map);
  }
  return map;
}

/**
 * Base class for state descriptors (AppState, RequestState).
 * Provides identity (symbol/name), global-scope get/getOrFailed, and the in() factory.
 * Writing is done exclusively via StateSetter in plugin.load().
 */
export abstract class ScopedState<T> {
  public readonly symbol: symbol;
  public readonly name: string;

  constructor(options?: StateOptions) {
    this.name = options?.name ?? `state:${++stateCounter}`;
    this.symbol = Symbol(this.name);
  }

  /** Reads from the GLOBAL scope. */
  public abstract get(): T | undefined;

  /** Returns a scope-pinned read handle. The handle has no in() — scope is fixed. */
  public abstract in(scopeKey: ScopeKey): StateView<T>;

  /** Reads from the GLOBAL scope, throwing if not initialized. */
  public getOrFailed(): T {
    const value = this.get();
    if (value === undefined) {
      throw RavenError.ERR_STATE_NOT_INITIALIZED(this.name);
    }
    return value;
  }
}

// ── AppState ──────────────────────────────────────────────────────────────────

class AppStateView<T> implements StateView<T> {
  constructor(
    private readonly descriptor: AppState<T>,
    private readonly scope: ScopeKey,
  ) {}

  public get(): T | undefined {
    const app = currentAppStorage.getStore();
    return app?.scopedStateMaps.get(this.scope)?.get(this.descriptor.symbol);
  }

  public getOrFailed(): T {
    const value = this.get();
    if (value === undefined) {
      throw RavenError.ERR_STATE_NOT_INITIALIZED(this.descriptor.name);
    }
    return value;
  }
}

/**
 * Application-scoped state descriptor.
 * Shared across the entire application instance; isolated per Raven instance.
 */
export class AppState<T> extends ScopedState<T> {
  private readonly _views = new Map<ScopeKey, AppStateView<T>>();

  public override get(): T | undefined {
    const app = currentAppStorage.getStore();
    return app?.scopedStateMaps.get(GLOBAL_SCOPE)?.get(this.symbol);
  }

  public override in(scopeKey: ScopeKey): AppStateView<T> {
    if (!this._views.has(scopeKey)) {
      this._views.set(scopeKey, new AppStateView<T>(this, scopeKey));
    }
    return this._views.get(scopeKey)!;
  }
}

// ── RequestState ──────────────────────────────────────────────────────────────

class RequestStateView<T> implements StateView<T> {
  constructor(
    private readonly descriptor: RequestState<T>,
    private readonly scope: ScopeKey,
  ) {}

  public get(): T | undefined {
    const store = requestStorage.getStore();
    return store?.get(this.scope)?.get(this.descriptor.symbol);
  }

  public getOrFailed(): T {
    const value = this.get();
    if (value === undefined) {
      throw RavenError.ERR_STATE_NOT_INITIALIZED(this.descriptor.name);
    }
    return value;
  }
}

/**
 * Request-scoped state descriptor.
 * Isolated to a single HTTP request lifecycle.
 */
export class RequestState<T> extends ScopedState<T> {
  private readonly _views = new Map<ScopeKey, RequestStateView<T>>();

  public override get(): T | undefined {
    const store = requestStorage.getStore();
    return store?.get(GLOBAL_SCOPE)?.get(this.symbol);
  }

  public override in(scopeKey: ScopeKey): RequestStateView<T> {
    if (!this._views.has(scopeKey)) {
      this._views.set(scopeKey, new RequestStateView<T>(this, scopeKey));
    }
    return this._views.get(scopeKey)!;
  }
}

// ── Factories ─────────────────────────────────────────────────────────────────

/** Defines a new application-scoped state descriptor. */
export function defineAppState<T>(options?: StateOptions): AppState<T> {
  return new AppState<T>(options);
}

/** Defines a new request-scoped state descriptor. */
export function defineRequestState<T>(options?: StateOptions): RequestState<T> {
  return new RequestState<T>(options);
}

/**
 * Internal setter for framework-owned states. Writes to GLOBAL_SCOPE only.
 * Not exported — only used within this module.
 */
function internalSet<T>(state: ScopedState<T>, value: T): void {
  if (state instanceof AppState) {
    const app = currentAppStorage.getStore();
    if (!app) throw RavenError.ERR_STATE_CANNOT_SET(state.name);
    getOrCreateScopeMap(app.scopedStateMaps, GLOBAL_SCOPE).set(state.symbol, value);
  } else if (state instanceof RequestState) {
    const reqMap = requestStorage.getStore();
    if (!reqMap) throw RavenError.ERR_STATE_CANNOT_SET(state.name);
    getOrCreateScopeMap(reqMap, GLOBAL_SCOPE).set(state.symbol, value);
  }
}

// Predefined Request States
export const RavenContext = defineRequestState<Context>({ name: "raven:context" });
export const BodyState = defineRequestState<unknown>({ name: "raven:body" });
export const QueryState = defineRequestState<Record<string, string>>({ name: "raven:query" });
export const ParamsState = defineRequestState<Record<string, string>>({ name: "raven:params" });
export const HeadersState = defineRequestState<Record<string, string>>({ name: "raven:headers" });

// Re-export router types for consumers
export { RadixRouter, type RouteMatch } from "./router.ts";
export * from "./schema.ts";
export type { StandardSchemaV1 } from "./standard-schema.ts";

// =============================================================================
// SECTION: Server Adapters
// =============================================================================

// =============================================================================
// SECTION: Core Framework
// =============================================================================

/**
 * Utility function to define a plugin with correct type checking.
 * Identity function; exists solely as a typing convenience.
 */
export function definePlugin(plugin: Plugin): Plugin {
  return plugin;
}

/**
 * Main application class for the Raven framework.
 */
export class Raven implements RavenInstance {
  private router: RadixRouter<RouteData>;
  public readonly scopedStateMaps = new Map<ScopeKey, Map<symbol, any>>();

  private hooks = {
    onRequest: [] as OnRequestHook[],
    beforeHandle: [] as BeforeHandleHook[],
    beforeResponse: [] as BeforeResponseHook[],
    onError: [] as OnErrorHook[],
    onLoaded: [] as OnLoadedHook[],
  };
  private pendingPlugins: Array<{ plugin: Plugin; scopeKey?: ScopeKey }> = [];
  private buildPromise: Promise<FetchHandler> | null = null;

  constructor() {
    this.router = new RadixRouter<RouteData>();
  }

  private getOrCreateScopeMap(key: ScopeKey): Map<symbol, any> {
    return getOrCreateScopeMap(this.scopedStateMaps, key);
  }

  private makeSet(scope: ScopeKey): StateSetter {
    return <T>(state: ScopedState<T>, value: T): void => {
      if (state instanceof AppState) {
        this.getOrCreateScopeMap(scope).set(state.symbol, value);
      } else if (state instanceof RequestState) {
        const reqMap = requestStorage.getStore();
        if (reqMap) {
          getOrCreateScopeMap(reqMap, scope).set(state.symbol, value);
        }
      }
    };
  }

  /**
   * Queues a plugin for loading. Plugins are loaded in order during ready().
   * @param plugin The plugin object to register.
   * @param scopeKey Optional scope key for isolating this plugin's state.
   */
  register(plugin: Plugin, scopeKey?: ScopeKey): this {
    this.pendingPlugins.push({ plugin, scopeKey });
    return this;
  }

  /**
   * Immediately loads a plugin, running its load() function right away.
   * Unlike register(), use() executes synchronously within the current load phase,
   * so state set by the plugin is available immediately after awaiting.
   * Intended for use inside another plugin's load() to declare inline dependencies.
   * @param plugin The plugin object to load.
   * @param scopeKey Optional scope key for isolating this plugin's state.
   */
  async use(plugin: Plugin, scopeKey?: ScopeKey): Promise<void> {
    const scope: ScopeKey = scopeKey ?? GLOBAL_SCOPE;
    try {
      await plugin.load(this, this.makeSet(scope));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`[${plugin.name}] Plugin load failed: ${message}`, { cause: err });
    }
  }

  /**
   * Initialises the application: runs all plugin loads in order, then fires onLoaded hooks.
   * Returns a FetchHandler ready for use with Bun.serve / Deno.serve / etc.
   * Calling ready() multiple times returns the same promise.
   */
  async ready(): Promise<FetchHandler> {
    if (this.buildPromise) return this.buildPromise;

    this.buildPromise = currentAppStorage.run(this, async () => {
      for (const { plugin, scopeKey } of this.pendingPlugins) {
        const scope: ScopeKey = scopeKey ?? GLOBAL_SCOPE;
        try {
          await plugin.load(this, this.makeSet(scope));
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          throw new Error(`[${plugin.name}] Plugin load failed: ${message}`, { cause: err });
        }
      }

      for (const hook of this.hooks.onLoaded) {
        await hook(this);
      }

      return (request: Request) => this.dispatchRequest(request);
    });

    return this.buildPromise;
  }

  private addRoute(method: string, path: string, handler: RouteHandler) {
    if (isSchemaAwareHandler(handler)) {
      this.router.add(method, path, {
        handler: () =>
          handler.handler({
            body: BodyState.get(),
            query: (QueryState.get() ?? {}) as any,
            params: (ParamsState.get() ?? {}) as any,
            headers: (HeadersState.get() ?? {}) as any,
          }),
        schemas: handler.schemas,
      });
      return;
    }

    this.router.add(method, path, { handler });
  }

  get(path: string, handler: Handler): this;
  get<B, Q, P, H>(path: string, handler: SchemaAwareHandler<B, Q, P, H>): this;
  get(path: string, handler: RouteHandler): this {
    this.addRoute("GET", path, handler);
    return this;
  }

  post(path: string, handler: Handler): this;
  post<B, Q, P, H>(path: string, handler: SchemaAwareHandler<B, Q, P, H>): this;
  post(path: string, handler: RouteHandler): this {
    this.addRoute("POST", path, handler);
    return this;
  }

  put(path: string, handler: Handler): this;
  put<B, Q, P, H>(path: string, handler: SchemaAwareHandler<B, Q, P, H>): this;
  put(path: string, handler: RouteHandler): this {
    this.addRoute("PUT", path, handler);
    return this;
  }

  delete(path: string, handler: Handler): this;
  delete<B, Q, P, H>(path: string, handler: SchemaAwareHandler<B, Q, P, H>): this;
  delete(path: string, handler: RouteHandler): this {
    this.addRoute("DELETE", path, handler);
    return this;
  }

  patch(path: string, handler: Handler): this;
  patch<B, Q, P, H>(path: string, handler: SchemaAwareHandler<B, Q, P, H>): this;
  patch(path: string, handler: RouteHandler): this {
    this.addRoute("PATCH", path, handler);
    return this;
  }

  onRequest(hook: OnRequestHook): this {
    this.hooks.onRequest.push(hook);
    return this;
  }

  beforeHandle(hook: BeforeHandleHook): this {
    this.hooks.beforeHandle.push(hook);
    return this;
  }

  beforeResponse(hook: BeforeResponseHook): this {
    this.hooks.beforeResponse.push(hook);
    return this;
  }

  onError(hook: OnErrorHook): this {
    this.hooks.onError.push(hook);
    return this;
  }

  onLoaded(hook: OnLoadedHook): this {
    this.hooks.onLoaded.push(hook);
    return this;
  }

  private async dispatchRequest(request: Request): Promise<Response> {
    return currentAppStorage.run(this, () => {
      return requestStorage.run(new Map<ScopeKey, Map<symbol, any>>(), async () => {
        try {
          for (const hook of this.hooks.onRequest) {
            const result = await hook(request);
            if (result instanceof Response) return result;
          }

          const url = new URL(request.url);
          const match = this.router.find(request.method, url.pathname);
          if (!match) {
            internalSet(RavenContext, new Context(request));
            return this.handleError(new Error("Not Found"), 404);
          }

          const { data: routeData, params } = match;
          const query: Record<string, string> = {};
          url.searchParams.forEach((value, key) => {
            query[key] = value;
          });

          internalSet(RavenContext, new Context(request, params, query));
          await this.processStates(request, params, query, routeData.schemas);

          for (const hook of this.hooks.beforeHandle) {
            const result = await hook();
            if (result instanceof Response) return this.handleResponseHooks(result);
          }

          return this.handleResponseHooks(await routeData.handler());
        } catch (error) {
          if (!RavenContext.get()) {
            internalSet(RavenContext, new Context(request));
          }
          return this.handleError(
            error instanceof Error ? error : RavenError.ERR_UNKNOWN_ERROR(String(error)),
          );
        }
      });
    });
  }

  private async processStates(
    request: Request,
    params: Record<string, string>,
    query: Record<string, string>,
    schemas?: AnySchemas,
  ): Promise<void> {
    const headersObj: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headersObj[key.toLowerCase()] = value;
    });

    const contentType = request.headers.get("content-type") || "";
    let bodyData: unknown;
    if (contentType.includes("application/json")) {
      try {
        bodyData = await request.json();
      } catch (err) {
        throw RavenError.ERR_BAD_REQUEST(
          `Invalid JSON body: ${err instanceof Error ? err.message : "parse error"}`,
        );
      }
    }

    const validated = await validateRequestSchemas(schemas, {
      body: bodyData,
      query,
      params,
      headers: headersObj,
    });

    internalSet(ParamsState, validated.params as any);
    internalSet(QueryState, validated.query as any);
    internalSet(HeadersState, validated.headers as any);
    if (validated.body !== undefined) {
      internalSet(BodyState, validated.body);
    }
  }

  private async handleResponseHooks(response: Response): Promise<Response> {
    let current = response;
    for (const hook of this.hooks.beforeResponse) {
      const result = await hook(current);
      if (result instanceof Response) current = result;
    }
    return current;
  }

  private async handleError(error: Error, status: number = 500): Promise<Response> {
    for (const hook of this.hooks.onError) {
      const result = await hook(error);
      if (result instanceof Response) return result;
    }

    if (isRavenError(error)) return error.toResponse();
    if (status === 404) return new Response("Not Found", { status: 404 });

    console.error("Unhandled error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
