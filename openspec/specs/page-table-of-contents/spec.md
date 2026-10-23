# page-table-of-contents Specification

## Purpose

Defines when the theme renders a table of contents, which setting owns the
default, how a page overrides it, and the guarantee that a page with nothing to
list renders no landmark at all rather than a heading over an empty box.

## Requirements

### Requirement: A table of contents renders only when it has entries

The theme SHALL render a table of contents only when the page's content has
headings for it to list. A page with no listable headings SHALL render no
table-of-contents box and no table-of-contents landmark.

#### Scenario: A page with no listable headings renders

- **WHEN** a page whose content has no headings is built
- **THEN** no "Table of contents" heading is emitted
- **AND** no `nav` element with the `TableOfContents` identifier is emitted

#### Scenario: A page with listable headings renders

- **WHEN** a page whose content has headings is built
- **THEN** one table-of-contents landmark is emitted
- **AND** it contains a list entry for each heading the configured heading levels include

### Requirement: A site controls the default, a page overrides it

The theme SHALL render a table of contents for a post when the site's
`params.enableToc` is true or unset, and SHALL not render one when it is false.
A page-level `toc` value SHALL take precedence over the site setting in both
directions.

#### Scenario: A site leaves the default alone

- **WHEN** a site sets no `enableToc` parameter
- **AND** a post with listable headings sets no `toc` value
- **THEN** the post renders a table of contents

#### Scenario: A site turns the default off

- **WHEN** a site sets `enableToc: false`
- **AND** a post with listable headings sets no `toc` value
- **THEN** the post renders no table of contents

#### Scenario: A post opts in on a site that turned the default off

- **WHEN** a site sets `enableToc: false`
- **AND** a post with listable headings sets `toc: true`
- **THEN** the post renders a table of contents

#### Scenario: A post opts out on a site that left the default on

- **WHEN** a site sets no `enableToc` parameter
- **AND** a post with listable headings sets `toc: false`
- **THEN** the post renders no table of contents

### Requirement: The gate rejects an empty table of contents

`make check` SHALL fail when any page the example site builds contains a
table-of-contents landmark with no entries, and SHALL fail when no built page
contains a populated one.

#### Scenario: The gate runs on a correct tree

- **WHEN** `make check` runs on the example site
- **THEN** it reports the number of populated tables of contents
- **AND** it reports zero empty ones

#### Scenario: The guard regresses

- **WHEN** the partial guards on `.TableOfContents` again
- **THEN** `make check` fails naming the pages that render an empty box

#### Scenario: The partial stops rendering

- **WHEN** the partial renders nothing at all
- **THEN** `make check` fails because no built page has a populated table of contents
