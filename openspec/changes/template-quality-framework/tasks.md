# Tasks

## 1. Verification Foundation

*Capability: `build-verification`. No rendered output changes in this group; it makes the gate capable of failing. This group must land before any group that changes markup, so that each later group is measured against a working baseline.*

*Landed. Both workflows were red on every run since they were committed; they are now green, and the measured baseline is recorded. Three tasks were added during implementation for defects found while getting the pipeline to run: 1.8–1.10.*

- [x] 1.1 Add a `build-example` prerequisite to the lint workflow so verification builds the site before validating, and verify the workflow step order is build-then-validate
- [x] 1.2 Replace `htmlhint` with `html-validate` in `.devcontainer/Dockerfile` at a pinned version, and verify `html-validate --version` reports the pinned version inside the container
- [x] 1.3 Pin `stylelint` and `stylelint-config-standard` to exact versions in the Dockerfile, and verify no unpinned version range remains in the provisioning definition
- [x] 1.4 Create `.htmlvalidate.json` declaring the enforced rule set, scoping validation to theme-rendered pages and excluding Hugo's built-in alias output, and verify the exclusion is recorded as a documented exception rather than a bare rule toggle
- [x] 1.5 Record the measured baseline in the repository, and verify a deliberately introduced violation fails CI while an unmodified build passes
- [x] 1.6 Replace the `layouts/**/*.html` glob with explicit discovery of generated pages so root-level pages are included, and verify the count of validated files equals the count of generated pages
- [x] 1.7 Add a `check` target to the `Makefile` invoking the same gate sequence as CI, and verify it appears in `make help` and runs the identical commands
- [x] 1.8 Fix `codeql.yml`, which requested `languages: html, javascript` and so aborted in `init` with "Did not recognize the following languages: html" on every run, and verify the job reaches the analysis step
- [x] 1.9 Scope the CSS gate to the theme's own stylesheet and clear the resulting violations in `assets/css/custom.css`, including one `no-descending-specificity` that no source order can satisfy and that is resolved with a documented rule exception rather than a reorder
- [x] 1.10 Make the build clean its destination (`--cleanDestinationDir`) so the gate cannot validate output left behind by a previous build

**Baseline as first recorded: 1304 errors across 24 theme-rendered pages** — `no-trailing-whitespace` 1068, `element-permitted-content` 96, `no-inline-style` 81, `no-implicit-button-type` 24, `text-content` 24, `aria-label-misuse` 6, `valid-id` 2, `form-dup-name` 1, `wcag/h30` 1, `wcag/h37` 1. This superseded the 629-across-33 figure previously recorded here, which had never been measured against a built site. Hugo generates 33 HTML files; the 9 not counted are its alias template, which accounts for all 9 `element-required-content` errors and is not theme-authored. **Now 454 — see group 2.**

Two corrections to earlier assumptions in this change, both from measurement. There is no `alt-require` rule in `html-validate` 11.x — it was replaced by `wcag/h37`, which is what the single missing-`alt` defect in `card.html` is actually reported as (see 4.6). And the baseline is measured against a build that is *not* byte-reproducible, because of the `collapsible` id defect in 5.1; repeated clean builds report an identical count, so the ratchet is insensitive to it, but that is a property of the current rule mix rather than a guarantee.

## 2. Mechanical Whitespace Cleanup

*Capability: `build-verification`. Clears the 1068 whitespace errors that made up 82% of the baseline, so later gate output is readable. **Landed.***

- [x] 2.1 Strip template-internal whitespace that leaks into rendered output across all 23 templates, and verify the theme's contribution to `no-trailing-whitespace` drops to zero
- [x] 2.2 Correct the `</div>` indentation mismatch in `layouts/_default/baseof.html` where the closing tag is outdented from its opener, and verify the rendered document's indentation is consistent
- [x] 2.3 Tighten the recorded baseline to the reduced count in this same change, and verify CI fails on any subsequent increase
- [x] 2.4 Decide what to do about the 218 whitespace errors the theme's templates do not own, and record the decision rather than letting them sit unexplained in the baseline

**What 2.1 actually was.** Not 1068 hand edits. Two causes, and only one of them is literal trailing whitespace in a template:

