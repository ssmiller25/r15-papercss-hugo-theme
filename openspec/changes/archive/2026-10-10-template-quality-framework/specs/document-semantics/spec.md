# Spec Delta

## Purpose

Defines the structural and accessible qualities that every generated page must satisfy, so the theme's output is valid, navigable by assistive technology, and byte-stable across builds.

## ADDED Requirements

### Requirement: Pages expose navigation landmarks

Every generated page SHALL expose its major regions as landmark elements, and SHALL provide a mechanism for keyboard users to bypass repeated navigation.

#### Scenario: A page is loaded

- **WHEN** any page is rendered
- **THEN** the primary navigation, main content, and site footer regions are exposed as named landmarks
- **AND** the first focusable element is a link that moves focus to the main content region

#### Scenario: A keyboard user traverses the page

- **WHEN** a user tabs from the top of the document
- **THEN** a skip link becomes the first stop and reveals itself on focus
- **AND** activating it moves focus into the main content region

### Requirement: Document language is declared

Every generated page SHALL declare its content language on the root element.

#### Scenario: A page declares its language

- **WHEN** a page is rendered in a configured language
- **THEN** the root element carries that language identifier

### Requirement: Headings form a coherent outline

Each page SHALL contain exactly one top-level heading, and heading levels SHALL NOT be chosen to achieve a visual size.

#### Scenario: A content page renders

- **WHEN** a single page renders
- **THEN** exactly one top-level heading is present
- **AND** its subordinate headings descend without skipping levels

#### Scenario: A heading is styled

- **WHEN** a heading requires a particular visual size
- **THEN** the size is achieved through the theme's existing presentation hooks
- **AND** the heading's outline level is chosen by its role in the document structure

### Requirement: Listings are marked up as lists

A sequence of sibling content entries SHALL be presented as a list, and individual entries SHALL NOT each occupy a heading level reserved for document sections.

#### Scenario: A listing renders

- **WHEN** a page presents multiple sibling content entries
- **THEN** the entries are contained within a list element
- **AND** the number of section-level headings on the page does not grow with the number of entries

#### Scenario: Consumer styling is preserved

- **WHEN** a listing renders
- **THEN** the presentation hooks that existing consumer overrides target remain present on the rendered entries

### Requirement: Every form control is labeled

Every interactive form control rendered by the theme SHALL have an associated label or an explicit accessible name.

#### Scenario: The search control renders

- **WHEN** the search feature is enabled
- **THEN** its input has an associated label
- **AND** the input is not announced to assistive technology as an unlabeled field

### Requirement: Generated images are described and dimensioned

Every image emitted by the theme SHALL carry alternative text and intrinsic dimensions.

#### Scenario: A shortcode renders an image

- **WHEN** a shortcode emits an image element
- **THEN** the element carries an alternative-text attribute
- **AND** the element carries width and height attributes

#### Scenario: Image alternative text is omitted

- **WHEN** an image is decorative
- **THEN** the alternative-text attribute is present and empty rather than absent

### Requirement: Generated output is byte-stable

Building the same content from an unchanged source tree SHALL produce byte-identical output, and template logic SHALL NOT introduce per-invocation randomness into markup.

#### Scenario: Two builds are compared

- **WHEN** the site is built twice with no intervening source change
- **THEN** the generated output is identical
- **AND** no element identifier differs between the two builds

#### Scenario: Repeated components render

- **WHEN** the same shortcode is invoked more than once within one page
- **THEN** each invocation receives a distinct element identifier
- **AND** that identifier is derived deterministically rather than randomly

### Requirement: No element identifiers are hardcoded

Where a template must reference an element identifier from more than one place, the identifier SHALL be derived within the template rather than written as a fixed value.

#### Scenario: A collapsible component renders

- **WHEN** a component needs a matching control and target
- **THEN** the identifier linking them is generated during the build

### Requirement: Navigation menus reflect current page

Navigation links SHALL indicate which page the visitor is currently viewing.

#### Scenario: A visitor views a page

- **WHEN** the rendered page corresponds to a navigation entry
- **THEN** that entry is marked as representing the current page
- **AND** the marking is exposed to assistive technology