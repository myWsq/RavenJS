// =============================================================================
// SECTION: Imports
// =============================================================================

import { AsyncLocalStorage } from "node:async_hooks";
import type { IncomingMessage, ServerResponse } from "node:http";

// =============================================================================
// SECTION: Types & Interfaces
// =============================================================================

export interface ErrorContext {
  [key: string]: unknown;
}

export interface RavenInstance {
  parent: RavenInstance | null;
  internalStateMap: Map<symbol, any>;
}

export interface StateOptions {
  name?: string;
}

export interface RouteMatch<T> {
  data: T;
  params: Record<string, string>;
}

export interface ServerConfig {
  port: number;
  hostname?: string;
}

export interface ServerAdapter {
  listen(
    config: ServerConfig,
    handler: (request: Request) => Response | Promise<Response>
  ): void | Promise<void>;
  stop(): void | Promise<void>;
}

// =============================================================================
// SECTION: Error Handling
// =============================================================================

export class RavenError extends Error {
  public readonly code: string;
  public readonly context: ErrorContext;
  public readonly statusCode?: number;
  public override readonly cause?: unknown;

  private constructor(
    code: string,
    message: string,
    context: ErrorContext,
    statusCode?: number
  ) {
    super(message);
    this.code = code;
    this.context = context;
    this.statusCode = statusCode;
  }

  public setContext(context: ErrorContext): this {
    Object.assign(this.context, context);
    return this;
  }

  public static ERR_SERVER_ALREADY_RUNNING(): RavenError {
    return new RavenError(
      "ERR_SERVER_ALREADY_RUNNING",
      "Server is already running",
      {}
    );
  }

  public static ERR_STATE_NOT_INITIALIZED(name: string): RavenError {
    return new RavenError(
      "ERR_STATE_NOT_INITIALIZED",
      `State is not initialized. Cannot access state: ${name}`,
      {}
    );
  }

  public static ERR_STATE_CANNOT_SET(name: string): RavenError {
    return new RavenError(
      "ERR_STATE_CANNOT_SET",
      `Cannot set value for state "${name}": Scope is not initialized.`,
      {}
    );
  }

  public static ERR_VALIDATION(message: string): RavenError {
    return new RavenError("ERR_VALIDATION", message, {}, 400);
  }

