import { BunAdapter, NodeAdapter, type ServerAdapter } from "./utils/adapters";
import { createScopedToken, runScoped } from "./utils/scoped-token";
import { RavenError } from "./utils/error.ts";
import { RadixRouter } from "./utils/router";

/**
 * 框架核心 Context 的作用域令牌。
 */
export const ContextToken = createScopedToken<Context>("raven:context");

/**
 * Server configuration options
 */
export interface ServerConfig {
	port: number;
	hostname?: string;
}

/**
 * Context object that encapsulates request and response information
 */
export interface Context {
	request: Request;
	url: URL;
	method: string;
	headers: Headers;
	body: ReadableStream<Uint8Array> | null;
	params: Record<string, string>;
	query: Record<string, string>;
}

/**
 * Request handler function type
 */
export type Handler = () => Response | Promise<Response>;

/**
 * Lifecycle hook for when a request is received
 */
export type OnRequestHook = () => void | Response | Promise<void | Response>;

/**
 * Lifecycle hook before the request handler is called
 */
export type BeforeHandleHook = () => void | Response | Promise<void | Response>;

/**
 * Lifecycle hook after the handler is called, before the response is sent
 */
export type BeforeResponseHook =
	(response: Response) => void | Response | Promise<void | Response>;

/**
 * Hook for global error handling
 */
export type OnErrorHook = (error: unknown) => Response | Promise<Response>;

/**
 * Pipeline of hooks for a route
 */
export interface RoutePipeline {
	onRequest: OnRequestHook[];
	beforeHandle: BeforeHandleHook[];
	beforeResponse: BeforeResponseHook[];
}

/**
 * Internal route data
 */
interface RouteData {
	handler: Handler;
	pipeline: RoutePipeline;
}

/**
 * Plugin definition
 */
export type Plugin<Options = any> = (
	instance: Raven,
	opts: Options,
) => void | Promise<void>;

/**
 * Helper to create a type-safe plugin
 */
export function createPlugin<Options = any>(
	plugin: Plugin<Options>,
): Plugin<Options> {
	return plugin;
}

export class Raven {
	private adapter: ServerAdapter | null = null;
	private router: RadixRouter<RouteData>;
	private prefix: string;
	private parent: Raven | null;
	private plugins: Plugin[] = [];
	private hooks = {
		onRequest: [] as OnRequestHook[],
		beforeHandle: [] as BeforeHandleHook[],
		beforeResponse: [] as BeforeResponseHook[],
		onError: [] as OnErrorHook[],
	};

	constructor(options?: {
		prefix?: string;
		parent?: Raven | null;
		router?: RadixRouter<RouteData>;
	}) {
		this.prefix = options?.prefix ?? "";
		this.parent = options?.parent ?? null;
		this.router = options?.router ?? new RadixRouter<RouteData>();
	}

	/**
	 * Register a plugin
	 */
	async register<Options = any>(
		plugin: Plugin<Options>,
		opts: Options = {} as Options,
	): Promise<this> {
		this.plugins.push(plugin);
		await plugin(this, opts);
		return this;
	}

	/**
	 * Create a route group
	 */
	async group(
		prefix: string,
		callback: (instance: Raven) => void | Promise<void>,
	): Promise<this> {
		const child = new Raven({
			prefix: this.prefix + prefix,
			parent: this,
			router: this.router,
		});
		await callback(child);
		return this;
	}

	/**
	 * Get all hooks of a certain type, including those from parent instances
	 */
	private getAllHooks<K extends keyof typeof this.hooks>(
		type: K,
	): (typeof this.hooks)[K] {
		const allHooks = [] as any[];
		let current: Raven | null = this;
		while (current) {
			allHooks.unshift(...current.hooks[type]);
			current = current.parent;
		}
		return allHooks as (typeof this.hooks)[K];
	}

	/**
	 * Internal method to add a route
	 */
	private addRoute(method: string, path: string, handler: Handler) {
		const fullPath = this.prefix + path;
		const pipeline: RoutePipeline = {
			onRequest: this.getAllHooks("onRequest"),
			beforeHandle: this.getAllHooks("beforeHandle"),
			beforeResponse: this.getAllHooks("beforeResponse"),
		};
		this.router.add(method, fullPath, { handler, pipeline });
	}

	get(path: string, handler: Handler): this {
		this.addRoute("GET", path, handler);
		return this;
	}

	post(path: string, handler: Handler): this {
		this.addRoute("POST", path, handler);
		return this;
	}

	put(path: string, handler: Handler): this {
		this.addRoute("PUT", path, handler);
		return this;
	}

	delete(path: string, handler: Handler): this {
		this.addRoute("DELETE", path, handler);
		return this;
	}

