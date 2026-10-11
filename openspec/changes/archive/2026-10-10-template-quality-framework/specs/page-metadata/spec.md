# Spec Delta

## Purpose

Defines what the theme places in the document head so that pages are correctly identified, discoverable by feed readers, and previewable when shared.

## ADDED Requirements

### Requirement: Every page declares a title

Each generated page SHALL expose a non-empty document title that distinguishes the page within the site.

#### Scenario: A content page renders

- **WHEN** a page other than the site root is rendered
- **THEN** its title identifies that page
- **AND** the site title appears alongside it as a separator

#### Scenario: The site root renders

- **WHEN** the site root page is rendered
- **THEN** its title is the site title without a redundant separator

### Requirement: Every page declares a description

Each generated page SHALL expose a plain-text description, falling back to the page's own title when no summary is available.

#### Scenario: A page has a summary

- **WHEN** a rendered page has derived summary content
- **THEN** the description carries that content with markup removed

#### Scenario: A page has no summary

- **WHEN** a rendered page has no summary content
- **THEN** the description falls back to the page title

#### Scenario: The site root renders

- **WHEN** the site root page is rendered
- **THEN** the description comes from the site's configured homepage description

### Requirement: Every page declares its canonical address

Each generated page SHALL expose an absolute canonical address that identifies the page independent of the address used to reach it.

#### Scenario: A page is reached through an alternate address

- **WHEN** a page is served from an address that differs from its permanent address
- **THEN** the canonical address still names the permanent location

### Requirement: Feed discovery is advertised

Where the site publishes a syndication feed, every generated page SHALL advertise that feed so aggregators can discover it without following a site navigation link.

#### Scenario: A feed is published

- **WHEN** the site publishes a syndication feed
- **THEN** every page advertises the feed and its format
- **AND** the advertisement is present on the site root as well as on inner pages

### Requirement: Share previews are described

Where the site has been configured with a sharing image and site identity, every page SHALL expose the metadata that link-preview consumers read.

#### Scenario: A page is shared

- **WHEN** the rendered page is shared to a service that renders link previews
- **THEN** the preview has a title, a description, and a type
- **AND** the preview shows the configured sharing image when one is set

#### Scenario: The site has no configured sharing image

- **WHEN** the site has no sharing image configured
- **THEN** the theme renders no reference to one

### Requirement: Metadata values are escaped

Metadata values SHALL be emitted escaped for the attribute context they appear in, and SHALL NOT be emitted as pre-trusted raw content.

#### Scenario: A title contains markup-significant characters

- **WHEN** a page title or description contains characters significant to the attribute context
- **THEN** the emitted attribute contains those characters in escaped form
- **AND** the value does not alter the surrounding document structure