- *Standalone action lines.* A line that is only whitespace plus a template action emits `"\n"` plus that whitespace. When the action writes nothing to the output stream — control flow, variable assignment, a comment — the result is a whitespace-only line in the rendered page. 53 such lines across 19 templates. Each was moved to column 0, which turns the rendered line into an empty one. An empty line is not a violation.
- *Chomping-sensitive lines.* Two kinds of line had to keep their indentation, because there the whitespace is not the line's own and dedenting it changes the rendered output. An action that *emits* output carries the indent as a prefix on what it renders, so dedenting left-shifts every line of a post title or a paragraph. And an action carrying a chomping marker behaves differently again: a trailing `-}}` eats the newline that follows, so the indent lands on the *next* line as its prefix, while a leading `{{-` eats its own indent before emitting anything. `partials/pagination.html` is written entirely in this style. A first attempt that dedented by indentation alone passed a naive diff and silently stripped the indentation from post titles, the nav, `<head>`, and every pagination control; it was caught by classifying the rendered diff rather than by reading it.
- *Literal trailing whitespace.* 29 lines across 5 templates, plus one HTML comment in `searchbox.html` that Go's `html/template` strips while leaving its newline behind — so the caller's indentation landed on a line of its own. Converted to a template comment with opening chomping, so the caller's indent lands on the `<div>` as intended.

Every rendered change was verified to be whitespace-only, by diffing the full built site before and after and classifying each differing line. The only content-level differences were the known non-deterministic `collapsible` ids (5.1) and the badge lines whose literal trailing space was stripped.

**2.4, the residual 218.** The theme's templates now contribute **zero** whitespace errors. All 218 belong to something else, and the split is not even:

| Count | Source |
|---|---|
| 144 | Hugo's internal `_internal/google_analytics.html` — 6 whitespace-only lines on every page. Verified by removing the call: the lines disappear. |
| 74 | `exampleSite/content/post/creating-a-new-theme.md` — trailing spaces inside fenced code blocks showing Hugo console output (`0 draft content `), rendered verbatim as page content. |

The GA figure is 64% of the residual and deserves a decision rather than a baseline entry. `exampleSite/config.yaml` sets `googleAnalytics: UA-123456789-1`, Hugo 0.131 warns on **every build** that Universal Analytics was replaced by GA4, and the internal template emits **no script tag at all** — only whitespace. So the theme's analytics integration is already non-functional, and 144 of the gate's remaining errors are the corpse of it. Replacing the internal-template call with a GA4 `gtag` snippet is the real fix, and it is a **breaking change**: `UA-…` and `G-…` identifiers are not interchangeable, so consumers would have to replace `googleAnalytics` with `site.Config.Services.GoogleAnalytics.ID` in their site config. That belongs in the breaking-change list in the proposal, not in a whitespace cleanup, so it is raised as an open question rather than taken here.

The content figure is the 10.6 problem in its sharpest form: the gate cannot tell a theme defect from a trailing space in a code sample the theme does not own.

**Baseline after 2.3: 454** — `no-trailing-whitespace` 218, `element-permitted-content` 96, `no-inline-style` 81, `no-implicit-button-type` 24, `text-content` 24, `aria-label-misuse` 6, `valid-id` 2, `form-dup-name` 1, `wcag/h30` 1, `wcag/h37` 1.

## 3. Document Structure and Markup Consolidation

*Capability: `template-architecture`. **Contains breaking changes** — see proposal.*

- [ ] 3.1 Add `header`, `footer`, and an identifiable `main` region to `layouts/_default/baseof.html`, with `partials/footer.html` as the footer's home, and verify landmarks are present in `html-validate` output
- [ ] 3.2 Add a skip link as the first focusable element in `baseof.html` targeting the main region, and verify it is the first tab stop and reveals itself on focus
- [ ] 3.3 Introduce `partials/page-list.html` as the single home for listing markup, accepting page source, sort order, and summary-visibility as parameters, and verify all four call sites render through it
- [ ] 3.4 Replace the four hand-rolled listing implementations (`_default/list.html`, `recipe/list.html`, `index.html`, `partials/post-list.html`) with calls to `page-list.html`, and verify no page template retains its own copy of the markup
- [ ] 3.5 Delete the now-unreachable `layouts/partials/post-list.html`, and verify an enumeration of partials finds every remaining one transitively reachable from a page template
- [ ] 3.6 Convert the `{{ template "partials/pagination.html" . }}` call in `index.html` to the partial invocation mechanism, and verify no deprecated template invocation remains
- [ ] 3.7 Add pagination to `_default/list.html` and `recipe/list.html`, and verify a section exceeding `pagerSize` paginates instead of rendering every page
- [ ] 3.8 Populate the empty `layouts/404.html` with a styled not-found page including a heading and navigation back into the site, and verify a request for a nonexistent path returns styled content
- [ ] 3.9 Add a check failing on any zero-byte template file, and verify it catches a deliberately emptied template

