## Why

`examples/` 目录当前作为独立目录存在于项目根目录，但示例内容实际上应该作为 plugin 文档的一部分存在。将示例代码移入文档可以减少项目结构复杂度，同时保持示例的教学价值。

## What Changes

- 删除 `examples/` 目录及其所有内容
- 将 `examples/sql-plugin/` 中的示例代码内容整合到 plugin 相关文档中
- 更新引用 `examples/` 目录的文档和代码

## Capabilities

### New Capabilities

无新增能力。

### Modified Capabilities

- `plugin-examples`: 移除物理示例目录，将示例内容转为纯文档形式

## Impact

- 删除 `examples/` 目录（包含 `sql-plugin` 子目录）
- 需要更新任何引用 `examples/` 路径的文档
- 需要更新 CLI 中可能涉及示例安装的代码
- 简化项目结构，减少维护负担
