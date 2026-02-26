## Context

当前 @raven.js/cli 通过 GitHub Actions 构建二进制文件，然后通过 GitHub Releases 发布。用户需要通过 install.sh 或 install.ps1 脚本下载安装。这种方式不如 npm 生态系统方便。

我们需要将发布方式切换到 npm，利用 npm 的 optionalDependencies 和平台特定包的机制，让用户可以通过 `npm install -g @raven.js/cli` 一键安装。

## Goals / Non-Goals

**Goals:**

- 用户可以通过 npm 全局安装 @raven.js/cli
- npm 自动安装对应平台的二进制文件
- 移除 self-update 功能（用户使用 npm update 更新）
- 移除独立的安装脚本
- 更新 GitHub Actions 工作流以支持 npm 发布

**Non-Goals:**

- 改变 CLI 的功能（除了移除 self-update）
- 支持 npm 以外的包管理器
- 保留 GitHub Releases 作为主要发布渠道

## Decisions

### Decision 1: 使用 optionalDependencies + 平台特定子包

**选择**: 使用 optionalDependencies + 平台特定子包
**替代方案**: postinstall 脚本下载二进制

**理由**:

- optionalDependencies 是 npm 原生支持的方式
- 更可靠，不依赖网络请求
- 符合 npm 生态系统的最佳实践（如 esbuild 等工具采用的方式）

### Decision 2: 子包命名为 @raven.js/cli-{target}

**选择**: @raven.js/cli-{target} 格式
**替代方案**: 单独的 scope 或其他命名

**理由**: 保持在同一 scope 下，便于管理和识别

### Decision 3: packages/cli 作为源代码仓库，所有 npm 包动态创建

**选择**: packages/cli 保持为源代码，主包和子包都在 GitHub Actions 中动态创建
**替代方案**: 修改 packages/cli 作为主包

**理由**:

- 保持源代码仓库的纯粹性
- 动态创建的包结构更灵活
- 便于调试和测试不同的包结构

### Decision 4: 动态创建的包包含完整元数据和 README

**选择**: 主包和子包都包含 keywords、repository 元数据，并包含 README.md
**替代方案**: 只包含最小化的 package.json

**理由**:

- 提供更好的 npm 包体验
- 便于用户在 npm 上搜索和发现
- 包含文档信息

### Decision 5: 主包包含包装脚本

**选择**: 主包包含 bin/raven.js 包装脚本
**替代方案**: 直接依赖子包的 bin

**理由**: 提供更好的错误处理和跨平台兼容性

### Decision 6: Git tag 格式保持 @raven.js/cli@v<version>

**选择**: tag 格式为 @raven.js/cli@v<version>
**替代方案**: v<version>

**理由**: 与现有工作流保持一致，便于识别是哪个包的发布

## Risks / Trade-offs

| Risk                   | Mitigation                                |
| ---------------------- | ----------------------------------------- |
| npm 发布多个包可能失败 | 工作流中加入重试机制，分开发布            |
| npm token 泄露风险     | 使用 GitHub Secrets 存储，限制 token 权限 |
| 旧版本用户无法更新     | 保留 install 脚本一段时间作为过渡         |

## Migration Plan

1. 更新 CLI 代码，移除 self-update 命令
2. 创建主包包装脚本
3. 重写 GitHub Actions 工作流
4. 配置 npm token 到 GitHub Secrets
5. 删除 install.sh 和 install.ps1
6. 测试发布流程

## Open Questions

- npm scope @raven.js 是否已确认可用？用户确认已更名为 @raven.js/cli
