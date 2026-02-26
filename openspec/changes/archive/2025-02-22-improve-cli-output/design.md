## Context

The raven CLI (`packages/cli/index.ts`) uses raw ANSI escape codes (`\x1b[31m`, `\x1b[32m`, etc.) in ad-hoc `error`, `info`, `success` helpers. Output from `init`, `add`, `update` is plain `console.log` with `### Modified Files:` headers. There is no loading feedback; async operations complete with no visual indication of progress. The CLI compiles to a single binary via `bun build --compile`, so dependencies must be chosen with bundle size in mind.

## Goals / Non-Goals

**Goals:**

- Replace raw ANSI with a standard colors library (picocolors or chalk)
- Add spinners (ora) for init/add/update
- Improve section headers and list formatting
- Respect `NO_COLOR` and non-TTY for CI/logging
- Keep bundle impact minimal

**Non-Goals:**

- Interactive prompts or complex TUI
- Table rendering for tabular data
- Custom spinner animations

## Decisions

### 1. Colors library: picocolors

**Choice:** Use `picocolors` for colors.

**Rationale:** Picocolors is small (~0.5KB), fast (2x faster than chalk in benchmarks), widely used (PostCSS, SVGO, Browserslist), and supports `NO_COLOR` and `FORCE_COLOR` out of the box. Chalk is larger and pulls transitive deps. Kleur is similar; picocolors has slightly wider adoption for CLI use.

**Alternatives:** Chalk (larger, more features than needed), kleur (similar trade-offs, less adoption for CLIs), ansi-colors (simpler API but less maintained).

### 2. Spinner library: ora

**Choice:** Use `ora` for loading spinners.

**Rationale:** Ora is the de facto standard for Node CLI spinners. It handles TTY detection, hides cursors during spin, and has clean start/succeed/fail APIs. Widely used by Vite, create-vite, and other modern CLIs.

**Alternatives:** cli-spinners (spinner chars only, no high-level API), nanospinner (smaller but less feature-complete).

### 3. Output layout: keep simple, add minimal structure

**Choice:** Keep `console.log` for section output; use picocolors for styled headers and list items. No boxen or complex layouts.

**Rationale:** Current `### Modified Files:` pattern is readable. Enhance with color (e.g., dim header, default-color list items) rather than boxes. Keeps complexity low and avoids more dependencies.

**Alternatives:** Boxen for boxes (adds size/complexity), cli-table3 for tables (overkill for current lists).

### 4. TTY and color detection

**Choice:** Use picocolors’ built-in behavior; ora already respects TTY. Add explicit `process.stdout.isTTY` check only if needed for edge cases.

**Rationale:** Picocolors disables colors when `NO_COLOR` is set. Ora stops animating when not a TTY. Default behavior matches expectations without extra logic.

## Risks / Trade-offs

- **[Risk]** ora adds size to compiled binary → **[Mitigation]** Binary size delta is acceptable; ora is widely used. Can revisit if bundle becomes an issue.
- **[Risk]** Spinner + verbose mode may conflict → **[Mitigation]** In verbose mode, consider suppressing spinner and using plain log lines instead.
- **[Trade-off]** No custom theming → Acceptable; default colors are sufficient for MVP.
