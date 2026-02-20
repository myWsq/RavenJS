export interface ErrorContext {
	[key: string]: unknown;
}

export class RavenError extends Error {
	public readonly code: string;
	public readonly context: ErrorContext;
	public readonly statusCode?: number;
	public override readonly cause?: unknown;

	private constructor(code: string, message: string, context: ErrorContext, statusCode?: number) {
		super(message);
		this.code = code;
		this.context = context;
		this.statusCode = statusCode;
	}

	public setContext(context: ErrorContext): this {
		Object.assign(this.context, context);
		return this;
	}

	public static ERR_SERVER_ALREADY_RUNNING(): RavenError {
		return new RavenError("ERR_SERVER_ALREADY_RUNNING", "Server is already running", {});
	}

	public static ERR_STATE_NOT_INITIALIZED(name: string): RavenError {
		return new RavenError(
			"ERR_STATE_NOT_INITIALIZED",
			`State is not initialized. Cannot access state: ${name}`,
			{}
		);
	}

	public static ERR_STATE_CANNOT_SET(name: string): RavenError {
		return new RavenError(
			"ERR_STATE_CANNOT_SET",
			`Cannot set value for state "${name}": Scope is not initialized.`,
			{}
		);
	}

	public static ERR_VALIDATION(message: string): RavenError {
		return new RavenError("ERR_VALIDATION", message, {}, 400);
	}

	public toJSON(): Record<string, unknown> {
		return {
			name: this.name,
			code: this.code,
			message: this.message,
			context: this.context,
			statusCode: this.statusCode,
			cause: this.cause,
			stack: this.stack,
		};
	}

	public toResponse(): Response {
		const status = this.statusCode ?? 500;
		return new Response(
			JSON.stringify({ message: this.message }),
			{
				status,
				headers: { "Content-Type": "application/json" },
			}
		);
	}
}

Object.defineProperty(RavenError.prototype, "name", {
	value: "RavenError",
	writable: true,
	configurable: true,
});

export function isRavenError(value: unknown): value is RavenError {
	return value instanceof RavenError;
}
