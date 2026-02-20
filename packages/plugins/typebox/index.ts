import { type Static, type TSchema } from "@sinclair/typebox";
import {
	createRequestState,
	createAppState,
	type RequestState,
	type AppState,
	type StateSource,
} from "@ravenjs/core";

export interface TypedStateOptions<S extends TSchema> {
	name?: string;
	schema: S;
	source?: StateSource;
}

export function createTypedRequestState<S extends TSchema>(
	options: TypedStateOptions<S>
): RequestState<Static<S>> {
	return createRequestState<Static<S>>({
		name: options.name,
		schema: options.schema,
		source: options.source,
	});
}

export function createTypedAppState<S extends TSchema>(
	options: TypedStateOptions<S>
): AppState<Static<S>> {
	return createAppState<Static<S>>({
		name: options.name,
		schema: options.schema,
		source: options.source,
	});
}

export { Type } from "@sinclair/typebox";
export type { Static, TSchema } from "@sinclair/typebox";
