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
import { BodyState, HeadersState, ParamsState, QueryState } from "../state/builtins.ts";
import type { AnyContract, HttpMethod } from "../contract/index.ts";
import { isValidationError, validateResponseSchema } from "../schema/validation.ts";
import { currentAppStorage, type ScopeKey } from "../state/storage.ts";
import { isSchemaAwareHandler, type SchemaAwareHandler } from "../schema/with-schema.ts";
import { RadixRouter } from "../routing/radix-router.ts";
import { executePluginLoad, loadPlugins } from "../runtime/load-plugins.ts";
import { dispatchRequest } from "../runtime/dispatch-request.ts";
import { handleResponseValidationHooks } from "../runtime/handle-response-validation.ts";

export function definePlugin(plugin: Plugin): Plugin {
  return plugin;
}

export class Raven implements RavenInstance {
  private readonly router = new RadixRouter<RouteData>();
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
      return (request: Request) =>
        dispatchRequest(request, {
          app: this,
          router: this.router,
          hooks: this.hooks,
        });
    });

    return this.buildPromise;
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
    this.router.add(method, path, routeData);
    this.markOpenAPIDocumentDirty();
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
