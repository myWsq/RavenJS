import type { AnySchemaAwareHandler } from "../schema/with-schema.ts";
import type { StateSetter } from "../state/descriptors.ts";
import type { ScopeKey } from "../state/storage.ts";
import type { Raven } from "./raven.ts";

export interface RavenInstance {
  scopedStateMaps: Map<ScopeKey, Map<symbol, any>>;
}

export type FetchHandler = (request: Request) => Response | Promise<Response>;
export type Handler = () => Response | Promise<Response>;
export type RouteHandler = Handler | AnySchemaAwareHandler;

export type OnRequestHook = (request: Request) => void | Response | Promise<void | Response>;
export type BeforeHandleHook = () => void | Response | Promise<void | Response>;
export type BeforeResponseHook = (response: Response) => void | Response | Promise<void | Response>;
export type OnErrorHook = (error: Error) => Response | Promise<Response> | void | Promise<void>;
export type OnLoadedHook = (app: Raven) => void | Promise<void>;

export interface Plugin {
  name: string;
  load(app: Raven, set: StateSetter): void | Promise<void>;
}

export interface RavenHooks {
  onRequest: OnRequestHook[];
  beforeHandle: BeforeHandleHook[];
  beforeResponse: BeforeResponseHook[];
  onError: OnErrorHook[];
  onLoaded: OnLoadedHook[];
}
