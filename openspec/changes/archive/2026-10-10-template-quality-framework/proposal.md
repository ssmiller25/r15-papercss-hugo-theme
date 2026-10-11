# Proposal

## Why

This theme's quality gates do not run, and have never run. Every check on this repository is red, which is why "the build passes" was never a claim it could make.

`.github/workflows/web-lint.yml` runs `htmlhint layouts/**/*.html`. Those files are Go templates, not HTML, so every error htmlhint reports is a false positive — the canonical one being "Doctype must be declared before any non-comment content", pointed at `{{ define "main" }}` — while the **1304 real markup violations across the site's 24 rendered pages** go entirely unexamined. `.github/workflows/codeql.yml` asks CodeQL for `html`, which is not a language CodeQL has, so the job aborts during `init` without analyzing a line of code. The stylelint step sits downstream of the failing htmlhint step, so it has never executed either, and would not have passed as written: it linted the vendored framework stylesheet this change requires to leave untouched, and stylelint cannot resolve a shareable config from a global install without being told where to look.

Fixing the gates is the reason this change exists, and it is unaffected by anything below.

**The framework was a dead end, and no longer is.** `static/css/paper.css` is byte-identical to the published `v1.9.2` (2023-05-29), which was simultaneously the newest tag, the current npm `latest`, and the current `master` CSS state, with no CSS change upstream in over three years. Fixes were technically possible — the repository was not archived — but they did not land: PR #311, a clean, mergeable, DCO-signed fix for the height clip this audit found, sat unmerged from 2026-09-02, its issue #272 from 2022-03-23, and four Dependabot branches carrying known-CVE bumps from early 2023.

