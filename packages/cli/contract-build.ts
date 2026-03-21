import { mkdir, readFile, rm, stat, writeFile } from "fs/promises";
import { basename, dirname, join, relative, resolve } from "path";
import { pathToFileURL } from "url";
import { randomUUID } from "crypto";

import ts from "typescript";
import { stringify as stringifyYaml } from "yaml";

import type {
  AnyContract,
  ContractSchemaKey,
  RavenContractArtifact,
} from "../core/contract/index.ts";
import { materializeContractSchemas } from "../core/contract/index.ts";

export interface BuildContractCLIOptions {
  config?: string;
  watch?: boolean;
}

interface RavenContractBuildConfig {
  backend: {
    tsconfig: string;
    contracts: string[];
  };
  outDir?: string;
  openapi?: {
    title?: string;
    version?: string;
  };
}

interface ResolvedRavenContractBuildConfig {
  configPath: string;
  configDir: string;
  backendTsconfigPath: string;
  contractPatterns: string[];
  outDir: string;
  openapiTitle: string;
  openapiVersion: string;
}

interface ExtractedContractEntry {
  exportName: string;
  sourcePath: string;
  sourcePathRelativeToConfig: string;
}

interface BuildContractResult {
  bundlePath: string;
  openapiJsonPath: string;
  openapiYamlPath: string;
  contracts: string[];
  watchedFiles: string[];
}

interface ContractMaterializationPayload {
  entries: ExtractedContractEntry[];
}

interface MaterializedContractEntry {
  id: string;
  exportName: string;
  sourcePath: string;
  method: AnyContract["method"];
  path: string;
  draftSchemas: ReturnType<typeof materializeContractSchemas>;
  openapiSchemas: ReturnType<typeof materializeContractSchemas>;
}

interface OpenAPIParameter {
  name: string;
  in: "query" | "path" | "header";
  required: boolean;
  schema: Record<string, unknown>;
}

interface OpenAPIInfo {
  title: string;
  version: string;
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function ensureDir(path: string) {
  await mkdir(path, { recursive: true });
}

async function readPackageDefaults(configDir: string): Promise<OpenAPIInfo> {
  const packageJsonPath = join(configDir, "package.json");
  if (!(await pathExists(packageJsonPath))) {
    return {
      title: basename(configDir),
      version: "0.0.0",
    };
  }

  const packageJson = JSON.parse(await readFile(packageJsonPath, "utf-8")) as {
    name?: string;
    version?: string;
  };

  return {
    title: packageJson.name ?? basename(configDir),
    version: packageJson.version ?? "0.0.0",
  };
}

async function loadBuildContractConfig(
  cwd: string,
  configPathOption?: string,
): Promise<ResolvedRavenContractBuildConfig> {
  const configPath = resolve(cwd, configPathOption ?? "raven.contract.json");
  if (!(await pathExists(configPath))) {
    throw new Error(`Contract build config not found: ${configPath}`);
  }

  const config = JSON.parse(await readFile(configPath, "utf-8")) as RavenContractBuildConfig;
  const configDir = dirname(configPath);
  const packageDefaults = await readPackageDefaults(configDir);

  if (!config.backend?.tsconfig) {
    throw new Error(`Invalid contract build config at ${configPath}: backend.tsconfig is required`);
  }

  if (!Array.isArray(config.backend.contracts) || config.backend.contracts.length === 0) {
    throw new Error(
      `Invalid contract build config at ${configPath}: backend.contracts is required`,
    );
  }

  return {
    configPath,
    configDir,
    backendTsconfigPath: resolve(configDir, config.backend.tsconfig),
    contractPatterns: config.backend.contracts,
    outDir: resolve(configDir, config.outDir ?? "dist"),
    openapiTitle: config.openapi?.title ?? packageDefaults.title,
    openapiVersion: config.openapi?.version ?? packageDefaults.version,
  };
}

function loadTsConfig(tsconfigPath: string): ts.ParsedCommandLine {
  const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
  if (configFile.error) {
    throw new Error(ts.formatDiagnosticsWithColorAndContext([configFile.error], diagnosticHost));
  }

  return ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    dirname(tsconfigPath),
    undefined,
    tsconfigPath,
  );
}

