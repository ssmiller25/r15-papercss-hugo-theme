# Proposal

## Why

Two defects in how the theme decides whether to render a table of contents.

**Every short page renders an empty box.** `layouts/partials/toc.html` guards
itself with `{{ if .TableOfContents }}`, but Hugo returns a non-empty
`<nav id="TableOfContents"></nav>` element for a page with no headings to list.
A non-empty string is truthy, so the guard always passes: the partial emits a
"Table of contents" heading followed by an empty landmark. A consuming site
reported it on every post that has no `<h2>`s — 32 of 34 posts on the blog this
theme serves. The behavior also contradicts the README, which promises a table
of contents only for posts with two or more subheadings.

**A consuming site cannot choose the default.** The only control is per-page
`toc: false`, so a site that wants tables of contents on long posts only must
write the flag into every post, and every new post silently gets one. Two
consuming sites want different defaults: the blog wants them off by default,
the recipe site has 94 pages whose headings genuinely benefit from one.

## What Changes

- Add an `enableToc` site parameter, **on by default**, so no existing site
  changes behavior. `params.enableToc: false` turns the table of contents off
  for every post; a page opts back in with `toc: true`.
- Keep the per-page `toc` flag as the final word in both directions, so
  `toc: false` still suppresses one post on a site that leaves the default on.
- Guard the partial on the rendered list rather than on `.TableOfContents`, so
  a page with nothing to list renders no box at all.
- Add `scripts/check-toc.mjs` to `make check`: no built page may contain a
  table-of-contents landmark without entries, and at least one built page must
  contain a populated one so a partial that stopped rendering cannot pass.
- Document the parameter and the corrected behavior in the README, record both
  changes in `CHANGELOG.md`, and describe them in `UPGRADE.md`.

Non-goals: no change to the table of contents markup, styling, or heading-level
configuration; no change to the default for existing sites; no per-page
"automatic" mode based on word count or heading count — an author opts in
explicitly.

## Capabilities

### New Capabilities

- `page-table-of-contents`: When a page renders a table of contents, what a
  site and a page each control about it, and the requirement that a page with
  nothing to list renders no empty landmark.

### Modified Capabilities

None. `papercss-integration` governs how the table of contents is *styled*, and
`document-semantics` governs the heading outline; neither changes here.

## Impact

- `layouts/post/single.html` — resolves the site and page settings.
- `layouts/partials/toc.html` — guards on list entries.
- `scripts/check-toc.mjs`, `Makefile` — the new gate and its wiring.
- `README.md`, `CHANGELOG.md`, `UPGRADE.md` — parameter, release note, and
  consumer-facing before/after.
