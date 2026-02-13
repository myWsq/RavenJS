import { BunAdapter, NodeAdapter, type ServerAdapter } from "./utils/adapters";

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

export class Raven {
	private adapter: ServerAdapter | null = null;

	/**
	 * Start the HTTP server with the given configuration
	 */
	async listen(config: ServerConfig): Promise<void> {
		if (this.adapter) {
			throw new Error("Server is already running");
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
	 * Handle incoming HTTP request
	 */
	private handleRequest(request: Request): Response | Promise<Response> {
		const url = new URL(request.url);
		const context: Context = {
			request,
			url,
			method: request.method,
			headers: request.headers,
			body: request.body,
		};

		return this.defaultHandler(context);
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