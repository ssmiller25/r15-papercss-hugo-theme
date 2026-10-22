# Design

## Context

See `proposal.md` — Why.

Constraints that shape the approach, verified against the current repository and the referenced stylesheet:

- **The override layer already exists and already wins.** `layouts/partials/head.html` loads `css/custom.css` after the framework stylesheet, via `resources.ExecuteAsTemplate … | minify | fingerprint`. It is the correct and only home for theme-owned corrections, and it is the file `make check` runs stylelint against.
- **The framework is consumed unmodified.** `papercss.lock.json` pins the release tag and a subresource-integrity digest; `scripts/check-papercss.mjs` fails `make check` if the reference drifts. There is no vendored framework file to edit.
- **The TOC is a `<nav>` the theme emits.** Hugo renders `.TableOfContents` as `<nav id="TableOfContents">`, and `layouts/partials/toc.html` wraps it in `<div class="toc border">`. The framework rules reach it because they match the `nav` element type, not a menu class.
- **The theme already partially normalizes nav links.** `assets/css/custom.css` sets `nav a:link, nav a:visited { color; text-decoration }` and `a, a:visited { background-image: none }`. It never clears the `border-bottom` or the list alignment, which is why the leaks are visible.

### The framework's `nav`-scoped rules and their effect on the TOC

The referenced release scopes six declarations to the `nav` element in `src/components/_navbar.scss`. Their effect on Hugo's TOC landmark:

| framework rule | effect on the TOC | visible |
| --- | --- | --- |
| `nav a, nav a:hover { border-bottom-style: solid; border-bottom-width: 5px }` plus `nav a { border-bottom-color: var(--primary) }` | a 5px underline below each link that overlaps the row beneath | **yes** |
| `nav ul { text-align: center }` (`max-width: 992px`) | TOC entries centered while the document body stays left-aligned | **yes** |
| `nav { display: flex }` (`min-width: 769px`) | the TOC's `<ul>` becomes a shrink-to-fit flex item | latent — not visible while the list is left-aligned |
| `nav { background-color: var(--main-background) }` | an opaque ground on the TOC landmark | no — the TOC sits inside `.paper`, which is the same color |
| `nav { padding: .3rem }` | 6px of extra inner padding | negligible |
| `nav { position: relative; z-index: 100 }` | a stacking context | benign — the theme's navbar is not `fixed` |

Measured on a built example page (`creating-a-new-theme`) in a headless browser, in both color modes:

- At 1280px the TOC's first link is left-aligned (`text-align: start`); at 900px and 500px `#TableOfContents > ul` computes `text-align: center` and the first link shifts right.
- `#TableOfContents` background equals `.paper` in light (`#fff`) and dark (`rgb(65, 64, 62)`), confirming the background leak is invisible.
- `#TableOfContents > ul` is 481px wide at 1280px against ~627px available, confirming the flex shrink-to-fit effect is real but currently unseen.

## Goals / Non-Goals

**Goals:**

- Remove the framework's menu-control underline from table-of-contents links only.
- Remove the framework's menu-list centering from the table of contents only.
- Keep the main navigation menu's framework presentation unchanged — underline and centered small-screen layout.
- Keep the fix inert to markup: no template or content change.
- Make the corrections verifiable in the theme's existing check gate rather than by eye.

**Non-Goals:**

- No change to the framework release, to `toc.html`, or to Hugo's generated TOC markup.
- No restyling of the framework's hand-drawn list markers (`ul li:before`, `ul ul li:before`) or of the TOC's spacing and borders.
- No correction of the `nav`-scoped declarations found to have no visible effect on the TOC: `background-color` (matches `.paper`), `display: flex` (latent), `padding` (negligible), `z-index`/`position` (benign). They are recorded here so a later reviewer does not reopen them.
- No redesign of the TOC. Only the leaks the framework's rules introduce are corrected.

## Decisions

### Scope the corrections to the theme's TOC wrapper, not to all nav links

**Chosen:** `.toc a, .toc a:hover { border-bottom: none }` and `.toc ul { text-align: start }`.

`.toc` is the wrapper the theme owns in `toc.html`, so these target exactly the table of contents. Both win on specificity without `!important`:

- `.toc a` is `(0,1,1)` against the framework's `nav a` at `(0,0,2)`; `.toc a:hover` is `(0,1,2)` against `nav a:hover` at `(0,0,2)`. A class outweighs any number of element selectors.
- `.toc ul` is `(0,1,1)` against the framework's `nav ul` at `(0,0,2)`, so it wins inside the framework's `max-width: 992px` media query as well.

