// =============================================================================
// SECTION: Imports
// =============================================================================

import { AsyncLocalStorage } from "node:async_hooks";
import { RadixRouter } from "./router.ts";

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
 * Core interface representing a Raven application instance.
 */
export interface RavenInstance {
  /** Internal storage for application-scoped state. */
  internalStateMap: Map<symbol, any>;
}

/**
 * Options for creating a new state.
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

/**
 * Hook executed when a request is first received.
 * Returning a Response will short-circuit the request lifecycle.
 */
export type OnRequestHook = (
  request: Request,
) => void | Response | Promise<void | Response>;

/**
 * Hook executed before the main route handler.
 * Returning a Response will short-circuit the request lifecycle.
 */
export type BeforeHandleHook = () => void | Response | Promise<void | Response>;

/**
 * Hook executed before the response is sent to the client.
 * Can return a new Response to override the outgoing response.
 */
export type BeforeResponseHook = (
  response: Response,
) => void | Response | Promise<void | Response>;

/**
 * Hook executed when an error occurs during the request lifecycle.
 * Should return a Response to send to the client.
 */
export type OnErrorHook = (error: Error) => Response | Promise<Response> | void | Promise<void>;

/** Internal route data structure. */
interface RouteData {
  handler: Handler;
}

/**
 * Plugin function type for extending the Raven instance.
 */
export type Plugin = (instance: Raven) => void | Promise<void>;

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

  private constructor(
    code: string,
    message: string,
    context: ErrorContext,
    statusCode?: number,
  ) {
    super(message);
    this.code = code;
    this.context = context;
    this.statusCode = statusCode;
  }

  /**
   * Appends additional context to the error.
   * @param context Additional properties to include.
   * @returns The current RavenError instance.
   */
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

  /**
   * Serializes the error to a JSON-friendly object.
   */
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

  /**
   * Converts the error to a standard HTTP Response.
   */
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

  /** HTTP method of the request. */
  get method(): string {
    return this.request.method;
  }

  /** HTTP headers of the request. */
  get headers(): Headers {
    return this.request.headers;
  }

  /** Body stream of the request. */
  get body(): ReadableStream<Uint8Array> | null {
    return this.request.body;
  }
}

/** Storage for the current application instance. */
export const currentAppStorage = new AsyncLocalStorage<RavenInstance>();
/** Storage for the current request's state map. */
export const requestStorage = new AsyncLocalStorage<Map<symbol, any>>();

let stateCounter = 0;

/**
 * Base class for a scoped state container.
 * @template T The type of the state value.
 */
export abstract class ScopedState<T> {
  public readonly symbol: symbol;
  public readonly name: string;

  constructor(options?: StateOptions) {
    this.name = options?.name ?? `state:${++stateCounter}`;
    this.symbol = Symbol(this.name);
  }

  /** Retrieves the state value, returning undefined if not set. */
  public abstract get(): T | undefined;
  
  /** Sets the state value in the current scope. */
  public abstract set(value: T): void;

  /**
   * Retrieves the state value, throwing an error if not initialized.
   * @throws {RavenError} If the state is not initialized.
   */
  public getOrFailed(): T {
    const value = this.get();
    if (value === undefined) {
      throw RavenError.ERR_STATE_NOT_INITIALIZED(this.name);
    }
    return value;
  }
}

/**
 * Application-scoped state, shared across the entire application instance.
 */
export class AppState<T> extends ScopedState<T> {
  constructor(options?: StateOptions) {
    super(options);
  }

  public get(): T | undefined {
    const app = currentAppStorage.getStore();
    return app?.internalStateMap.get(this.symbol);
  }

  public set(value: T): void {
    const app = currentAppStorage.getStore();
    if (!app) {
      throw RavenError.ERR_STATE_CANNOT_SET(this.name);
    }
    app.internalStateMap.set(this.symbol, value);
  }
}

/**
 * Request-scoped state, isolated to a single HTTP request lifecycle.
 */
export class RequestState<T> extends ScopedState<T> {
  constructor(options?: StateOptions) {
    super(options);
  }

  public get(): T | undefined {
    const store = requestStorage.getStore();
    return store?.get(this.symbol);
  }

  public set(value: T): void {
    const store = requestStorage.getStore();
    if (!store) {
      throw RavenError.ERR_STATE_CANNOT_SET(this.name);
    }
    store.set(this.symbol, value);
  }
}

/** Creates a new application-scoped state. */
export function createAppState<T>(options?: StateOptions): AppState<T> {
  return new AppState<T>(options);
}

/** Creates a new request-scoped state. */
export function createRequestState<T>(options?: StateOptions): RequestState<T> {
  return new RequestState<T>(options);
}

// Predefined Request States
export const RavenContext = createRequestState<Context>({ name: "raven:context" });
export const BodyState = createRequestState<unknown>({ name: "raven:body" });
export const QueryState = createRequestState<Record<string, string>>({ name: "raven:query" });
export const ParamsState = createRequestState<Record<string, string>>({ name: "raven:params" });
export const HeadersState = createRequestState<Record<string, string>>({ name: "raven:headers" });

// Re-export router types for consumers
export { RadixRouter, type RouteMatch } from "./router.ts";

// =============================================================================
// SECTION: Server Adapters
// =============================================================================

// =============================================================================
// SECTION: Core Framework
// =============================================================================

/**
 * Utility function to define a plugin.
 * @param plugin The plugin function.
 * @returns The unchanged plugin function, useful for type inference.
 */
export function createPlugin(plugin: Plugin): Plugin {
  return plugin;
}

