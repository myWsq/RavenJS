## 1. 基础设施搭建

- [x] 1.1 创建 `packages/plugins` 目录及基础文件 (`package.json`, `tsconfig.json`)
- [x] 1.2 在 `packages/plugins` 下初始化路由插件占位目录 (`packages/plugins/router`)

## 2. 核心库生命周期重构

- [x] 2.1 修改 `packages/core/index.ts` 中的请求处理流程：将路由匹配和 Context 组装移至 `onRequest` 钩子之后
- [x] 2.2 确保 Context 构造函数支持接收 `params` 和 `query` 参数
- [x] 2.3 在生命周期中提取并注入路由参数到 Context 对象

## 3. 测试与验证

- [x] 3.1 编写单元测试验证 `onRequest` 钩子中无法访问 `ctx.params` (或 ctx 尚未组装)
- [x] 3.2 编写单元测试验证 `beforeHandle` 钩子中可以正确访问 `ctx.params` 和 `ctx.query`
- [x] 3.3 验证 `packages/plugins` 作为一个独立包能够被正常解析
