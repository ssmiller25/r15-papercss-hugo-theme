# Design

## Context

See `proposal.md` for motivation. The constraints that shape the approach:

**Upstream was frozen; it is now maintained in a copy, and released.** `static/css/paper.css` (3,327 lines) is byte-identical to the published `v1.9.2` from 2023-05-29 — which was simultaneously the newest tag, the current npm `latest`, and the current `master` CSS state of `papercss/papercss`. There had been no CSS change upstream in over three years. The original repository was not archived, so fixes were technically possible, but they did not land: PR #311 — a clean, DCO-signed fix for the height clip this audit found — had been open since 2026-09-02, and its issue #272 since 2022-03-23. That is why the framework is now maintained as a copy at [`ssmiller25/papercss`](https://github.com/ssmiller25/papercss), which shipped **`v2.0.0` on 2026-10-10** and patched it to **`v2.0.1`** the same day — immutable releases, each carrying a build-provenance attestation and a signed tag. The theme references `v2.0.1`: the four defects fixed in 2.0, plus the fonts 2.0.1 restores.

**That is no longer the situation, and this design was written against it.** PaperCSS is maintained as 2.x in the `ssmiller25/papercss` copy, and the four defects this change originally assumed the theme had to own are fixed at their source. Two consequences run through everything below: the override layer is no longer permanent architecture, and group 6 is a straight adoption of a published release rather than a wait. What has *not* changed is the finding itself — the defects are real, they were the theme's to work around or not, and the verification gates that exposed them are needed either way.

**Both existing workflows were failing on every run, and one gate had never run at all.** Neither has ever been green, so "the build passes" was never a claim this repository could make.

`web-lint.yml` runs `htmlhint layouts/**/*.html`, which fails on every file it scans:

1. `layouts/**/*.html` files are Go templates, not HTML. `{{ define "main" }}` on line 1 is reported as "Doctype must be declared before any non-comment content", which is htmlhint correctly describing a fragment that was never meant to be a document.
2. In `bash` without `globstar`, `layouts/**/*.html` collapses to `layouts/*/*.html`, silently skipping `layouts/index.html` and `layouts/404.html` — which is how a zero-byte `404.html` survives.

Because that first step exits non-zero, **the stylelint step never ran**. It would not have passed either: `.stylelintrc.json` extends `stylelint-config-standard`, and stylelint resolves a shareable config against the config file, the working directory, and finally a directory inferred from the node binary — which does not reliably point at a global `npm install -g`. The gate needed `--config-basedir` before it could run at all. And it did not need to pass: linting the vendored `static/css/paper.css` alongside the theme's own stylesheet reports ~980 violations, virtually all of them in the vendored file this change requires to stay byte-identical to upstream.

`codeql.yml` failed earlier still, before analyzing anything: `languages: html, javascript` names `html`, which is not a CodeQL language, so `init` aborts with "Did not recognize the following languages: html". CodeQL has no HTML analyzer at all. Markup correctness has to be asserted by a different tool, which is what the HTML gate is for.

**The theme is small enough to audit exhaustively.** 23 templates, ~350 lines. There is no code volume to amortize discipline against, so every finding is a discrete, fixable defect rather than a matter of taste.

**Measured baseline.** `html-validate` 11.16.2 at `html-validate:recommended` over the 24 theme-rendered pages of `exampleSite/public`. Hugo generates 33 HTML files, but 9 of them are its built-in alias template — a redirect stub consisting of `<html><head>…<meta http-equiv="refresh">` and no `<body>`, which accounts for all 9 `element-required-content` errors and none of them are theme-authored. Excluding those leaves:

| Count | Pages | Rule |
|---|---|---|
| 218 | 24 | `no-trailing-whitespace` |
| 96 | 24 | `element-permitted-content` |
| 81 | 24 | `no-inline-style` |
| 24 | 24 | `no-implicit-button-type` |
| 24 | 24 | `text-content` |
| 6 | 6 | `aria-label-misuse` |
| 2 | 1 | `valid-id` |
| 1 | 1 | `form-dup-name` |
| 1 | 1 | `wcag/h30` |
| 1 | 1 | `wcag/h37` |

