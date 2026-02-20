## 1. 类型定义修改

- [x] 1.1 移除 `JTDParser` 类型导入
- [x] 1.2 将 `Handler.bodyParser` 改为 `Handler.bodyValidator: ValidateFunction<unknown>`
- [x] 1.3 将 `HandlerBuilder._bodyParser` 改为 `_bodyValidator: ValidateFunction<unknown>`

## 2. HandlerBuilder 方法修改

- [x] 2.1 修改 `bodySchema()` 方法，使用 `ajv.compile()` 替代 `ajv.compileParser()`
- [x] 2.2 修改 `handle()` 方法，将 `bodyParser` 赋值改为 `bodyValidator`

## 3. 请求处理逻辑修改

- [x] 3.1 修改 body 解析逻辑，统一使用 `request.json()` 解析
- [x] 3.2 在解析后调用 `runValidator()` 验证 body 数据
- [x] 3.3 移除 JTD Parser 特有的错误处理（position 相关）

## 4. 验证与测试

- [x] 4.1 运行现有测试确保功能正常
- [x] 4.2 运行 benchmark 验证性能提升
