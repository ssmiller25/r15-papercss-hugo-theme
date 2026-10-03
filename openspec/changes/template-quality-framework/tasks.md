# Tasks

## 1. Verification Foundation

*Capability: `build-verification`. No rendered output changes in this group; it makes the gate capable of failing. This group must land before any group that changes markup, so that each later group is measured against a working baseline.*

- [ ] 1.1 Add a `build-example` prerequisite to the lint workflow so verification builds the site before validating, and verify the workflow step order is build-then-validate
- [ ] 1.2 Replace `htmlhint` with `html-validate` in `.devcontainer/Dockerfile` at a pinned version, and verify `html-validate --version` reports the pinned version inside the container
- [ ] 1.3 Pin `stylelint` and `stylelint-config-standard` to exact versions in the Dockerfile, and verify no unpinned version range remains in the provisioning definition
- [ ] 1.4 Create `.htmlvalidate.json` declaring the enforced rule set, scoping validation to theme-rendered pages and excluding Hugo's built-in alias output, and verify the exclusion is recorded as a documented exception rather than a bare rule toggle
- [ ] 1.5 Record the measured baseline (629 errors across 33 pages) in the repository, and verify a deliberately introduced violation fails CI while an unmodified build passes
- [ ] 1.6 Replace the `layouts/**/*.html` glob with explicit discovery of generated pages so root-level pages are included, and verify the count of validated files equals the count of generated pages
- [ ] 1.7 Add a `check` target to the `Makefile` invoking the same gate sequence as CI, and verify it appears in `make help` and runs the identical commands

## 2. Mechanical Whitespace Cleanup

*Capability: `build-verification`. Clears 549 of 629 recorded errors as one reviewable commit so later gate output is readable.*

- [ ] 2.1 Strip template-internal whitespace that leaks into rendered output across all 23 templates, and verify the `no-trailing-whitespace` count drops to zero in `html-validate` output
- [ ] 2.2 Correct the `</div>` indentation mismatch in `layouts/_default/baseof.html` where the closing tag is outdented from its opener, and verify the rendered document's indentation is consistent
- [ ] 2.3 Tighten the recorded baseline to the reduced count in this same change, and verify CI fails on any subsequent increase

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
- [ ] 4.3 Restructure the nav's collapsible control to a plain sibling `label` rather than a `label` nested inside a `button`, retaining the framework's documented hooks, and verify the six `element-permitted-content` errors on that component clear while the open and closed states still work
- [ ] 4.4 Add `type` and an accessible name to the nav's activation control and to the commit listing's pagination controls, and verify the `no-implicit-button-type` and `text-content` counts drop to zero
- [ ] 4.5 Add an associated `label` to the search input in `partials/searchbox.html`, and verify the control is no longer reported as unlabeled
- [ ] 4.6 Add `alt`, `width`, and `height` to images emitted by `shortcodes/card.html`, with `alt` present-and-empty for decorative images, and verify the `alt-require` error clears
- [ ] 4.7 Mark the navigation entry matching the current page with `aria-current`, and verify the marking is present on the site root and on each section page
- [ ] 4.8 Add language and canonical address assertions to the gate config, and verify both are present on every generated page

## 5. Deterministic Output

*Capability: `document-semantics`, `build-verification`.*

- [ ] 5.1 Replace the `shuffle`/`md5`-derived identifier in `shortcodes/collapsible.html` with a deterministic ordinal-based one that retains the framework's required `collapsible` prefix, and verify two builds of unchanged content are byte-identical
- [ ] 5.2 Verify repeated invocations of the `collapsible` shortcode on one page receive distinct identifiers, and verify each still opens independently
- [ ] 5.3 Audit all templates for other sources of per-invocation randomness or time dependence, and verify none remain
- [ ] 5.4 Add a build-determinism check to CI that builds twice and diffs the output, and verify it fails on a deliberately randomized template

## 6. PaperCSS Override Layer

*Capability: `papercss-integration`. The vendored `static/css/paper.css` is not modified; every fix lands in the override layer.*

- [ ] 6.1 Record the vendored PaperCSS version in the repository, verifiable against the published artifact, and verify the vendored file still matches it byte for byte
- [ ] 6.2 Add a comment header to `assets/css/custom.css` establishing it as the permanent override layer, with each rule annotated by the framework rule it counteracts
- [ ] 6.3 Override the framework rule that removes the collapsible toggle from the tab order so it is keyboard-reachable with a visible focus indicator, and verify a keyboard-only user can operate both the nav and the `collapsible` shortcode
- [ ] 6.4 Override the framework's fixed expanded-height limit so content of arbitrary length is fully visible, modeling the upstream pending fix, and verify a body exceeding the limit is not clipped
- [ ] 6.5 Correct the invalid padding declaration in the nav's collapsible body via the override layer, and verify no invalid declaration remains in effective styles
- [ ] 6.6 Add minification and content-addressed fingerprinting to the override layer in `partials/head.html`, and verify the served address changes when the layer's content changes
- [ ] 6.7 Verify cascade order places the override layer after the framework stylesheet, and verify a conflicting framework declaration is successfully overridden without specificity escalation
- [ ] 6.8 Open upstream reports for the tab-order and invalid-markup defects, referencing the affected vendored version, and verify local work does not block on their resolution

## 7. Commit Homepage Security

*Capability: `document-semantics`. No dedicated security capability; this is a correctness requirement on generated output.*

- [ ] 7.1 Replace the `innerHTML` assignment in `layouts/index.html` with inert text-node construction, following the `textContent` pattern already used in `static/js/search.js`, and verify no HTML-string sink remains in the theme's JavaScript
- [ ] 7.2 Verify a commit whose message contains markup renders as visible text rather than executing, and verify line breaks in commit bodies still render as intended
- [ ] 7.3 Move the inline presentation rules in the commit listing out of markup into the override layer, and verify the `no-inline-style` count drops to zero

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