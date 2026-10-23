# Tasks

## 1. Rendering corrections

- [x] 1.1 Change `layouts/partials/toc.html` to guard on the rendered list rather than on `.TableOfContents`, recording in a comment why the truthiness test was wrong (Hugo emits a non-empty `<nav>` for pages with no headings). Verify a page with headings still emits one populated landmark.
- [x] 1.2 Change `layouts/post/single.html` to resolve `params.enableToc` (default on) and let a page-level `toc` value win in both directions, using `isset` rather than `default` because Hugo's `default` treats `false` as empty. Verify all four combinations of site setting and page setting.
- [x] 1.3 Verify the guard is based on list entries and not on heading markup: a page whose only headings are outside the configured table-of-contents levels renders no box.

## 2. Regression gate

- [x] 2.1 Add `scripts/check-toc.mjs`, which fails on any built page with a table-of-contents landmark containing no list entries and on a build where no page renders a populated one.
- [x] 2.2 Wire the script into the `check` target of the `Makefile` and update that target's help text.
- [x] 2.3 Verify the gate fails when 1.1 is reverted to the truthiness guard, and fails when the partial is made to render nothing.

## 3. Documentation and version

- [x] 3.1 Rewrite the README's table-of-contents section as "Table of contents on a blog post", documenting `params.enableToc` and the per-page override, and update the version named in its install examples to the release that ships this change.
- [x] 3.2 Add a `1.2.0` section to `CHANGELOG.md` covering the parameter and the empty-box fix.
- [x] 3.3 Add a `1.2.0` section to `UPGRADE.md` recording both behavior changes and stating that neither is breaking.
- [x] 3.4 Confirm `node scripts/check-release.mjs --tag v1.2.0` passes once the changelog and README agree.

## 4. Integration checks

- [x] 4.1 Run `make check` and confirm every gate passes: example build, HTML baseline, determinism, PaperCSS pin, Hugo floor, release identity, distribution, the new table-of-contents gate, and stylelint. Confirm the HTML error baseline is unchanged or lower; if lower, record why before updating it.
- [x] 4.2 Walk each scenario in `specs/page-table-of-contents/spec.md` against a running example build.
- [x] 4.3 **Manual review (owner).** Run `make run-example` and confirm by hand that a short post has no table of contents, a post with headings does, and the site parameter and page flag behave as documented. Sign off before any commit or push.
