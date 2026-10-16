# Proposal

## Why

Hugo renders a page's table of contents inside a `<nav id="TableOfContents">` landmark. The referenced PaperCSS release styles the `nav` element and its descendants as a navigation menu control, matching by element type rather than by a menu class. The theme's table of contents is therefore styled as a menu even though it is a document landmark, not a menu.

Two framework declarations leak onto it visibly:

- `nav a, nav a:hover { border-bottom-style: solid; border-bottom-width: 5px }`, recolored dark by `nav a { border-bottom-color: var(--primary) }`. In the TOC's vertical list that 5px border sits below each link's box and overlaps the following line, so every page with a table of contents renders with dark underlines crossing the text beneath.
- `nav ul { text-align: center }` at `max-width: 992px`. Below that width the TOC's list — the framework intends this for the collapsing menu — centers every table-of-contents entry while the document body stays left-aligned.

A review of the remaining `nav`-scoped declarations found no other visible effect on the TOC: the framework's `nav { background-color: var(--main-background) }` matches the `.paper` panel the TOC sits inside, so it is invisible; `nav { display: flex }` makes the TOC's `<ul>` a shrink-to-fit flex item but is not visible while the list stays left-aligned; `nav { padding: .3rem }` adds negligible padding; and `nav { position: relative; z-index: 100 }` is benign because the theme's navbar is not fixed. These are recorded as deliberate non-goals rather than corrected.

The theme's override layer already normalizes nav-link color and `text-decoration` (`nav a:link, nav a:visited`) and disables the framework's gradient link underline (`a, a:visited { background-image: none }`), but it never clears this `border-bottom` or the menu-list centering. Since these are framework rules reaching the TOC through a landmark the theme emits, they are the theme's residue to own — and they are currently unowned.

## What Changes

- Add two rules to the theme's override layer, `assets/css/custom.css`, that remove the framework's menu-control presentation from table-of-contents content only:
  - `.toc a, .toc a:hover { border-bottom: none }` — removes the menu-control underline.
  - `.toc ul { text-align: start }` — removes the menu-list centering below 992px.
- Leave every other `nav` link and list untouched: the main navigation menu keeps the framework's hand-drawn underline and its centered small-screen layout.
- Record the corrections' rationale in the stylesheet — the framework rules they counteract and why the pinned release still carries the behavior — per the theme's existing local-correction convention, and file an upstream report.
- Add a regression check so the corrections are verified in `make check` rather than left to manual inspection.

Non-goals: no change to the framework release (it stays referenced unmodified) and no upstream code change at this time; no change to TOC markup or to `toc.html`; no restyling of the framework's hand-drawn list markers (`ul li:before`); and no correction of the `nav`-scoped declarations found to have no visible effect on the TOC (`background-color`, `display: flex`, `padding`, `z-index`).

## Capabilities

### New Capabilities
None. This change is an override-layer correction of framework presentation, which an existing capability already governs.

### Modified Capabilities
- `papercss-integration`: adds a requirement that the theme's override layer excludes theme-emitted navigation landmarks — the generated table of contents — from framework presentation intended for navigation menu controls, and records the corrections and their upstream report. No existing requirement's behavior changes; this codifies how the override layer handles a landmark that is not a menu.

## Impact

- `assets/css/custom.css` — the two corrections and their rationale comment. This file is covered by `stylelint` in `make check` and by `template-architecture`/`papercss-integration`'s override-layer rules.
- `openspec/specs/papercss-integration/spec.md` — one added requirement (via the change's delta spec).
- `CHANGELOG.md` — an entry for the release that ships the fix.
- `scripts/check-papercss.mjs` — gains the regression guard for both corrections. `.htmlvalidate-baseline.json` is unaffected; this changes CSS only, adding no markup and no htmlvalidate error.
- The referenced PaperCSS release — **not modified**. It is consumed unmodified by reference, and `scripts/check-papercss.mjs` continues to enforce the pinned tag and digest.
