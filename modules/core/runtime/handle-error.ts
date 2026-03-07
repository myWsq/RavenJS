import type { OnErrorHook } from "../app/types.ts";
import { isRavenError } from "../error/raven-error.ts";

export async function handleError(
  error: Error,
  hooks: OnErrorHook[],
  status: number = 500,
): Promise<Response> {
  for (const hook of hooks) {
    const result = await hook(error);
    if (result instanceof Response) {
      return result;
    }
  }

  if (isRavenError(error)) {
    return error.toResponse();
  }
  if (status === 404) {
    return new Response("Not Found", { status: 404 });
  }

  console.error("Unhandled error:", error);
  return new Response("Internal Server Error", { status: 500 });
}
