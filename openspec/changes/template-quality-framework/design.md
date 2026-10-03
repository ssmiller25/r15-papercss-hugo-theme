# Design

## Context

See `proposal.md` for motivation. The constraints that shape the approach:

**Upstream is frozen and unmergeable.** `static/css/paper.css` (3,327 lines) is byte-identical to the published `v1.9.2` from 2023-05-29 — which is simultaneously the newest tag, the current npm `latest`, and the current `master` CSS state. There has been no CSS change upstream in over three years. The repository is not archived (4,194 stars, 227 forks, 38 open issues), so fixes are technically possible, but they do not land: PR #311 — a `mergeable_state: clean`, DCO-signed fix for the height clip this audit found — has been open since 2026-09-02, and its issue #272 has been open since 2022-03-23. Four Dependabot branches carrying known-CVE bumps have been unmerged since early 2023.

**The existing gates are structurally incapable of failing.** `web-lint.yml` runs `htmlhint layouts/**/*.html`. Two independent failures compound:

1. `layouts/**/*.html` files are Go templates. htmlhint's default ruleset reports zero errors across 33 built pages that contain 40 real `element-permitted-content` violations.
2. In `bash` without `globstar`, `layouts/**/*.html` collapses to `layouts/*/*.html`, silently skipping `layouts/index.html` and `layouts/404.html` — which is how a zero-byte `404.html` survives.

**The theme is small enough to audit exhaustively.** 23 templates, ~350 lines. There is no code volume to amortize discipline against, so every finding is a discrete, fixable defect rather than a matter of taste.

**Measured baseline.** `html-validate` over `exampleSite/public/**/*.html`: 629 errors across 33 pages.

| Count | Rule |
|---|---|
| 549 | `no-trailing-whitespace` |
| 40 | `element-permitted-content` |
| 11 | `no-implicit-button-type` |
| 10 | `text-content` |
| 9 | `no-inline-style` |
| 6 | `element-required-content` |
| 1 | `form-dup-name` |

Six of the seven `element-required-content` errors are Hugo's built-in alias template (`<html>` with only `<head>`), not a theme defect. One real `alt-require` error comes from `shortcodes/card.html`.

## Goals / Non-Goals

**Goals:**
- A gate that can actually fail, operating on real output.
- One home per piece of markup, enforced structurally.
- Valid, landmark-bearing, keyboard-operable HTML.
- Byte-stable builds.
- PaperCSS defects fixed locally, permanently, with the vendored file untouched.

**Non-Goals:**
- Modernizing Hugo template APIs. `theme.toml` declares `min_version = "0.81.0"` but `.devcontainer/Dockerfile` pins `HUGO_VERSION=0.131.0` and `head.html:30` uses `resources.ExecuteAsTemplate`, which postdates the declared floor. The fix is to make the declaration *truthful* at the version already exercised, not to raise it.
- Forking or vendoring a modified PaperCSS. Explicitly rejected; see Decision 1.
- Migrating the theme to Hugo's `layouts/_partials/` convention. Deferred; see Open Questions.
- Restyling the theme. No visual redesign.
- Per-shortcode documentation pages (the existing `papercss-shortcodes/` page satisfies the spec scenario).

## Decisions

### Decision 1: No PaperCSS fork; the override layer is permanent architecture

**Rationale.** The vendored file is already byte-identical to the newest available CSS, so a fork would track zero upstream delta while permanently absorbing upstream's security and bug-fix burden and obliging every consumer to use a non-standard PaperCSS. Separately, the unmerged Dependabot CVEs (`minimist`, `json5`) are *build-time* deps of PaperCSS's own gulp toolchain — consumers use the prebuilt `dist/paper.css` and never run that build, so they carry no risk here and must not be used to justify a fork.

The absence of mergeable upstream fixes is not a reason to wait; it is the reason to own the fixes locally.

**Alternative considered:** maintain a patched PaperCSS fork. Rejected — no delta to track, and it externalizes cost onto consumers.