## 4. Semantics and Accessibility

*Capability: `document-semantics`.*

- [ ] 4.1 Convert listing entries from sibling section-level headings to a list containing one heading each, retaining the `post-list` and `summary` hooks, and verify a 20-entry page's section-level heading count does not grow with entry count
- [ ] 4.2 Replace the regex-based `partials/toc.html` scraper with the site's built-in table of contents, and verify subheadings below the top level now appear and that the scraper's index-out-of-range path is gone
- [ ] 4.3 Restructure the nav's collapsible control to a plain sibling `label` rather than a `label` nested inside a `button`, retaining the framework's documented hooks, and verify the `element-permitted-content` errors on that component clear while the open and closed states still work
- [ ] 4.4 Add `type` and an accessible name to the nav's activation control and to the commit listing's pagination controls, and verify the `no-implicit-button-type` and `text-content` counts drop to zero
- [ ] 4.5 Add an associated `label` to the search input in `partials/searchbox.html`, and verify the control is no longer reported as unlabeled
- [ ] 4.6 Add `alt`, `width`, and `height` to images emitted by `shortcodes/card.html`, with `alt` present-and-empty for decorative images, and verify the `wcag/h37` error clears
- [ ] 4.7 Mark the navigation entry matching the current page with `aria-current`, and verify the marking is present on the site root and on each section page
- [ ] 4.8 Add language and canonical address assertions to the gate config, and verify both are present on every generated page
- [ ] 4.9 Resolve the two `valid-id` errors on `fn:1` / `fnref:1`, which are emitted by goldmark's footnote renderer rather than by theme markup — post-process the rendered content, record them as a documented framework exception, or report upstream — and verify the `valid-id` count reaches zero or is explicitly excepted

*Measured counts for this group, from the recorded baseline: `element-permitted-content` 96 and `no-implicit-button-type` 24 and `text-content` 24 are all one nav component repeated on all 24 pages — the `<button>` with no `type` and no accessible text, containing a `<label>` (1) which contains the three `<div class="barN">` (3). So 4.3 clears 96 errors and 4.4 clears 24 of each, not the six and the handful an audit of a single page suggests. `aria-label-misuse` (6, on the six pages whose content has headings) is not covered by any task here and needs one; it comes from `partials/toc.html` and will likely resolve with 4.2.*

## 5. Deterministic Output

*Capability: `document-semantics`, `build-verification`.*

- [ ] 5.1 Replace the `shuffle`/`md5`-derived identifier in `shortcodes/collapsible.html` with a deterministic ordinal-based one that retains the framework's required `collapsible` prefix, and verify two builds of unchanged content are byte-identical
- [ ] 5.2 Verify repeated invocations of the `collapsible` shortcode on one page receive distinct identifiers, and verify each still opens independently
- [ ] 5.3 Audit all templates for other sources of per-invocation randomness or time dependence, and verify none remain
- [ ] 5.4 Add a build-determinism check to CI that builds twice and diffs the output, and verify it fails on a deliberately randomized template

## 6. PaperCSS 2.0 Integration

*Capability: `papercss-integration`. **This group is gated on an external release and must not start until it exists** — see 6.1. It replaces an earlier framing of this group as "build a permanent override layer for four framework defects", which was written on the assumption that upstream was permanently frozen. That assumption was correct when made and is now retired: the framework is being maintained as PaperCSS 2.x, and the same four defects are being fixed at their source. Building override-layer copies of fixes that are landing upstream would mean maintaining two corrections for one bug and then deleting one of them.*

*Concretely, of the four defects this group previously assumed it had to own:*

