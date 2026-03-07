## 1. Core 校验能力并入

- [x] 1.1 将 `StandardSchemaV1`、`ValidationError`、`isValidationError`、`SchemaClass`、`withSchema` 迁入 `modules/core` 并从 core 导出
- [x] 1.2 扩展 core 的 handler 类型与路由存储结构，使 `withSchema` 返回的 schema-aware handler 能被 `get/post/put/delete/patch` 正常注册
- [x] 1.3 改造 `dispatchRequest` 与 `processStates`，在声明 schema 的路由上完成校验、写回校验后的 State，并让校验错误走统一 `onError` 通道

## 2. 独立模块与分发清理

- [x] 2.1 删除 `modules/schema-validator`，移除其 package、GUIDE、README 与源码目录
- [x] 2.2 更新 CLI registry/build 相关逻辑与模块元数据，使 `schema-validator` 不再出现在可安装模块列表中
- [x] 2.3 清理仓库中对 `@raven.js/schema-validator` 与 `raven add schema-validator` 的残留引用

## 3. 文档与示例迁移

- [x] 3.1 更新 `modules/core/README.md` 与 `modules/core/GUIDE.md`，补充 core 内建 Standard Schema 校验的用法与错误处理说明
- [x] 3.2 更新根目录 `README.md` 的模块清单与示例，移除独立 `schema-validator` 模块描述
- [x] 3.3 更新 `docs/` 中所有依赖 `schema-validator` 的示例导入和说明，明确 schema-aware 路由会把校验输出写入 State

## 4. 测试迁移与补全

- [x] 4.1 将 `tests/unit/schema-validator/` 的校验与 `SchemaClass` 用例迁移到 core 测试域，并覆盖 `beforeHandle` 读取校验后 State 的新语义
- [x] 4.2 更新 `tests/e2e/cli.test.ts` 中关于模块安装、status 与文件落盘的断言，去掉 `schema-validator` 模块预期
- [x] 4.3 运行并修复受影响的 unit / e2e 测试，确认 core 校验集成与 CLI 模块列表同时通过
