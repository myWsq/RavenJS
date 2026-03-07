import { RavenError } from "../error/raven-error.ts";
import { validateRequestSchemas } from "../schema/validation.ts";
import type { AnySchemas } from "../schema/with-schema.ts";
import { BodyState, HeadersState, ParamsState, QueryState } from "../state/builtins.ts";
import { internalSet } from "../state/descriptors.ts";

export async function processStates(
  request: Request,
  params: Record<string, string>,
  query: Record<string, string>,
  schemas?: AnySchemas,
): Promise<void> {
  const headersObj: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headersObj[key.toLowerCase()] = value;
  });

  const contentType = request.headers.get("content-type") || "";
  let bodyData: unknown;
  if (contentType.includes("application/json")) {
    try {
      bodyData = await request.json();
    } catch (err) {
      throw RavenError.ERR_BAD_REQUEST(
        `Invalid JSON body: ${err instanceof Error ? err.message : "parse error"}`,
      );
    }
  }

  const validated = await validateRequestSchemas(schemas, {
    body: bodyData,
    query,
    params,
    headers: headersObj,
  });

  internalSet(ParamsState, validated.params as any);
  internalSet(QueryState, validated.query as any);
  internalSet(HeadersState, validated.headers as any);
  if (validated.body !== undefined) {
    internalSet(BodyState, validated.body);
  }
}
