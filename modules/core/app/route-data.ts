import type { AnySchemas } from "../schema/with-schema.ts";
import type { Handler } from "./types.ts";

export interface RouteData {
  handler: Handler;
  schemas?: AnySchemas;
}
