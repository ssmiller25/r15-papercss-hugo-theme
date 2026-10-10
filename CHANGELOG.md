# Changelog

## Unreleased

### Breaking changes

These change the markup the theme renders. Consumers who override the affected
hooks must adjust their CSS.

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

- The four defects the theme previously worked around are fixed at the source,
  so the theme no longer carries overrides for them: the collapsible toggle is
  visually hidden but focusable, the `960px` height cap is gone, `padding: none`
  is corrected, and the documented toggle markup uses `<span class="barN">`.
- The framework's fonts (Neucha and Patrick Hand SC) are self-hosted by the
  referenced stylesheet, so the theme's typography is unchanged and the page
  makes no separate font request. If you added the Google Fonts `<link>` that
  the `2.0.0` `UPGRADE.md` suggested, remove it — the fonts now load
  automatically and the link loads them twice.
- The referenced release and its integrity digest are recorded in
  `papercss.lock.json`, and `make check` verifies that `head.html` is pinned to
  them (and, when online, that the bytes still match and the fonts resolve).

### Hugo version floor

`theme.toml`'s `min_version` is now `0.131.0`. This is not a new restriction: the
theme has always required it. The previous declaration of `0.81.0` was not true —
`head.html` uses `resources.ExecuteAsTemplate`, and the templates use
`.Site.Language.Lang` and `site.Data`, all of which postdate that floor. The
theme cannot run on `0.81.0`, and the declared floor now matches the version the
theme is built and verified against.