That audit concluded every framework bug was permanently ours to own, and on that basis this change was going to carry four override-layer corrections indefinitely. PaperCSS is now maintained as 2.x in a copy at [`ssmiller25/papercss`](https://github.com/ssmiller25/papercss), and the four defects are fixed there. **The release exists: `v2.0.1`, published 2026-10-10** (a patch on `v2.0.0`), carrying a build-provenance attestation, an immutable release, and a signed tag. `2.0.1` restores the framework's typography by shipping its own self-hosted fonts, so the theme keeps its intended look with no third-party request. So the theme's PaperCSS work is an **adoption** — reference the published `v2.0.1` stylesheet, pinned by tag and integrity digest, drop the overrides it makes unnecessary, and keep the override layer only as a documented fallback for the residue 2.0 does not fix — rather than four permanent local corrections. Group 6 is no longer gated.

So quality cannot be delegated to CI defaults, and framework quality is no longer something this theme has to delegate at all. This change establishes the layer contracts, HTML/Hugo best practices, and verification gates that let the theme be maintained deliberately for as long as it is published.

## What Changes

**Verification gates (the highest-leverage item)**
- Build `exampleSite` in CI and lint the **generated HTML output**, not the Go templates. Replace `htmlhint` with `html-validate`.
- Establish a measured baseline and ratchet it per-rule to zero; CI fails on regression, and lowering a baseline is a deliberate act rather than a side effect of a green run. Measured at **1304 errors across the 24 theme-rendered pages**, now **454** after the whitespace cleanup.
- Clear the template whitespace that made up 82% of that baseline. A line that is only whitespace plus a non-emitting action renders as a whitespace-only line, so those lines move to column 0; lines whose action emits output, or that carry a chomping marker, keep their indentation, because there the whitespace is a prefix on rendered content rather than the line's own.
- Pin all lint tool versions (currently `npm install -g htmlhint stylelint` with no pins, so CI results drift over time).
- Scope the CSS gate to the theme's own stylesheet. The framework stylesheet is referenced, not vendored, so its ~980 violations are upstream's to fix, not ours.
- Stop the gate from reading stale output: Hugo leaves a generated page in place when its template stops generating one, so the build now cleans its destination.
- Add a deterministic-output check to catch non-deterministic template constructs.
- Make the whole sequence reachable from one command, so the local gate and CI cannot drift apart.

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

**PaperCSS 2.0 integration**
- Reference the framework stylesheet from the published `v2.0.1` release of [`ssmiller25/papercss`](https://github.com/ssmiller25/papercss) through jsDelivr, pinned to the immutable tag and by a subresource-integrity digest, recording the version, URL, and digest so drift is detectable and the served bytes are verifiable.
- Drop the override-layer corrections 2.0 makes unnecessary. The four defects this audit surfaced are fixed at source: the collapsible toggle is visually hidden but focusable, the `960px` height cap is gone, `padding: none` is corrected, and the documented toggle markup uses `<span class="barN">`.
- Change the theme's own toggle markup from `<div class="barN">` to `<span class="barN">`, honoring upstream's `input[id^=collapsible]` contract. This is the one defect that stays theme work: the framework styles `.barN` by class, so 2.0 changing its documentation does not change what the theme renders.
- Adopt the framework's bundled fonts. `2.0.0` dropped the Google Fonts `@import`; `2.0.1` restores the typography as self-hosted `@font-face` rules served from the framework's own release. The theme references the pinned stylesheet, whose relative font addresses resolve to the tagged release on the same origin, so the look is preserved with no Google `<link>` — adding one would load the fonts twice.
- Deliver `assets/css/custom.css` minified and fingerprinted, so consumers' browsers do not cache the residue indefinitely.
- Record whatever 2.0 does not fix as remaining theme-owned — expected to be small — each documented in the override layer with an upstream report.

**Documentation**
- Fix `README.md`, which documents a `make generate-commits` target that does not exist in the `Makefile`.

## Capabilities

### New Capabilities

- `template-architecture`: Layer contracts governing which layer owns which markup — `baseof.html` owns the document, partials own all reusable markup, layouts stay thin and declare only what differs from `_default`. Covers the prohibition on duplicated and dead partials.
- `document-semantics`: Structural and accessible HTML output — landmark elements, skip link, heading hierarchy, list semantics, form control labeling, image alternatives, and deterministic DOM identifiers.
- `page-metadata`: Document head correctness — title composition, description, canonical URL, RSS alternate discovery, and social preview metadata.
- `shortcode-contract`: The uniform authoring contract for theme shortcodes — named parameters, explicit validation failures, accessible images, and no inline styles.
- `papercss-integration`: The PaperCSS relationship against [`ssmiller25/papercss`](https://github.com/ssmiller25/papercss) — the pinned, integrity-checked release reference, adoption of published fixes in preference to local overrides, override-layer precedence, the `input[id^=collapsible]` contract the theme must honor, and local ownership of whatever residue upstream does not fix.
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
- `static/css/paper.css` — removed; the pinned framework stylesheet is referenced instead

**Tooling and CI**
- `.github/workflows/web-lint.yml` — rewritten to run the single `make check` gate, which builds, validates output, and lints CSS
- `.github/workflows/codeql.yml` — removed; GitHub's default CodeQL setup (actions, javascript-typescript, python) already scans this repository, and an advanced configuration cannot upload while default setup is enabled
- `.devcontainer/Dockerfile` — `htmlhint` removed, `html-validate` added, all three linters pinned to exact versions
- New `.htmlvalidate.json` (rule set) and `.htmlvalidate-baseline.json` (recorded baseline), plus `scripts/check-html.mjs`, which drives `html-validate`, scopes validation to theme-rendered pages, and enforces the per-rule ratchet
- `Makefile` — `check` and `check-update-baseline` targets; `build-example` now cleans its destination; the missing `generate-commits` target
- `assets/css/custom.css` — four stylelint violations cleared, with one documented rule exception
- `theme.toml` — corrected `min_version`

**Dependencies**
- Adds `html-validate` (replacing `htmlhint`) and pins `stylelint`/`stylelint-config-standard` to exact versions.
- No runtime dependency changes beyond the pinned stylesheet reference. PaperCSS is loaded from the immutable `v2.0.1` release of [`ssmiller25/papercss`](https://github.com/ssmiller25/papercss) through jsDelivr, pinned by tag and verified by a subresource-integrity digest recorded in `papercss.lock.json`. **The theme does not fork or patch it**; every theme-side correction lives in the override layer.

**Compatibility**
- Five **BREAKING** changes are listed above, all in rendered markup structure or page composition rather than configuration. Consumers overriding `.post-list`, keying CSS to the nav's `<button><label>` nesting, or relying on the random collapsible id will need adjustment.
- Adopting PaperCSS 2.0 is itself a compatibility event for consumers, and `2.0.1` has already retired the sharpest edge of it. The framework defects that forced an override layer are fixed at source, so a consumer who also worked around them has corrections to remove. `2.0.0` dropped the Google Fonts `@import`, but `2.0.1` restores the fonts as self-hosted files shipped with the framework, so the typography is preserved with no third-party request and no consumer action. A consumer who added the Google `<link>` that the `2.0.0` `UPGRADE.md` suggested should remove it, because the fonts load twice otherwise. The changelog entry for the upgrade must state all of this — see task 6.12 — and the framework's own `UPGRADE.md` gives the before/after for every breaking change.
- `theme.toml`'s `min_version` will rise to match the devcontainer's pinned Hugo. Consumers on the currently-declared but non-functional 0.81.0 floor will be affected — that floor does not reflect what the theme has ever actually run on.