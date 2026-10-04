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

### Requirement: A committed gate is runnable

A gate definition committed to the repository SHALL execute. A gate that aborts during setup, or that a preceding failure prevents from being reached, SHALL be treated as a defect in its own right rather than as an absent or passing check.

#### Scenario: A gate names an option its tool does not have

- **WHEN** a gate definition requests analysis of a language, format, or rule the invoked tool does not support
- **THEN** the definition is corrected rather than left to fail on every run

#### Scenario: A gate is unreachable

- **WHEN** one step of a gate sequence cannot succeed
- **THEN** the remaining steps are still verified to run and to pass

#### Scenario: A gate is not reached

- **WHEN** a step preceding another step fails
- **THEN** the following step is treated as unverified rather than as passing

### Requirement: The file set under validation is explicit

Gates SHALL validate the complete set of generated markup. A file-matching pattern that depends on shell glob semantics SHALL NOT be relied upon to determine that set.

#### Scenario: A page is added to the example site

- **WHEN** verification determines which generated pages to validate
- **THEN** the new page is included
- **AND** pages located at the root of the site are included alongside nested pages

#### Scenario: Coverage is audited

- **WHEN** verification counts the generated pages it validated
- **THEN** the count equals the number of generated pages

#### Scenario: Output the theme does not own is present

- **WHEN** the built site contains markup generated wholly by the site generator rather than by the theme
- **THEN** that markup is excluded from validation
- **AND** the exclusion is by identification of the file, not by disabling a rule
- **AND** the number of excluded files is reported on every run

### Requirement: Validation reads only current build output

Verification SHALL NOT validate output left behind by an earlier build. The build that produces the output under validation SHALL leave no stale files in that output.

#### Scenario: A template stops producing a page

- **WHEN** a template that previously generated a page no longer does
- **THEN** the page it previously generated does not survive into the output being validated

#### Scenario: Output persists between runs

- **WHEN** verification runs against an output directory written by an earlier build
- **THEN** the result reflects the current templates rather than the earlier ones

### Requirement: Regression baseline

The repository SHALL record the current validation result for the bundled example site, and gates SHALL fail on any increase from that recorded result. The recorded result SHALL carry a ceiling per rule, not only an aggregate total, so that an improvement in one rule cannot offset a regression in another.

Lowering a recorded ceiling SHALL be a deliberate act. A passing run SHALL NOT raise a ceiling, and SHALL NOT adopt a newly measured value on the maintainer's behalf.

#### Scenario: A change introduces new violations

- **WHEN** a change increases the count of violations for any rule
- **THEN** verification fails and names the rule and both counts

#### Scenario: Violations appear under a rule with no recorded ceiling

- **WHEN** a change produces the first violation of a rule the baseline has never seen
- **THEN** verification fails

#### Scenario: One rule improves while another regresses

- **WHEN** a change reduces the violations of one rule and increases those of another by the same amount
- **THEN** verification fails on the regressed rule

#### Scenario: A change fixes violations

- **WHEN** a change reduces the count of violations
- **THEN** verification passes
- **AND** the run reports the reduced count as available for the baseline

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