**Alternatives considered:**
- `#TableOfContents a`, `#TableOfContents ul` — also win on specificity, but tie the corrections to an id Hugo generates rather than to the wrapper the theme owns; if Hugo's TOC markup changes, the theme-owned `.toc` remains the stable anchor.
- `nav a { border-bottom: none }`, `nav ul { text-align: left }` — remove the main menu's underline and centering too, which is out of scope and a visual regression.
- `!important` — unnecessary once the selectors outrank the framework rules, and it would make the overrides harder to supersede.

### Neutralize the menu-list centering with `.toc ul`

**Chosen:** `.toc ul { text-align: start }`.

The framework centers a menu's lists below 992px (`nav ul { text-align: center }`); a document's table of contents should stay left-aligned like the body it indexes. `start` rather than `left` keeps the correction writing-mode-relative, matching the framework's own logical use of alignment. Applying it at all widths is harmless — `start` is the initial value — so no media query is needed.

**Alternative considered:** scope the override to the same `max-width: 992px` media query the framework uses. Rejected — the rule then only holds inside a breakpoint the framework controls, and a future change to that breakpoint would silently reintroduce the centering. A breakpoint-independent override is the safer anchor.

### Clear only the border, not the whole nav-link reset

**Chosen:** reset `border-bottom` (which sets `border-bottom-style: none`). The framework's `padding-bottom: .1rem` and the border radii are invisible or negligible once the border is gone.

**Alternative considered:** also reset `padding-bottom` and the radii. Rejected — extra churn with no visible effect, and it widens the blast radius of a one-rule fix.

### Leave the non-visible framework declarations uncorrected

**Chosen:** correct only the two declarations with a visible effect; record the rest as investigated and deliberately left.

The framework's `nav { display: flex }` makes the TOC's list a shrink-to-fit flex item, but with the list left-aligned and no background or border of its own, nothing renders differently. Correcting it would be a speculative layout change outside the observed defect. `background-color` is invisible because the TOC sits inside `.paper` (verified in both modes); `padding` is negligible; `position`/`z-index` are benign. Recording these keeps the correction's scope defensible and the investigation's result durable.

### Treat the over-broad framework selector as a defect and record an upstream report

**Chosen:** record an upstream report, as the theme already does for other framework-originated corrections (`papercss-integration` — "Upstream reports accompany local corrections"). The report covers the framework's element-scoped `nav` menu styling — `nav`, `nav a`, `nav a:hover`, and `nav ul` — which matches any `<nav>` landmark, including Hugo's `<nav id="TableOfContents">`.

The framework styles *every* `nav` as a menu control; a document's table of contents is a `nav` landmark Hugo emits, not a menu. The theme cannot stop the framework from matching a landmark, so it opts out in its override layer. Framing this as the framework's over-broad selector keeps the corrections' provenance consistent with the theme's existing convention. No upstream code change is made in this change; the theme's corrections do not wait on one.

**Alternative considered:** treat it as purely theme-scoped presentation with no upstream report. Rejected to stay consistent with how the theme records every local correction of framework-originated behavior.

## Risks / Trade-offs

- **A future framework release could raise these rules' specificity and re-win.** → Keep the overrides at class specificity (`.toc a`, `.toc ul`) and cover them with a regression check in `make check`, so a re-leak fails the gate instead of shipping.
- **The corrections apply whether or not `enableDarkMode` is set, and light mode is the default.** → The rules only remove a border and restore default alignment; light-mode computed styles for the TOC must be unchanged apart from those two properties. Verify by comparing the rendered TOC before and after.
- **The main menu must keep its hand-drawn underline and centered small-screen layout.** → An explicit scenario asserts the main menu is unchanged; verify after applying.
- **The TOC's hand-drawn list markers remain.** → Deliberate. Recorded as a Non-Goal so a later reviewer does not treat it as an oversight.
- **The uncorrected `display: flex` could become visible if the TOC list is later given its own background or border.** → Recorded as a deliberate Non-Goal; if that styling is added later, revisit this correction.

## Migration Plan

Additive and inert. Two selector blocks are added to `assets/css/custom.css`; no markup, framework, or consumer change is involved. Rollback is deleting the blocks. Because the override layer is fingerprinted, existing visitors receive the corrected stylesheet on the next build without cache action.

## Open Questions

None.
