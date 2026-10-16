# Spec Delta

## ADDED Requirements

### Requirement: Framework menu-control styling does not leak onto the table of contents

The theme's override layer SHALL exclude the generated table of contents from framework presentation intended for navigation menu controls, so that table-of-contents content is not rendered with a menu-control affordance — the framework's hand-drawn underline — nor laid out as a menu — the framework's centered list alignment.

#### Scenario: A page with a table of contents renders

- **WHEN** a page renders a table of contents
- **THEN** its entries are not drawn with the framework's navigation menu-control underline
- **AND** no entry's decoration overlaps the text of the entry below it
- **AND** its list is not centered by the framework's menu-list alignment
- **AND** the main navigation menu keeps the framework's menu-control presentation unchanged

#### Scenario: A page with a table of contents renders at a narrow width

- **WHEN** a page with a table of contents renders at a width below the framework's menu-collapse breakpoint
- **THEN** its entries stay left-aligned with the document body
- **AND** the main navigation menu is centered as the framework intends for a collapsing menu

#### Scenario: The corrections are inspected

- **WHEN** the override layer is inspected
- **THEN** it contains the table-of-contents corrections
- **AND** each correction's rationale identifies the framework rule it counteracts
- **AND** the corrections are scoped so they do not alter non-table-of-contents navigation links or lists
