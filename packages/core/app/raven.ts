import type { RouteData } from "./route-data.ts";
import type {
  BeforeHandleHook,
  BeforeResponseHook,
  FetchHandler,
  Handler,
  OnErrorHook,
  OnLoadedHook,
  OnRequestHook,
  OnResponseValidationErrorHook,
  Plugin,
  RavenHooks,
  RavenInstance,
  RouteHandler,
} from "./types.ts";
import {
  buildOpenAPIDocument,
  DEFAULT_OPENAPI_PATH,
  type OpenAPIDocument,
  type OpenAPIExportOptions,
  type OpenAPIWarning,
} from "./openapi.ts";
import {
  makeRegisteredRouteKey,
  normalizeRoutePathShape,
  type RegisteredRoute,
} from "./route-manifest.ts";
import {
  BodyState,
  HeadersState,
  ParamsState,
  QueryState,
  RavenContext,
} from "../state/builtins.ts";
import type { AnyContract, HttpMethod } from "../contract/index.ts";
import { isValidationError, validateResponseSchema } from "../schema/validation.ts";
import { currentAppStorage, requestStorage, type ScopeKey } from "../state/storage.ts";
import { isSchemaAwareHandler, type SchemaAwareHandler } from "../schema/with-schema.ts";
import { executePluginLoad, loadPlugins } from "../runtime/load-plugins.ts";
import { makeRavenHandler } from "../runtime/make-raven-handler.ts";
import { handleError } from "../runtime/handle-error.ts";
import { handleResponseValidationHooks } from "../runtime/handle-response-validation.ts";
import { Context } from "../context/context.ts";
import { RavenError } from "../error/raven-error.ts";
import { internalSet } from "../state/descriptors.ts";
import { Hono } from "hono";

export function definePlugin(plugin: Plugin): Plugin {
  return plugin;
}

export class Raven implements RavenInstance {
  /**
   * 底层 HTTP 引擎。路由匹配、请求收发、serve 均由 Hono 承担；
   * 其 context `c` 仅在 runtime 内部使用，绝不暴露给应用作者。
   */
  private readonly hono = new Hono();
  private readonly routeManifest = new Map<string, RegisteredRoute>();
  public readonly scopedStateMaps = new Map<ScopeKey, Map<symbol, any>>();

  private readonly hooks: RavenHooks = {
    onRequest: [],
    beforeHandle: [],
    beforeResponse: [],
    onError: [],
    onLoaded: [],
    onResponseValidationError: [],
  };

  private readonly pendingPlugins: Array<{ plugin: Plugin; scopeKey?: ScopeKey }> = [];
  private buildPromise: Promise<FetchHandler> | null = null;
  private openAPIExportOptions: OpenAPIExportOptions | null = null;
  private openAPIDocumentCache: OpenAPIDocument | null = null;
  private openAPIDocumentDirty = true;

  constructor() {
    // 路由未命中（含 method 不匹配）：复刻原 dispatch 的 404 分支，
    // 在 ambient 上下文内补建 Context 并走 onError 链（404 也对 onError 可见）。
    this.hono.notFound((c) => {
      const request = c.req.raw;
      if (!RavenContext.get()) {
        internalSet(RavenContext, new Context(request));
      }
      return handleError(new Error("Not Found"), this.hooks.onError, 404);
    });

    // 路由 handler / processStates / beforeHandle 抛出的错误由 Hono 捕获并交到这里，
    // 复刻原 dispatch 的 catch 分支，归一化错误后走 onError 链。
    this.hono.onError((error, c) => {
      const request = c.req.raw;
      if (!RavenContext.get()) {
        internalSet(RavenContext, new Context(request));
      }
      return handleError(
        error instanceof Error ? error : RavenError.ERR_UNKNOWN_ERROR(String(error)),
        this.hooks.onError,
      );
    });
  }

  register(plugin: Plugin, scopeKey?: ScopeKey): this {
    this.pendingPlugins.push({ plugin, scopeKey });
    return this;
  }

  async use(plugin: Plugin, scopeKey?: ScopeKey): Promise<void> {
    await currentAppStorage.run(this, () => executePluginLoad(this, plugin, scopeKey));
  }

  async ready(): Promise<FetchHandler> {
    if (this.buildPromise) {
      return this.buildPromise;
    }

    this.buildPromise = currentAppStorage.run(this, async () => {
      await loadPlugins(this, this.pendingPlugins, this.hooks.onLoaded);
      return (request: Request) => this.dispatch(request);
    });

    return this.buildPromise;
  }

  /**
   * 请求入口。建立两层 AsyncLocalStorage（app scope + request scope），
   * 先跑 onRequest 钩子（可短路，且此时 RavenContext 尚未建立），
   * 再交给内部 Hono 实例完成路由匹配与命中后的生命周期（见 makeRavenHandler）。
   * 因为 `this.hono.fetch` 在 ALS 回调内被 await，Hono 内部的 handler / onError / notFound
   * 都运行在同一 ambient 上下文中。
   */
  private dispatch(request: Request): Promise<Response> {
    return currentAppStorage.run(this, () =>
      requestStorage.run(new Map(), async (): Promise<Response> => {
        try {
          for (const hook of this.hooks.onRequest) {
            const result = await hook(request);
            if (result instanceof Response) {
              return result;
            }
          }

          return await this.hono.fetch(request);
        } catch (error) {
          if (!RavenContext.get()) {
            internalSet(RavenContext, new Context(request));
          }
          return handleError(
            error instanceof Error ? error : RavenError.ERR_UNKNOWN_ERROR(String(error)),
            this.hooks.onError,
          );
        }
      }),
    );
  }

