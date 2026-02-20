import {
  BunAdapter,
  NodeAdapter,
  type ServerAdapter,
} from "./utils/server-adapter.ts";
import {
  createRequestState,
  currentAppStorage,
  requestStorage,
  type RavenInstance,
  type ScopedState,
} from "./utils/state.ts";
import { RavenError, isRavenError } from "./utils/error.ts";

import { RadixRouter } from "./utils/router.ts";
import { validate } from "./utils/validator.ts";

/**
 * Scope state for the framework's core Context.
 */
export const RavenContext = createRequestState<Context>({ name: "raven:context" });

/**
 * Server configuration options
 */
export interface ServerConfig {
  port: number;
  hostname?: string;
}

/**
 * Context class that encapsulates request and response information
 */
export class Context {
  public readonly url: URL;

  constructor(
    public readonly request: Request,
    public params: Record<string, string> = {},
    public query: Record<string, string> = {}
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

/**
 * Base handler function type
 */
export type HandlerFn = () => Response | Promise<Response>;

/**
 * Handler with optional slots metadata
 */
export type Handler = HandlerFn & {
  slots?: ScopedState<any>[];
};

/**
 * Options for createHandler
 */
export interface CreateHandlerOptions {
  slots?: ScopedState<any>[];
}

/**
 * Create a handler with state slots for automatic validation and injection
 */
export function createHandler(
  options: CreateHandlerOptions,
  handler: HandlerFn
): Handler {
  const wrappedHandler = handler as Handler;
  wrappedHandler.slots = options.slots;
  return wrappedHandler;
}

/**
 * Lifecycle hook for when a request is received
 */
export type OnRequestHook = (
  request: Request
) => void | Response | Promise<void | Response>;

/**
 * Lifecycle hook before the request handler is called
 */
export type BeforeHandleHook = () => void | Response | Promise<void | Response>;

/**
 * Lifecycle hook after the handler is called, before the response is sent
 */
export type BeforeResponseHook = (
  response: Response
) => void | Response | Promise<void | Response>;

/**
 * Hook for global error handling
 */
export type OnErrorHook = (error: unknown) => Response | Promise<Response>;

/**
 * Pipeline of hooks for a route
 */
export interface RoutePipeline {
  onRequest: OnRequestHook[];
  beforeHandle: BeforeHandleHook[];
  beforeResponse: BeforeResponseHook[];
}

/**
 * Internal route data
 */
interface RouteData {
  handler: Handler;
  pipeline: RoutePipeline;
}

/**
 * Plugin definition
 */
export type Plugin = (instance: Raven) => void | Promise<void>;

/**
 * Helper to create a type-safe plugin
 */
export function createPlugin(plugin: Plugin): Plugin {
  return plugin;
}

export class Raven implements RavenInstance {
  private adapter: ServerAdapter | null = null;
  private router: RadixRouter<RouteData>;
  private prefix: string;
  public readonly parent: Raven | null;
  public readonly internalStateMap = new Map<symbol, any>();
  private plugins: Plugin[] = [];
  private hooks = {
    onRequest: [] as OnRequestHook[],
    beforeHandle: [] as BeforeHandleHook[],
    beforeResponse: [] as BeforeResponseHook[],
    onError: [] as OnErrorHook[],
  };

  constructor(options?: {
    prefix?: string;
    parent?: Raven | null;
    router?: RadixRouter<RouteData>;
  }) {
    this.prefix = options?.prefix ?? "";
    this.parent = options?.parent ?? null;
    this.router = options?.router ?? new RadixRouter<RouteData>();
  }

  /**
   * Register a plugin
   */
  async register(plugin: Plugin): Promise<this> {
    this.plugins.push(plugin);
    await currentAppStorage.run(this, () => plugin(this));
    return this;
  }

  /**
   * Create a route group
   */
  async group(
    prefix: string,
    callback: (instance: Raven) => void | Promise<void>
  ): Promise<this> {
    const child = new Raven({
      prefix: this.prefix + prefix,
      parent: this,
      router: this.router,
    });
    await currentAppStorage.run(child, () => callback(child));
    return this;
  }

  /**
   * Get all hooks of a certain type, including those from parent instances
   */
  private getAllHooks<K extends keyof typeof this.hooks>(
    type: K
  ): (typeof this.hooks)[K] {
    const allHooks = [] as any[];
    let current: Raven | null = this;
    while (current) {
      allHooks.unshift(...current.hooks[type]);
      current = current.parent;
    }
    return allHooks as (typeof this.hooks)[K];
  }

  /**
   * Internal method to add a route
   */
  private addRoute(method: string, path: string, handler: Handler) {
    const fullPath = this.prefix + path;
    const pipeline: RoutePipeline = {
      onRequest: this.getAllHooks("onRequest"),
      beforeHandle: this.getAllHooks("beforeHandle"),
      beforeResponse: this.getAllHooks("beforeResponse"),
    };
    this.router.add(method, fullPath, { handler, pipeline });
  }

  get(path: string, handler: Handler): this {
    this.addRoute("GET", path, handler);
    return this;
  }

  post(path: string, handler: Handler): this {
    this.addRoute("POST", path, handler);
    return this;
  }

  put(path: string, handler: Handler): this {
    this.addRoute("PUT", path, handler);
    return this;
  }

  delete(path: string, handler: Handler): this {
    this.addRoute("DELETE", path, handler);
    return this;
  }

  patch(path: string, handler: Handler): this {
    this.addRoute("PATCH", path, handler);
    return this;
  }

  /**
   * Start the HTTP server with the given configuration
   */
  async listen(config: ServerConfig): Promise<void> {
    if (this.adapter || (this.parent?.adapter)) {
      throw RavenError.ERR_SERVER_ALREADY_RUNNING();
    }

    // Environment detection
    // @ts-ignore
    const isBun = typeof Bun !== "undefined";
    this.adapter = isBun ? new BunAdapter() : new NodeAdapter();

    await this.adapter.listen(config, (request) => {
      return this.handleRequest(request);
    });
  }

  /**
   * Stop the running server
   */
  async stop(): Promise<void> {
    if (this.adapter) {
      await this.adapter.stop();
      this.adapter = null;
    }
  }

  /**
   * Register an onRequest hook
   */
  onRequest(hook: OnRequestHook): this {
    this.hooks.onRequest.push(hook);
    return this;
  }

  /**
   * Register a beforeHandle hook
   */
  beforeHandle(hook: BeforeHandleHook): this {
    this.hooks.beforeHandle.push(hook);
    return this;
  }

  /**
   * Register a beforeResponse hook
   */
  beforeResponse(hook: BeforeResponseHook): this {
    this.hooks.beforeResponse.push(hook);
    return this;
  }

  /**
   * Register an onError hook
   */
  onError(hook: OnErrorHook): this {
    this.hooks.onError.push(hook);
    return this;
  }

  /**
   * Handle incoming HTTP request
   */
  public async handleRequest(request: Request): Promise<Response> {
    return currentAppStorage.run(this, () => {
      return requestStorage.run(new Map(), async () => {
        try {
          // 1. Global onRequest hooks - Context not yet available
          const globalOnRequest = this.getAllHooks("onRequest");
          for (const hook of globalOnRequest) {
            const result = await hook(request);
            if (result instanceof Response) {
              return result;
            }
          }

          // 2. Route matching
          const url = new URL(request.url);
          const match = this.router.find(request.method, url.pathname);
          if (!match) {
            // Initialize minimal context for error handling
            const ctx = new Context(request);
            RavenContext.set(ctx);
            return this.handleError(new Error("Not Found"), 404);
          }

          const { data: routeData, params } = match;

          // 3. Assemble full context
          const query: Record<string, string> = {};
          url.searchParams.forEach((value, key) => {
            query[key] = value;
          });

          const ctx = new Context(request, params, query);
          RavenContext.set(ctx);

          // 4. Process state slots (validation and injection)
          await this.processSlots(routeData.handler, request, params, query);

          // 5. Execute route-specific pipeline (beforeHandle and onwards)
          for (const hook of routeData.pipeline.beforeHandle) {
            const result = await hook();
            if (result instanceof Response) {
              return this.handleResponseHooks(result, routeData.pipeline);
            }
          }

          // 6. Main handler
          const response = await routeData.handler();

          // 7. beforeResponse hooks
          return this.handleResponseHooks(response, routeData.pipeline);
        } catch (error) {
          // Ensure context is available for error handlers if it wasn't set yet
          if (!RavenContext.get()) {
            RavenContext.set(new Context(request));
          }
          return this.handleError(error);
        }
      });
    });
  }

  /**
   * Process state slots: extract data, validate, and inject into states
   */
  private async processSlots(
    handler: Handler,
    request: Request,
    params: Record<string, string>,
    query: Record<string, string>
  ): Promise<void> {
    const slots = handler.slots;
    if (!slots || slots.length === 0) {
      return;
    }

    let parsedBody: unknown = undefined;
    let bodyParsed = false;

    for (const slot of slots) {
      if (!slot.schema || !slot.source) {
        continue;
      }

      let rawData: unknown;

      switch (slot.source) {
        case "body":
          if (!bodyParsed) {
            try {
              const contentType = request.headers.get("content-type") || "";
              if (contentType.includes("application/json")) {
                parsedBody = await request.json();
              } else {
                parsedBody = {};
              }
            } catch {
              parsedBody = {};
            }
            bodyParsed = true;
          }
          rawData = parsedBody;
          break;

        case "query":
          rawData = query;
          break;

        case "params":
          rawData = params;
          break;

        case "header": {
          const headers: Record<string, string> = {};
          request.headers.forEach((value, key) => {
            headers[key.toLowerCase()] = value;
          });
          rawData = headers;
          break;
        }

        default:
          continue;
      }

      const validData = validate(slot.schema, rawData);
      slot.set(validData);
    }
  }

  /**
   * Run beforeResponse hooks
   */
  private async handleResponseHooks(
    response: Response,
    pipeline?: RoutePipeline
  ): Promise<Response> {
    let currentResponse = response;
    const hooks =
      pipeline?.beforeResponse ?? this.getAllHooks("beforeResponse");
    for (const hook of hooks) {
      const result = await hook(currentResponse);
      if (result instanceof Response) {
        currentResponse = result;
      }
    }
    return currentResponse;
  }

  /**
   * Run error hooks
   */
  private async handleError(
    error: unknown,
    status: number = 500
  ): Promise<Response> {
    const onErrorHooks = this.getAllHooks("onError");
    if (onErrorHooks.length > 0) {
      for (const hook of onErrorHooks) {
        const result = await hook(error);
        if (result instanceof Response) {
          return result;
        }
      }
    }

    // Handle RavenError
    if (isRavenError(error)) {
      return error.toResponse();
    }

    // Default error fallback
    if (status === 404) {
      return new Response("Not Found", { status: 404 });
    }
    console.error("Unhandled error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
