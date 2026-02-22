---
name: "Raven: Add"
description: 向 RavenJS 项目添加模块
category: RavenJS
tags: [ravenjs, modules, extension]
---

向 RavenJS 项目添加模块。

**Input**: 模块名称（如 "jtd-validator"），或者用户描述所需功能。

**Steps**

1. **检查项目状态**

   运行 `raven status` 或 `raven status --json` 获取安装状态。若 core 未安装，先建议使用 `/raven:install`。

2. **确定要添加的模块**

   - 如果用户明确说了模块名（如 "jtd-validator"），直接使用
   - 如果用户描述功能（如"我需要验证请求体"），推断对应的模块
   - 如果不确定，使用 **AskUserQuestion** 询问：
     > "你想添加哪个模块？可用模块：core, jtd-validator"

3. **执行添加**

   运行：
   ```bash
   raven add <module-name>
   ```

4. **验证添加**

   检查 `raven/<module-name>/` 目录是否已创建，并显示该模块的 README。

5. **后续步骤**

   根据添加的模块，给出使用建议。

**Output**

总结：
- 模块添加成功的消息
- 安装的文件列表
- 该模块的使用说明（来自 README）
- 后续使用建议

**Guardrails**
- 必须在已初始化 RavenJS 的项目中使用
- 只能添加 registry.json 中列出的模块
- 如果模块已存在，提示用户并询问是否更新
