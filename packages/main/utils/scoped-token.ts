import { AsyncLocalStorage } from "node:async_hooks";

const storage = new AsyncLocalStorage<Map<symbol, any>>();

export function runScoped<R>(callback: () => R): R {
	return storage.run(new Map(), callback);
}

export class ScopedToken<T> {
	public readonly symbol: symbol;

	constructor(public readonly name: string) {
		this.symbol = Symbol(name);
	}

	public get(): T | undefined {
		const store = storage.getStore();
		return store?.get(this.symbol);
	}

	public getOrFailed(): T {
		const store = storage.getStore();
		if (!store) {
			throw new Error(`Scope is not initialized. Cannot access scoped token: ${this.name}`);
		}
		return store.get(this.symbol);
	}

	public set(value: T): void {
		const store = storage.getStore();
		if (!store) {
			throw new Error(`Cannot set value for scoped token "${this.name}": Scope is not initialized.`);
		}
		store.set(this.symbol, value);
	}
}

export function createScopedToken<T>(name: string): ScopedToken<T> {
	return new ScopedToken<T>(name);
}
