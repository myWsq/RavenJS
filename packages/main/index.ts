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
	private server: ReturnType<typeof Bun.serve> | null = null;

	/**
	 * Start the HTTP server with the given configuration
	 */
	listen(config: ServerConfig): void {
		if (this.server) {
			throw new Error("Server is already running");
		}

		this.server = Bun.serve({
			port: config.port,
			hostname: config.hostname,
			fetch: (request) => {
				return this.handleRequest(request);
			},
		});
	}

	/**
	 * Stop the running server
	 */
	stop(): void {
		if (this.server) {
			this.server.stop();
			this.server = null;
		}
	}

	/**
	 * Handle incoming HTTP request
	 */
	private handleRequest(request: Request): Response {
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