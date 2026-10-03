# Spec Delta

## Purpose

Defines the quality gates that run against this theme's generated output, so that regressions in markup validity, accessibility, and build determinism are detected automatically rather than by inspection.

## ADDED Requirements

### Requirement: Gates operate on generated output

Template sources SHALL NOT be submitted to HTML validation, because they are template syntax rather than markup. Gates SHALL be applied to the markup the theme actually produces.

#### Scenario: Verification runs

- **WHEN** the theme's verification executes
- **THEN** the site is built first
- **AND** the resulting markup is what validation is applied to

#### Scenario: An invalid document is produced

- **WHEN** a template change produces markup with a structural violation
- **THEN** verification fails
- **AND** the report identifies the offending output location

### Requirement: Lint tool versions are pinned

Every lint tool the gates invoke SHALL run at a version fixed by the repository, so that results are reproducible and a tool upgrade cannot silently change the gate's meaning.

#### Scenario: The environment is provisioned

- **WHEN** the verification environment is created
- **THEN** each lint tool is installed at the version the repository specifies

#### Scenario: The pinned set is audited

- **WHEN** verification inspects the provisioning definition
- **THEN** no lint tool resolves to an unpinned version range

### Requirement: The file set under validation is explicit

Gates SHALL validate the complete set of generated markup. A file-matching pattern that depends on shell glob semantics SHALL NOT be relied upon to determine that set.

#### Scenario: A page is added to the example site

- **WHEN** verification determines which generated pages to validate
- **THEN** the new page is included
- **AND** pages located at the root of the site are included alongside nested pages

#### Scenario: Coverage is audited

- **WHEN** verification counts the generated pages it validated
- **THEN** the count equals the number of generated pages

### Requirement: Regression baseline

The repository SHALL record the current validation result for the bundled example site, and gates SHALL fail on any increase from that recorded result.

#### Scenario: A change introduces new violations

- **WHEN** a change increases the count of violations
- **THEN** verification fails and reports the increase

#### Scenario: A change fixes violations

- **WHEN** a change reduces the count of violations
- **THEN** verification passes
- **AND** the improved count becomes the new baseline

#### Scenario: The baseline is improved

- **WHEN** a deliberate cleanup reduces the count
- **THEN** the recorded baseline is tightened to the new count in the same change

### Requirement: The declared runtime floor matches what is exercised

The minimum runtime version the theme declares SHALL be the version the theme is actually built and verified against, and divergence SHALL fail verification.

#### Scenario: The declared floor is audited

- **WHEN** verification compares the theme's declared minimum runtime version against the version the environment builds with
- **THEN** the two agree
- **AND** a mismatch fails verification

#### Scenario: A version is bumped

- **WHEN** the verified runtime version is changed
- **THEN** the declared minimum is updated in the same change

### Requirement: A single local entry point

The theme SHALL provide one documented command that runs the full verification sequence locally, and it SHALL be the command contributors are directed to use before pushing.

#### Scenario: A contributor verifies locally

- **WHEN** a contributor runs the documented local verification command
- **THEN** the same gates that continuous integration runs are executed
- **AND** the command is listed in the task runner's own help output

#### Scenario: Gates drift apart

- **WHEN** the local command and the continuous integration definition are compared
- **THEN** they invoke the same gates

### Requirement: Markup constraints are declared rather than implicit

Gates SHALL declare the rule set they enforce in a committed configuration, so that a failure is attributable to a deliberate policy choice.

#### Scenario: A gate reports a violation

- **WHEN** a gate fails
- **THEN** the rule it enforced is traceable to committed configuration

#### Scenario: A framework constraint is knowingly violated

- **WHEN** a markup construct is invalid in isolation but is mandated by the framework the theme builds on
- **THEN** the gate configuration records that construct as an explicit, documented exception

#### Scenario: The exception set is audited

- **WHEN** the committed gate configuration is reviewed
- **THEN** every disabled rule corresponds to a documented exception rather than to convenience