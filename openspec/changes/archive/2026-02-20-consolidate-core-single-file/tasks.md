## 1. 代码整合到 main.ts

- [x] 1.1 在 main.ts 顶部添加分区注释结构
- [x] 1.2 将 error.ts 内容合并到 main.ts（SECTION: Error Handling）
- [x] 1.3 将 state.ts 内容合并到 main.ts（SECTION: State Management）
- [x] 1.4 将 validator.ts 内容合并到 main.ts（SECTION: Validation）
- [x] 1.5 将 router.ts 内容合并到 main.ts（SECTION: Router）
- [x] 1.6 将 server-adapter.ts 内容合并到 main.ts（SECTION: Server Adapters）
- [x] 1.7 移除 main.ts 中对 utils/ 的 import 语句
- [x] 1.8 调整代码顺序确保无前向引用

## 2. 清理文件结构

- [x] 2.1 删除 utils/ 目录及其所有文件
- [x] 2.2 更新 index.ts 为单行重导出

## 3. 更新测试文件

- [x] 3.1 更新 validation.test.ts 的 import 路径
- [x] 3.2 更新 state.test.ts 的 import 路径
- [x] 3.3 更新其他测试文件的 import 路径（如需要）

## 4. 验证

- [x] 4.1 运行 TypeScript 编译确认无错误
- [x] 4.2 运行测试套件确认所有测试通过
