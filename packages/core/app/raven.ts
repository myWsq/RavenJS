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
import { BodyState, HeadersState, ParamsState, QueryState } from "../state/builtins.ts";
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

  private addRoute(method: string, path: string, handler: RouteHandler): void {
    if (isSchemaAwareHandler(handler)) {
      this.router.add(method, path, {
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
      });
      return;
    }

    this.router.add(method, path, { handler });
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
