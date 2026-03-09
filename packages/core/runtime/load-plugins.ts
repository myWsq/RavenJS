import type { OnLoadedHook, Plugin } from "../app/types.ts";
import {
  AppState,
  RequestState,
  type ScopedState,
  type StateSetter,
} from "../state/descriptors.ts";
import {
  currentAppStorage,
  getOrCreateScopeMap,
  requestStorage,
  GLOBAL_SCOPE,
  type ScopeKey,
  type ScopedStateStoreOwner,
} from "../state/storage.ts";

function createStateSetter(app: ScopedStateStoreOwner, scope: ScopeKey): StateSetter {
  return <T>(state: ScopedState<T>, value: T): void => {
    if (state instanceof AppState) {
      getOrCreateScopeMap(app.scopedStateMaps, scope).set(state.symbol, value);
      return;
    }

    if (state instanceof RequestState) {
      const reqMap = requestStorage.getStore();
      if (reqMap) {
        getOrCreateScopeMap(reqMap, scope).set(state.symbol, value);
      }
    }
  };
}

export async function executePluginLoad(
  app: ScopedStateStoreOwner,
  plugin: Plugin,
  scopeKey?: ScopeKey,
): Promise<void> {
  const scope: ScopeKey = scopeKey ?? GLOBAL_SCOPE;
  try {
    await plugin.load(app as never, createStateSetter(app, scope));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`[${plugin.name}] Plugin load failed: ${message}`, { cause: err });
  }
}

export async function loadPlugins(
  app: ScopedStateStoreOwner,
  pendingPlugins: Array<{ plugin: Plugin; scopeKey?: ScopeKey }>,
  onLoadedHooks: OnLoadedHook[],
): Promise<void> {
  await currentAppStorage.run(app, async () => {
    for (const { plugin, scopeKey } of pendingPlugins) {
      await executePluginLoad(app, plugin, scopeKey);
    }

    for (const hook of onLoadedHooks) {
      await hook(app as never);
    }
  });
}
