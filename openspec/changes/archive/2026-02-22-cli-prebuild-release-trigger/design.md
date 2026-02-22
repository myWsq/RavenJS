## Context

目前 CLI prebuild 版本号为固定值，GitHub Release 工作流的触发条件也较复杂，导致 RavenJS 与 CLI 版本联动不稳定。由于两者共用版本号，发布应以 v{x.x.x} 标签为单一事实来源，并在工作流中传递该版本到 CLI prebuild。

## Goals / Non-Goals

**Goals:**
- 以 v{x.x.x} 标签作为 Release 触发条件
- CLI prebuild 版本号从 Release tag 获取，避免硬编码
- 发布流程中版本保持一致、可追踪

**Non-Goals:**
- 不调整 CLI 产物格式或分发渠道
- 不更改现有版本号规则或语义版本策略
- 不引入新的发布平台或外部依赖

## Decisions

- 使用 Release tag 作为唯一版本来源  
  理由：RavenJS 与 CLI 共用版本号，tag 是天然的发布信号。  
  备选：从 package.json 读取版本。否决原因：可能与 tag 不一致，且 Release 触发已经提供 tag。

- 简化 GitHub Actions 触发为 tags: [v*]  
  理由：版本 tag 统一规范，减少复杂条件带来的误触发与维护成本。  
  备选：保留多条件触发（分支、路径）。否决原因：发布流程以 tag 为主更清晰。

- 在 workflow 中显式传递版本到 CLI prebuild 步骤  
  理由：消除硬编码，保证版本可追踪。  
  备选：在脚本内自行解析 tag。否决原因：分散逻辑，难以统一维护。

## Risks / Trade-offs

- [tag 命名不规范导致不触发] → 通过文档与发布脚本约束 tag 格式
- [版本传递链路错误导致 prebuild 版本不一致] → 在 workflow 中加入校验步骤对比 tag 与输入版本
