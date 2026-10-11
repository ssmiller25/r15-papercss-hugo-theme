# Spec Delta

## Purpose

Defines how a consumer obtains and pins the theme: two supported consumption methods, each pinned to an exact version, documented so that no instruction points at a floating reference.

## ADDED Requirements

### Requirement: The theme is consumable as a Hugo Module

The theme SHALL be importable as a Hugo Module so a consumer can depend on it at an exact version, with the resolved version and checksum recorded in the consumer's project.

#### Scenario: A consumer adds the theme as a module

- **WHEN** a consumer imports the theme as a module at an exact version
- **THEN** the theme's content is mounted into the consumer's project
- **AND** the exact version and its checksum are recorded in the consumer's project files

#### Scenario: A consumer builds after the module is resolved

- **WHEN** a consumer rebuilds without changing the recorded version
- **THEN** the same theme version is used

### Requirement: The theme is consumable as a pinned git submodule

The theme SHALL remain consumable as a git submodule, and the documented submodule flow SHALL pin the submodule to an exact version rather than floating it.

#### Scenario: A consumer adds the theme as a submodule

- **WHEN** a consumer follows the documented submodule instructions
- **THEN** the submodule is placed under the site's themes directory
- **AND** it is pinned to an exact version

#### Scenario: A consumer updates the submodule

- **WHEN** a consumer follows the documented update instructions
- **THEN** the instructions move the submodule to a chosen exact version
- **AND** do not silently track a branch head

### Requirement: Both consumption methods are documented

The theme's documentation SHALL describe installing and upgrading it by each supported method, and SHALL identify which prerequisites each method requires.

#### Scenario: A consumer chooses a method

- **WHEN** a consumer reads the installation documentation
- **THEN** both the module and submodule methods are documented
- **AND** each states its prerequisite (the module method's toolchain requirement, the submodule method's absence of one)

### Requirement: Documented references never float

A version reference in the theme's installation or upgrade documentation SHALL name an exact version. A floating reference — a latest alias, a partial version, a branch, or a bare commit — SHALL be treated as a defect.

#### Scenario: The documentation is audited

- **WHEN** verification inspects the installation and upgrade documentation
- **THEN** every version reference names an exact version
- **AND** verification fails when a floating reference is introduced

#### Scenario: The version display is audited

- **WHEN** verification inspects a version shown in the documentation
- **THEN** the exact-version requirement applies to instructions a consumer copies
- **AND** a version displayed dynamically from the repository's releases is not treated as a floating reference

### Requirement: Distribution metadata is accurate

The theme's distribution metadata SHALL identify the theme unambiguously and truthfully, including a name that does not collide with an existing theme, the demonstration site, and the declared runtime floor.

#### Scenario: The theme metadata is inspected

- **WHEN** a consumer or a theme index reads the theme's metadata
- **THEN** the name is unique to this theme
- **AND** the demonstration address and the declared runtime floor are present and correct

### Requirement: The current release is surfaced dynamically

The theme's documentation SHALL present the current release version, sourced dynamically from the repository's releases or tags rather than a value maintained by hand, so the displayed version cannot drift from the latest release.

#### Scenario: The documentation is viewed

- **WHEN** a reader views the documentation
- **THEN** the current release version is shown
- **AND** it is not a value maintained by hand

#### Scenario: A release is cut

- **WHEN** a new release is published
- **THEN** the version shown in the documentation reflects it without a documentation change
