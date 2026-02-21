# ravenjs

## Installation

### Using Install Script (Recommended)

**Linux/macOS:**

```bash
curl -fsSL https://raw.githubusercontent.com/myWsq/RavenJS/refs/heads/main/install.sh | sh
```

Or install a specific version:

```bash
curl -fsSL https://raw.githubusercontent.com/myWsq/RavenJS/refs/heads/main/install.sh | sh -s -- v1.0.0
```

**Windows (PowerShell):**

```powershell
irm https://raw.githubusercontent.com/myWsq/RavenJS/refs/heads/main/install.ps1 | iex
```

Or install a specific version:

```powershell
& ([scriptblock]::Create((irm https://raw.githubusercontent.com/ravenjs/ravenjs/main/install.ps1))) -Version v1.0.0
```

### Manual Download from GitHub Releases

Visit [GitHub Releases](https://github.com/ravenjs/ravenjs/releases) to download the binary for your system.

## Development

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.3.10. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
