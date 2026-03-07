## 1. 目录骨架与公共入口

- [x] 1.1 在 `modules/core` 中建立新的概念目录骨架（如 `app/`、`runtime/`、`state/`、`schema/`、`routing/`、`context/`、`error/`）
- [x] 1.2 将 `modules/core/index.ts` 重构为纯公共导出地图，移除其中的主体实现逻辑
- [x] 1.3 提取并迁移 `Context`、`RavenError` 等基础概念到专属模块，并更新导出与引用关系

## 2. Raven 组合根与请求生命周期拆分

- [x] 2.1 将 `Raven` 的公共 API、类型定义和内部路由数据拆分为更清晰的 `app/` 模块
- [x] 2.2 将 `ready()` 与插件加载流程提取到显式的运行时模块
- [x] 2.3 将请求分发、路由匹配、状态处理、响应后处理、错误处理拆分到 `runtime/` 下的阶段模块
- [x] 2.4 保持 `raven.ts` 只承担高层组合与 API 暴露职责，移除大段私有流程实现

## 3. 状态、Schema 与路由概念重组

- [x] 3.1 将状态系统拆分为存储机制、State 描述符、内置状态三个层次的模块
- [x] 3.2 将 `schema` 相关实现拆分为 `withSchema`、校验逻辑、`SchemaClass`、`Standard Schema` 适配等独立模块
- [x] 3.3 将路由实现迁移到专属 `routing/` 模块，并统一新的命名与导入路径
- [x] 3.4 删除迁移后失去价值的旧文件、旧 section comments 和仅为历史结构服务的中间层

## 4. 文档与测试学习路径对齐

- [x] 4.1 更新 `modules/core/README.md`，让架构说明与新目录结构一致
- [x] 4.2 更新 `modules/core/GUIDE.md`，给出基于真实文件布局的推荐阅读路径
- [x] 4.3 视需要更新 `modules/core/PLUGIN.md`，确保插件相关说明引用新的源码位置
- [x] 4.4 重组或重命名 `tests/unit/core`，使测试命名/目录与新的概念边界一致

## 5. 校验与收尾

- [x] 5.1 修复所有受影响的 import/export 和测试引用
- [x] 5.2 运行 core 相关单元测试并修正结构重排引入的问题
- [x] 5.3 复查 `modules/core`，确保 Agent 能通过目录、入口文件、文档和测试快速定位主要概念
