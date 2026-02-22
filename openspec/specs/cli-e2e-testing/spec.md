## ADDED Requirements

### Requirement: 可配置的拉取来源覆盖
CLI SHALL 在默认使用 GitHub 拉取代码的同时，支持通过显式配置将拉取来源覆盖为本地路径。

#### Scenario: 使用本地路径替代 GitHub
- **WHEN** 测试运行时提供本地拉取配置
- **THEN** CLI 从本地路径拉取代码且不访问 GitHub

### Requirement: 端到端测试覆盖关键流程
测试系统 SHALL 提供覆盖初始化、拉取、构建、运行等关键路径的 CLI e2e 测试用例。

#### Scenario: 完整流程可在本地执行
- **WHEN** 运行 CLI e2e 测试
- **THEN** 测试依次验证初始化、拉取、构建、运行的成功结果

### Requirement: 测试夹具与环境隔离
e2e 测试 SHALL 使用固定夹具与临时目录进行隔离，确保可重复执行并可清理。

#### Scenario: 测试结束后环境可清理
- **WHEN** e2e 测试完成
- **THEN** 临时目录与生成产物被清理或可被统一回收

### Requirement: 生产默认行为保持不变
在未提供测试覆盖配置时，CLI SHALL 继续从 GitHub 拉取代码。

#### Scenario: 默认仍从 GitHub 拉取
- **WHEN** 未设置本地拉取配置
- **THEN** CLI 仍按现有逻辑从 GitHub 拉取代码