/**
 * Main application class for the Raven framework.
 */
export class Raven implements RavenInstance {
  private router: RadixRouter<RouteData>;
  public readonly internalStateMap = new Map<symbol, any>();
  private plugins: Plugin[] = [];
  
  private hooks = {
    onRequest: [] as OnRequestHook[],
    beforeHandle: [] as BeforeHandleHook[],
    beforeResponse: [] as BeforeResponseHook[],
    onError: [] as OnErrorHook[],
  };

  /**
   * Initializes a new Raven application instance.
   */
  constructor() {
    this.router = new RadixRouter<RouteData>();
  }

  /**
   * Registers a plugin with the application instance.
   * @param plugin The plugin to register.
   */
  async register(plugin: Plugin): Promise<this> {
    this.plugins.push(plugin);
    await currentAppStorage.run(this, () => plugin(this));
    return this;
  }

  /** Internal helper to register a route handler. */
  private addRoute(method: string, path: string, handler: Handler) {
    this.router.add(method, path, { handler });
  }

  /** Registers a GET route. */
  get(path: string, handler: Handler): this {
    this.addRoute("GET", path, handler);
    return this;
  }

  /** Registers a POST route. */
  post(path: string, handler: Handler): this {
    this.addRoute("POST", path, handler);
    return this;
  }

  /** Registers a PUT route. */
  put(path: string, handler: Handler): this {
    this.addRoute("PUT", path, handler);
    return this;
  }

  /** Registers a DELETE route. */
  delete(path: string, handler: Handler): this {
    this.addRoute("DELETE", path, handler);
    return this;
  }

  /** Registers a PATCH route. */
  patch(path: string, handler: Handler): this {
    this.addRoute("PATCH", path, handler);
    return this;
  }

  /** Adds an OnRequest hook. */
  onRequest(hook: OnRequestHook): this {
    this.hooks.onRequest.push(hook);
    return this;
  }

  /** Adds a BeforeHandle hook. */
  beforeHandle(hook: BeforeHandleHook): this {
    this.hooks.beforeHandle.push(hook);
    return this;
  }

  /** Adds a BeforeResponse hook. */
  beforeResponse(hook: BeforeResponseHook): this {
    this.hooks.beforeResponse.push(hook);
    return this;
  }

  /** Adds an OnError hook. */
  onError(hook: OnErrorHook): this {
    this.hooks.onError.push(hook);
    return this;
  }

  /**
   * Main request processing entrypoint (FetchHandler).
   * Evaluates hooks, matches routes, and handles responses/errors.
   * Use with HTTP server
   */
  public async handle(request: Request): Promise<Response> {
    return currentAppStorage.run(this, () => {
      return requestStorage.run(new Map(), async () => {
        try {
          const globalOnRequest = this.hooks.onRequest;
          for (const hook of globalOnRequest) {
            const result = await hook(request);
            if (result instanceof Response) {
              return result;
            }
          }

          const url = new URL(request.url);
          const match = this.router.find(request.method, url.pathname);
          if (!match) {
            const ctx = new Context(request);
            RavenContext.set(ctx);
            return this.handleError(new Error("Not Found"), 404);
          }

          const { data: routeData, params } = match;

          const query: Record<string, string> = {};
          url.searchParams.forEach((value, key) => {
            query[key] = value;
          });

          const ctx = new Context(request, params, query);
          RavenContext.set(ctx);

          await this.processStates(request, params, query);

          for (const hook of this.hooks.beforeHandle) {
            const result = await hook();
            if (result instanceof Response) {
              return this.handleResponseHooks(result);
            }
          }

          const response = await routeData.handler();

          return this.handleResponseHooks(response);
        } catch (error) {
          if (!RavenContext.get()) {
            RavenContext.set(new Context(request));
          }
          return this.handleError(
            error instanceof Error
              ? error
              : RavenError.ERR_UNKNOWN_ERROR(String(error)),
          );
        }
      });
    });
  }

  /**
   * Parses and stores request state (parameters, query, headers, body).
   */
  private async processStates(
    request: Request,
    params: Record<string, string>,
    query: Record<string, string>,
  ): Promise<void> {
    const headersObj: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headersObj[key.toLowerCase()] = value;
    });

    ParamsState.set(params);
    QueryState.set(query);
    HeadersState.set(headersObj);

    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      let data: unknown;
      try {
        data = await request.json();
      } catch (err) {
        throw RavenError.ERR_BAD_REQUEST(
          `Invalid JSON body: ${err instanceof Error ? err.message : "parse error"}`,
        );
      }
      BodyState.set(data);
    }
  }

  /**
   * Runs response modification hooks.
   */
  private async handleResponseHooks(response: Response): Promise<Response> {
    let currentResponse = response;
    for (const hook of this.hooks.beforeResponse) {
      const result = await hook(currentResponse);
      if (result instanceof Response) {
        currentResponse = result;
      }
    }
    return currentResponse;
  }

  /**
   * Evaluates error hooks and formats standard framework errors.
   */
  private async handleError(
    error: Error,
    status: number = 500,
  ): Promise<Response> {
    const onErrorHooks = this.hooks.onError;
    if (onErrorHooks.length > 0) {
      for (const hook of onErrorHooks) {
        const result = await hook(error);
        if (result instanceof Response) {
          return result;
        }
      }
    }

    if (isRavenError(error)) {
      return error.toResponse();
    }

    if (status === 404) {
      return new Response("Not Found", { status: 404 });
    }
    console.error("Unhandled error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