**454 total**, down from the 1304 first recorded, after the whitespace cleanup in the migration plan cleared the theme's own contribution to `no-trailing-whitespace` to zero. The 218 that remain are not theme markup: 144 are whitespace from Hugo's internal `_internal/google_analytics.html`, and 74 are trailing spaces inside fenced code blocks in one example-site content file. The per-page rules are one component each, repeated on every page: the nav's collapsible is a `<button>` with no `type` and no accessible text (`no-implicit-button-type`, `text-content`), containing a `<label>` (`element-permitted-content`) which in turn contains the three `<div class="barN">` PaperCSS only ever styles as divs (three more `element-permitted-content`). Four `element-permitted-content` per page, 96 in total, all from that one component.

Two corrections to earlier assumptions in this change, both from measurement:

- **There is no `alt-require` rule.** It was replaced in html-validate by the `wcag` plugin's `wcag/h37`. The single missing-`alt` defect in `shortcodes/card.html` is real and is reported as `wcag/h37`; the old name is what an audit would have recorded.
- **`valid-id` is Hugo's, not the theme's.** The two errors are `id="fn:1"` / `id="fnref:1"`, emitted by goldmark's footnote renderer, and appear on the one page that uses footnotes. It needs a decision (accept and record as a framework exception, or post-process the rendered footnotes), not a theme-side markup fix.

## Goals / Non-Goals

**Goals:**
- A gate that can actually fail, operating on real output.
- One home per piece of markup, enforced structurally.
- Valid, landmark-bearing, keyboard-operable HTML.
- Byte-stable builds.
- PaperCSS's published release referenced as-is, pinned by tag and integrity digest, with local overrides removed where `v2.0.1` makes them unnecessary.

**Non-Goals:**
- Modernizing Hugo template APIs. `theme.toml` declares `min_version = "0.81.0"` but `.devcontainer/Dockerfile` pins `HUGO_VERSION=0.131.0` and `head.html:30` uses `resources.ExecuteAsTemplate`, which postdates the declared floor. The fix is to make the declaration *truthful* at the version already exercised, not to raise it.
- Forking or vendoring a modified PaperCSS. Explicitly rejected; see Decision 1.
- Migrating the theme to Hugo's `layouts/_partials/` convention. Deferred; see Open Questions.
- Restyling the theme. No visual redesign.
- Per-shortcode documentation pages (the existing `papercss-shortcodes/` page satisfies the spec scenario).

## Decisions

### Decision 1: Framework defects are fixed upstream; the override layer is a documented fallback, not permanent architecture

**This decision was reversed after it was written, and the reversal is deliberate.**

As originally reasoned: the vendored file was byte-identical to the newest available CSS, so forking would track zero upstream delta while permanently absorbing upstream's bug-fix burden and obliging every consumer to a non-standard PaperCSS. On that basis the override layer was declared permanent architecture, and this change was going to carry four framework defects indefinitely.

That reasoning was sound given the evidence, and the evidence has changed. PaperCSS is maintained as 2.x at `ssmiller25/papercss`, and the four defects are fixed at their source in that repository, whose own verification gates assert the fixes. They are shipped: `v2.0.1` is a published, immutable release. A theme-side override for a defect that is already fixed upstream is two corrections for one bug, one of which must later be deleted.

So the ordering inverts. Group 6 adopts the published `v2.0.1` artifact and its font files, and removes the overrides that are no longer needed. What survives is the residue 2.0 does not fix, documented as such.

**What does not change.** The framework is still consumed unmodified from a published release, and every theme-side correction still lives outside it. That was a good constraint when it meant "do not fork the CSS" and it remains a good constraint when it means "reference the pinned release, and put anything else in the override layer". Separately, the Dependabot CVE reasoning still holds and is unaffected: `minimist` and `json5` are build-time dependencies of PaperCSS's own toolchain, consumers use the prebuilt `dist/` artifacts and never run that build, so they carry no risk to this theme.

**Consequence.** `assets/css/custom.css` is smaller and less load-bearing than originally planned — it is a fallback layer rather than the primary home for four corrections. It still warrants minification and fingerprinting, because the residue is real and a consumer's browser should not cache it indefinitely, but it no longer justifies the "each rule annotated by the framework rule it counteracts" burden across a large surface.

**On why the theme references a published release and not the maintained copy's working tree.** The theme references a *published* release so the bytes it applies are identifiable and integrity-checked, rather than tracking a mutable branch. Consuming an unreleased local build would make the theme's own provenance unverifiable, which is the property that made Decision 1's constraint worth keeping in the first place. `v2.0.1` is published and attested, so that gate — task 6.1 — is satisfied, and the theme references the tagged release through jsDelivr, pinned by tag and subresource-integrity digest, rather than a branch.

