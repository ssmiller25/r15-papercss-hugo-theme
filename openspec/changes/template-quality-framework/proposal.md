# Proposal

## Why

This theme has quality gates that cannot fail. `.github/workflows/web-lint.yml` runs `htmlhint layouts/**/*.html` — but `layouts/**/*.html` files are Go templates, not HTML, so htmlhint's default ruleset reports zero errors across 33 built pages that in fact contain 40 HTML validity violations, 549 whitespace defects, and a cross-site-scripting sink. Two compounding facts make this unfixable by waiting:

1. **Upstream PaperCSS is frozen.** `static/css/paper.css` is byte-identical to the published `v1.9.2` (2023-05-29), which is simultaneously the newest tag, the current npm `latest`, and the current `master` CSS state. There has been no CSS change upstream in over three years. Every framework bug is now permanently ours to own.
2. **Upstream fixes do not land.** PR #311 — a clean, mergeable, DCO-signed fix for the `max-height: 960px` clip this audit found — has sat unmerged since 2026-09-02. Its issue, #272, has been open since 2022-03-23. Four Dependabot branches carrying known-CVE dependency bumps have been unmerged since early 2023.

So quality cannot be delegated upstream or to CI defaults. This change establishes the layer contracts, HTML/Hugo best practices, and verification gates that let this theme be maintained deliberately for as long as it is published.

## What Changes

**Verification gates (the highest-leverage item)**
- Build `exampleSite` in CI and lint the **generated HTML output**, not the Go templates. Replace `htmlhint` with `html-validate`.
- Establish a measured baseline and ratchet it to zero; CI fails on regression.
- Pin all lint tool versions (currently `npm install -g htmlhint stylelint` with no pins, so CI results drift over time).
- Fix the broken glob: in `bash` without `globstar`, `layouts/**/*.html` silently skips `layouts/index.html` and `layouts/404.html`.
- Add a deterministic-output check to catch non-deterministic template constructs.

**Document structure and semantics**
- `baseof.html` becomes the sole owner of the document: adds `<header>`, `<footer>`, a skip link, and an identifiable `<main>` landmark. **BREAKING** for consumers whose custom CSS assumed no footer or relied on the current `<main>`.
- Replace the regex-based `partials/toc.html` scraper with Hugo's built-in `.TableOfContents`, which also restores `h3`–`h6` support that the current scraper silently drops.
- **BREAKING**: list pages stop rendering every item as `<h2 class="post-list">`. Adopt `<ul><li><h2><a>` so a page's heading outline is meaningful. The `post-list` and `summary` classes are retained so existing consumer overrides keep working.
- Section lists (`_default/list.html`, `recipe/list.html`) gain pagination. **BREAKING**: a section with more pages than `pagerSize` now paginates instead of rendering every page.
- Add `<label>` to the search input, `alt`/`width`/`height` to shortcode-generated images, and RSS/canonical/Open Graph metadata to the document head.

**Hugo template design**
- Partials become the only place reusable markup exists. Collapse the four hand-rolled copies of the post-list markup and delete the dead `layouts/partials/post-list.html`.
- Replace `{{ template "partials/pagination.html" . }}` with `{{ partial }}`.
- Make output deterministic: `shortcodes/collapsible.html` currently derives its DOM id from `shuffle(split(md5 "yolo"))`, a constant seed reshuffled per invocation, so every build emits different HTML. **BREAKING** for the id format only.
- Populate the empty `layouts/404.html` (currently 0 bytes, so all 404s render an empty page).
- Standardize shortcodes on one contract: named parameters, `errorf` on invalid input, no `style=` attributes.
- Reconcile the declared Hugo floor: `theme.toml` claims `min_version = "0.81.0"` while `.devcontainer/Dockerfile` pins `0.131.0` and `head.html` uses `resources.ExecuteAsTemplate`, which postdates the declared floor. CI fails when the two drift.

**Security**
- Close the XSS sink at `layouts/index.html`: commit `subject`/`body` are interpolated into an `innerHTML` template literal. A commit message containing markup executes. This theme is published for public consumption and `exampleSite/config.yaml` enables `goldmark.renderer.unsafe`.

