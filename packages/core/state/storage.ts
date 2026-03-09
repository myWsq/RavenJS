import { AsyncLocalStorage } from "node:async_hooks";

export type ScopeKey = string | symbol;
export type ScopedStateMaps = Map<ScopeKey, Map<symbol, any>>;

export interface ScopedStateStoreOwner {
  scopedStateMaps: ScopedStateMaps;
}

export const currentAppStorage = new AsyncLocalStorage<ScopedStateStoreOwner>();
export const requestStorage = new AsyncLocalStorage<ScopedStateMaps>();

export const GLOBAL_SCOPE: unique symbol = Symbol("raven:global");

export function getOrCreateScopeMap(parent: ScopedStateMaps, key: ScopeKey): Map<symbol, any> {
  let map = parent.get(key);
  if (!map) {
    map = new Map<symbol, any>();
    parent.set(key, map);
  }
  return map;
}
