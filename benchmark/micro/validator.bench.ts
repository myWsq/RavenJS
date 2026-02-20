import { bench, group, run } from "mitata";
import Ajv from "ajv/dist/jtd";
import { J } from "../../packages/core/main";

const ajv = new Ajv();

const simpleSchema = J.object({
  properties: {
    name: J.string(),
    age: J.int(),
    email: J.string(),
  },
});

const complexSchema = J.object({
  properties: {
    user: J.object({
      properties: {
        id: J.int(),
        name: J.string(),
        email: J.string(),
      },
      optionalProperties: {
        avatar: J.string(),
      },
    }),
    posts: J.array(
      J.object({
        properties: {
          id: J.int(),
          title: J.string(),
          content: J.string(),
          tags: J.array(J.string()),
        },
        optionalProperties: {
          publishedAt: J.timestamp(),
        },
      })
    ),
    metadata: J.object({
      properties: {
        createdAt: J.timestamp(),
        updatedAt: J.timestamp(),
      },
    }),
  },
});

const simpleValidator = ajv.compile(simpleSchema);
const complexValidator = ajv.compile(complexSchema);
const simpleParser = ajv.compileParser(simpleSchema);
const complexParser = ajv.compileParser(complexSchema);

const simpleData = {
  name: "John Doe",
  age: 30,
  email: "john@example.com",
};

const complexData = {
  user: {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    avatar: "https://example.com/avatar.png",
  },
  posts: [
    {
      id: 1,
      title: "First Post",
      content: "This is the content of the first post",
      tags: ["typescript", "bun", "performance"],
      publishedAt: "2024-01-15T10:30:00Z",
    },
    {
      id: 2,
      title: "Second Post",
      content: "This is the content of the second post",
      tags: ["benchmark", "testing"],
    },
  ],
  metadata: {
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-15T12:00:00Z",
  },
};

const simpleJson = JSON.stringify(simpleData);
const complexJson = JSON.stringify(complexData);

const invalidData = {
  name: 123,
  age: "thirty",
  email: null,
};

group("Simple Schema Validation (3 fields)", () => {
  bench("validate - valid data", () => {
    simpleValidator(simpleData);
  });

  bench("validate - invalid data", () => {
    simpleValidator(invalidData);
  });
});

group("Complex Schema Validation (nested + arrays)", () => {
  bench("validate - valid data", () => {
    complexValidator(complexData);
  });
});

group("JTD Parser vs JSON.parse - Simple", () => {
  bench("JTD parser", () => {
    simpleParser(simpleJson);
  });

  bench("JSON.parse", () => {
    JSON.parse(simpleJson);
  });

  bench("JSON.parse + validate", () => {
    const data = JSON.parse(simpleJson);
    simpleValidator(data);
  });
});

group("JTD Parser vs JSON.parse - Complex", () => {
  bench("JTD parser", () => {
    complexParser(complexJson);
  });

  bench("JSON.parse", () => {
    JSON.parse(complexJson);
  });

  bench("JSON.parse + validate", () => {
    const data = JSON.parse(complexJson);
    complexValidator(data);
  });
});

group("Schema Compilation (one-time cost)", () => {
  bench("compile simple validator", () => {
    ajv.compile(simpleSchema);
  });

  bench("compile complex validator", () => {
    ajv.compile(complexSchema);
  });

  bench("compile simple parser", () => {
    ajv.compileParser(simpleSchema);
  });

  bench("compile complex parser", () => {
    ajv.compileParser(complexSchema);
  });
});

await run({
  colors: true,
});
