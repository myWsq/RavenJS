# Single File Organization

定义 Raven 项目的代码组织规范，确保代码结构清晰、可维护。

## Requirements

### Requirement: Single File Core Structure

每个包的所有业务逻辑 SHALL 存放在单一的 `main.ts` 文件中。`index.ts` 作为包入口点，显式管理导出。

#### Scenario: Package file structure
- **WHEN** 检查 `packages/<package>/` 目录结构
- **THEN** 目录中仅包含 `main.ts`、`index.ts` 和 `tests/` 子目录

#### Scenario: No utils directory
- **WHEN** 需要添加工具函数或辅助代码
- **THEN** 将代码添加到 `main.ts` 的适当分区中，而非创建 `utils/` 目录

### Requirement: Code Section Organization

`main.ts` 中的代码 SHALL 按照依赖顺序组织为明确的分区（sections），使用统一格式的分区注释分隔。

#### Scenario: Section comment format
- **WHEN** 在 `main.ts` 中添加新的代码分区
- **THEN** 使用以下格式的分区注释：
  ```
  // =============================================================================
  // SECTION: Section Name
  // =============================================================================
  ```

#### Scenario: Section dependency order
- **WHEN** 组织 `main.ts` 中的代码
- **THEN** 分区按以下顺序排列（可根据包的实际需要增减）：
  1. Imports - 外部依赖
  2. Types & Interfaces - 类型定义
  3. Error Handling - 错误类
  4. State Management - 状态管理
  5. Validation - 验证器
  6. Router - 路由实现
  7. Server Adapters - 服务器适配器
  8. Core Framework - 核心框架类

### Requirement: No Forward References

代码组织 SHALL 确保每个分区只引用其上方分区定义的内容，避免前向引用。

#### Scenario: Dependency direction
- **WHEN** 某分区的代码需要引用其他类型或函数
- **THEN** 被引用的内容 MUST 在当前分区之前的分区中定义

#### Scenario: Circular dependency prevention
- **WHEN** TypeScript 编译器分析 `main.ts`
- **THEN** 不存在任何循环依赖警告

### Requirement: Explicit Export Management

`index.ts` SHALL 显式管理所有导出，区分 Public API 和 Internal API。

#### Scenario: Public API exports
- **WHEN** 定义用户应该使用的 API
- **THEN** 在 `index.ts` 的 `// Public API` 分区中显式导出，包括：
  - 核心类和函数
  - 类型定义
  - 用户可能需要的辅助函数

#### Scenario: Internal API exports
- **WHEN** 定义框架内部或测试使用的 API
- **THEN** 在 `index.ts` 的 `// Internal API` 分区中显式导出，并添加注释说明不建议用户直接使用

#### Scenario: Index file structure
- **WHEN** 编写 `index.ts` 文件
- **THEN** 使用以下结构：
  ```typescript
  // =============================================================================
  // Public API - 用户应该使用的导出
  // =============================================================================
  export { ... } from "./main.ts";
  export type { ... } from "./main.ts";

  // =============================================================================
  // Internal API - 框架内部或测试使用，不建议用户直接使用
  // =============================================================================
  export { ... } from "./main.ts";
  export type { ... } from "./main.ts";
  ```

### Requirement: Public API Stability

代码重构 SHALL NOT 改变任何公开导出的 API 签名。

#### Scenario: Export compatibility
- **WHEN** 外部代码从包导入
- **THEN** 所有 Public API 的导入路径和类型签名保持不变

#### Scenario: Plugin compatibility
- **WHEN** 现有插件使用框架 API
- **THEN** 插件无需任何修改即可继续工作
