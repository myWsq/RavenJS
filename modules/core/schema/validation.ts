import type { StandardSchemaV1 } from "./standard-schema.ts";
import type { AnySchemas } from "./with-schema.ts";

type ValidationResults = {
  body?: StandardSchemaV1.FailureResult;
  query?: StandardSchemaV1.FailureResult;
  params?: StandardSchemaV1.FailureResult;
  headers?: StandardSchemaV1.FailureResult;
};

type ValidationInput = {
  body: unknown;
  query: Record<string, string>;
  params: Record<string, string>;
  headers: Record<string, string>;
};

type ValidationOutput = {
  body: unknown;
  query: unknown;
  params: unknown;
  headers: unknown;
};

export class ValidationError extends Error {
  public readonly bodyIssues?: readonly StandardSchemaV1.Issue[];
  public readonly queryIssues?: readonly StandardSchemaV1.Issue[];
  public readonly paramsIssues?: readonly StandardSchemaV1.Issue[];
  public readonly headersIssues?: readonly StandardSchemaV1.Issue[];

  constructor(results: ValidationResults) {
    const allIssues = [
      ...(results.body?.issues ?? []),
      ...(results.query?.issues ?? []),
      ...(results.params?.issues ?? []),
      ...(results.headers?.issues ?? []),
    ];
    const message = allIssues.map((issue) => issue.message).join(", ");
    super(message);
    this.name = "ValidationError";
    this.bodyIssues = results.body?.issues;
    this.queryIssues = results.query?.issues;
    this.paramsIssues = results.params?.issues;
    this.headersIssues = results.headers?.issues;
  }
}

export function isValidationError(value: unknown): value is ValidationError {
  return value instanceof ValidationError;
}

function isFailureResult<T>(
  result: StandardSchemaV1.Result<T> | undefined,
): result is StandardSchemaV1.FailureResult {
  return Array.isArray(result?.issues);
}

async function validateSchema<T>(
  schema: StandardSchemaV1<unknown, T> | undefined,
  value: unknown,
): Promise<StandardSchemaV1.Result<T> | undefined> {
  if (!schema) {
    return undefined;
  }

  return schema["~standard"].validate(value);
}

export async function validateRequestSchemas(
  schemas: AnySchemas | undefined,
  input: ValidationInput,
): Promise<ValidationOutput> {
  const [bodyResult, queryResult, paramsResult, headersResult] = await Promise.all([
    validateSchema(schemas?.body, input.body),
    validateSchema(schemas?.query, input.query),
    validateSchema(schemas?.params, input.params),
    validateSchema(schemas?.headers, input.headers),
  ]);

  if (
    isFailureResult(bodyResult) ||
    isFailureResult(queryResult) ||
    isFailureResult(paramsResult) ||
    isFailureResult(headersResult)
  ) {
    throw new ValidationError({
      body: isFailureResult(bodyResult) ? bodyResult : undefined,
      query: isFailureResult(queryResult) ? queryResult : undefined,
      params: isFailureResult(paramsResult) ? paramsResult : undefined,
      headers: isFailureResult(headersResult) ? headersResult : undefined,
    });
  }

  return {
    body: bodyResult ? bodyResult.value : input.body,
    query: queryResult ? queryResult.value : input.query,
    params: paramsResult ? paramsResult.value : input.params,
    headers: headersResult ? headersResult.value : input.headers,
  };
}
