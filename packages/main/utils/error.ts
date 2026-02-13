export interface ErrorContext {
	[key: string]: unknown;
}

export class RavenError extends Error {
	public readonly code: string;
	public readonly context: ErrorContext;
	public override readonly cause?: unknown;

	private constructor(code: string, message: string, context: ErrorContext) {
		super(message);
		this.code = code;
		this.context = context;
	}

	public setContext(context: ErrorContext): this {
		Object.assign(this.context, context);
		return this;
	}

	public static ERR_SERVER_ALREADY_RUNNING(): RavenError {
		return new RavenError("ERR_SERVER_ALREADY_RUNNING", "Server is already running", {});
	}

	public static ERR_SCOPED_TOKEN_NOT_INITIALIZED(name: string): RavenError {
		const message = `Scope is not initialized. Cannot access scoped token: ${name}`;
		return new RavenError("ERR_SCOPED_TOKEN_NOT_INITIALIZED", message, {});
	}

	public static ERR_SCOPED_TOKEN_CANNOT_SET(name: string): RavenError {
		const message = `Cannot set value for scoped token "${name}": Scope is not initialized.`;
		return new RavenError("ERR_SCOPED_TOKEN_CANNOT_SET", message, {});
	}

	public toJSON(): Record<string, unknown> {
		return {
			name: this.name,
			code: this.code,
			message: this.message,
			context: this.context,
			cause: this.cause,
			stack: this.stack,
		};
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