function collectContractSourceFiles(config: ResolvedRavenContractBuildConfig): string[] {
  const fileSet = new Set<string>();

  for (const pattern of config.contractPatterns) {
    const normalizedPattern = pattern.replace(/\\/g, "/");
    const files = ts.sys.readDirectory(
      config.configDir,
      [".ts", ".tsx", ".js", ".jsx"],
      undefined,
      [normalizedPattern],
    );

    for (const file of files) {
      fileSet.add(resolve(file));
    }
  }

  return [...fileSet].sort();
}

function hasExportModifier(node: ts.Node): boolean {
  return (ts.getCombinedModifierFlags(node as ts.Declaration) & ts.ModifierFlags.Export) !== 0;
}

function isDefineContractCall(expression: ts.Expression): boolean {
  if (!ts.isCallExpression(expression)) {
    return false;
  }

  if (ts.isIdentifier(expression.expression)) {
    return expression.expression.text === "defineContract";
  }

  if (ts.isPropertyAccessExpression(expression.expression)) {
    return expression.expression.name.text === "defineContract";
  }

  return false;
}

function extractContractExports(
  program: ts.Program,
  sourcePaths: string[],
  configDir: string,
): ExtractedContractEntry[] {
  const extracted: ExtractedContractEntry[] = [];

  for (const sourcePath of sourcePaths) {
    const sourceFile = program.getSourceFile(sourcePath);
    if (!sourceFile) {
      continue;
    }

    for (const statement of sourceFile.statements) {
      if (!ts.isVariableStatement(statement) || !hasExportModifier(statement)) {
        continue;
      }

      for (const declaration of statement.declarationList.declarations) {
        if (
          ts.isIdentifier(declaration.name) &&
          declaration.initializer &&
          isDefineContractCall(declaration.initializer)
        ) {
          extracted.push({
            exportName: declaration.name.text,
            sourcePath,
            sourcePathRelativeToConfig: relative(configDir, sourcePath).replace(/\\/g, "/"),
          });
        }
      }
    }
  }

  return extracted.sort((left, right) => left.sourcePath.localeCompare(right.sourcePath));
}

function makeContractId(entry: ExtractedContractEntry): string {
  return `${entry.sourcePathRelativeToConfig}#${entry.exportName}`;
}