| Defect | papercss 2.x task | Theme consequence |
|---|---|---|
| `padding: none` | already corrected in the 2.x working tree | 6.3, 6.4 — override becomes unnecessary |
| collapsible input `display: none` | group 4 | 6.3, 6.4 — override becomes unnecessary |
| `max-height: 960px` clip | group 5 | 6.3, 6.4 — override becomes unnecessary |
| `<div class="barN">` in a `<label>` | group 6 (docs) | **still theme work** — see 6.6; the framework only styles `.bar*` by class, so the theme's own `nav.html` must change |

*One consequence nobody had recorded: the theme loads no webfonts of its own — `grep` for `fonts.googleapis` across `layouts/` and `exampleSite/config.yaml` returns nothing — so it inherits PaperCSS's `@import url(...)` entirely. papercss group 9 defaults that off as part of 2.0. The theme's typography will therefore change unless it opts in explicitly. See 6.7.*

- [ ] 6.1 **Gate — do not start this group until the PaperCSS 2.0 release exists.** Record the release tag, its date, and the published artifact for it; verify the theme can obtain that artifact; and record which of the four defects the release is claimed to fix. Every task below depends on this one, and none of them may be started against an unreleased or locally-built stylesheet, because the theme vendors a *published* artifact and must be able to verify it byte for byte
- [ ] 6.2 Replace `static/css/paper.css` with the 2.0 artifact and verify it is byte-identical to the published file for that tag, recording the version and a checksum so future drift is detectable
- [ ] 6.3 Audit what 2.0 actually fixed, by inspecting the new vendored stylesheet rather than trusting the release notes — confirm each of the four defects against the shipped CSS, and record any that remain
- [ ] 6.4 Remove every override that 2.0 made unnecessary, proving each removal by the absence of the offending declaration in the vendored stylesheet rather than by observing no visual difference
- [ ] 6.5 Re-run the full gate and re-measure the recorded baseline, tightening it to the reduced counts — 2.0 changes both the CSS and the documented markup, so the previous ceiling no longer describes reality
- [ ] 6.6 Change the theme's own toggle markup from `<div class="barN">` to `<span class="barN">`, and verify the bars still render identically — PaperCSS styles `.bar1/.bar2/.bar3` by class only, so this is render-neutral. Coordinate with 4.3, which restructures the same `<button>`/`<label>` nesting; do not land two overlapping edits to `layouts/partials/nav.html`
- [ ] 6.7 Adopt the font-loading change explicitly: either link PaperCSS's fonts from the theme's own markup, or record the fallback stack as the intended appearance. Leaving it implicit means shipping a silent, unrecorded visual regression
- [ ] 6.8 Add minification and content-addressed fingerprinting to the override layer in `partials/head.html`, and verify the served address changes when the layer's content changes. Unaffected by 2.0 and worth doing regardless
- [ ] 6.9 Verify cascade order places the override layer after the framework stylesheet, and verify a conflicting framework declaration is successfully overridden without specificity escalation
- [ ] 6.10 Re-examine the `no-descending-specificity` exception in `assets/css/custom.css`, whose stated justification is that the theme's nav override must out-specify the framework's own anchor colours. If 2.0 changes those colours, the exception's reasoning is stale and the rule may be enforceable again
- [ ] 6.11 Record whatever 2.0 did **not** fix as remaining theme-owned, each documented in the override layer with the framework rule it counteracts — this is the residue of the original group, and it is expected to be small or empty
- [ ] 6.12 Update the README and the changelog to state the vendored framework version, what 2.0 changed for consumers, and which theme-side markup changed as a consequence

## 7. Commit Homepage Security

*Capability: `document-semantics`. No dedicated security capability; this is a correctness requirement on generated output.*

- [ ] 7.1 Replace the `innerHTML` assignment in `layouts/index.html` with inert text-node construction, following the `textContent` pattern already used in `static/js/search.js`, and verify no HTML-string sink remains in the theme's JavaScript
- [ ] 7.2 Verify a commit whose message contains markup renders as visible text rather than executing, and verify line breaks in commit bodies still render as intended
- [ ] 7.3 Move theme-emitted inline presentation out of markup into the override layer, and verify the `no-inline-style` count falls to the number attributable to example-site content rather than to theme markup

