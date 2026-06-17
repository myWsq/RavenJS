import type { BeforeResponseHook } from "../app/types.ts";
import { isResponse } from "./is-response.ts";

export async function handleResponseHooks(
  response: Response,
  hooks: BeforeResponseHook[],
): Promise<Response> {
  let current = response;
  for (const hook of hooks) {
    const result = await hook(current);
    if (isResponse(result)) {
      current = result;
    }
  }
  return current;
}