### Decision 2: Gate on generated output, never on templates

**Rationale.** A gate pointed at the wrong artifact is worse than no gate, because it manufactures confidence. This is the single highest-leverage change in the proposal: it converts a check whose every reported error is a false positive into one that catches all 96 real `element-permitted-content` violations and the rest of the table above.

**Alternative considered:** validating template sources with a template-aware parser. Rejected — no maintained, trustworthy validator understands Go template syntax, and any attempt produces false positives that train contributors to ignore the gate.

**Consequence.** CI must build `exampleSite` before validating. The glob defect disappears along with the glob: the input is now a real file tree walked by `readdir`, so root-level pages and any depth are included by construction rather than by a pattern someone has to get right. The file set is additionally narrowed to theme-rendered pages, by detecting Hugo's alias stub rather than by disabling rules — see Decision 9.

### Decision 3: Baseline, then ratchet to zero

**Rationale.** Landing 1304 errors and 1304 new failures simultaneously would be unreviewable and would stall at a permanently red gate. Recording the measured baseline and failing only on *increases* lets correctness fixes land independently of unrelated cleanups, while `no-trailing-whitespace` — then 1068 of the 1304 — clears as one mechanical change.

That reasoning held, but the premise that the whitespace would be hand-written cleanup across 23 templates did not: 1068 of the 1304 were auto-clearable once the actual mechanism was identified, and the theme's own contribution is now zero. See migration step 3 and task 2.1.

The ratchet is per-rule, not just per-total. A single total would let unrelated regressions mask each other — fixing three whitespace defects while adding three accessibility defects would hold the total flat and pass. Each rule carries its own ceiling and the gate fails if any single one rises, including a rule with no prior baseline entry at all. Lowering a baseline is a deliberate act (`make check-update-baseline`), never an automatic side effect of a passing run, so the baseline cannot ratchet upward by accident.

The stricter requirement — tightening the baseline in the same change as a deliberate cleanup — is what prevents the baseline from becoming a permanent ceiling.

**Alternative considered:** fix everything first, gate at zero. Rejected — one 1300-error commit is unreviewable and impossible to bisect.

### Decision 4: Pin to the Hugo version already exercised (0.131.0)

**Rationale.** The declared `min_version` of `0.81.0` describes a version the theme has never actually run on: `resources.ExecuteAsTemplate` postdates it, and `.Site.Language.Lang` and `site.Data` postdate it too. Raising the declared floor to match the devcontainer's pin makes the claim true and lets CI enforce it, without forcing any consumer onto a version the theme does not already require.

**Alternative considered:** adopt Hugo's modern `layouts/_partials/` and `layouts/_shortcodes/` conventions. Deferred — those postdate 0.131.0, so adopting them means bumping Hugo and breaking consumers on the (already fictional) 0.81 floor. See Open Questions.

### Decision 5: Honor PaperCSS's identifier contract, fix its markup contract

Two distinct constraints, deliberately treated differently.

**The identifier prefix is a hard contract.** Every collapsible rule in the framework CSS is conditioned on `input[id^=collapsible]`. The theme MUST generate matching identifiers — there is no way to implement a PaperCSS collapsible without this. PaperCSS constrained the *shape*; it did not constrain how the suffix is derived.

**The current derivation is a defect.** `shortcodes/collapsible.html:4-6` derives the suffix from `delimit (shuffle (split (md5 "yolo") ""))` — a **constant** seed, reshuffled per invocation. Every build emits different HTML, which defeats output diffing, invalidates Hugo's cache, and makes preview deploys irreproducible. `collapsible_{{ .Ordinal }}` satisfies the same prefix contract deterministically.

**The markup contract is negotiable, and the evidence says so.** `paper.css:3308-3327` styles `nav .collapsible > button` with the full button treatment, and `paper.css:3197` animates `input[id^=collapsible]:checked + button .bar1`. PaperCSS supports `input + label` **and** `input + button` as siblings. The theme's `nav.html:7-13` chose the button variant and then nested the `<label>` inside it — a third structure PaperCSS documents nowhere:

