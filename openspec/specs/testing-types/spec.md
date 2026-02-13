## ADDED Requirements

### Requirement: Explicit Type Definitions
系统必须为导出的测试原语提供显式的类型定义，而不是依赖动态导入的自动推断。

#### Scenario: 验证类型提示
- **WHEN** 在编辑器中悬停在 `describe` 上
- **THEN** 必须显示完整的函数签名而非 `any`
