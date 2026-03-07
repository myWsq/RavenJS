## 1. 更新 AI 技能工作流

- [x] 1.1 更新 `packages/install-raven/skills/raven-learn/SKILL.md`，让 core / RavenJS 业务代码任务显式加载 `modules/core/pattern/*` 的对应入口
- [x] 1.2 更新 `packages/install-raven/skills/raven-use/SKILL.md`，在“学习完成”与“写代码”之间新增任务分类与 Pattern Plan 步骤
- [x] 1.3 在 `raven-use` 中加入基于 `modules/core/pattern/anti-patterns.md` 与 `modules/core/pattern/conventions.md` 的收尾自检要求
- [x] 1.4 审视并同步 `raven-setup` / `raven-add` 中与学习顺序相关的措辞，避免与新的 pattern-aware workflow 冲突

## 2. 调整 core 学习入口文档

- [x] 2.1 更新 `modules/core/GUIDE.md`，为业务代码任务与 runtime assembly 任务增加显式的 pattern 分流入口
- [x] 2.2 更新 `modules/core/README.md`，补充 pattern 入口说明，并区分 API / 源码阅读路径与 pattern / 分层规则路径
- [x] 2.3 整理 `modules/core/pattern/*` 的交叉引用与入口文案，确保 GUIDE 和 skills 指向的阅读链路闭合

## 3. 验证典型任务路径

- [x] 3.1 以“简单写接口”“可复用写流程”“复杂查询”“runtime assembly”四类典型任务回查技能文案，确认每类都能落到正确的 pattern 路径
- [x] 3.2 运行相关文档或构建检查，确认更新后的 GUIDE 与 skills 仍满足现有模块学习入口要求