```html
<input id="collapsible1" type="checkbox">
<button>                        <!-- PaperCSS styles this -->
  <label for="collapsible1">    <!-- the actual click target -->
    <div class="bar1"></div>    <!-- PaperCSS only ever styles .bar* as divs -->
```

So the `<label>`-in-`<button>` nesting is the theme's invention, not a framework requirement. Restructuring to a plain sibling `<label>` stays inside PaperCSS's documented contract and removes all six `element-permitted-content` violations on that component.

### Decision 6: The four PaperCSS defects are fixed in PaperCSS 2.0, not overridden here

| Defect | Location (v1.9.2) | Where it is now fixed | Theme work that remains |
|---|---|---|---|
| `input { display: none }` drops the toggle from the tab order; mobile nav is keyboard-unreachable. Affects nav *and* the `collapsible` shortcode. | `paper.css:1323` | 2.0 — `.collapsible > input` uses the visually-hidden pattern and `:focus-visible` shows a focus indicator | none, once adopted (6.3, 6.4) |
| `.bar1/.bar2/.bar3` are `<div>`s; HTML forbids flow content in `<label>`. Styleable as `<span>`. | theme markup | 2.0 changes the *documented* markup (and the switch tile) to `<span>`; the CSS still styles only by class | **yes** — the theme's own `nav.html` must change (6.6) |
| `padding: none` — not a valid CSS value | `paper.css:3296` | 2.0 — the declaration is gone | none, once adopted |
| `max-height: 960px` clips tall bodies | `paper.css:1330` | 2.0 — the body is a `0fr → 1fr` grid row; the cap is gone | none, once adopted |

Each fix was confirmed against the shipped `v2.0.1` asset rather than the release notes: the stylesheet carries the visually-hidden `.collapsible > input` rule, has no `max-height: 960px` on a collapsible body and no `padding: none`, and contains no `fonts.googleapis` import.

**On the first:** the rule is load-bearing for PaperCSS's click-toggle pattern, so it could not simply be deleted. A correct fix swaps in a visually-hidden approach or exploits `input:focus-visible + label`, and that is the kind of change that wants the framework's owner making the call. It now has one.

**On the second:** this is the one defect the theme never fully delegated, and it is worth being precise about why. PaperCSS styles `.bar1/.bar2/.bar3` by class alone, so the element type is the theme's choice and 2.0 changing its own documentation does not change what the theme renders. `nav.html:9-11` emits `<div class="barN">` inside a `<label>`, which is invalid on both sides of the upgrade. The theme has to edit its markup either way; what 2.0 buys is that the edit now matches the documented contract instead of contradicting it.

**On the fourth:** PR #311's `grid-template-rows: 0fr → 1fr` approach was the right fix and is what `v2.0.0` implements. Issue #272 and PR #311 were open against a repository nobody was merging into, which is the whole reason a maintained copy became the right answer.

**Why the defects existed this long is now partly answerable.** The accessibility issues in the upstream tracker numbered eight, the oldest dating to 2017, and none mentioned the toggle's reachability. PR #277 ("Feature display input in collapsible") *was* merged in November 2022, but reading it shows it fixed form elements inside the collapsible *body* (issue #271), not the toggle's own `display: none`. So the finding was genuinely unreported — which is also why the 2.x work carries its own verification gates rather than relying on review. A defect nobody reported is a defect no review would catch.

**What the theme keeps.** Per task 6.11, whatever 2.0 does not fix stays in the override layer with its rationale recorded, and needs an upstream report. The residue is small, and one item is already known: the dark palette still sets `--primary-text` to `#41403e` — the same value as `--main-background` — so text resolved from it is invisible on a dark ground. Neither `2.0.0` nor `2.0.1` fixed this, which confirms it is a genuine theme-side correction for the `add-dark-mode-toggle` change to carry, not an override waiting to be deleted.

### Decision 7: Semantics over PaperCSS's own markup in one specific place

`post-list` headings are an intentional, documented exception. `_default/list.html:7` and three siblings render each listing entry as `<h2 class="post-list">`, so a 20-post page has 20 sibling `h2`s and a meaningless heading outline. This is the theme's bug, not PaperCSS's — PaperCSS merely offers `.post-list` as a font-size hook, which is what invited its use as a heading.

The fix is `<ul><li><h2 class="post-list"><a>`, keeping both `post-list` and `summary` so existing consumer overrides survive. The spec records this explicitly: styling hooks are retained, heading count does not grow with entry count.

