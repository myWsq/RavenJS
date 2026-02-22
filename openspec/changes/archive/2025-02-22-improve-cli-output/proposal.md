## Why

The current raven CLI uses raw ANSI escape codes and ad-hoc `console.log` calls for output. Resulting UX feels unpolished compared to industry-standard CLIs (e.g., Vite, pnpm, create-vite). Colors are inconsistent, output layout is plain, and there is no loading feedback during async operations. Users expect modern CLIs to use professional output styling, spinners, and structured formatting.

## What Changes

- Introduce a dedicated output/styling module in the CLI package using industry-standard libraries
- Replace raw ANSI codes with a proper colors API (picocolors or chalk)
- Add loading spinners for async operations (init, add, update)
- Improve structured output: formatted lists, section headers, and consistent typography
- Respect `NO_COLOR` and TTY detection for non-interactive environments
- Keep bundle size minimal (CLI compiles to a single binary)

## Capabilities

### New Capabilities

- `cli-output-styling`: Professional CLI output with colors, spinners, and structured formatting. Covers color handling, loading indicators, section headers, and TTY/NO_COLOR compatibility.

### Modified Capabilities

- (none — output styling is additive; existing cli-tool behavior stays unchanged)

## Impact

- **Code**: `packages/cli/index.ts` — refactor log/error/success helpers; add spinner usage in download flows
- **Dependencies**: Add 1–2 packages (picocolors or chalk; ora for spinners)
- **Bundle**: Ensure minimal impact; picocolors/kleur preferred for size
- **Tests**: Update e2e tests to handle styled output (e.g., strip ANSI in assertions if needed)
