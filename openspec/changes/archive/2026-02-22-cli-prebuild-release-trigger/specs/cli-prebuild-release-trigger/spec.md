## ADDED Requirements

### Requirement: Release tag triggers workflow
GitHub Actions SHALL run the release workflow only when a tag matching v<x.x.x> is pushed.

#### Scenario: Tag push triggers release
- **WHEN** a tag v1.2.3 is pushed to the repository
- **THEN** the release workflow starts

#### Scenario: Non-version tag does not trigger release
- **WHEN** a tag not matching v<x.x.x> is pushed
- **THEN** the release workflow does not start

### Requirement: Prebuild version sourced from tag
The CLI prebuild step SHALL use the release tag version as its build version.

#### Scenario: Prebuild receives version from tag
- **WHEN** the release workflow is triggered by tag v1.2.3
- **THEN** the CLI prebuild version is set to 1.2.3

#### Scenario: Version propagation is consistent
- **WHEN** the workflow computes the release version
- **THEN** the same version value is passed to all CLI prebuild steps