*Correction from measurement. 7.3 previously read "move the inline presentation rules in the commit listing out of markup … verify the count drops to zero", on the assumption that the commit listing was where the inline styles were. Neither half survives contact with the built site. The commit listing is not rendered at all — `exampleSite` ships no `data/commits.json`, so `layouts/index.html` takes its `{{ else }}` fallback and none of the commit markup appears in the output. And 72 of the 81 `no-inline-style` errors are 3 per page from `partials/searchbox.html`, which ships on every page whenever `enable_search` is set; the remaining ~9 are the `card` shortcode and example-site content. So the work belongs to the searchbox partial and the shortcodes, and the target cannot be zero: `no-inline-style` also fires on inline styles authored in the example site's own markdown, which the theme does not own. The gate needs to be able to distinguish theme-emitted markup from content-authored markup before "drops to zero" is a meaningful assertion — see the note on group 10.*

## 8. Shortcode Contract

*Capability: `shortcode-contract`. **Contains a breaking change** — positional parameters become named.*

- [ ] 8.1 Convert every shortcode's inputs to named parameters, and verify reordering named inputs does not change rendered output
- [ ] 8.2 Add validation to `alert`, `background`, `badge`, `border`, `collapsible`, and `color` that fails with a message naming the offending parameter and its accepted values and identifying the content file and position, and verify an invalid invocation fails the build with that message
- [ ] 8.3 Add a resolution check to `card.html` so an unresolvable resource fails with a message naming the resource instead of raising a nil-reference failure, and verify the message
- [ ] 8.4 Remove the empty `style` attribute emitted by `card.html` and verify shortcode output carries no inline presentation
- [ ] 8.5 Verify every shortcode's rendered output appears in the bundled example content, and verify `shortcodes/card.html`'s unconditional `style=""` and unguarded resource dereference are both gone
- [ ] 8.6 Verify each shortcode's rendered result is documented and visible on the published demonstration page, and verify the delimiter style does not change output

## 9. Documentation and Version Declaration

*Capability: `template-architecture`, `build-verification`.*

- [ ] 9.1 Set `theme.toml`'s `min_version` to the version the environment actually builds with, and add a gate failing on divergence between the declared floor and the verified version
- [ ] 9.2 Correct the README's reference to a commit-generation command that does not exist in the `Makefile` — either define the target or correct the documentation — and verify every command named in the documentation resolves to a defined target
- [ ] 9.3 Document the override layer, the vendored PaperCSS version, and the four locally-owned framework defects in the README, and verify each documented command runs as written
- [ ] 9.4 Add a changelog entry for the five breaking changes, naming the before and after markup for each so consumers can adjust overrides, and verify the entry states that the raised `min_version` reflects what the theme has always required
- [ ] 9.5 Document the verification workflow for contributors and verify the documented command runs the same gates as CI

## 10. Integration Verification

*Checks only that span the groups above. Not a substitute for the per-group verification already recorded.*

- [ ] 10.1 Build the example site and run the full gate sequence, verifying the recorded baseline is met or improved and no group regressed another's fixes
- [ ] 10.2 Verify the complete set of shortcodes renders correctly on the example site and that the collapsible components are keyboard-operable end to end
- [ ] 10.3 Verify two consecutive builds produce byte-identical output
- [ ] 10.4 Run the theme's own `check` target and confirm it invokes the same gates as continuous integration
- [ ] 10.5 Review the disabled rules in the committed gate configuration and verify each corresponds to a documented exception rather than to convenience
- [ ] 10.6 Decide how the gate separates theme-emitted markup from content-authored markup, and verify the recorded baseline can express a floor for the former that the theme actually controls

*Added from measurement.* The baseline counts errors across whole generated pages, so it cannot distinguish a defect in the theme from a defect in the example site's own markdown. `no-trailing-whitespace` and `no-inline-style` both have a large content-authored component: several `no-trailing-whitespace` errors come from migrated Jekyll posts, and ~9 `no-inline-style` errors come from inline styles in that content. As long as that is true, "ratchet the baseline to zero" is not a well-defined goal for those two rules — reaching zero would require rewriting the example content, and stopping short of it leaves the theme's own regressions indistinguishable from the content's. 10.6 has to settle this before the per-rule baselines in 4.x and 7.3 can be tightened to values that mean something. The candidates are validating theme templates' rendered fragments separately from content, tracking a content-owned floor per page, or accepting a documented non-zero floor for the content-authored rules.