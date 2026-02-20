## 1. 类型系统重构

- [x] 1.1 定义 OPTIONAL Symbol 常量用于标记可选字段
- [x] 1.2 定义 FieldSchema 接口，包含 schema 属性和 optional/nullable 方法
- [x] 1.3 实现 createField 工厂函数，返回带链式方法的 schema 对象

## 2. J Helper 基础类型重构

- [x] 2.1 重构 J.string() 返回可链式调用的 FieldSchema
- [x] 2.2 重构 J.int() 及其他整数类型（int8/16/32, uint8/16/32）
- [x] 2.3 重构 J.number() 及浮点类型（float32/64）
- [x] 2.4 重构 J.boolean() 和 J.timestamp()
- [x] 2.5 重构 J.enum() 返回可链式调用的 FieldSchema
- [x] 2.6 重构 J.array() 返回可链式调用的 FieldSchema
- [x] 2.7 重构 J.record() 返回可链式调用的 FieldSchema

## 3. J.object() 重构

- [x] 3.1 修改 J.object() 接收扁平字段定义
- [x] 3.2 实现自动分离 properties/optionalProperties 逻辑
- [x] 3.3 确保 J.object() 本身也返回可链式调用的对象（支持嵌套 optional）

## 4. 类型推断更新

- [x] 4.1 更新 JTDSchema 类型定义支持 nullable 属性
- [x] 4.2 重构 Infer<T> 处理 nullable 类型推断
- [x] 4.3 重构 Infer<T> 处理 optional 字段分离（InferObject 类型）
- [x] 4.4 验证嵌套对象的类型推断正确性

## 5. 测试更新

- [x] 5.1 更新 validation.test.ts 中的 schema 定义为新 API
- [x] 5.2 添加 optional 字段验证测试
- [x] 5.3 添加 nullable 字段验证测试
- [x] 5.4 添加 optional + nullable 组合测试
- [x] 5.5 添加类型推断正确性的编译时测试

## 6. Benchmark 更新

- [x] 6.1 更新 validator.bench.ts 中的 schema 定义为新 API
