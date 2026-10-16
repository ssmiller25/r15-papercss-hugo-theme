# Tasks

## 1. Override-layer corrections

- [x] 1.1 Add `.toc a, .toc a:hover { border-bottom: none }` and `.toc ul { text-align: start }` to `assets/css/custom.css`, with a comment recording the framework rules they counteract (`nav a, nav a:hover { border-bottom-style: solid; border-bottom-width: 5px }` and `nav ul { text-align: center }` at `max-width: 992px`) and why the pinned release still carries them. Verify `stylelint --config-basedir "$(npm root --global)" "assets/css/**/*.css"` passes on the file.
- [x] 1.2 Verify the border correction outranks the framework rule in the built stylesheet: on a generated page with a table of contents, the computed `border-bottom-style` of a `.toc a` link is `none`, and no `!important` appears in either new rule. Verify no other declaration in the block is needed to achieve this.
- [x] 1.3 Verify the alignment correction outranks the framework rule: at a viewport below 992px, the computed `text-align` of a `.toc ul` is `start` (left), and no `!important` appears in the rule. Verify this holds without wrapping the rule in a media query.
- [x] 1.4 Verify the corrections are scoped: the computed `border-bottom-width` of a main navigation menu link (`nav .inline a`) remains `5px`, and the computed `text-align` of the main menu list (`nav .inline`) remains `center` below 992px, so the menu keeps the framework's hand-drawn underline and centered small-screen layout. Verify the selectors do not match any element outside `.toc`.

## 2. Regression guard

- [x] 2.1 Extend `scripts/check-papercss.mjs` to assert the override layer neutralizes the framework's nav-link border and the framework's menu-list centering for the table of contents, and scopes both corrections to `.toc` (not all `nav` links or lists). Verify the check passes on the corrected tree and fails when either rule is removed.
- [x] 2.2 Confirm the guard runs as part of the existing gate: verify `node scripts/check-papercss.mjs` is still invoked by `make check` and that a deliberately broken override makes the cheap script fail before the full build.

## 3. Documentation and upstream record

- [x] 3.1 Add an entry to `CHANGELOG.md` for the release that ships the fix, describing the table-of-contents underline and alignment corrections. Verify the entry is present and names the affected presentation.
- [x] 3.2 Record an upstream report for the framework's over-broad, element-scoped `nav` menu styling (`nav`, `nav a`, `nav a:hover`, `nav ul`) matching Hugo's `<nav id="TableOfContents">` landmark, referencing the pinned release. Verify a report reference exists (as the dark-mode change recorded `ssmiller25/papercss#17`), that local work does not wait on it, and that no upstream code change is made in this change.

## 4. Integration checks

- [x] 4.1 Run `make check` and verify every gate passes: example build, `scripts/check-html.mjs` against the committed baseline, `scripts/check-determinism.mjs`, `scripts/check-papercss.mjs` (including the new guard), `scripts/check-hugo-version.mjs`, `scripts/check-release.mjs`, `scripts/check-distribution.mjs`, and stylelint. Confirm the htmlvalidate baseline count is unchanged, since this change adds no markup.
- [x] 4.2 Walk each scenario in `specs/papercss-integration/spec.md` against a running example build in both light and dark modes, at both a wide viewport and a width below 992px. Verify a table-of-contents entry carries no decoration overlapping the entry below it, that the TOC stays left-aligned, and that the main navigation menu is unchanged.
- [x] 4.3 **Manual review (owner).** Run `make run-example`, open a page with a table of contents (for example a post with two or more subheadings), and review the table of contents and the main menu by hand in both light and dark modes and at both wide and narrow widths. Confirm the overlap is gone, the TOC is left-aligned, and the menu underline and small-screen centering are intact. Sign off before any commit or push.
