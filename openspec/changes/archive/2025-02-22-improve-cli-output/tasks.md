## 1. Dependencies

- [x] 1.1 Add picocolors and ora to packages/cli/package.json
- [x] 1.2 Run install and verify build still produces raven binary

## 2. Output helpers refactor

- [x] 2.1 Replace raw ANSI in error(), info(), success() with picocolors
- [x] 2.2 Add section header helper (e.g., printSectionHeader) for Modified Files / Required Dependencies
- [x] 2.3 Ensure NO_COLOR / non-TTY behavior via picocolors defaults (no explicit checks needed unless edge cases arise)

## 3. Spinner integration

- [x] 3.1 Wrap downloadModule calls in cmdInit with ora spinner
- [x] 3.2 Wrap downloadModule calls in cmdAdd with ora spinner
- [x] 3.3 Wrap update loop in cmdUpdate with ora spinner
- [x] 3.4 In verbose mode, suppress spinner and use plain log output instead

## 4. Structured output polish

- [x] 4.1 Apply styled section headers to Modified Files and Required Dependencies
- [x] 4.2 Format list items (files, dependencies) with consistent indentation and optional dim
- [x] 4.3 Update self-update info output to use styled formatting

## 5. Tests and validation

- [x] 5.1 Run e2e tests; fix any assertions that break due to ANSI/styling changes
- [x] 5.2 Manually verify NO_COLOR disables colors and piped output is plain text
