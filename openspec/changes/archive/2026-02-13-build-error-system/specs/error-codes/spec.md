# error-codes Specification

## ADDED Requirements

### Requirement: 错误码格式规范
所有 RavenError SHALL 使用字符串错误码，格式为 `ERR_XXX`。

#### Scenario: 错误码命名
- **WHEN** 定义新的错误码
- **THEN** 错误码 SHALL 使用 `ERR_` 前缀

### Requirement: 错误码常量定义
框架 SHALL 在统一的错误码常量文件中定义所有标准错误码。

#### Scenario: 定义服务器错误码
- **WHEN** 定义服务器相关错误
- **THEN** 错误码 SHALL 使用 `ErrorCodes.ERR_SERVER_*` 命名

#### Scenario: 定义 Scoped Token 错误码
- **WHEN** 定义 Scoped Token 相关错误
- **THEN** 错误码 SHALL 使用 `ErrorCodes.ERR_SCOPED_TOKEN_*` 命名

### Requirement: 错误码唯一性
每个具体错误 SHALL 拥有唯一的错误码，不可重复。

#### Scenario: 检查错误码冲突
- **WHEN** 定义新的错误码
- **THEN** 该错误码 SHALL 不与已存在的错误码冲突
