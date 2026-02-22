## Context

The `raven self-update` command currently prints manual npm/bunx instructions. The `install.sh` script already implements full self-update logic: it fetches the latest version from GitHub Releases, detects OS/arch, downloads the prebuilt binary, and installs to `~/.local/bin/raven`. The CLI runs on Bun and can use `fetch` for HTTP. The goal is to implement equivalent logic inside the CLI so `raven self-update` performs the update automatically.

## Goals / Non-Goals

**Goals:**
- Implement self-update that downloads and installs the latest binary from GitHub Releases
- Match install.sh behavior: OS/arch detection, GitHub API, URL pattern, install path `~/.local/bin`
- Show "Already up to date" when current version equals latest
- Clear success/error messages aligned with install.sh semantics

**Non-Goals:**
- Supporting Windows (install.sh doesn't; CLI can error on unsupported OS/arch)
- Updating when run via `bun run` or development setup
- Confirmation prompts (install.sh doesn't prompt; we proceed directly)

## Decisions

**1. Install target: `~/.local/bin/raven`**
- Same as install.sh. Works for both binary-installed and npm/bunx users.
- Alternative: Replace the running executable in-place. Rejected because detecting the real binary path across npx/bunx/global install is complex and platform-specific.

**2. Version source**
- Current: from bundled `registry.version` (matches CLI package version).
- Latest: from GitHub Releases API `https://api.github.com/repos/myWsq/RavenJS/releases`, first non-prerelease tag (same logic as install.sh).

**3. OS/arch detection**
- Mirror install.sh: `uname -s` → linux/darwin; `uname -m` → x64/arm64. Unsupported → exit with error.

**4. Download URL**
- `https://github.com/myWsq/RavenJS/releases/download/v{version}/raven-{version}-{os}-{arch}`
- No `.exe` suffix (no Windows support).

**5. Update flow**
- Fetch latest version → compare with current → if same, print "Already up to date" and exit.
- Else: download to temp file → validate non-empty → write to `~/.local/bin/raven` → `chmod +x` → success message.
- Use Bun `fetch` and `Bun.write`; `process.platform` / `process.arch` for detection.

## Risks / Trade-offs

- [Running via npx/bunx] → We always write to `~/.local/bin`. If user ran `bunx raven`, after self-update they may need to ensure `~/.local/bin` is in PATH to use the new binary.
- [Network failure] → Same as install.sh: clear error, exit 1.
- [No release for current OS/arch] → Download fails; show install.sh-style error suggesting they check if the release supports their platform.
- [Binary in use] → On Unix, overwriting a running binary is safe; the old inode stays until the process exits.
