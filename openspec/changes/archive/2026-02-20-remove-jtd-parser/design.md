## Context

当前 `HandlerBuilder.bodySchema()` 使用 `ajv.compileParser()` 生成 JTD Parser，而其他三个 schema 方法（`querySchema`、`paramsSchema`、`headersSchema`）使用 `ajv.compile()` 生成 `ValidateFunction`。

基准测试数据表明，在 Bun 运行时环境下：

- JTD Parser (Simple): 568 ns
- JSON.parse + validate (Simple): 144 ns
- JTD Parser 比组合方案慢 **3.9 倍**

这种不一致不仅导致性能问题，也造成代码结构不统一。

## Goals / Non-Goals

**Goals:**

- 统一所有 schema 验证使用 `ValidateFunction` 模式
- 移除 `JTDParser` 相关代码和类型
- 使用 `request.json()` + validator 替代 JTD Parser
- 保持现有验证错误格式的兼容性

**Non-Goals:**

- 不改变 JTD Schema 定义方式（`J.object()` 等）
- 不引入新的验证库
- 不修改其他 schema 类型（query/params/headers）的验证逻辑

## Decisions

### Decision 1: 使用 request.json() 而非手动 JSON.parse

**选择**: 使用 `await request.json()` 解析 body

**理由**:

- Bun 的 `request.json()` 内部使用原生优化的 JSON 解析
- 代码更简洁，与无 schema 时的路径统一
- 错误处理已经内置

**替代方案**: 手动 `JSON.parse(await request.text())`

- 性能相近但代码冗余
- 需要额外处理 text 读取失败

### Decision 2: 重命名属性为 bodyValidator

**选择**: 将 `Handler.bodyParser` 改为 `Handler.bodyValidator`

**理由**:

- 与 `queryValidator`、`paramsValidator`、`headersValidator` 命名一致
- 类型统一为 `ValidateFunction<unknown>`
- 语义更准确（这是 validator 不是 parser）

### Decision 3: 统一验证流程

**选择**: body 验证调用 `runValidator()` 方法

**理由**:

- 复用现有的 query/params/headers 验证逻辑
- 错误格式保持一致
- 减少重复代码

## Risks / Trade-offs

**[Breaking Change]** Handler.bodyParser 属性移除
→ 此变更为内部 API，用户代码不直接访问该属性

**[错误信息变化]** JTD Parser 错误信息与 ValidateFunction 不同
→ 验证失败仍返回 400，但错误详情格式略有变化（从 position 变为 path）

**[解析顺序变化]** 原先 JTD Parser 边解析边验证，现在先解析后验证
→ 对于无效 JSON，错误阶段不同：原先在 parse 阶段，现在拆分为 JSON 解析错误和验证错误
