import { BunAdapter, NodeAdapter, type ServerAdapter } from "./utils/adapters";
import { createScopedToken, runScoped } from "./utils/scoped-token";
import { RavenError } from "./utils/error.ts";

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
}

/**
 * Request handler function type
 */
export type RequestHandler = (ctx: Context) => Response | Promise<Response>;

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
export type BeforeResponseHook = (response: Response) => void | Response | Promise<void | Response>;

/**
 * Hook for global error handling
 */
export type OnErrorHook = (error: unknown) => Response | Promise<Response>;

export class Raven {
	private adapter: ServerAdapter | null = null;
	private hooks = {
		onRequest: [] as OnRequestHook[],
		beforeHandle: [] as BeforeHandleHook[],
		beforeResponse: [] as BeforeResponseHook[],
		onError: [] as OnErrorHook[],
	};

	/**
	 * Start the HTTP server with the given configuration
	 */
	async listen(config: ServerConfig): Promise<void> {
		if (this.adapter) {
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
				// 1. Create context and inject it as early as possible
				const url = new URL(request.url);
				const context: Context = {
					request,
					url,
					method: request.method,
					headers: request.headers,
					body: request.body,
				};
				ContextToken.set(context);

				// 2. onRequest hooks (now has access to ContextToken)
				for (const hook of this.hooks.onRequest) {
					const result = await hook();
					if (result instanceof Response) {
						return this.handleResponseHooks(result);
					}
				}

				// 3. beforeHandle hooks
				for (const hook of this.hooks.beforeHandle) {
					const result = await hook();
					if (result instanceof Response) {
						return this.handleResponseHooks(result);
					}
				}

				// 4. Main handler
				const response = await this.defaultHandler(context);

				// 5. beforeResponse hooks
				return this.handleResponseHooks(response);
			} catch (error) {
				return this.handleError(error);
			}
		});
	}

	/**
	 * Run beforeResponse hooks
	 */
	private async handleResponseHooks(response: Response): Promise<Response> {
		let currentResponse = response;
		for (const hook of this.hooks.beforeResponse) {
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
	private async handleError(error: unknown): Promise<Response> {
		if (this.hooks.onError.length > 0) {
			for (const hook of this.hooks.onError) {
				const result = await hook(error);
				if (result instanceof Response) {
					return result;
				}
			}
		}

		// Default error fallback
		console.error("Unhandled error:", error);
		return new Response("Internal Server Error", { status: 500 });
	}

	/**
	 * Default request handler - returns a simple response
	 */
	private defaultHandler(_ctx: Context): Response {
		return new Response("Raven Framework", {
			status: 200,
			headers: {
				"Content-Type": "text/plain",
			},
		});
	}
}
