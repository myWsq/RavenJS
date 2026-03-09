import type { BeforeResponseHook } from "../app/types.ts";

export async function handleResponseHooks(
  response: Response,
  hooks: BeforeResponseHook[],
): Promise<Response> {
  let current = response;
  for (const hook of hooks) {
    const result = await hook(current);
    if (result instanceof Response) {
      current = result;
    }
  }
  return current;
}
