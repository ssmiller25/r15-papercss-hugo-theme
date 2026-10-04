# Spec Delta

## Purpose

Defines the theme's relationship to the vendored PaperCSS framework: the constraints the theme must honor, the precedence of its override layer, and the defects the theme therefore owns outright.

## ADDED Requirements

### Requirement: The vendored framework version is recorded

The theme SHALL record which version of the framework stylesheet it vendors, and that record SHALL be verifiable against the vendored file.

#### Scenario: The vendored version is inspected

- **WHEN** a maintainer determines which framework version the theme ships
- **THEN** the version is stated in the repository
- **AND** the stated version can be compared against the published artifact for that version

### Requirement: Override styles take precedence over framework styles

Consumer-facing and theme-owned presentation SHALL be applied through an override layer that the theme loads after the framework stylesheet, so that it wins without requiring selector specificity battles.

#### Scenario: A framework declaration conflicts with theme intent

- **WHEN** the framework stylesheet declares a rule that the theme needs to behave differently
- **THEN** the theme's override layer changes the effective value
- **AND** the override requires no modification to the vendored file

#### Scenario: Cascade order is inspected

- **WHEN** the generated page's stylesheet references are read in order
- **THEN** the override layer is requested after the framework stylesheet

### Requirement: The theme honors the framework's activation contract

Where the framework's behavior is conditioned on an element identifier prefix, the theme SHALL generate identifiers satisfying that prefix.

#### Scenario: A collapsible component renders

- **WHEN** the theme renders a component the framework drives through an identifier-prefix selector
- **THEN** the generated control's identifier satisfies the framework's required prefix
- **AND** the component's open and closed states both behave as the framework intends

### Requirement: Overridden styles are delivered with cache invalidation

Styles applied through the override layer SHALL be delivered in a form that changes when their content changes, so that visitors do not retain superseded fixes.

#### Scenario: Override content is updated

- **WHEN** the override layer's content changes and the site is rebuilt
- **THEN** the address at which it is served changes
- **AND** a visitor loading the rebuilt site receives the updated rules

#### Scenario: Override layer is delivered

- **WHEN** the override layer is served
- **THEN** its content is minified for transfer size

### Requirement: Framework defects are adopted when the framework provides a fix

Where a framework defect affects this theme's output and a fixed version of the framework is available, the theme SHALL adopt that version rather than carry a local correction for a defect the framework has fixed. The theme SHALL correct a defect locally only where the vendored framework version still contains it, and SHALL record why that version does not carry the fix.

#### Scenario: A framework defect affects the theme

- **WHEN** the framework's shipped stylesheet causes incorrect output
- **THEN** the theme checks whether a fixed framework version is available before correcting it locally

#### Scenario: A fixed framework version exists

- **WHEN** a published framework version fixes a defect the theme has been working around
- **THEN** the theme adopts that version
- **AND** the local correction for that defect is removed

#### Scenario: The vendored version still contains the defect

- **WHEN** no fixed framework version is available for the defect
- **THEN** the theme corrects the behavior in its override layer
- **AND** the correction is documented with its cause

### Requirement: The vendored framework version is pinned to a release

The theme SHALL vendor a framework version that has been published as a release artifact, and SHALL NOT vendor an unreleased or locally built framework stylesheet, so that the vendored file's provenance stays verifiable.

#### Scenario: A framework fix is available but unreleased

- **WHEN** a fix exists only in an unreleased or locally built framework stylesheet
- **THEN** the theme does not adopt it
- **AND** the theme waits for the published release

#### Scenario: The vendored stylesheet is audited

- **WHEN** a maintainer compares the vendored stylesheet against the published artifact for the recorded version
- **THEN** they are byte-identical

### Requirement: Toggle controls remain keyboard reachable

Where the theme relies on a framework rule that removes a control from the document's rendering and interaction order, the theme SHALL override that rule so the control remains reachable and operable by keyboard.

#### Scenario: A visitor uses only a keyboard

- **WHEN** a visitor tabs through a page containing a collapsible component
- **THEN** the control governing that component is reachable in the tab order
- **AND** activating it opens or closes the component
- **AND** a visible focus indicator is shown

#### Scenario: The correction is inspected

- **WHEN** the override layer is inspected
- **THEN** it contains the correction
- **AND** the correction's rationale identifies the framework rule it counteracts

### Requirement: Expandable components are not height-limited

Where the framework limits the expanded height of an expandable component, the theme SHALL override that limit so content of arbitrary length is fully reachable.

#### Scenario: A component expands

- **WHEN** a collapsible component's content exceeds the framework's height limit
- **THEN** all of the content is visible once the component is expanded
- **AND** none of it is clipped or hidden
- **AND** the expand and collapse transition still operates

#### Scenario: The correction is inspected

- **WHEN** the override layer is inspected
- **THEN** it contains the height-limit correction
- **AND** the correction's rationale identifies the framework rule it counteracts

### Requirement: Upstream reports accompany local corrections

Where the theme corrects a framework defect locally, the theme SHALL record an upstream report for that defect.

#### Scenario: A local correction is made

- **WHEN** the theme corrects a defect originating in the framework
- **THEN** an upstream report exists referencing the defect
- **AND** the report identifies which vendored version is affected
- **AND** local work does not wait on the upstream report being resolved

### Requirement: Framework markup keeps its presentation hooks

Where the theme corrects a framework defect by changing markup rather than styles, it SHALL retain the framework's documented hooks so the correction does not disable the framework's own presentation.

#### Scenario: A markup correction is made

- **WHEN** the theme alters markup to correct a framework defect
- **THEN** the framework's documented hooks remain present on the altered elements
- **AND** the component renders with the framework's intended appearance

### Requirement: Local modifications live only in the override layer

A theme-local correction SHALL NOT be applied by editing the vendored stylesheet. The vendored file SHALL remain byte-identical to a published framework artifact.

#### Scenario: The vendored stylesheet is inspected

- **WHEN** a maintainer inspects how the framework is obtained
- **THEN** the vendored stylesheet is unmodified from its published version
- **AND** all local modifications live in the override layer

#### Scenario: A correction is needed

- **WHEN** a correction to framework behavior is required
- **THEN** it is applied in the override layer or in theme markup
- **AND** the vendored file is not edited to carry it

### Requirement: The theme tracks the framework it depends on

Where the framework's published releases change behavior the theme relies on, the theme SHALL identify the affected behavior and record a deliberate response, so that an upgrade never changes the theme's output silently.

#### Scenario: A framework release changes observable behavior

- **WHEN** an adopted framework release changes something the theme's output depended on
- **THEN** the theme identifies the affected behavior
- **AND** the response is recorded rather than being left to chance

#### Scenario: The framework stops supplying a dependency

- **WHEN** an adopted framework release no longer supplies something the theme's output relied on implicitly
- **THEN** the theme supplies it explicitly or records the fallback as its intended appearance
- **AND** the change is not left as an unrecorded visual difference