  public static ERR_BAD_REQUEST(message: string): RavenError {
    return new RavenError("ERR_BAD_REQUEST", message, {}, 400);
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

export function isRavenError(value: unknown): value is RavenError {
  return value instanceof RavenError;
}

// =============================================================================
// SECTION: State Management
// =============================================================================

export const currentAppStorage = new AsyncLocalStorage<RavenInstance>();
export const requestStorage = new AsyncLocalStorage<Map<symbol, any>>();

let stateCounter = 0;

export abstract class ScopedState<T> {
  public readonly symbol: symbol;
  public readonly name: string;

  constructor(options?: StateOptions) {
    this.name = options?.name ?? `state:${++stateCounter}`;
    this.symbol = Symbol(this.name);
  }

  public abstract get(): T | undefined;
  public abstract set(value: T): void;

  public getOrFailed(): T {
    const value = this.get();
    if (value === undefined) {
      throw RavenError.ERR_STATE_NOT_INITIALIZED(this.name);
    }
    return value;
  }
}

export class AppState<T> extends ScopedState<T> {
  constructor(options?: StateOptions) {
    super(options);
  }

  public get(): T | undefined {
    let current: RavenInstance | null | undefined =
      currentAppStorage.getStore();
    while (current) {
      if (current.internalStateMap.has(this.symbol)) {
        return current.internalStateMap.get(this.symbol);
      }
      current = current.parent;
    }
    return undefined;
  }

  public set(value: T): void {
    const app = currentAppStorage.getStore();
    if (!app) {
      throw RavenError.ERR_STATE_CANNOT_SET(this.name);
    }
    app.internalStateMap.set(this.symbol, value);
  }
}

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

export function createAppState<T>(options?: StateOptions): AppState<T> {
  return new AppState<T>(options);
}

export function createRequestState<T>(
  options?: StateOptions
): RequestState<T> {
  return new RequestState<T>(options);
}

export const BodyState = createRequestState<unknown>({ name: "raven:body" });
export const QueryState = createRequestState<unknown>({ name: "raven:query" });
export const ParamsState = createRequestState<unknown>({ name: "raven:params" });
export const HeadersState = createRequestState<unknown>({
  name: "raven:headers",
});

// =============================================================================
// SECTION: Router
// =============================================================================

class RouterNode<T> {
  children: Map<string, RouterNode<T>> = new Map();
  paramChild: RouterNode<T> | null = null;
  wildcardChild: RouterNode<T> | null = null;
  paramName: string | null = null;
  handlers: Map<string, T> = new Map();

  insert(segments: string[], method: string, data: T) {
    let current: RouterNode<T> = this;

    for (const segment of segments) {
      if (segment.startsWith(":")) {
        if (!current.paramChild) {
          current.paramChild = new RouterNode<T>();
          current.paramName = segment.slice(1);
        }
        current = current.paramChild;
      } else if (segment === "*") {
        if (!current.wildcardChild) {
          current.wildcardChild = new RouterNode<T>();
        }
        current = current.wildcardChild;
        break;
      } else {
        if (!current.children.has(segment)) {
          current.children.set(segment, new RouterNode<T>());
        }
        current = current.children.get(segment)!;
      }
    }

    current.handlers.set(method.toUpperCase(), data);
  }

  search(
    segments: string[],
    method: string,
    params: Record<string, string>
  ): T | null {
    let current: RouterNode<T> = this;

    for (const segment of segments) {
      const next = current.children.get(segment);
      if (next) {
        current = next;
      } else if (current.paramChild) {
        if (current.paramName) {
          params[current.paramName] = segment;
        }
        current = current.paramChild;
      } else if (current.wildcardChild) {
        current = current.wildcardChild;
        return current.handlers.get(method.toUpperCase()) || null;
      } else {
        return null;
      }
    }

    return current.handlers.get(method.toUpperCase()) || null;
  }
}

export class RadixRouter<T> {
  private root = new RouterNode<T>();

  add(method: string, path: string, data: T) {
    const segments = this.splitPath(path);
    this.root.insert(segments, method, data);
  }

  find(method: string, path: string): RouteMatch<T> | null {
    const segments = this.splitPath(path);
    const params: Record<string, string> = {};
    const data = this.root.search(segments, method, params);

    if (data === null) {
      return null;
    }

    return { data, params };
  }

  private splitPath(path: string): string[] {
    return path.split("/").filter((s) => s.length > 0);
  }
}

// =============================================================================
// SECTION: Server Adapters
// =============================================================================

export class BunAdapter implements ServerAdapter {
  private server: any = null;

  listen(
    config: ServerConfig,
    handler: (request: Request) => Response | Promise<Response>
  ): void {
    // @ts-ignore - Bun is global in Bun runtime
    this.server = Bun.serve({
      port: config.port,
      hostname: config.hostname,
      fetch: handler,
    });
  }

  stop(): void {
    if (this.server) {
      this.server.stop();
      this.server = null;
    }
  }
}

export class NodeAdapter implements ServerAdapter {
  private server: any = null;

  async listen(
    config: ServerConfig,
    handler: (request: Request) => Response | Promise<Response>
  ): Promise<void> {
    const http = await import("node:http");

    this.server = http.createServer(
      async (req: IncomingMessage, res: ServerResponse) => {
        try {
          const protocol = req.headers["x-forwarded-proto"] || "http";
          const host = req.headers.host || `localhost:${config.port}`;
          const url = new URL(req.url || "/", `${protocol}://${host}`);

          let body: any = null;
          if (req.method !== "GET" && req.method !== "HEAD") {
            const chunks: Uint8Array[] = [];
            for await (const chunk of req) {
              chunks.push(chunk);
            }
            // @ts-ignore
            body = Buffer.concat(chunks);
          }

          const request = new Request(url.toString(), {
            method: req.method,
            headers: req.headers as any,
            body: body,
          });

          const response = await handler(request);

          res.statusCode = response.status;
          response.headers.forEach((value, key) => {
            res.setHeader(key, value);
          });

          if (response.body) {
            const reader = response.body.getReader();
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              res.write(value);
            }
          }
          res.end();
        } catch (error) {
          console.error("Error handling request:", error);
          res.statusCode = 500;
          res.end("Internal Server Error");
        }
      }
    );

    this.server.listen(config.port, config.hostname || "0.0.0.0");
  }

  stop(): void {
    if (this.server) {
      this.server.close();
      this.server = null;
    }
  }
}

// =============================================================================
// SECTION: Core Framework
// =============================================================================

export const RavenContext = createRequestState<Context>({
  name: "raven:context",
});

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

export type Handler = () => Response | Promise<Response>;

export type OnRequestHook = (
  request: Request
) => void | Response | Promise<void | Response>;

export type BeforeHandleHook = () => void | Response | Promise<void | Response>;

export type BeforeResponseHook = (
  response: Response
) => void | Response | Promise<void | Response>;

export type OnErrorHook = (error: unknown) => Response | Promise<Response>;

export interface RoutePipeline {
  onRequest: OnRequestHook[];
  beforeHandle: BeforeHandleHook[];
  beforeResponse: BeforeResponseHook[];
}

interface RouteData {
  handler: Handler;
  pipeline: RoutePipeline;
}

export type Plugin = (instance: Raven) => void | Promise<void>;

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

  async register(plugin: Plugin): Promise<this> {
    this.plugins.push(plugin);
    await currentAppStorage.run(this, () => plugin(this));
    return this;
  }

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

  async listen(config: ServerConfig): Promise<void> {
    if (this.adapter || this.parent?.adapter) {
      throw RavenError.ERR_SERVER_ALREADY_RUNNING();
    }

    // @ts-ignore
    const isBun = typeof Bun !== "undefined";
    this.adapter = isBun ? new BunAdapter() : new NodeAdapter();

    await this.adapter.listen(config, (request) => {
      return this.handleRequest(request);
    });
  }

  async stop(): Promise<void> {
    if (this.adapter) {
      await this.adapter.stop();
      this.adapter = null;
    }
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

  public async handleRequest(request: Request): Promise<Response> {
    return currentAppStorage.run(this, () => {
      return requestStorage.run(new Map(), async () => {
        try {
          const globalOnRequest = this.getAllHooks("onRequest");
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

          for (const hook of routeData.pipeline.beforeHandle) {
            const result = await hook();
            if (result instanceof Response) {
              return this.handleResponseHooks(result, routeData.pipeline);
            }
          }

          const response = await routeData.handler();

          return this.handleResponseHooks(response, routeData.pipeline);
        } catch (error) {
          if (!RavenContext.get()) {
            RavenContext.set(new Context(request));
          }
          return this.handleError(error);
        }
      });
    });
  }

  private async processStates(
    request: Request,
    params: Record<string, string>,
    query: Record<string, string>
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
          `Invalid JSON body: ${err instanceof Error ? err.message : "parse error"}`
        );
      }
      BodyState.set(data);
    }
  }

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