### Decision 8: The commit-history homepage's `innerHTML` sink becomes inert text

`index.html:27` embeds the full commit history via `jsonify | safeJS`; `index.html:96` assigns `container.innerHTML` to a string built from `commit.subject` and `commit.body` with no escaping. A commit message containing markup executes.

Severity is low — it requires committer access — but this theme is published for public consumption and `exampleSite/config.yaml` sets `goldmark.renderer.unsafe: true`, so the raw-HTML path is enabled site-wide. `search.js` already uses `textContent` throughout, which is the in-repo precedent to follow.

**Alternative considered:** HTML-escaping at template time. Rejected — escaping in the template and then interpolating into `innerHTML` is fragile; `textContent` removes the sink class entirely rather than filtering one instance of it.

### Decision 9: Hugo's alias output is excluded by detection, not by disabling rules

Hugo's alias template is not theme-authored and its `element-required-content` errors are not defects the theme can fix. The requirement is still that excluding them be an explicit, auditable choice, so the exclusion is made by *identifying* the file — an alias stub is recognizable by its `meta http-equiv="refresh"` and absent `<body>` — rather than by turning a rule off.

The distinction matters. A disabled rule is invisible to the next person who reads `.htmlvalidate.json`: it reads as "this rule is off", not "these 9 files are not ours". Detection puts the exclusion in the validation driver, where it is accompanied by the reason and is counted and reported (`9 alias stubs excluded`) on every run. It also cannot be over-broad in the quiet way a rule toggle can, because a filter that matched every page would be caught by the guard that refuses to validate zero pages.

**Alternative considered:** `--ignore-pattern` against alias-shaped paths. Rejected — it guesses at paths, and the same path can be an alias in one build and a real page in another.

### Decision 10: The CSS gate covers the theme's stylesheet only

The framework stylesheet is referenced from the pinned release, not stored in the repository, so the CSS gate lints the theme's own `assets/css/**/*.css` only. That scoping leaves a handful of violations, all in `assets/css/custom.css`, all genuinely fixable. `no-descending-specificity` on the nav override is resolved by expressing the nav rule as `nav a:link, nav a:visited`, whose specificity range no longer straddles the theme's anchor rule, so the rule is enforceable without an exception.

**Alternative considered:** lint the referenced framework stylesheet as well. Rejected — it is not theme-authored and is not modifiable; its violations are upstream's to fix, not ours.

### Decision 11: The gate must not be able to read stale output

A verification gate that validates whatever happens to be in the output directory is not verifying the build. Hugo does not delete a generated page when the template that produced it stops generating one, so a `404.html` written by an earlier build survives and gets validated as though it were current. This was not hypothetical: it was how a regression injected for testing survived three consecutive `make check` runs.

The fix is `--cleanDestinationDir` on the build, which makes the output directory a faithful projection of the current build. It is a correctness requirement of the gate, not a tidiness setting, and it belongs in the build target rather than in the validator, because the validator cannot tell stale output from current output.

### Decision 12: A committed workflow that cannot run is itself a defect

`codeql.yml` requested a language CodeQL does not have, so the job failed during `init` and never analyzed a line of code — while `web-lint.yml`'s failing first step meant its second step was never reached. Both workflows had been red on every run since they were committed, and neither was noticed, because nothing distinguishes "this check is passing" from "this check is not running" at a glance.

The first fix was to correct the language to `javascript-typescript`, the current identifier for the JavaScript analyzer. That exposed the next failure: this repository also has GitHub's **default CodeQL setup** enabled, and GitHub rejects SARIF from an advanced configuration while default setup is on ("CodeQL analyses from advanced configurations cannot be processed when the default setup is enabled"). The default setup is broader than the committed workflow — it analyzes `actions`, `javascript`, `javascript-typescript`, `python`, and `typescript` — so the committed workflow is both redundant and less capable. It is **removed**, leaving code scanning configured in exactly one place.

**On the general lesson:** the reason these survived is that a permanently red check reads as a known annoyance rather than as an unverified claim. A gate that cannot fail and a gate that is always failing look identical from the outside. Getting to green is what makes the remaining red meaningful.

### Decision 13: The theme relies on PaperCSS's bundled, self-hosted fonts

