## 1. 基础准备与依赖

- [x] 1.1 在 `packages/core/package.json` 中添加 `ajv` 依赖
- [x] 1.2 创建 `packages/core/utils/validator.ts` 用于封装 Ajv 实例和校验逻辑

## 2. State 层扩展

- [x] 2.1 定义 `StateOptions` 接口，包含可选的 `name`、`schema` 和 `source` 属性
- [x] 2.2 修改 `ScopedState` 基类构造函数，接受对象参数
- [x] 2.3 修改 `AppState` 和 `RequestState` 构造函数，传递对象参数给基类
- [x] 2.4 修改 `createAppState` 和 `createRequestState` 工厂函数签名为 `(options?: StateOptions)`
- [x] 2.5 当 `name` 未提供时，使用 Symbol 自动生成唯一标识符

## 3. Handler 与 Slot 机制

- [x] 3.1 扩展 `packages/core/main.ts` 中的 `Handler` 类型，支持附加 `slots` 数组
- [x] 3.2 实现 `createHandler` 辅助函数，用于将 Slots 绑定到 Handler 上

## 4. 框架核心集成 (Lifecycle)

- [x] 4.1 在 `Raven.handleRequest` 中实现 Slot 探测逻辑
- [x] 4.2 实现数据提取器：根据 `source` 从请求中获取 Body, Query, Params 或 Headers
- [x] 4.3 集成 Ajv 运行时校验：对提取的数据进行 JSON Schema 验证
- [x] 4.4 实现状态自动赋值：校验通过后，调用 `slot.set()` 注入数据
- [x] 4.5 实现统一的 400 错误响应机制，包含 Ajv 错误详情

## 5. TypeBox 插件包（可选）

- [x] 5.1 创建 `packages/typebox` 目录和 `package.json`
- [x] 5.2 实现类型安全的 `createTypedRequestState` 工厂函数
- [x] 5.3 导出必要的类型定义

## 6. 测试验证

- [x] 6.1 编写单元测试，验证新的对象参数 API
- [x] 6.2 编写单元测试，验证 `name` 可选时的自动生成逻辑
- [x] 6.3 编写集成测试，测试 Body, Query, Params 三种数据源的自动注入和校验
- [x] 6.4 编写 TypeBox 插件的类型推断测试
