## 1. Create packages/ai

- [x] 1.1 Create `packages/ai/` directory and `package.json` with name, files
- [x] 1.2 Create `packages/ai/skills/` and migrate skills from `packages/cli/templates/skills/`
- [x] 1.3 Create `packages/ai/commands/` and migrate commands from `packages/cli/templates/commands/`
- [x] 1.4 Add `packages/ai` to root `package.json` workspaces

## 2. Registry and generate-registry

- [x] 2.1 Extend Registry interface and registry.json to include top-level `ai` property
- [x] 2.2 Update `generate-registry.ts` to scan `packages/ai` and output `ai` field
- [x] 2.3 Remove `ai-skills` from modules output in generate-registry
- [x] 2.4 Run generate-registry and verify registry.json has `ai` and no ai-skills in modules

## 3. CLI updates

- [x] 3.1 Update Registry/RegistryModule types to include `ai` property
- [x] 3.2 Add `downloadAiResources` or equivalent that reads from `registry.ai`
- [x] 3.3 Update `cmdInit` to use `registry.ai` instead of `downloadModule("ai-skills", ...)`
- [x] 3.4 Update `cmdUpdate` to install AI resources from `registry.ai`, remove ai-skills special handling
- [x] 3.5 Update download URL/path logic: use `packages/ai/` for remote and local source
- [x] 3.6 Remove all `ai-skills`-specific branches and module-name checks

## 4. Cleanup

- [x] 4.1 Delete `packages/cli/templates/` directory
- [x] 4.2 Ensure CI/release includes `packages/ai/` in distribution
