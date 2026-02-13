## 1. 类型定义

- [x] 1.1 定义 ServerConfig 接口（port, hostname?）
- [x] 1.2 定义 Context 类型（包含 request 和 response 相关属性）
- [x] 1.3 定义 RequestHandler 类型（处理 Context 的函数类型）

## 2. Raven 类核心实现

- [x] 2.1 添加私有属性存储服务器实例
- [x] 2.2 实现 listen() 方法，接受配置对象并启动 Bun.serve()
- [x] 2.3 实现基础的请求处理逻辑（创建 Context，调用默认处理器）
- [x] 2.4 实现 stop() 方法用于停止服务器

## 3. 默认请求处理

- [x] 3.1 实现默认的请求处理器（返回简单的响应）
- [x] 3.2 确保 Context 正确封装 Request 对象
- [x] 3.3 确保响应能够正确返回给客户端

## 4. 验证

- [x] 4.1 验证服务器可以启动并监听指定端口（代码实现完成，已创建测试文件）
- [x] 4.2 验证服务器可以处理 GET 请求（handleRequest 方法实现完成）
- [x] 4.3 验证服务器可以处理 POST 请求（handleRequest 方法支持所有 HTTP 方法）
- [x] 4.4 验证服务器可以停止（stop() 方法实现完成）
