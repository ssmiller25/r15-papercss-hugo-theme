# Spec Delta

## Purpose

Defines which layer of the theme owns which markup, so that reusable structure has exactly one home and page layouts stay thin enough to audit.

## ADDED Requirements

### Requirement: The base template owns the document

The theme's base template SHALL be the only template that emits document-level elements, and every page template SHALL inherit from it without redefining them.

#### Scenario: A page template renders

- **WHEN** any page template produces output
- **THEN** the document skeleton is emitted by the base template alone
- **AND** the page template supplies only its main content region

### Requirement: Reusable markup lives in partials

Markup required by two or more page templates SHALL exist in exactly one partial, and page templates SHALL NOT inline a second copy of it.

#### Scenario: Post listings appear on multiple page types

- **WHEN** post listings render on the home page, on section list pages, and on taxonomy pages
- **THEN** all three obtain the markup from the same shared partial
- **AND** no page template contains its own copy of that markup

#### Scenario: Shared markup changes

- **WHEN** the markup of a shared element changes
- **THEN** a single edit changes it at every location it appears

### Requirement: Page templates are thin

A page template SHALL declare only the behavior that differs from the default template for its content type, and SHALL NOT restate shared structure.

#### Scenario: A content type needs distinct rendering

- **WHEN** a content type requires a genuinely different presentation
- **THEN** its template contains only that difference
- **AND** all shared structure remains delegated to the base template or to partials

### Requirement: Partials are invoked through the partial function

Shared partials SHALL be invoked through the theme's partial invocation mechanism, and SHALL NOT be invoked through the deprecated template invocation mechanism.

#### Scenario: A partial is called

- **WHEN** a page template includes a shared partial
- **THEN** it uses the partial invocation mechanism

### Requirement: No orphaned partials

Every partial in the theme SHALL be reachable from at least one template. Partials that are unreachable SHALL be removed rather than retained.

#### Scenario: An audit runs

- **WHEN** the set of partials is enumerated
- **THEN** each one is transitively reachable from a page template
- **AND** any partial with no referrer has been deleted or wired in

### Requirement: Empty templates are a build failure

A template file SHALL NOT be committed with zero bytes of content.

#### Scenario: The not-found template is populated

- **WHEN** a consumer requests a path that does not exist
- **THEN** the response body contains a styled not-found page with a heading
- **AND** a navigation path back into the site

#### Scenario: Template contents are audited

- **WHEN** any template file in the theme is empty
- **THEN** verification fails

### Requirement: Authoring instructions match the tooling

Documented maintenance commands SHALL exist as executable targets in the project's task runner.

#### Scenario: A documented command is followed

- **WHEN** a contributor follows a command shown in the project's documentation
- **THEN** the command is a defined target and executes successfully

#### Scenario: Target existence is audited

- **WHEN** verification inspects commands named in project documentation
- **THEN** every such command resolves to a defined target