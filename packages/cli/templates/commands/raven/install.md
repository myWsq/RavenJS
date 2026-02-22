---
name: "Raven: Install"
description: 在当前项目中安装 RavenJS 框架
category: RavenJS
tags: [ravenjs, installation, setup]
---

在当前项目中安装 RavenJS 框架。

**Input**: 可选的安装选项，如版本号、自定义目录等。

**Steps**

1. **检查项目状态**

   检查当前目录是否已经初始化过 RavenJS：
   - 检查是否存在 `raven/` 目录

   如果已存在，提示用户并询问是否要重新安装或继续。

2. **确认安装**

   如果未安装，使用 **AskUserQuestion** 确认：
   > "即将在当前目录安装 RavenJS。是否继续？"

3. **执行安装**

   运行：
   ```bash
   raven install
   ```

4. **验证安装**

   检查是否生成了 `raven/` 目录，并列出安装的内容。

5. **下一步建议**

   告诉用户可以使用 `/raven:add` 来添加模块，或者直接开始编写代码。

**Output**

总结：
- 安装成功的消息
- 安装的文件列表
- 下一步建议（如 "现在可以使用 `/raven:add jtd-validator` 添加验证模块"）

**Guardrails**
- 不要覆盖已有的 raven/ 目录，除非用户明确确认
- 如果 raven 命令不可用，提示用户先安装 RavenJS CLI
