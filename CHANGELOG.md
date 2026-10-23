# Changelog

## 1.2.0

### Added

- **An `enableToc` site parameter**, on by default. A site that wants tables of
  contents only on its long-form posts sets `params.enableToc: false` and opts
  individual posts in with `toc: true`. `toc` on a page wins over the site
  setting in both directions, so `toc: false` still suppresses a single post.
  Nothing changes for a site that sets neither.

### Fixed

- **Pages with no subheadings no longer render an empty "Table of contents"
  box.** Hugo returns a `<nav id="TableOfContents">` element for every page,
  including pages whose content has no headings for it to list, so the partial's
  truthiness test passed on every page and emitted the box with an empty
  navigation element inside it. The partial now tests the rendered list itself,
  which means the box appears only when it has entries — the behavior the README
  already described. Pages that have real tables of contents are unaffected.

## 1.1.1

### Fixed

- **The navigation menu underline no longer bleeds onto the table of
  contents.** The referenced PaperCSS release styles `nav`, `nav a`,
  `nav a:hover`, and `nav ul` as a navigation menu control by element type, so
  those rules also matched Hugo's `<nav id="TableOfContents">` landmark. The
  5px menu underline sat below each table-of-contents entry and overlapped the
  text beneath it, and below the framework's 992px breakpoint the table of
  contents was centered while the document body stayed left-aligned. The
  theme's override layer now clears the menu-control underline and restores
  default alignment for the table of contents only, leaving the main
  navigation menu's underline and centered small-screen layout unchanged. The
  over-broad framework selectors are reported upstream as
  [ssmiller25/papercss#18](https://github.com/ssmiller25/papercss/issues/18).

## 1.1.0

### Added

- **A Paper/Ink color-mode switch**, gated behind the new `enableDarkMode`
  site parameter (off by default). When enabled, two small options stacked
  vertically appear at the right of the navigation bar. With no stored choice
  the site follows the operating system's `prefers-color-scheme`; once a visitor
  chooses, that choice is remembered across visits. The options are labelled
  "Paper" (light) and "Ink" (dark) by default, overridable with
  `lightModeLabel` and `darkModeLabel`. The resolved mode is
  applied before first paint, so the page never flashes the wrong ground. The
  dark palette is PaperCSS's own; the theme corrects two reachable upstream
  defects and leaves the rest as published — see the README.

### Changed

- **The referenced PaperCSS release moves from `v2.0.1` to `v2.0.2`.** The two
  releases ship a byte-identical stylesheet and the pin's subresource-integrity
  digest is unchanged, so this is a provenance-only change with no rendered
  effect. `v2.0.2` is a development-dependency hardening patch; no documented
  breaking change applies to the theme.

## 1.0.0

### Breaking changes

These change the markup the theme renders. Consumers who override the affected
hooks must adjust their CSS; see [UPGRADE.md](UPGRADE.md) for the before/after of
each and the substitution to make.

- **Document landmarks and a footer were added.** `baseof.html` now emits a
  `<header>`, an identifiable `<main id="main-content">`, and a `<footer>`, with
  a skip link as the first focusable element.

  Before: a bare `<main>`.
  After: `<header>`, `<main id="main-content">`, and `<footer>`, plus a skip
  link. Consumer CSS that assumed there is no footer, or that targeted `main`
  without accounting for the id, needs updating.

- **Listings are marked up as lists.** Section, taxonomy, and home listings
  render a list instead of sibling section headings.

  Before: `<h2 class="post-list summary"><a href="…">…</a></h2>` per entry.
  After: `<ul class="post-list-items"><li><h2 class="post-list summary"><a
  href="…">…</a></h2>…</li></ul>`. The `post-list` and `summary` hooks are
  retained, so class-based overrides keep working; a selector that assumed the
  heading was a direct child of `main` does not.

- **Section lists paginate.** `_default/list.html` and `recipe/list.html` now
  paginate at `pagerSize`.

  Before: a section rendered every page it contained.
  After: a section with more pages than `pagerSize` (the example site uses 5)
  paginates, adding `/page/2/` and so on.

- **The navigation toggle markup changed.** The collapsible control no longer
  nests a `<label>` inside a `<button>`, and the bars are phrasing content.

  Before: `<input id="collapsible1"><button><label for="collapsible1"><div
  class="bar1"></div>…</label></button>`.
  After: `<input id="collapsible1" aria-label="Toggle navigation"><label
  for="collapsible1"><span class="bar1"></span>…</label>`.

  Consumer CSS keyed to `button > label` or to `label div` needs updating; a
  selector based on `.barN` needs no change.

- **The collapsible shortcode's identifiers are deterministic.** The id is
  derived from the shortcode's ordinal instead of a reshuffled constant seed.

  Before: `id="collapsible_<random>"`.
  After: `id="collapsible_<ordinal>"`. Consumers keying CSS to a particular
  generated id should target the `collapsible` prefix instead.

### PaperCSS 2.x

The framework moves from the vendored `v1.9.2` to the **`v2.0.1`** release of
[`ssmiller25/papercss`](https://github.com/ssmiller25/papercss), now referenced
from jsDelivr and pinned by tag and subresource-integrity digest rather than
vendored. The framework's own
[`UPGRADE.md`](https://github.com/ssmiller25/papercss/blob/main/UPGRADE.md)
is the canonical before/after for each framework change; the theme-specific
consequences are:

### Hugo version floor

`theme.toml`'s `min_version` is now `0.131.0`. This is not a new restriction: the
theme has always required it. The previous declaration of `0.81.0` was not true —
`head.html` uses `resources.ExecuteAsTemplate`, and the templates use
`.Site.Language.Lang` and `site.Data`, all of which postdate that floor. The
theme cannot run on `0.81.0`, and the declared floor now matches the version the
theme is built and verified against.
