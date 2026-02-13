import type { ServerConfig } from "../index";
import type { IncomingMessage, ServerResponse } from "node:http";

/**
 * Interface for server adapters to abstract different runtimes
 */
export interface ServerAdapter {
	listen(config: ServerConfig, handler: (request: Request) => Response | Promise<Response>): void | Promise<void>;
	stop(): void | Promise<void>;
}

/**
 * Bun adapter using Bun.serve
 */
export class BunAdapter implements ServerAdapter {
	private server: any = null;

	listen(config: ServerConfig, handler: (request: Request) => Response | Promise<Response>): void {
		// @ts-ignore - Bun is global in Bun runtime
		this.server = Bun.serve({
			port: config.port,
			hostname: config.hostname,
			fetch: handler,
		});
	}

	stop(): void {
		if (this.server) {
			this.server.stop();
			this.server = null;
		}
	}
}

/**
 * Node adapter using node:http
 */
export class NodeAdapter implements ServerAdapter {
	private server: any = null;

	async listen(config: ServerConfig, handler: (request: Request) => Response | Promise<Response>): Promise<void> {
		const http = await import("node:http");
		
		this.server = http.createServer(async (req: IncomingMessage, res: ServerResponse) => {
			try {
				// Simple conversion from Node.js http to Web Standard Request
				const protocol = req.headers["x-forwarded-proto"] || "http";
				const host = req.headers.host || `localhost:${config.port}`;
				const url = new URL(req.url || "/", `${protocol}://${host}`);
				
				// Read body if exists
				let body: any = null;
				if (req.method !== "GET" && req.method !== "HEAD") {
					// For simplicity in this initial implementation, we're not fully streaming
					// but a real implementation would stream the body.
					const chunks: Uint8Array[] = [];
					for await (const chunk of req) {
						chunks.push(chunk);
					}
					// @ts-ignore
					body = Buffer.concat(chunks);
				}

				const request = new Request(url.toString(), {
					method: req.method,
					headers: req.headers as any,
					body: body,
				});

				const response = await handler(request);

				// Convert Web Standard Response to Node.js http response
				res.statusCode = response.status;
				response.headers.forEach((value, key) => {
					res.setHeader(key, value);
				});

				if (response.body) {
					const reader = response.body.getReader();
					while (true) {
						const { done, value } = await reader.read();
						if (done) break;
						res.write(value);
					}
				}
				res.end();
			} catch (error) {
				console.error("Error handling request:", error);
				res.statusCode = 500;
				res.end("Internal Server Error");
			}
		});

		this.server.listen(config.port, config.hostname || "0.0.0.0");
	}

	stop(): void {
		if (this.server) {
			this.server.close();
			this.server = null;
		}
	}
}
