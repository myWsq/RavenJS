import { AsyncLocalStorage } from "node:async_hooks";
import { RavenError } from "./error.ts";

export interface RavenInstance {
	parent: RavenInstance | null;
	internalStateMap: Map<symbol, any>;
}

export const currentAppStorage = new AsyncLocalStorage<RavenInstance>();
export const requestStorage = new AsyncLocalStorage<Map<symbol, any>>();

export type StateSource = "body" | "query" | "params" | "header";

export interface StateOptions {
	name?: string;
	schema?: object;
	source?: StateSource;
}

let stateCounter = 0;

export abstract class ScopedState<T> {
	public readonly symbol: symbol;
	public readonly name: string;
	public readonly schema?: object;
	public readonly source?: StateSource;

	constructor(options?: StateOptions) {
		this.name = options?.name ?? `state:${++stateCounter}`;
		this.symbol = Symbol(this.name);
		this.schema = options?.schema;
		this.source = options?.source;
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

export function createRequestState<T>(options?: StateOptions): RequestState<T> {
	return new RequestState<T>(options);
}
