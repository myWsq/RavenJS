import { RavenError } from "../error/raven-error.ts";
import {
  GLOBAL_SCOPE,
  currentAppStorage,
  getOrCreateScopeMap,
  requestStorage,
  type ScopeKey,
} from "./storage.ts";

export interface StateView<T> {
  get(): T | undefined;
  getOrFailed(): T;
}

export interface StateOptions {
  name?: string;
}

let stateCounter = 0;

export abstract class ScopedState<T> {
  public readonly symbol: symbol;
  public readonly name: string;

  constructor(options?: StateOptions) {
    this.name = options?.name ?? `state:${++stateCounter}`;
    this.symbol = Symbol(this.name);
  }

  public abstract get(): T | undefined;
  public abstract in(scopeKey: ScopeKey): StateView<T>;

  public getOrFailed(): T {
    const value = this.get();
    if (value === undefined) {
      throw RavenError.ERR_STATE_NOT_INITIALIZED(this.name);
    }
    return value;
  }
}

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

export class AppState<T> extends ScopedState<T> {
  private readonly views = new Map<ScopeKey, AppStateView<T>>();

  public override get(): T | undefined {
    const app = currentAppStorage.getStore();
    return app?.scopedStateMaps.get(GLOBAL_SCOPE)?.get(this.symbol);
  }

  public override in(scopeKey: ScopeKey): AppStateView<T> {
    if (!this.views.has(scopeKey)) {
      this.views.set(scopeKey, new AppStateView<T>(this, scopeKey));
    }
    return this.views.get(scopeKey)!;
  }
}

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

export class RequestState<T> extends ScopedState<T> {
  private readonly views = new Map<ScopeKey, RequestStateView<T>>();

  public override get(): T | undefined {
    const store = requestStorage.getStore();
    return store?.get(GLOBAL_SCOPE)?.get(this.symbol);
  }

  public override in(scopeKey: ScopeKey): RequestStateView<T> {
    if (!this.views.has(scopeKey)) {
      this.views.set(scopeKey, new RequestStateView<T>(this, scopeKey));
    }
    return this.views.get(scopeKey)!;
  }
}

export function defineAppState<T>(options?: StateOptions): AppState<T> {
  return new AppState<T>(options);
}

export function defineRequestState<T>(options?: StateOptions): RequestState<T> {
  return new RequestState<T>(options);
}

export type StateSetter = <T>(state: ScopedState<T>, value: T) => void;

export function internalSet<T>(state: ScopedState<T>, value: T): void {
  if (state instanceof AppState) {
    const app = currentAppStorage.getStore();
    if (!app) {
      throw RavenError.ERR_STATE_CANNOT_SET(state.name);
    }
    getOrCreateScopeMap(app.scopedStateMaps, GLOBAL_SCOPE).set(state.symbol, value);
    return;
  }

  if (state instanceof RequestState) {
    const reqMap = requestStorage.getStore();
    if (!reqMap) {
      throw RavenError.ERR_STATE_CANNOT_SET(state.name);
    }
    getOrCreateScopeMap(reqMap, GLOBAL_SCOPE).set(state.symbol, value);
  }
}
