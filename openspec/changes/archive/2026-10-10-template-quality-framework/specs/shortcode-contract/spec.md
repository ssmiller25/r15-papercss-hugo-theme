# Spec Delta

## Purpose

Defines the uniform authoring contract that every theme shortcode must satisfy, so that content authors get actionable errors instead of cryptic failures or silently wrong output.

## ADDED Requirements

### Requirement: Shortcodes accept named parameters

Shortcodes SHALL accept their inputs as named parameters, so that a given parameter's position cannot change the meaning of the invocation.

#### Scenario: A shortcode is invoked

- **WHEN** an author invokes a shortcode
- **THEN** every input is supplied by name
- **AND** reordering named inputs does not change the result

### Requirement: Invalid shortcode input fails with a located, actionable message

A shortcode SHALL fail with a message that names the offending parameter and states the accepted values, and the failure SHALL identify the content file and position that produced it.

#### Scenario: A required parameter is absent

- **WHEN** an author invokes a shortcode without a required parameter
- **THEN** the build fails with a message naming the missing parameter
- **AND** the message identifies the content file and position

#### Scenario: A parameter holds an unsupported value

- **WHEN** an author supplies a parameter value outside the accepted set
- **THEN** the build fails with a message listing the accepted values
- **AND** the message identifies the content file and position

#### Scenario: A resource lookup matches nothing

- **WHEN** a shortcode is asked to process a named resource that does not resolve
- **THEN** the build fails with a message naming the resource that could not be resolved
- **AND** no nil-reference failure is raised

### Requirement: Shortcodes emit no inline presentation

Shortcodes SHALL NOT emit presentation rules in the markup's style attribute. Presentational concerns SHALL be expressed through the theme's presentation hooks so they can be overridden by consumers.

#### Scenario: A shortcode emits a container

- **WHEN** a shortcode renders a container element
- **THEN** the element carries no inline presentation rules
- **AND** its appearance is controlled through overridable hooks

### Requirement: Shortcodes produce accessible content

Shortcodes SHALL NOT emit interactive elements that lack an accessible name, and SHALL NOT emit form controls that lack an associated label.

#### Scenario: A shortcode emits a control

- **WHEN** a shortcode renders an element that responds to activation
- **THEN** that element declares its type and an accessible name
- **AND** it is not nested inside another activation-sensitive element

#### Scenario: A shortcode emits a control with a visible description

- **WHEN** a shortcode renders an activation-sensitive element whose visible content is graphical rather than textual
- **THEN** the element's visible children use phrasing-level elements rather than block-level elements

### Requirement: Shortcode inner content is processed consistently

A shortcode's inner content SHALL be processed identically regardless of how the author delimited the shortcode.

#### Scenario: Inner content contains markup

- **WHEN** a shortcode's inner content contains markup or formatting
- **THEN** it is rendered through the site's content processing
- **AND** the result is identical for both delimiter styles

#### Scenario: Inner content is absent

- **WHEN** a shortcode that renders its inner content is invoked without any
- **THEN** no empty container or stray separator is emitted

### Requirement: Shortcodes are exercised by the example site

Every shortcode the theme provides SHALL be demonstrated in the bundled example content so that its rendered output is covered by the theme's own verification.

#### Scenario: The example site is built and linted

- **WHEN** verification builds and inspects the bundled example site
- **THEN** every provided shortcode's output appears somewhere in the generated pages and has been validated

#### Scenario: The example site is published as the demo

- **WHEN** a consumer reads the theme's published demonstration
- **THEN** each shortcode's rendered result is visible and documented