`v2.0.0` dropped the Google Fonts `@import` without replacing it, so a consumer who changed nothing got `sans-serif` — the theme stopped looking like itself. `v2.0.1` reverses that: the stylesheet carries five `@font-face` rules for Neucha and Patrick Hand SC whose `url()` resolves to files shipped beside it, and they load by default. So the intended typography comes back, self-hosted by the framework rather than by Google — the property the `2.0.0` change was reaching for, achieved without losing the look.

**Chosen:** rely on `v2.0.1`'s bundled fonts. The theme references the pinned stylesheet and adds no Google `<link>`; because jsDelivr serves the whole tagged `dist/` tree, the `@font-face` `url()`s resolve to the tagged fonts on the same origin. It is strictly better than the fallback stack this decision previously chose against `v2.0.0`: same look, no consumer action.

**The relative-path requirement.** The `@font-face` `url()`s are relative to the stylesheet, so whatever serves the stylesheet must also serve the fonts beside it. jsDelivr does, for the tagged release; verification confirms each referenced asset resolves. A missing font would otherwise fall back to `sans-serif` silently, with no build error.

**Alternative considered:** vendor the font files into the theme. Rejected — the release is immutable and integrity-pinned, so there is no need to duplicate upstream artifacts or carry binary blobs; referencing them keeps the repository lean.

**Consequence.** The changelog notes that a consumer who followed `2.0.0`'s `UPGRADE.md` and added the Google `<link>` should remove it, because `2.0.1` loads the fonts itself and the link would double-load them.

## Risks / Trade-offs

**Gate reports the alias template's `element-required-content` errors** → Hugo's built-in alias output is not theme-authored, and it accounts for all 9 of them. Scope validation to theme-rendered pages and document the exclusion; per Decision 9 the exclusion is a detection step in the validator, reported on every run, not a rule toggle in `.htmlvalidate.json`.

**The 1068 whitespace errors were noise that obscured real ones** → They were 82% of the baseline and 82% of the report. Cleared in one change; see migration step 3.

**The baseline is measured against a non-deterministic build** → `shortcodes/collapsible.html` derives its DOM id from `shuffle(split(md5 "yolo"))`, so two builds of unchanged content differ. Verified that the baseline is insensitive to this — the `collapsible` ids appear once each on one page, and repeated clean builds report an identical count — but that is a property of the current rule mix, not a guarantee. Task 5.1 removes the non-determinism, which makes it moot.

**Consumers' custom CSS breaks on the five breaking changes** (footer added, listing markup, section pagination, nav markup, collapsible id format) → `post-list` and `summary` hooks are retained by design. Document the rest in the changelog with before/after selectors. Section pagination is the most likely to surprise: a section that previously rendered every page now paginates at `pagerSize`.

**Raising `min_version` to 0.131.0 breaks consumers** → They are already broken on 0.81.0; the template cannot run there. State this plainly in the changelog rather than framing it as a new restriction.

**Override layer drifts from the framework release** → *Now expected rather than hypothetical.* `v2.0.1` is a deliberate upgrade from 1.9.2, and overrides written against the old version may double-apply or conflict. This is precisely why group 6 audits what 2.0 actually fixed by inspecting the shipped stylesheet (6.3) before removing anything (6.4), rather than trusting release notes and deleting rules by memory. Record the referenced version and its integrity digest so future drift is detectable.

**`custom.css` becomes load-bearing** → *Superseded.* With the framework defects fixed in 2.0, the override layer is a fallback rather than the home for four corrections, so it is no longer load-bearing enough to justify annotating every rule with the framework rule it counteracts. Fingerprinting and minification still stand, because the residue is real.

**The framework's fonts must resolve from the referenced stylesheet** → `v2.0.1` loads its fonts from `url("fonts/…")` relative to the stylesheet, so whatever serves the stylesheet must serve the fonts beside it. jsDelivr does, for the tagged release; verification (Decision 13) fetches the stylesheet and confirms its integrity and that each referenced asset resolves. The failure mode this guards against is silent — a missing file falls back to `sans-serif` with no build error — so it is checked explicitly rather than assumed.

**The dark-mode component fix overlaps the in-flight `add-dark-mode-toggle` change** → 2.0 makes dark mode theme every component (pressed buttons, striped bars, table rules, shadows) and grows the property surface from 48 to 60. The `add-dark-mode-toggle` change was designed against the v1.9.2 palette and carries local corrections for exactly those components; each must be re-checked against `v2.0.1` and any that are now redundant dropped. The `--primary-text` defect that change identified is confirmed still present in `v2.0.1` (Decision 6), so that correction stays and needs an upstream report.

