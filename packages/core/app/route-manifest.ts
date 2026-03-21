import type { AnyContract, HttpMethod } from "../contract/index.ts";
import type { RouteData } from "./route-data.ts";

export interface RegisteredRoute {
  readonly method: HttpMethod;
  readonly path: string;
  readonly normalizedPath: string;
  readonly data: RouteData;
  readonly contract?: AnyContract;
}

export function normalizeRoutePathShape(path: string): string {
  const segments = path
    .split("/")
    .filter((segment) => segment.length > 0)
    .map((segment) => {
      if (segment === "*") {
        return "*";
      }

      return segment.startsWith(":") ? ":" : segment;
    });

  return segments.length === 0 ? "/" : `/${segments.join("/")}`;
}

export function makeRegisteredRouteKey(method: string, path: string): string {
  return `${method.toUpperCase()} ${normalizeRoutePathShape(path)}`;
}
