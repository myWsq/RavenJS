import { Context } from "../context/context.ts";
import { defineRequestState } from "./descriptors.ts";

export const RavenContext = defineRequestState<Context>({ name: "raven:context" });
export const BodyState = defineRequestState<unknown>({ name: "raven:body" });
export const QueryState = defineRequestState<Record<string, string>>({ name: "raven:query" });
export const ParamsState = defineRequestState<Record<string, string>>({ name: "raven:params" });
export const HeadersState = defineRequestState<Record<string, string>>({ name: "raven:headers" });
