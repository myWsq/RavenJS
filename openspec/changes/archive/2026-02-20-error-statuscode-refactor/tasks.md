## 1. 修改 ErrorContext 接口

- [x] 1.1 从 ErrorContext 接口移除 status 属性

## 2. 修改 RavenError 类

- [x] 2.1 添加 statusCode 可选属性
- [x] 2.2 更新构造函数接受 statusCode 参数
- [x] 2.3 更新 toResponse() 使用 statusCode（默认 500）
- [x] 2.4 更新 toJSON() 包含 statusCode

## 3. 更新工厂方法

- [x] 3.1 更新 ERR_VALIDATION 传递 statusCode: 400

## 4. 验证

- [x] 4.1 运行现有测试确保无回归
