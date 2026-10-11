# Spec Delta

## Purpose

Defines how a theme release is produced and published: gated on the theme's own verification, published as an immutable release from an exact tag, and verifiable without trusting the maintainer by hand.

## ADDED Requirements

### Requirement: A release is published only from a tree that passes the theme's verification

Publishing SHALL be gated on the theme's own verification sequence, so no release is created from a tree that fails its gates.

#### Scenario: The gates fail

- **WHEN** a release is triggered and the theme's verification sequence does not pass
- **THEN** no release is created

#### Scenario: A release is triggered

- **WHEN** a release tag is pushed or the release is dispatched
- **THEN** the theme's full verification sequence runs before anything is published

### Requirement: A release is identified by an exact, immutable tag

A release SHALL be identified by an exact `vX.Y.Z` tag, and the published release SHALL NOT be mutable after publication.

#### Scenario: A released artifact is referenced

- **WHEN** a consumer or a CDN addresses a release
- **THEN** it is addressed by an exact tag
- **AND** the published release's tag and assets cannot be altered afterward

### Requirement: A release is verifiable independent of the maintainer

A release SHALL carry the provenance needed to verify that its assets were built from the tagged source by the repository's own release process.

#### Scenario: A release is audited

- **WHEN** a consumer verifies a downloaded release artifact
- **THEN** the provenance binds the artifact to this repository and its release workflow
- **AND** the release's tag is signed and the release is marked immutable

### Requirement: A release carries a source archive

A release SHALL publish the theme's source as an archive, so a consumer can obtain a version without a version control client.

#### Scenario: A release is inspected

- **WHEN** a consumer views a release
- **THEN** a source archive for that version is attached
- **AND** release notes are generated from the changes since the previous tag

### Requirement: Nothing is published by hand and no package registry is used

A release SHALL be produced by the repository's release process triggered by the tag, and the theme SHALL NOT depend on publication to a package registry.

#### Scenario: A release is produced

- **WHEN** a maintainer cuts a release
- **THEN** the release is created by the tag-triggered process rather than by manual upload
- **AND** no package-registry publication is required for consumption
