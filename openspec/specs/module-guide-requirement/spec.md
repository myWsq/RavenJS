# Module Guide Requirement Specification

## Purpose

定义 registry 模块必须提供 GUIDE.md 的约束，以及 registry 生成时的校验行为。

## Requirements

### Requirement: Registry 模块必须提供 GUIDE.md

每个被纳入 registry 的模块 SHALL 在其目录下提供 `GUIDE.md` 文件，用于说明 AI Agent 应如何学习该模块。GUIDE.md 的内容和结构由各模块自行决定，无需遵循统一 template。

#### Scenario: 模块缺少 GUIDE.md 时 registry 生成报错

- **WHEN** registry 生成脚本（如 `packages/cli/scripts/build.ts`）扫描 `modules/` 目录
- **AND** 某个模块目录存在且已被识别为有效模块（如已解析 package.json）
- **AND** 该模块目录下不存在 `GUIDE.md` 文件
- **THEN** 脚本 SHALL 输出错误信息并以非零状态码退出
- **AND** 不生成或写入 registry.json

#### Scenario: 所有模块均有 GUIDE.md 时正常生成 registry

- **WHEN** registry 生成脚本扫描所有模块
- **AND** 每个模块目录下均存在 `GUIDE.md` 文件
- **THEN** 脚本 SHALL 正常生成 registry.json
