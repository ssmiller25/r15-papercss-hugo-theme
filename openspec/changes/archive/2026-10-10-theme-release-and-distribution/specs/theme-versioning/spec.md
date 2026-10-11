# Spec Delta

## Purpose

Defines the theme's version identity: the release tag as the source of truth, how the changelog and the documentation are reconciled against it, and how breaking changes are recorded for consumers.

## ADDED Requirements

### Requirement: The release tag is the source of truth for the version

The release tag SHALL be the source of truth for the theme's version, and the theme SHALL NOT maintain a separate committed version file. A consistency check SHALL fail verification when the changelog and the version named in the documentation do not agree with the tag, or — absent a tag — with each other.

#### Scenario: A release tag is published

- **WHEN** a `vX.Y.Z` tag is pushed
- **THEN** the changelog carries a section for `X.Y.Z` and the documentation names `vX.Y.Z`
- **AND** verification fails, and no release is published, when either disagrees with the tag

#### Scenario: No tag is present

- **WHEN** verification runs without a release tag
- **THEN** the version named in the documentation must equal the newest changelog section
- **AND** verification fails when they disagree

#### Scenario: The version sources agree

- **WHEN** the tag (if present), the newest changelog section, and the documented version all name the same version
- **THEN** the consistency check passes

#### Scenario: A prerelease tag is published

- **WHEN** a `vX.Y.Z-<suffix>` candidate tag is pushed
- **THEN** the changelog section and the documented version for `X.Y.Z` are checked, because a candidate is documented as the release it prepares
- **AND** the release is published as a prerelease rather than as the current release

### Requirement: Every release has a changelog section

The changelog SHALL contain a section for the released version, written for consumers, with the newest release first.

#### Scenario: A release is inspected

- **WHEN** a consumer reads the changelog for a released version
- **THEN** a section for that version exists
- **AND** it describes what changed for consumers rather than restating commit messages

### Requirement: Breaking changes carry consumer upgrade guidance

Where a release contains a breaking change, the theme SHALL provide the before/after a consumer needs to adjust, separate from the changelog summary.

#### Scenario: A breaking change ships

- **WHEN** a release changes rendered markup, configuration, or the runtime floor in a way consumers must react to
- **THEN** an upgrade document states what it was, what it is now, and the substitution to make
- **AND** the changelog entry for that release points to it
