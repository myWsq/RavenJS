## 1. packages/ai 配置

- [x] 1.1 更新 packages/ai/package.json：移除 `files`，添加 `claude` 字段（或 `agents.claude`），值为 `{ sourcePath: destPath }` 的 mapping，保持与现 fileMapping 内容一致

## 2. generate-registry

- [x] 2.1 更新 generate-registry.ts：从 packages/ai 读取 `claude` mapping，输出 `ai: { claude: mapping }`，不再输出 `files`、`fileMapping`
- [x] 2.2 更新 AiInfo / Registry 接口，匹配新结构
- [x] 2.3 运行 generate-registry，验证 registry.json 输出格式

## 3. CLI 消费

- [x] 3.1 更新 packages/cli/index.ts 的 downloadAiResources：读取 `registry.ai.claude`，用 `Object.keys(ai.claude)` 作为文件列表，`ai.claude[file]` 作为目标路径
- [x] 3.2 移除对 `ai.files`、`ai.fileMapping` 的引用
- [x] 3.3 验证 init、update 命令安装 AI 资源行为正确

## 4. 验证

- [x] 4.1 运行现有 e2e 测试（含 init、update），确认无回归
