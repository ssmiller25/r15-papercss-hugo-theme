# Spec Delta

## Purpose

Defines how a visitor selects a light or dark ground, how that choice survives across visits, and how the theme renders content so it stays legible in either mode.

## ADDED Requirements

### Requirement: The mode control is opt-in

The theme SHALL render the mode control and apply dark-mode styling only when the site enables dark mode, and SHALL default that setting to off, so that an existing site sees no change until it opts in.

#### Scenario: Dark mode is not enabled

- **WHEN** a site does not enable dark mode
- **THEN** the rendered navigation contains no mode control
- **AND** the page renders exactly as it did before this feature

#### Scenario: Dark mode is enabled

- **WHEN** a site enables dark mode
- **THEN** the rendered navigation contains a mode control

### Requirement: The mode is applied before first paint

The theme SHALL determine the active mode and apply it to the document before the page's first paint, so that a visitor never sees the wrong ground followed by a switch to the right one.

#### Scenario: A returning visitor loads a page

- **WHEN** a visitor with a stored preference loads any page
- **THEN** that page first renders with the stored mode
- **AND** no flash of the other mode is visible

#### Scenario: The anti-flash mechanism is inspected

- **WHEN** the rendered document's head is inspected
- **THEN** the mode is applied by code that runs before the stylesheets are processed

### Requirement: A stored preference overrides the system preference

Where a visitor has explicitly chosen a mode, the theme SHALL apply that choice and SHALL ignore the operating system's preference, so that an explicit selection is never overridden by the environment.

#### Scenario: A visitor chose light on a dark-mode system

- **WHEN** a visitor who has stored a light preference loads a page on a system reporting a dark preference
- **THEN** the page renders in light mode

### Requirement: An unstated mode follows the system preference

Where a visitor has stored no preference, the theme SHALL follow the operating system's reported preference, so that the site matches the environment they already chose for everything else.

#### Scenario: A first-time visitor on a dark-mode system

- **WHEN** a visitor with no stored preference loads a page on a system reporting a dark preference
- **THEN** the page renders in dark mode

#### Scenario: A first-time visitor on a light-mode system

- **WHEN** a visitor with no stored preference loads a page on a system reporting a light preference
- **THEN** the page renders in light mode

#### Scenario: The system preference is unavailable

- **WHEN** the system reports no preference
- **THEN** the page renders in light mode

### Requirement: An explicit choice survives the session

Where a visitor selects a mode, the theme SHALL record that choice and restore it on later visits, so that the site does not ask again on every page.

#### Scenario: A visitor selects a mode

- **WHEN** a visitor selects a mode
- **THEN** the choice is recorded in a form readable on the next visit
- **AND** the choice survives navigating to another page within the same site

#### Scenario: A returning visitor loads a page

- **WHEN** a visitor returns to the site
- **THEN** the previously selected mode is applied without the visitor selecting it again

#### Scenario: The choice is cleared by the visitor

- **WHEN** a visitor returns the control to its automatic state and that state is recorded
- **THEN** subsequent visits follow the system preference again

### Requirement: The control reports the active mode

The theme SHALL expose the active mode on the control in a form assistive technology can read, so that a visitor who cannot see the colors still knows which mode is active.

#### Scenario: A screen reader user opens the control

- **WHEN** assistive technology reports the mode controls
- **THEN** the control representing the active mode is identifiable as the active one
- **AND** the controls not representing the active mode are identifiable as inactive

#### Scenario: The visitor changes mode

- **WHEN** the active mode changes
- **THEN** the exposed state of each control reflects the new active mode

### Requirement: The mode control is keyboard operable

The theme SHALL render the mode control as a natively operable control with a visible focus indicator, so that the feature is not mouse-only.

#### Scenario: A visitor uses only a keyboard

- **WHEN** a visitor tabs to the mode control
- **THEN** the control receives focus with a visible focus indicator
- **AND** activating it with the keyboard changes the active mode

### Requirement: Theme-owned colors follow the active mode

Where the theme's own stylesheet sets a color, the theme SHALL derive it from the active mode rather than fixing it to one mode, so that no theme-owned text or surface stays light while the rest of the page is dark.

#### Scenario: Every theme-owned color is audited

- **WHEN** the theme-owned stylesheet is searched for literal color values
- **THEN** no color in it is pinned to a single mode
- **AND** each resolves through the active mode's palette

#### Scenario: A dark page is inspected

- **WHEN** a page renders in dark mode
- **THEN** body text, links, and navigation links are legible against their backgrounds
- **AND** they are not the light-mode values rendered on a dark background

### Requirement: Scripted content follows the active mode

Where the theme renders colors for content assembled at runtime, the theme SHALL derive those colors from the active mode rather than fixing them, so that runtime content stays legible in either mode.

#### Scenario: The commit feed renders in dark mode

- **WHEN** the home page's runtime-rendered commit list is displayed in dark mode
- **THEN** its text, borders, and backgrounds are legible
- **AND** none of them is a value that is only legible on a light background

#### Scenario: The mode is switched without a page load

- **WHEN** the active mode changes while runtime-rendered content is on screen
- **THEN** that content's colors reflect the new mode

### Requirement: The browser chrome color tracks the active mode

Where the theme declares a browser chrome color, the theme SHALL make it reflect the active mode, so that the surrounding browser UI does not contradict the page.

#### Scenario: A dark page is opened as a standalone tab

- **WHEN** a page renders in dark mode and is viewed outside the site
- **THEN** the declared browser chrome color matches the page's ground

### Requirement: The mode control is delivered without a build step

The theme SHALL deliver the mode control's behavior as a static asset referenced directly by the rendered page, and SHALL NOT require a JavaScript bundler or a package manifest to do so, so that enabling the feature adds no dependency surface to the theme or its CI.

#### Scenario: The theme is built with the documented commands

- **WHEN** a site is built using the theme's documented build commands
- **THEN** the mode control works without installing any JavaScript dependencies

#### Scenario: The delivery mechanism is inspected

- **WHEN** the mode control's behavior is traced from the rendered page
- **THEN** it resolves to a static file served directly by the site
- **AND** no bundler configuration is involved

### Requirement: The vendored stylesheet is left untouched

The theme SHALL deliver all dark-mode styling through its own override layer and SHALL NOT modify the vendored stylesheet, so that the vendored file stays comparable to its published upstream artifact.

#### Scenario: A dark-mode correction is required

- **WHEN** a color needs correcting for dark mode
- **THEN** the correction is applied in the theme-owned stylesheet
- **AND** the vendored stylesheet is unchanged

#### Scenario: The vendored stylesheet is inspected

- **WHEN** a maintainer inspects the vendored stylesheet
- **THEN** it is unmodified from its published upstream version
