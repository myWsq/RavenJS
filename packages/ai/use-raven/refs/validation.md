# 验证使用方式

jtd-validator 模块提供 JTD (JSON Type Definition) 数据验证功能。

## 基本用法

```typescript
import { validate } from "./jtd-validator/main.ts";

const schema = {
  properties: {
    name: { type: "string" },
    age: { type: "int32" },
  },
  optionalProperties: {
    email: { type: "string" },
  },
};

const data = {
  name: "Alice",
  age: 30,
};

const result = validate(schema, data);

if (result.valid) {
  console.log("验证通过");
} else {
  console.log("验证失败:", result.errors);
}
```

## 在 Handler 中使用

```typescript
import { validate } from "./jtd-validator/main.ts";

const userSchema = {
  properties: {
    username: { type: "string" },
    email: { type: "string" },
    age: { type: "int32" },
  },
  optionalProperties: {
    bio: { type: "string" },
  },
};

app.post("/users", async (req) => {
  const body = await req.json();
  
  const result = validate(userSchema, body);
  
  if (!result.valid) {
    return {
      status: 400,
      body: { errors: result.errors },
    };
  }
  
  // 处理有效数据
  return { id: 1, ...body };
});
```

## JTD Schema 类型

- **properties** - 必填字段
- **optionalProperties** - 可选字段
- **arrayType** - 数组类型
- **enum** - 枚举值
- **nullable** - 可为空
- **discriminator** - 区分联合类型

## 验证结果

验证返回结果包含：
- **valid** - 是否有效
- **errors** - 错误列表（如果无效）