	patch(path: string, handler: Handler): this {
		this.addRoute("PATCH", path, handler);
		return this;
	}

	/**
	 * Start the HTTP server with the given configuration
	 */
	async listen(config: ServerConfig): Promise<void> {
		if (this.adapter || (this.parent && this.parent.adapter)) {
			throw RavenError.ERR_SERVER_ALREADY_RUNNING();
		}

		// Environment detection
		// @ts-ignore
		const isBun = typeof Bun !== "undefined";
		this.adapter = isBun ? new BunAdapter() : new NodeAdapter();

		await this.adapter.listen(config, (request) => {
			return this.handleRequest(request);
		});
	}

	/**
	 * Stop the running server
	 */
	async stop(): Promise<void> {
		if (this.adapter) {
			await this.adapter.stop();
			this.adapter = null;
		}
	}

	/**
	 * Register an onRequest hook
	 */
	onRequest(hook: OnRequestHook): this {
		this.hooks.onRequest.push(hook);
		return this;
	}

	/**
	 * Register a beforeHandle hook
	 */
	beforeHandle(hook: BeforeHandleHook): this {
		this.hooks.beforeHandle.push(hook);
		return this;
	}

	/**
	 * Register a beforeResponse hook
	 */
	beforeResponse(hook: BeforeResponseHook): this {
		this.hooks.beforeResponse.push(hook);
		return this;
	}

	/**
	 * Register an onError hook
	 */
	onError(hook: OnErrorHook): this {
		this.hooks.onError.push(hook);
		return this;
	}

	/**
	 * Handle incoming HTTP request
	 */
	private async handleRequest(request: Request): Promise<Response> {
		return runScoped(async () => {
			try {
				const url = new URL(request.url);

				// 1. Phase 1: Basic context for onRequest
				// Note: params and query are not yet available
				const basicContext: any = {
					request,
					url,
					method: request.method,
					headers: request.headers,
					body: request.body,
				};
				ContextToken.set(basicContext);

				// 2. Global onRequest hooks (not route-specific because we haven't matched yet)
				const globalOnRequest = this.getAllHooks("onRequest");
				for (const hook of globalOnRequest) {
					const result = await hook();
					if (result instanceof Response) {
						return result; // Skip everything else
					}
				}

				// 3. Route matching
				const match = this.router.find(request.method, url.pathname);
				if (!match) {
					return this.handleError(new Error("Not Found"), 404);
				}

				const { data: routeData, params } = match;

				// 4. Phase 2: Assemble full context
				const query: Record<string, string> = {};
				url.searchParams.forEach((value, key) => {
					query[key] = value;
				});

				const fullContext: Context = {
					...basicContext,
					params,
					query,
				};
				ContextToken.set(fullContext);

				// 5. Execute route-specific pipeline
				// Note: Global onRequest were already run, but route-specific onRequest might be different
				// if we implemented per-route hooks. For now, routeData.pipeline.onRequest contains
				// all hooks captured at route definition time.
				// Since we already ran global ones, we need to be careful not to double-run if they overlap.
				// However, the current design captures ALL hooks at definition time.
				// Let's refine this: only run beforeHandle and onwards from the pipeline.

				for (const hook of routeData.pipeline.beforeHandle) {
					const result = await hook();
					if (result instanceof Response) {
						return this.handleResponseHooks(result, routeData.pipeline);
					}
				}

				// 6. Main handler
				const response = await routeData.handler();

				// 7. beforeResponse hooks
				return this.handleResponseHooks(response, routeData.pipeline);
			} catch (error) {
				return this.handleError(error);
			}
		});
	}

	/**
	 * Run beforeResponse hooks
	 */
	private async handleResponseHooks(
		response: Response,
		pipeline?: RoutePipeline,
	): Promise<Response> {
		let currentResponse = response;
		const hooks = pipeline?.beforeResponse ?? this.getAllHooks("beforeResponse");
		for (const hook of hooks) {
			const result = await hook(currentResponse);
			if (result instanceof Response) {
				currentResponse = result;
			}
		}
		return currentResponse;
	}

	/**
	 * Run error hooks
	 */
	private async handleError(
		error: unknown,
		status: number = 500,
	): Promise<Response> {
		const onErrorHooks = this.getAllHooks("onError");
		if (onErrorHooks.length > 0) {
			for (const hook of onErrorHooks) {
				const result = await hook(error);
				if (result instanceof Response) {
					return result;
				}
			}
		}

		// Default error fallback
		if (status === 404) {
			return new Response("Not Found", { status: 404 });
		}
		console.error("Unhandled error:", error);
		return new Response("Internal Server Error", { status: 500 });
	}
}