**Consequence.** `assets/css/custom.css` stops being a cosmetic scratchpad and becomes load-bearing production code, which is why it now needs minification and fingerprinting (`head.html:29-31` currently emits it unhashed, so a consumer's browser would cache bug fixes indefinitely).

### Decision 2: Gate on generated output, never on templates

**Rationale.** A gate pointed at the wrong artifact is worse than no gate, because it manufactures confidence. This is the single highest-leverage change in the proposal: it converts a check that reports zero errors into one that catches all 40 real violations.

**Alternative considered:** validating template sources with a template-aware parser. Rejected — no maintained, trustworthy validator understands Go template syntax, and any attempt produces false positives that train contributors to ignore the gate.

**Consequence.** CI must build `exampleSite` before validating. The existing glob defect disappears once the input is a real file tree, but the explicit-coverage requirement stays, because a root-level page is exactly what a naive `**` pattern drops.

### Decision 3: Baseline, then ratchet to zero

**Rationale.** Landing 629 errors and 629 new failures simultaneously would be unreviewable and would stall at a permanently red gate. Recording the measured baseline and failing only on *increases* lets correctness fixes land independently of unrelated cleanups, while `no-trailing-whitespace` (549 of 629) clears as one mechanical commit.

The stricter requirement — tightening the baseline in the same change as a deliberate cleanup — is what prevents the baseline from becoming a permanent ceiling.

**Alternative considered:** fix everything first, gate at zero. Rejected — one 600-error commit is unreviewable and impossible to bisect.

### Decision 4: Pin to the Hugo version already exercised (0.131.0)

**Rationale.** The declared `min_version` of `0.81.0` describes a version the theme has never actually run on: `resources.ExecuteAsTemplate` postdates it, and `.Site.Language.Lang` and `site.Data` postdate it too. Raising the declared floor to match the devcontainer's pin makes the claim true and lets CI enforce it, without forcing any consumer onto a version the theme does not already require.

**Alternative considered:** adopt Hugo's modern `layouts/_partials/` and `layouts/_shortcodes/` conventions. Deferred — those postdate 0.131.0, so adopting them means bumping Hugo and breaking consumers on the (already fictional) 0.81 floor. See Open Questions.

### Decision 5: Honor PaperCSS's identifier contract, fix its markup contract

Two distinct constraints, deliberately treated differently.

**The identifier prefix is a hard contract.** Every collapsible rule in the vendored CSS is conditioned on `input[id^=collapsible]`. The theme MUST generate matching identifiers — there is no way to implement a PaperCSS collapsible without this. PaperCSS constrained the *shape*; it did not constrain how the suffix is derived.

**The current derivation is a defect.** `shortcodes/collapsible.html:4-6` derives the suffix from `delimit (shuffle (split (md5 "yolo") ""))` — a **constant** seed, reshuffled per invocation. Every build emits different HTML, which defeats output diffing, invalidates Hugo's cache, and makes preview deploys irreproducible. `collapsible_{{ .Ordinal }}` satisfies the same prefix contract deterministically.

**The markup contract is negotiable, and the evidence says so.** `paper.css:3308-3327` styles `nav .collapsible > button` with the full button treatment, and `paper.css:3197` animates `input[id^=collapsible]:checked + button .bar1`. PaperCSS supports `input + label` **and** `input + button` as siblings. The theme's `nav.html:7-13` chose the button variant and then nested the `<label>` inside it — a third structure PaperCSS documents nowhere:

```html
<input id="collapsible1" type="checkbox">
<button>                        <!-- PaperCSS styles this -->
  <label for="collapsible1">    <!-- the actual click target -->
    <div class="bar1"></div>    <!-- PaperCSS only ever styles .bar* as divs -->
```

So the `<label>`-in-`<button>` nesting is the theme's invention, not a framework requirement. Restructuring to a plain sibling `<label>` stays inside PaperCSS's documented contract and removes all six `element-permitted-content` violations on that component.

### Decision 6: The four PaperCSS defects are fixed locally, each with an upstream report

| Defect | Location | Local fix | Upstream |
|---|---|---|---|
| `input { display: none }` drops the toggle from the tab order; mobile nav is keyboard-unreachable. Affects nav *and* the `collapsible` shortcode. | `paper.css:1323` | Override to a visually-hidden pattern | Report |
| `.bar1/.bar2/.bar3` are `<div>`s; HTML forbids flow content in `<label>`. Styleable as `<span>`. | theme markup | Change element type | Report |
| `padding: none` — not a valid CSS value | `paper.css:3296` | Override | Report |
| `max-height: 960px` clips tall bodies | `paper.css:1330` | Override | Issue #272 exists; PR #311 unmerged |

**On the first:** the rule is load-bearing for PaperCSS's click-toggle pattern, so it cannot simply be deleted. A maintainer fix must swap in a visually-hidden approach or exploit `input:focus-visible + label`. This is exactly the kind of change that wants upstream's owner making the call — and exactly why we do not wait on it.

**On the fourth:** PR #311's `grid-template-rows: 0fr → 1fr` approach is the right fix and is the local override's model.

**Note on the unclaimed status of the first:** the accessibility issues in the upstream tracker number eight, the oldest dating to 2017 and still open, and none mention the toggle's reachability. PR #277 ("Feature display input in collapsible") *was* merged in November 2022, but reading it shows it fixed form elements inside the collapsible *body* (issue #271), not the toggle's own `display: none`. The finding is genuinely unreported.

### Decision 7: Semantics over PaperCSS's own markup in one specific place

`post-list` headings are an intentional, documented exception. `_default/list.html:7` and three siblings render each listing entry as `<h2 class="post-list">`, so a 20-post page has 20 sibling `h2`s and a meaningless heading outline. This is the theme's bug, not PaperCSS's — PaperCSS merely offers `.post-list` as a font-size hook, which is what invited its use as a heading.

The fix is `<ul><li><h2 class="post-list"><a>`, keeping both `post-list` and `summary` so existing consumer overrides survive. The spec records this explicitly: styling hooks are retained, heading count does not grow with entry count.

### Decision 8: The commit-history homepage's `innerHTML` sink becomes inert text

`index.html:27` embeds the full commit history via `jsonify | safeJS`; `index.html:96` assigns `container.innerHTML` to a string built from `commit.subject` and `commit.body` with no escaping. A commit message containing markup executes.

Severity is low — it requires committer access — but this theme is published for public consumption and `exampleSite/config.yaml` sets `goldmark.renderer.unsafe: true`, so the raw-HTML path is enabled site-wide. `search.js` already uses `textContent` throughout, which is the in-repo precedent to follow.

**Alternative considered:** HTML-escaping at template time. Rejected — escaping in the template and then interpolating into `innerHTML` is fragile; `textContent` removes the sink class entirely rather than filtering one instance of it.

## Risks / Trade-offs

**Gate reports the alias template's `element-required-content` errors** → Hugo's built-in alias output is not theme-authored. Scope validation to theme-rendered pages and document the exclusion in `.htmlvalidate.json`, satisfying the explicit-exception requirement.

**Consumers' custom CSS breaks on the five breaking changes** (footer added, listing markup, section pagination, nav markup, collapsible id format) → `post-list` and `summary` hooks are retained by design. Document the rest in the changelog with before/after selectors. Section pagination is the most likely to surprise: a section that previously rendered every page now paginates at `pagerSize`.

**Raising `min_version` to 0.131.0 breaks consumers** → They are already broken on 0.81.0; the template cannot run there. State this plainly in the changelog rather than framing it as a new restriction.

**Override layer drifts from the vendored CSS** → If PaperCSS is ever updated, overrides may double-apply or conflict. Record the vendored version and, ideally, the file's checksum so drift is detectable.

**`custom.css` becomes load-bearing** → Fingerprinting and minification are now correctness features, not optimizations. Add a comment header tying each override to the framework rule it counteracts.

**The 549 whitespace errors are noise that obscures real ones** → Clear them as a single mechanical commit before tightening the baseline, so subsequent gate output is readable.

**Vendored `paper.css` still `@import`s Google Fonts at the top of the file** → A render-blocking third-party request. Out of scope here (it is a framework concern and a performance matter, not a correctness one); worth a separate change.

## Migration Plan

1. **Measurement first, no behavior change.** Build the example site, run `html-validate`, commit `.htmlvalidate.json` and the recorded baseline. Gate now runs on real output and fails on regressions from the current state.
2. **Pin tools.** Fix the glob and the unpinned `npm install -g`; wire the CI gate to the new configuration.
3. **Mechanical cleanup.** Clear the 549 whitespace errors; tighten the baseline in the same commit.
4. **Structure.** Add landmarks, footer, and skip link to `baseof.html`; consolidate the four copies of the listing markup into one partial; delete the dead `post-list.html`; populate `404.html`.
5. **Semantics.** Listing markup, heading outline, `toc.html` onto `.TableOfContents`, search labeling, image attributes, `aria-current` on nav.
6. **Determinism.** Replace the `shuffle`/`md5` derivation with `{{ .Ordinal }}`.
7. **PaperCSS layer.** Add the four overrides with rationale comments; record the vendored version; minify and fingerprint `custom.css`.
8. **Security.** Convert the commit renderer's `innerHTML` sink to inert text nodes.
9. **Shortcodes.** Uniform contract across all seven, with validation failures.
10. **Documentation.** Correct the changelog and README; reconcile `min_version` with the enforced gate.

Rollback is per-step: steps 1–3 change no rendered output, and steps 4–9 each land as an independent commit that can be reverted without touching the gates established in step 1.

## Open Questions

- **Should the theme bump past Hugo 0.131.0 to adopt `layouts/_partials/` and `layouts/_shortcodes/`?** Genuinely deferrable — it changes no spec in this change, only future task sequencing. It becomes worth doing when a future Hugo bump is motivated by something else, at which point the directory migration is mechanical.
- **Should the Google Fonts `@import` in the vendored framework stylesheet be addressed?** Deferred as a separate performance-motivated change; it is the framework's file and this change's premise is that the vendored file stays unmodified.