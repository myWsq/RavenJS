import type { RouteData } from "../app/route-data.ts";
import type { RavenHooks } from "../app/types.ts";
import { Context } from "../context/context.ts";
import { RavenError } from "../error/raven-error.ts";
import { RadixRouter } from "../routing/radix-router.ts";
import { RavenContext } from "../state/builtins.ts";
import { internalSet } from "../state/descriptors.ts";
import { currentAppStorage, requestStorage, type ScopedStateStoreOwner } from "../state/storage.ts";
import { handleError } from "./handle-error.ts";
import { handleResponseHooks } from "./handle-response.ts";
import { processStates } from "./process-states.ts";

export async function dispatchRequest(
  request: Request,
  options: {
    app: ScopedStateStoreOwner;
    router: RadixRouter<RouteData>;
    hooks: RavenHooks;
  },
): Promise<Response> {
  const { app, router, hooks } = options;

  return currentAppStorage.run(app, () => {
    return requestStorage.run(new Map(), async () => {
      try {
        for (const hook of hooks.onRequest) {
          const result = await hook(request);
          if (result instanceof Response) {
            return result;
          }
        }

        const url = new URL(request.url);
        const match = router.find(request.method, url.pathname);
        if (!match) {
          internalSet(RavenContext, new Context(request));
          return handleError(new Error("Not Found"), hooks.onError, 404);
        }

        const { data: routeData, params } = match;
        const query: Record<string, string> = {};
        url.searchParams.forEach((value, key) => {
          query[key] = value;
        });

        internalSet(RavenContext, new Context(request, params, query));
        await processStates(request, params, query, routeData.schemas);

        for (const hook of hooks.beforeHandle) {
          const result = await hook();
          if (result instanceof Response) {
            return handleResponseHooks(result, hooks.beforeResponse);
          }
        }

        return handleResponseHooks(await routeData.handler(), hooks.beforeResponse);
      } catch (error) {
        if (!RavenContext.get()) {
          internalSet(RavenContext, new Context(request));
        }
        return handleError(
          error instanceof Error ? error : RavenError.ERR_UNKNOWN_ERROR(String(error)),
          hooks.onError,
        );
      }
    });
  });
}
