## Context

The CLI `raven self-update` fetches the latest version from GitHub Releases, compares with `registry.version`, and downloads the prebuilt binary. Currently `getLatestVersion()` filters tags with `!t.includes("-")` so prereleases are ignored, and version comparison uses string equality.

## Goals / Non-Goals

**Goals:**
- Add `--prerelease` flag so users can opt into updating to the latest prerelease
- Use semver comparison so `0.0.1` vs `0.0.1-alpha.1` is handled correctly (no downgrade)
- Keep default behavior: stable-only, unchanged for users who never use prerelease

**Non-Goals:**
- Prerelease channel matching (e.g., only alpha when on alpha)
- Automatic detection of "user is on prerelease, offer prerelease"

## Decisions

### 1. Use `semver` package for version comparison
- **Choice**: Add `semver` dependency, use `semver.gt(latestVersion, currentVersion)` to decide if update is needed
- **Rationale**: Standard, well-tested, handles prerelease ordering (`0.0.1-alpha.1` < `0.0.1-alpha.2` < `0.0.1`)
- **Alternative**: Inline semver parsing — more code, risk of bugs

### 2. GitHub API order for "latest"
- **Choice**: Keep using first matching release in GitHub API response (newest by publish date)
- **Rationale**: API returns releases in reverse chronological order; first match is usually correct. Avoid sorting all tags by semver (extra logic, edge cases with invalid tags)
- **Alternative**: Parse all tags, sort by semver, take max — more robust but overkill for typical release flow

### 3. `getLatestVersion(includePrerelease: boolean)`
- **Choice**: Add optional parameter; when false, filter `!t.includes("-")`; when true, take first release
- **Rationale**: Single function, clear branching

## Risks / Trade-offs

- **[Risk]** Invalid semver strings (malformed tags) could throw → Mitigation: wrap `semver.gt` in try/catch; on parse failure fall back to string comparison or error out cleanly
- **[Trade-off]** GitHub date order vs semver order — if someone publishes v1.0.0 then v0.9.0 by mistake, we'd take v1.0.0 (first in list). Acceptable.
