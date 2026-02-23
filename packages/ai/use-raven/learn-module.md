# Learning a Module

Use `raven guide` to load the full documentation and source code for an installed module.

## Command

```bash
raven guide <module-name>
```

## Output format

The command prints two tagged sections:

```
<readme>
Full content of the module's README.md
</readme>

<code>
File: path/to/file.ts
```
// Full source code
```
</code>
```

## How to read the README

The README is the primary reference. It is structured with these sections — read them in order:

| Section | What to look for |
|---|---|
| **OVERVIEW** | What the module does; the philosophy behind it |
| **ARCHITECTURE** | File layout and request lifecycle diagram |
| **CORE CONCEPTS** | The key types, classes, and functions |
| **DESIGN DECISIONS** | *Why* things work the way they do — read this before writing code |
| **GOTCHAS** | Common mistakes and how to avoid them — read every item |
| **ANTI-PATTERNS** | What not to do |
| **USAGE EXAMPLES** | Copy-paste starting points |

## How to read the source code

The source file is organized by `SECTION` comments. Skim for the relevant section, then read the types and exports. The README's ARCHITECTURE section maps section names to their purpose.

## Tips

- **Read GOTCHAS and ANTI-PATTERNS before writing anything.** They prevent the most common bugs.
- **Cross-reference examples with types.** The `Infer<T>` utility and state types in the source clarify what each function returns.
- If something is unclear, re-read DESIGN DECISIONS — the rationale usually explains the constraint.

## Important: do not re-read files that guide already provided

`raven guide` outputs the complete README and source code inline. **Do not use Read tools to re-read those files** — the content is already in context. Use it directly.
