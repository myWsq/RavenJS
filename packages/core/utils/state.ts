import { AsyncLocalStorage } from "node:async_hooks";
import { RavenError } from "./error.ts";

/**
 * Interface representing a Raven instance as a state container.
 * This avoids circular dependency with Raven class.
 */
export interface RavenInstance {
	parent: RavenInstance | null;
	internalStateMap: Map<symbol, any>;
}

export const currentAppStorage = new AsyncLocalStorage<RavenInstance>();
export const requestStorage = new AsyncLocalStorage<Map<symbol, any>>();

export abstract class ScopedState<T> {
	public readonly symbol: symbol;

	constructor(public readonly name: string) {
		this.symbol = Symbol(name);
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
	public get(): T | undefined {
		let current: RavenInstance | null | undefined = currentAppStorage.getStore();
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

export function createAppState<T>(name: string): AppState<T> {
	return new AppState<T>(name);
}

export function createRequestState<T>(name: string): RequestState<T> {
	return new RequestState<T>(name);
}