function makeSchemaId(entry: ExtractedContractEntry, key: ContractSchemaKey): string {
  return `${entry.sourcePathRelativeToConfig}#${entry.exportName}.${key}`.replace(
    /[^A-Za-z0-9_#.:-]/g,
    "_",
  );
}

async function importContractModule(
  entry: ExtractedContractEntry,
  cacheBust: string,
): Promise<Record<string, unknown>> {
  const moduleUrl = `${pathToFileURL(entry.sourcePath).href}?raven_contract_build=${cacheBust}`;
  return (await import(moduleUrl)) as Record<string, unknown>;
}

function assertContractValue(
  value: unknown,
  entry: ExtractedContractEntry,
): asserts value is AnyContract {
  if (typeof value !== "object" || value === null) {
    throw new Error(
      `Contract export '${entry.exportName}' from ${entry.sourcePath} is not an object`,
    );
  }

  const contract = value as { method?: unknown; path?: unknown; schemas?: unknown };
  if (typeof contract.method !== "string" || typeof contract.path !== "string") {
    throw new Error(
      `Contract export '${entry.exportName}' from ${entry.sourcePath} must expose string method/path`,
    );
  }

  if (typeof contract.schemas !== "object" || contract.schemas === null) {
    throw new Error(
      `Contract export '${entry.exportName}' from ${entry.sourcePath} must expose a schemas object`,
    );
  }
}

function buildBundle(
  config: ResolvedRavenContractBuildConfig,
  entries: ExtractedContractEntry[],
  bundleSchemas: Record<string, Record<string, unknown>>,
  artifacts: RavenContractArtifact[],
) {
  return {
    version: 1 as const,
    schemaTarget: "draft-2020-12",
    generatedAt: new Date().toISOString(),
    source: {
      configPath: relative(config.configDir, config.configPath).replace(/\\/g, "/"),
      backendTsconfigPath: relative(config.configDir, config.backendTsconfigPath).replace(
        /\\/g,
        "/",
      ),
    },
    contracts: artifacts,
    schemas: bundleSchemas,
    metadata: {
      contractFiles: entries.map((entry) => entry.sourcePathRelativeToConfig),
    },
  };
}

function extractOpenAPIParameters(
  schema: Record<string, unknown>,
  location: OpenAPIParameter["in"],
): OpenAPIParameter[] {
  const properties = schema.properties;
  if (!properties || typeof properties !== "object" || Array.isArray(properties)) {
    throw new Error(
      `OpenAPI ${location} schemas must materialize to an object schema with properties`,
    );
  }

  const required = new Set(
    Array.isArray(schema.required)
      ? schema.required.filter((value): value is string => typeof value === "string")
      : [],
  );

  return Object.entries(properties).map(([name, propertySchema]) => {
    if (
      typeof propertySchema !== "object" ||
      propertySchema === null ||
      Array.isArray(propertySchema)
    ) {
      throw new Error(`OpenAPI ${location} property '${name}' must materialize to a schema object`);
    }

    return {
      name,
      in: location,
      required: location === "path" ? true : required.has(name),
      schema: propertySchema as Record<string, unknown>,
    };
  });
}

function toOpenAPIPath(path: string): string {
  return path.replace(/:([A-Za-z0-9_]+)/g, "{$1}");
}

function buildOpenAPIDocument(
  contracts: RavenContractArtifact[],
  openapiSchemas: Record<string, Record<string, unknown>>,
  info: OpenAPIInfo,
) {
  const paths: Record<string, Record<string, unknown>> = {};

  for (const contract of contracts) {
    const openapiPath = toOpenAPIPath(contract.path);
    const operation: Record<string, unknown> = {
      operationId: contract.exportName,
      responses: {
        "200": contract.schemas.response
          ? {
              description: "Success",
              content: {
                "application/json": {
                  schema: {
                    $ref: contract.schemas.response.$ref.replace(
                      "#/schemas/",
                      "#/components/schemas/",
                    ),
                  },
                },
              },
            }
          : {
              description: "Success",
            },
      },
    };

    const parameters: OpenAPIParameter[] = [];

    if (contract.schemas.query) {
      const querySchema = openapiSchemas[contract.schemas.query.$ref.replace("#/schemas/", "")];
      if (!querySchema) {
        throw new Error(`Missing OpenAPI schema for query ref ${contract.schemas.query.$ref}`);
      }
      parameters.push(...extractOpenAPIParameters(querySchema, "query"));
    }

    if (contract.schemas.params) {
      const paramsSchema = openapiSchemas[contract.schemas.params.$ref.replace("#/schemas/", "")];
      if (!paramsSchema) {
        throw new Error(`Missing OpenAPI schema for params ref ${contract.schemas.params.$ref}`);
      }
      parameters.push(...extractOpenAPIParameters(paramsSchema, "path"));
    }

    if (contract.schemas.headers) {
      const headersSchema = openapiSchemas[contract.schemas.headers.$ref.replace("#/schemas/", "")];
      if (!headersSchema) {
        throw new Error(`Missing OpenAPI schema for headers ref ${contract.schemas.headers.$ref}`);
      }
      parameters.push(...extractOpenAPIParameters(headersSchema, "header"));
    }

    if (parameters.length > 0) {
      operation.parameters = parameters;
    }

    if (contract.schemas.body) {
      operation.requestBody = {
        required: true,
        content: {
          "application/json": {
            schema: {
              $ref: contract.schemas.body.$ref.replace("#/schemas/", "#/components/schemas/"),
            },
          },
        },
      };
    }

    paths[openapiPath] = {
      ...(paths[openapiPath] ?? {}),
      [contract.method.toLowerCase()]: operation,
    };
  }

  return {
    openapi: "3.0.3",
    info,
    paths,
    components: {
      schemas: openapiSchemas,
    },
  };
}

async function writeContractOutputs(
  config: ResolvedRavenContractBuildConfig,
  bundle: ReturnType<typeof buildBundle>,
  openapiDocument: ReturnType<typeof buildOpenAPIDocument>,
): Promise<BuildContractResult> {
  await ensureDir(config.outDir);

  const bundlePath = join(config.outDir, "raven-contract.json");
  const openapiJsonPath = join(config.outDir, "openapi.json");
  const openapiYamlPath = join(config.outDir, "openapi.yml");

  await writeFile(bundlePath, `${JSON.stringify(bundle, null, 2)}\n`);
  await writeFile(openapiJsonPath, `${JSON.stringify(openapiDocument, null, 2)}\n`);
  await writeFile(openapiYamlPath, stringifyYaml(openapiDocument));

  return {
    bundlePath,
    openapiJsonPath,
    openapiYamlPath,
    contracts: bundle.contracts.map((contract) => contract.exportName),
    watchedFiles: [
      config.configPath,
      config.backendTsconfigPath,
      ...bundle.metadata.contractFiles.map((file) => resolve(config.configDir, file)),
    ],
  };
}

async function runSingleBuild(
  cwd: string,
  options: BuildContractCLIOptions,
  cacheBust: string,
): Promise<BuildContractResult> {
  const config = await loadBuildContractConfig(cwd, options.config);
  const contractSourceFiles = collectContractSourceFiles(config);

  if (contractSourceFiles.length === 0) {
    throw new Error(`No contract files matched in ${config.configPath}`);
  }

  const parsedTsConfig = loadTsConfig(config.backendTsconfigPath);
  const program = ts.createProgram({
    rootNames: contractSourceFiles,
    options: parsedTsConfig.options,
  });

  const entries = extractContractExports(program, contractSourceFiles, config.configDir);
  if (entries.length === 0) {
    throw new Error(
      `No exported defineContract(...) declarations found in configured contract files`,
    );
  }

  const materializedEntries = await loadMaterializedContracts(entries, config, cacheBust);
  const bundleSchemas: Record<string, Record<string, unknown>> = {};
  const openapiSchemas: Record<string, Record<string, unknown>> = {};
  const artifacts: RavenContractArtifact[] = [];

  for (const entry of materializedEntries) {
    const refs: RavenContractArtifact["schemas"] = {};
    for (const key of ["body", "query", "params", "headers", "response"] as const) {
      const draftSchema = entry.draftSchemas[key];
      const openapiSchema = entry.openapiSchemas[key];
      if (!draftSchema || !openapiSchema) {
        continue;
      }

      const schemaId = makeSchemaId(
        {
          exportName: entry.exportName,
          sourcePath: resolve(config.configDir, entry.sourcePath),
          sourcePathRelativeToConfig: entry.sourcePath,
        },
        key,
      );
      bundleSchemas[schemaId] = draftSchema;
      openapiSchemas[schemaId] = openapiSchema;
      refs[key] = {
        $ref: `#/schemas/${schemaId}`,
      };
    }

    artifacts.push({
      id: entry.id,
      exportName: entry.exportName,
      sourcePath: entry.sourcePath,
      method: entry.method,
      path: entry.path,
      schemas: refs,
    });
  }

  const bundle = buildBundle(config, entries, bundleSchemas, artifacts);
  const openapiDocument = buildOpenAPIDocument(artifacts, openapiSchemas, {
    title: config.openapiTitle,
    version: config.openapiVersion,
  });

  return writeContractOutputs(config, bundle, openapiDocument);
}

async function loadMaterializedContracts(
  entries: ExtractedContractEntry[],
  config: ResolvedRavenContractBuildConfig,
  cacheBust: string,
): Promise<MaterializedContractEntry[]> {
  const payloadPath = join(config.configDir, `.raven-contract-build-${randomUUID()}.json`);

  try {
    await writeFile(
      payloadPath,
      JSON.stringify({ entries } satisfies ContractMaterializationPayload),
    );

    const cliEntrypoint = process.argv[1];
    if (!cliEntrypoint) {
      throw new Error("Cannot locate current CLI entrypoint for contract materialization");
    }

    const proc = Bun.spawn({
      cmd: [
        "bun",
        cliEntrypoint,
        "__build-contract-snapshot",
        "--payload",
        payloadPath,
        "--cache-bust",
        cacheBust,
      ],
      cwd: config.configDir,
      stdout: "pipe",
      stderr: "pipe",
    });
    const stdout = await new Response(proc.stdout).text();
    const stderr = await new Response(proc.stderr).text();
    const exitCode = await proc.exited;

    if (exitCode !== 0) {
      throw new Error(stderr.trim() || stdout.trim() || "Unknown contract materialization error");
    }

    return JSON.parse(stdout) as MaterializedContractEntry[];
  } finally {
    await rm(payloadPath, { force: true }).catch(() => {});
  }
}

export async function cmdBuildContractSnapshot(
  payloadPath: string,
  cacheBust = Date.now().toString(),
) {
  const payload = JSON.parse(
    await readFile(resolve(payloadPath), "utf-8"),
  ) as ContractMaterializationPayload;
  const materializedEntries: MaterializedContractEntry[] = [];

  for (const entry of payload.entries) {
    let rawContract: AnyContract;
    try {
      const moduleExports = await importContractModule(entry, cacheBust);
      const candidate = moduleExports[entry.exportName];
      assertContractValue(candidate, entry);
      rawContract = candidate;
    } catch (error) {
      throw new Error(
        `Failed to load contract '${entry.exportName}' from ${entry.sourcePathRelativeToConfig}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    let draftSchemas;
    let openapiSchemasForContract;
    try {
      draftSchemas = materializeContractSchemas(rawContract.schemas, { target: "draft-2020-12" });
      openapiSchemasForContract = materializeContractSchemas(rawContract.schemas, {
        target: "openapi-3.0",
      });
    } catch (error) {
      throw new Error(
        `Failed to serialize contract '${entry.exportName}' from ${entry.sourcePathRelativeToConfig}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    materializedEntries.push({
      id: makeContractId(entry),
      exportName: entry.exportName,
      sourcePath: entry.sourcePathRelativeToConfig,
      method: rawContract.method,
      path: rawContract.path,
      draftSchemas,
      openapiSchemas: openapiSchemasForContract,
    });
  }

  console.log(JSON.stringify(materializedEntries));
}

function createWatchSnapshot(files: string[]): string {
  return files.sort().join("\n");
}

async function buildWatchSnapshot(files: string[]): Promise<string> {
  const snapshotParts: string[] = [];

  for (const file of files.sort()) {
    try {
      const currentStat = await stat(file);
      snapshotParts.push(`${file}:${currentStat.mtimeMs}`);
    } catch {
      snapshotParts.push(`${file}:missing`);
    }
  }

  return snapshotParts.join("\n");
}

export async function cmdBuildContract(cwd: string, options: BuildContractCLIOptions) {
  if (!options.watch) {
    const result = await runSingleBuild(cwd, options, Date.now().toString());
    console.log(
      JSON.stringify({
        success: true,
        bundlePath: result.bundlePath,
        openapiJsonPath: result.openapiJsonPath,
        openapiYamlPath: result.openapiYamlPath,
        contracts: result.contracts,
      }),
    );
    return;
  }

  let previousSnapshot = "";
  let building = false;

  const buildAndReport = async (reason: "initial" | "change") => {
    if (building) {
      return;
    }

    building = true;
    try {
      const result = await runSingleBuild(cwd, options, `${Date.now()}-${reason}`);
      const fileSnapshot = createWatchSnapshot(result.watchedFiles);
      previousSnapshot = `${fileSnapshot}\n${await buildWatchSnapshot(result.watchedFiles)}`;
      console.log(
        JSON.stringify({
          success: true,
          watch: true,
          reason,
          bundlePath: result.bundlePath,
          openapiJsonPath: result.openapiJsonPath,
          openapiYamlPath: result.openapiYamlPath,
          contracts: result.contracts,
        }),
      );
    } catch (error) {
      console.error(
        JSON.stringify({
          success: false,
          watch: true,
          reason,
          error: error instanceof Error ? error.message : String(error),
        }),
      );
    } finally {
      building = false;
    }
  };

  await buildAndReport("initial");

  setInterval(async () => {
    try {
      const config = await loadBuildContractConfig(cwd, options.config);
      const files = [
        config.configPath,
        config.backendTsconfigPath,
        ...collectContractSourceFiles(config),
      ];
      const signature = `${createWatchSnapshot(files)}\n${await buildWatchSnapshot(files)}`;
      if (signature !== previousSnapshot) {
        await buildAndReport("change");
      }
    } catch (error) {
      console.error(
        JSON.stringify({
          success: false,
          watch: true,
          reason: "change",
          error: error instanceof Error ? error.message : String(error),
        }),
      );
    }
  }, 500);

  await new Promise(() => {});
}

const diagnosticHost: ts.FormatDiagnosticsHost = {
  getCanonicalFileName: (fileName) => fileName,
  getCurrentDirectory: () => process.cwd(),
  getNewLine: () => "\n",
};
