import Ajv, { type ValidateFunction } from "ajv";
import { RavenError } from "./error.ts";

const ajv = new Ajv({
	coerceTypes: true,
	removeAdditional: true,
	useDefaults: true,
	allErrors: true,
});

const compiledSchemas = new WeakMap<object, ValidateFunction>();

export function validate<T>(schema: object, data: unknown): T {
	let validator = compiledSchemas.get(schema);
	if (!validator) {
		validator = ajv.compile(schema);
		compiledSchemas.set(schema, validator);
	}

	const clonedData = structuredClone(data);
	const valid = validator(clonedData);

	if (!valid) {
		const errors = validator.errors ?? [];
		const message = errors
			.map((err) => `${err.instancePath || "/"}: ${err.message || "invalid"}`)
			.join("; ");
		throw RavenError.ERR_VALIDATION(message || "Validation failed");
	}

	return clonedData as T;
}
