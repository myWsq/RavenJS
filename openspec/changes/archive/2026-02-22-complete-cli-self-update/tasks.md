## 1. Platform Detection

- [x] 1.1 Add `detectOs()` returning "linux" | "darwin" based on `process.platform`
- [x] 1.2 Add `detectArch()` returning "x64" | "arm64" based on `process.arch`
- [x] 1.3 Error with clear message when OS or arch is unsupported

## 2. Version Fetching

- [x] 2.1 Add `getLatestVersion()` that fetches from `https://api.github.com/repos/myWsq/RavenJS/releases` and parses first non-prerelease tag (exclude tags containing `-`)
- [x] 2.2 Strip leading `v` from version string when comparing

## 3. Download and Install

- [x] 3.1 Add `downloadBinary(version: string, os: string, arch: string)` that downloads from `https://github.com/myWsq/RavenJS/releases/download/v{version}/raven-{version}-{os}-{arch}` and returns buffer
- [x] 3.2 Validate downloaded file is non-empty before writing
- [x] 3.3 Write to `~/.local/bin/raven` using `Bun.write`, create directory with `mkdir -p` semantics
- [x] 3.4 Set executable bit on installed binary (Bun.write or chmod equivalent)

## 4. Self-Update Command

- [x] 4.1 Refactor `cmdSelfUpdate` to call detectOs/detectArch; exit with error if unsupported
- [x] 4.2 Fetch latest version; compare with `registry.version`; if equal, show "Already up to date" and return
- [x] 4.3 Download binary, install to `~/.local/bin/raven`, show success message with path
- [x] 4.4 Handle fetch/download errors with install.sh-style messages (e.g. check if release supports platform)
- [x] 4.5 Optionally warn if `~/.local/bin` is not in PATH (similar to install.sh)