  private createRouteData(handler: RouteHandler): RouteData {
    if (isSchemaAwareHandler(handler)) {
      return {
        handler: async () => {
          const ctx = {
            body: BodyState.get(),
            query: (QueryState.get() ?? {}) as any,
            params: (ParamsState.get() ?? {}) as any,
            headers: (HeadersState.get() ?? {}) as any,
          };
          const result = await handler.handler(ctx as any);

          if (!handler.schemas.response) {
            return result as Response;
          }

          try {
            const validatedResponse = await validateResponseSchema(
              handler.schemas.response,
              result,
            );

            return Response.json(validatedResponse);
          } catch (error) {
            if (isValidationError(error) && error.responseIssues) {
              await handleResponseValidationHooks(
                { error, value: result },
                this.hooks.onResponseValidationError,
              );
              return Response.json(result);
            }

            throw error;
          }
        },
        schemas: handler.schemas,
      };
    }

    return { handler };
  }

  private markOpenAPIDocumentDirty(): void {
    this.openAPIDocumentDirty = true;
  }

  private addRoute(
    method: HttpMethod,
    path: string,
    handler: RouteHandler,
    contract?: AnyContract,
  ): void {
    const registrationKey = makeRegisteredRouteKey(method, path);
    const existingRoute = this.routeManifest.get(registrationKey);
    if (existingRoute) {
      throw new Error(
        `Route conflict for ${method} ${path}: existing route ${existingRoute.method} ${existingRoute.path} already uses normalized path ${existingRoute.normalizedPath}`,
      );
    }

    const routeData = this.createRouteData(handler);
    this.routeManifest.set(registrationKey, {
      method,
      path,
      normalizedPath: normalizeRoutePathShape(path),
      data: routeData,
      contract,
    });
    this.hono.on(method, path, makeRavenHandler(routeData, this.hooks));
    this.markOpenAPIDocumentDirty();
  }

  getOpenAPIDocument(): OpenAPIDocument {
    return this.getOrBuildOpenAPIDocument();
  }

  private getOrBuildOpenAPIDocument(): OpenAPIDocument {
    if (!this.openAPIExportOptions) {
      throw new Error("OpenAPI export is not configured for this app");
    }

    if (!this.openAPIDocumentDirty && this.openAPIDocumentCache) {
      return this.openAPIDocumentCache;
    }

    const { document, warnings } = buildOpenAPIDocument(
      [...this.routeManifest.values()],
      this.openAPIExportOptions,
    );
    for (const warning of warnings) {
      this.warnOpenAPIExport(warning);
    }

    this.openAPIDocumentCache = document;
    this.openAPIDocumentDirty = false;
    return document;
  }

  private warnOpenAPIExport(warning: OpenAPIWarning): void {
    console.warn(`[Raven OpenAPI] Skipped ${warning.method} ${warning.path}: ${warning.reason}`);
  }

  registerContractRoute(contract: AnyContract, handler: RouteHandler): this {
    this.addRoute(contract.method, contract.path, handler, contract);
    return this;
  }

  exportOpenAPI(options: OpenAPIExportOptions = {}): this {
    if (this.openAPIExportOptions) {
      throw new Error(
        `OpenAPI export is already configured at ${this.openAPIExportOptions.path ?? DEFAULT_OPENAPI_PATH}`,
      );
    }

    const path = options.path ?? DEFAULT_OPENAPI_PATH;
    this.openAPIExportOptions = {
      path,
      info: options.info,
    };
    this.get(path, () => Response.json(this.getOrBuildOpenAPIDocument()));
    this.markOpenAPIDocumentDirty();
    return this;
  }

  get(path: string, handler: Handler): this;
  get<B, Q, P, H, RI, RO>(path: string, handler: SchemaAwareHandler<B, Q, P, H, RI, RO>): this;
  get(path: string, handler: RouteHandler): this {
    this.addRoute("GET", path, handler);
    return this;
  }

  post(path: string, handler: Handler): this;
  post<B, Q, P, H, RI, RO>(path: string, handler: SchemaAwareHandler<B, Q, P, H, RI, RO>): this;
  post(path: string, handler: RouteHandler): this {
    this.addRoute("POST", path, handler);
    return this;
  }

  put(path: string, handler: Handler): this;
  put<B, Q, P, H, RI, RO>(path: string, handler: SchemaAwareHandler<B, Q, P, H, RI, RO>): this;
  put(path: string, handler: RouteHandler): this {
    this.addRoute("PUT", path, handler);
    return this;
  }

  delete(path: string, handler: Handler): this;
  delete<B, Q, P, H, RI, RO>(path: string, handler: SchemaAwareHandler<B, Q, P, H, RI, RO>): this;
  delete(path: string, handler: RouteHandler): this {
    this.addRoute("DELETE", path, handler);
    return this;
  }

  patch(path: string, handler: Handler): this;
  patch<B, Q, P, H, RI, RO>(path: string, handler: SchemaAwareHandler<B, Q, P, H, RI, RO>): this;
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

  onResponseValidationError(hook: OnResponseValidationErrorHook): this {
    this.hooks.onResponseValidationError.push(hook);
    return this;
  }
}