**PaperCSS integration**
- Treat `assets/css/custom.css` as the permanent override layer rather than a cosmetic scratchpad, and give it minification and fingerprinting so consumers' browsers do not cache fixes indefinitely.
- Record the vendored PaperCSS version explicitly.
- Fix, locally, the PaperCSS defects this audit surfaced, honoring upstream's `input[id^=collapsible]` contract:
  - `.collapsible > input { display: none }` removes the toggle from the tab order entirely, so the mobile nav is unreachable by keyboard. Affects both the nav and the `collapsible` shortcode.
  - `.bar1/.bar2/.bar3` are `<div>` elements, which HTML forbids inside `<label>`; they are styleable as `<span>`.
  - `nav div.collapsible-body { padding: none }` — `none` is not a valid `padding` value.
  - `max-height: 960px` clips tall collapsible bodies (tracked upstream as #272, unfixed).
- Open upstream issues for signpost value, but do not block on them.

**Documentation**
- Fix `README.md`, which documents a `make generate-commits` target that does not exist in the `Makefile`.

## Capabilities

### New Capabilities

- `template-architecture`: Layer contracts governing which layer owns which markup — `baseof.html` owns the document, partials own all reusable markup, layouts stay thin and declare only what differs from `_default`. Covers the prohibition on duplicated and dead partials.
- `document-semantics`: Structural and accessible HTML output — landmark elements, skip link, heading hierarchy, list semantics, form control labeling, image alternatives, and deterministic DOM identifiers.
- `page-metadata`: Document head correctness — title composition, description, canonical URL, RSS alternate discovery, and social preview metadata.
- `shortcode-contract`: The uniform authoring contract for theme shortcodes — named parameters, explicit validation failures, accessible images, and no inline styles.
- `papercss-integration`: The vendored PaperCSS relationship — version pinning, override-layer precedence, the `input[id^=collapsible]` contract the theme must honor, and local ownership of upstream defects.
- `build-verification`: The quality gates — building the example site and asserting on generated output rather than templates, tool version pinning, error-budget ratcheting, and non-deterministic-output detection.

### Modified Capabilities

None. This project has no existing specs; `openspec list --specs` is empty.

## Impact

**Affected code**
- `layouts/_default/baseof.html` — document skeleton, landmarks, skip link, footer, script loading
- `layouts/_default/{single,list,terms}.html`, `layouts/post/single.html`, `layouts/recipe/{list,single}.html`, `layouts/index.html`, `layouts/404.html`
- `layouts/partials/` — `head.html`, `nav.html`, `toc.html`, `pagination.html`, `searchbox.html`, `post-list.html`; new `footer.html`, `head/meta.html`, `page-list.html`
- `layouts/shortcodes/` — all seven, most acutely `collapsible.html` and `card.html`
- `assets/css/custom.css` — becomes the PaperCSS override layer
- `static/css/paper.css` — vendored, unchanged in content

**Tooling and CI**
- `.github/workflows/web-lint.yml` — rewritten to build then lint output
- `.devcontainer/Dockerfile` — pinned tool versions
- New `.htmlvalidate.json`, `.markdownlint.json`
- `Makefile` — a `check` target; the missing `generate-commits` target
- `theme.toml` — corrected `min_version`

**Dependencies**
- Adds `html-validate` (replacing `htmlhint`), `markdownlint-cli2`, and pinned `stylelint`/`stylelint-config-standard`.
- No runtime dependency changes. PaperCSS remains vendored at v1.9.2; **no fork is created.**

**Compatibility**
- Five **BREAKING** changes are listed above, all in rendered markup structure or page composition rather than configuration. Consumers overriding `.post-list`, keying CSS to the nav's `<button><label>` nesting, or relying on the random collapsible id will need adjustment.
- `theme.toml`'s `min_version` will rise to match the devcontainer's pinned Hugo. Consumers on the currently-declared but non-functional 0.81.0 floor will be affected — that floor does not reflect what the theme has ever actually run on.