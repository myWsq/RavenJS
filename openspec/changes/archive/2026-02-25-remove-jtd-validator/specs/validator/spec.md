## REMOVED Requirements

### Requirement: Core 只做 State 赋值 (Core State Assignment Only)
**Reason**: The validator module is being removed, and validation logic is no longer part of the default distribution. Core behavior remains unchanged (no validation), but this spec is deprecated.
**Migration**: None.

### Requirement: Lazy Validation (获取时验证)
**Reason**: The `jtd-validator` module providing this capability is being removed.
**Migration**: Users must implement validation logic manually or integrate a third-party library.

### Requirement: Validator 编译缓存 (Validator Compilation Caching)
**Reason**: The `jtd-validator` module is being removed.
**Migration**: None.

### Requirement: 扁平化 Schema 定义 (Flattened Schema Definition)
**Reason**: The `jtd-validator` module providing the `J` API is being removed.
**Migration**: Use a third-party schema library (e.g., Zod, Ajv) directly.

### Requirement: Optional 字段标记 (Optional Field Marker)
**Reason**: The `jtd-validator` module is being removed.
**Migration**: Use a third-party schema library.

### Requirement: Nullable 值支持 (Nullable Value Support)
**Reason**: The `jtd-validator` module is being removed.
**Migration**: Use a third-party schema library.

### Requirement: 类型推断支持 (Type Inference Support)
**Reason**: The `jtd-validator` module is being removed.
**Migration**: Use a third-party schema library's inference tools.

### Requirement: Schema 库无关性 (Schema Library Agnostic)
**Reason**: The validator module is being removed. Core remains agnostic.
**Migration**: None.