## Migration Plan

1. **Measurement first, no behavior change.** Build the example site, run `html-validate`, commit `.htmlvalidate.json` and the recorded baseline. Gate now runs on real output and fails on regressions from the current state. *Landed.*
2. **Pin tools, and make the workflows runnable.** Replace the unpinned `npm install -g` with exact versions, drop the template glob, scope the CSS gate to the theme's own stylesheet, name stylelint's shareable-config location explicitly, clean the build destination, and remove the redundant `codeql.yml` in favour of the repository's default CodeQL setup. *Landed.*
3. **Mechanical cleanup.** Clear the theme's whitespace errors; tighten the baseline in the same commit. *Landed — 1304 → 454. See Open Questions for the 218 residual.*
4. **Structure.** Add landmarks, footer, and skip link to `baseof.html`; consolidate the four copies of the listing markup into one partial; delete the dead `post-list.html`; populate `404.html`.
5. **Semantics.** Listing markup, heading outline, `toc.html` onto `.TableOfContents`, search labeling, image attributes, `aria-current` on nav.
6. **Determinism.** Replace the `shuffle`/`md5` derivation with `{{ .Ordinal }}`.
7. **PaperCSS 2.0 adoption.** Reference the pinned `v2.0.1` release from jsDelivr (recording the version, URL, and integrity digest), audit what it actually fixed against the shipped stylesheet, drop the overrides it made unnecessary, rely on its bundled self-hosted fonts (Decision 13), and record the residue. This step absorbs what were going to be four override-layer tasks, plus minification and fingerprinting.
8. **Security.** Convert the commit renderer's `innerHTML` sink to inert text nodes.
9. **Shortcodes.** Uniform contract across all seven, with validation failures.
10. **Documentation.** Correct the changelog and README; reconcile `min_version` with the enforced gate.

Rollback is per-step: steps 1–3 change no rendered output, and steps 4–9 each land as an independent commit that can be reverted without touching the gates established in step 1. Step 7 is reversible in one move — reverting the stylesheet reference and the overrides together restores the previous state — but it should not be reverted alone, because 6.6's markup change and 6.7's font behavior are only correct against 2.0.

Steps 4–6 and 8–10 can proceed in any order and none of them wait on step 7. The gate established in step 1 measures all of them, so their progress is visible throughout.

## Open Questions

- **Should the theme bump past Hugo 0.131.0 to adopt `layouts/_partials/` and `layouts/_shortcodes/`?** Genuinely deferrable — it changes no spec in this change, only future task sequencing. It becomes worth doing when a future Hugo bump is motivated by something else, at which point the directory migration is mechanical.
- **Should the repo's `codeql.yml` be deleted in favour of GitHub's default CodeQL setup?** *Resolved — deleted.* The default setup analyzes `actions`, `javascript`, `javascript-typescript`, `python`, and `typescript`, and GitHub rejects an advanced configuration's results while default setup is enabled, so the committed workflow was both duplicative and a guaranteed failure. Code scanning now has a single configuration.
- **How should goldmark's colon-bearing footnote ids (`fn:1`) be handled?** Raised by the measured baseline. `valid-id` is a real conformance failure, but the ids are emitted by Hugo's markdown renderer rather than by theme markup, so every option is a workaround: post-process the rendered `.Content`, accept them under a documented framework exception, or report upstream. Needs a decision before the baseline reaches zero.
- **Should the theme migrate off Hugo's deprecated Universal Analytics template?** Raised by the whitespace cleanup, and the largest single block of remaining gate noise: 144 errors, 6 whitespace-only lines on every page, traced to `head.html`'s call to `_internal/google_analytics.html`. Three facts make this more than a cosmetic problem. Hugo 0.131 warns on every build that UA was replaced by GA4; the internal template emits **no script tag at all**, only whitespace, so the theme's analytics are already dead; and `UA-…` identifiers are not interchangeable with `G-…` ones, so emitting a GA4 `gtag` snippet means consumers must replace `googleAnalytics` with `site.Config.Services.GoogleAnalytics.ID` in their own site config. That is a sixth **breaking** change, and it belongs in the proposal's breaking-change list with a changelog entry — not in a whitespace commit. Left undecided here deliberately.