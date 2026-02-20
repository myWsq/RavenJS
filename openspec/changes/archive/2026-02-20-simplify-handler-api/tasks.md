## 1. 在 Core 内实现 JTD Builder

- [x] 1.1 添加 JTD 类型定义（`JTDSchema`, `JTDType` 等）
- [x] 1.2 实现 JTD Builder（`J.string()`, `J.object()`, `J.array()` 等）
- [x] 1.3 实现 `Infer<T>` 类型推断

## 2. 重构 Core 验证层

- [x] 2.1 切换到 `ajv/dist/jtd` 入口
- [x] 2.2 创建公共单例 State：`BodyState`, `QueryState`, `ParamsState`, `HeadersState`
- [x] 2.3 修改 `Handler` 类型，用 `bodySchema/querySchema/paramsSchema/headersSchema` 替代旧属性
- [x] 2.4 添加 `bodyParser/queryValidator/paramsValidator/headersValidator` 属性存储预编译结果

## 3. 实现 HandlerBuilder

- [x] 3.1 创建 `HandlerBuilder` 类
- [x] 3.2 实现 `bodySchema(schema)` 方法（调用 `ajv.compileParser`）
- [x] 3.3 实现 `querySchema(schema)` 方法（调用 `ajv.compile`）
- [x] 3.4 实现 `paramsSchema(schema)` / `headersSchema(schema)` 方法
- [x] 3.5 实现 `handle(fn)` 方法
- [x] 3.6 修改 `createHandler()` 返回 `HandlerBuilder`

## 4. 重构 processStates

- [x] 4.1 修改 body 处理：使用 `handler.bodyParser(text)` 一步完成 parse + validate
- [x] 4.2 修改 query/params/headers 处理：使用预编译的 validator
- [x] 4.3 验证后数据存入公共单例 State

## 5. 实现类型安全访问函数

- [x] 5.1 实现 `useBody<S>(schema): Infer<S>`
- [x] 5.2 实现 `useQuery<S>`, `useParams<S>`, `useHeaders<S>`

## 6. 更新导出和测试

- [x] 6.1 从 `@ravenjs/core` 导出 `J`, `Infer`, `useBody` 等
- [x] 6.2 更新现有测试用例，使用新的 Builder API
- [x] 6.3 添加测试：JTD Builder、预编译 parser、链式 API

## 7. 清理

- [x] 7.1 删除 `@ravenjs/typebox` 插件
- [x] 7.2 移除旧的 `validate()` 函数（StateOptions.schema 保留为可选 metadata）
