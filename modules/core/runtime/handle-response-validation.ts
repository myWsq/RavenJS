import type { OnResponseValidationErrorHook, ResponseValidationFailure } from "../app/types.ts";

export async function handleResponseValidationHooks(
  failure: ResponseValidationFailure,
  hooks: OnResponseValidationErrorHook[],
): Promise<void> {
  for (const hook of hooks) {
    try {
      await hook(failure);
    } catch (error) {
      console.error("Unhandled response validation hook error:", error);
    }
  }
}
