# Design

## Context

See `proposal.md` — Why.

Constraints that shape the approach, verified against the current repository:

- **The framework is consumed by reference, not vendored.** `papercss.lock.json` records the release tag and a subresource-integrity digest, `layouts/partials/head.html` loads the stylesheet from jsDelivr at that tag with that digest, and `scripts/check-papercss.mjs` fails `make check` if the reference drifts. There is no local framework file to edit; the release is unmodified by construction.
- **The dark palette is a class selector, not a media query.** The referenced stylesheet keys dark mode entirely on `html.dark`. Nothing in it reads `prefers-color-scheme`. So the system-preference fallback has to be resolved in JavaScript and expressed by toggling that class — the framework cannot do it for us.
- **The override layer already exists and already wins.** `layouts/partials/head.html` loads `css/custom.css` after the framework stylesheet, via `resources.ExecuteAsTemplate`. That is the correct home for every theme-owned correction, and it is the file `make check` runs stylelint against.
- **The upstream dark palette has reachable defects, but not the one first suspected.** Comparing the pinned stylesheet against every class the theme's templates emit shows two dark-mode breakages: `.alert-muted` sets its text to `--muted-text` on a `--muted-light` surface and both are `#949ba2` in dark (contrast 1.00); and the `.background-{type}` utility sets a light `--{type}-light` surface while the text inherits white, so `.background-primary` is white on white (1.00) and the other variants fall to 1.7-3.4. The `--primary-text` value is **not** reachable: the only rules using it place it on `--primary-light` surfaces, which are near-white in dark, so it stays legible, and re-declaring it under `html.dark` would regress `.alert-primary`. Per `papercss-integration`, the two reachable defects are corrected in the override layer and recorded with an upstream report, not by editing the framework release.
- **The latest release does not fix either defect.** `v2.0.2`, published after `v2.0.1`, ships a byte-identical `dist/paper.min.css`: same 56,984 bytes, same `sha384` digest. Its changelog states it is a dev-dependency hardening patch that changes no generated CSS. So adopting it is a provenance change with no rendered effect, and the local corrections above are still required.
- **Theme-owned CSS pins light values in several places.** `assets/css/custom.css` hardcodes `rgb(0 0 238)` for anchors, `#41403e` for nav links, and the commit feed's `#ddd`, `#eee`, `#666`, `#f4f4f4`, `#999`, `#fff` literals. `#41403e` happens to be the light palette's `--primary`, so some of these are custom-property lookups spelled out as literals.
- **The commit feed is already class-based.** `layouts/index.html` builds DOM nodes and assigns classes (`commit-entry`, `commit-meta`, `commit-hash`, …); it carries no inline color styles. Its colors are theme-owned literals in `custom.css`, which cannot vary by mode as written. Making them resolve through `var()` is the fix; the template needs no change.
- **The build has no JavaScript toolchain.** There is no root `package.json` and no `node_modules`; `static/js/search.js` is plain ES5 served verbatim, and CI runs `make check` inside a devcontainer with globally pinned linters. Introducing `js.Build` would mean creating an npm project the CI does not currently install.
- **`layouts/_default/baseof.html` is the only place `<html>` is opened**, so it is the one place the mode can be expressed globally.
- **The HTML error baseline is small.** `.htmlvalidate-baseline.json` records 238 total errors, of which 8 are `no-inline-style`; the rest are trailing whitespace. Any error this change adds must be attributed, not absorbed.

## Goals / Non-Goals

**Goals:**

- Reuse the referenced `html.dark` palette rather than authoring a parallel one.
- Put every color decision in CSS, expressed through custom properties, so that runtime-generated content cannot get out of sync with the stylesheet.
- Add no dependency surface: no npm manifest, no bundler, no new CI install step.
- Keep the feature fully inert for sites that do not opt in.
- Keep the framework reference on the latest immutable release without pretending it changes what renders.

**Non-Goals:**

- No attempt to improve the upstream dark palette's design. Where it is wrong the theme patches the symptom, and does not attempt to restyle it.
- No `data-theme` attribute abstraction. The referenced stylesheet gives us `html.dark` and only `html.dark`; inventing a second vocabulary means mapping one onto the other for no gain.
- No support for more than light and dark. No palettes, no font switching, no per-site accent color.
- No moving the commit feed out of `layouts/index.html`. It is already class-based; this change only makes its colors mode-aware.

## Decisions

### The mode is expressed as a class on `<html>`, not a data attribute

**Chosen:** JavaScript toggles `dark` on `document.documentElement`.

herdr.dev — the site this feature is modelled on — uses `data-mode="ink|paper"` plus a separate `data-palette` attribute, because it supports multiple palettes and its CSS is built around custom properties it owns. That indirection is not warranted here. The referenced framework stylesheet already defines the exact selector we need. Adding `data-theme` would mean shipping a rule that maps it onto `html.dark`, which is a second source of truth for a value the framework already reacts to.

**Alternative considered:** render the class server-side from a cookie. Rejected — it moves a purely client-side preference into the build, requires cookie handling Hugo does not do natively, and buys nothing since the pre-paint script must run anyway.

### Automatic mode is resolved in JavaScript, not CSS

**Chosen:** the pre-paint script reads a stored preference; if absent it consults `matchMedia('(prefers-color-scheme: dark)').matches` and applies the resulting class.

There is no CSS-only way to express this. The framework stylesheet keys on a class and has no media query. Resolving it in JS costs one `matchMedia` call at head-parse time and gives us a single mechanism — "apply the right class" — shared by the first paint and by later toggle clicks.

**Trade-off:** a visitor with JavaScript disabled gets light mode regardless of their system setting. Accepted: the theme's non-JS behavior is unchanged from today, and the pre-paint script is inline and cannot plausibly be blocked in a way the rest of the script is not.

### The pre-paint application is a small inline script in `head.html`, and the interactive behavior is a separate static file

**Chosen:** two pieces of JavaScript, in two places, for two different jobs.

The inline snippet is synchronous and runs before the stylesheets are processed; it does nothing but read a preference and set one class. It must be inline because a deferred or external file runs too late to prevent the flash — that is the whole point. Everything else — click handling, `aria-pressed` updates, persistence writes, the `storage` event listener — goes in `static/js/theme.js`, referenced from `baseof.html`, matching how `search.js` is delivered.

**Alternative considered:** one file, loaded synchronously in `head.html`. Rejected — it would block rendering on every page for behavior that is not needed until the visitor interacts with the control.

### The control is a two-button group using `aria-pressed`

**Chosen:** two native `<button type="button">` elements stacked vertically at the right of the navigation bar, with `aria-pressed` reflecting which is active, inside a container carrying `role="group"` and an accessible label. The buttons are labelled **Paper** (light) and **Ink** (dark) by default, each overridable through the `lightModeLabel` and `darkModeLabel` site parameters.

Keeping both options visible is simpler than a disclosure and shows the current state directly, without a summary to keep in sync or a floating panel to place. The small stacked pair is a light footprint at the end of the bar.

This follows the site the feature is modelled on, which uses two options — "ink" for dark and "paper" for light — with `aria-pressed`. The reported modes stay `light`/`dark`; "automatic" is not a selectable state but the initial one: with no stored choice the theme follows the system preference, and keeps following it when the system setting changes.

**Trade-off:** there is no in-control way back to automatic. Once a visitor chooses Paper or Ink, the choice is remembered and the system preference no longer applies until the site's stored data is cleared. Accepted: an explicit choice is the visitor's intent, and the control stays simple and unambiguous. The spec's former "choice is cleared by the visitor" scenario is dropped accordingly.

Native buttons give keyboard operation and focus handling for free — no `role` switching, no keydown handling — which satisfies the "keyboard operable" requirement without any script.

### `theme-color` is set by the pre-paint script rather than by media-query meta tags

**Chosen:** the inline snippet writes the `content` attribute of the single `<meta name="theme-color">` element based on the mode it just applied.

The usual approach is two `<meta name="theme-color">` tags with `prefers-color-scheme` media attributes. That works only when the page's mode *is* the system preference. Here the visitor can override it, at which point the media-scoped tag would advertise the wrong chrome color. Since the snippet already knows the resolved mode, having it write the value is both simpler and always correct.

### The commit feed's colors move from CSS literals to custom properties

**Chosen:** replace the literal colors in the `.commit-*` rules in `assets/css/custom.css` with `var()` lookups over the active palette.

The feed already builds class-based DOM in `layouts/index.html`; it has no inline styles to remove. The colors live in the stylesheet as literals (`#ddd`, `#eee`, `#666`, `#f4f4f4`, `#999`, `#fff`), which cannot vary by mode as written. Inline styles *can* use `var()`, but there are none here, so the correct and smaller change is to fix the rules where they live. This also keeps every color decision in one file.

### The referenced framework moves to `v2.0.2` as a provenance-only change

**Chosen:** run `make papercss-pin TAG=v2.0.2`, which rewrites `papercss.lock.json`, `layouts/partials/head.html`, and `README.md`, then verify with `scripts/check-papercss.mjs`.

Because the `v2.0.2` stylesheet is byte-identical to `v2.0.1`, the integrity digest is unchanged and nothing about the rendered page moves. `papercss-integration` prefers the latest immutable release and requires a deliberate, recorded response to a framework release; sitting on a superseded tag while carrying a local correction is exactly the ambiguity that requirement exists to remove.

**Alternative considered:** stay on `v2.0.1` because the bytes are the same. Rejected — it leaves the reference stale for no benefit once the upgrade is known to be inert, and it leaves the "is a fix available?" question open in the change record.

### Local corrections for the reachable dark-mode defects

**Chosen:** in `assets/css/custom.css`, (1) re-declare `--muted-text` under `html.dark` to `var(--muted-dark)` so `.alert-muted` text contrasts with its `--muted-light` surface, and (2) add `html.dark .background-{type} { color: var(--{type}-text) }` for the six types so the background utility's text follows its surface. Both reuse the palette's own `--*-text` variables rather than introducing new colors.

**Not chosen:** re-declaring `--primary-text`, the value the first draft targeted. It is not reachable in the theme's output, and re-declaring it under `html.dark` would regress `.alert-primary` (which relies on dark `--primary-text` on its white `--primary-light` surface). The correction and the upstream report therefore target the two reachable defects instead.

Per `papercss-integration`, a theme-local correction is permitted but must be documented with its cause, accompanied by an upstream report, and checked against whether a published release already fixes it. That check is settled: `v2.0.2` is the latest release and ships the same palette, so no release fixes either defect.

Values that stay low-contrast but legible — `.text-danger` (2.62), `.text-muted` (3.12), `.text-secondary` (3.24), `.badge` (3.32), and the non-primary `.alert-*`/`.background-*` variants (3.1-4.4) — are recorded as accepted upstream design and deliberately not restyled, per the Non-Goal of not improving the palette's design.

### Persistence uses a namespaced key

**Chosen:** `localStorage` under a key namespaced to the theme, with every access wrapped so a storage failure (Safari private browsing, disabled cookies, quota) degrades to "no stored preference."

herdr.dev reads `starlight-theme` because it is a Starlight site and that is Starlight's key. Copying the key would couple this theme to another project's storage layout for no reason.

## Risks / Trade-offs

- **The upstream dark palette is visually poor in places** beyond the two reachable defects. `--muted` is unchanged from light mode, several `-light` values go to near-white in dark, and the low-contrast text values listed above stay low. → The audit is done and its results are recorded in the change; correct only the two breakages that make text illegible and accept the rest. Say in the README that the result is "PaperCSS's dark mode, corrected", not a designed dark theme.
- **`geometry2.png` is a light-mode background texture on `<body>`.** It will sit behind the dark page and may read as a bright halo. → Determine whether it needs to be suppressed or replaced under `html.dark`. If suppressing it is the answer, that is a visual regression for dark mode that is arguably still better than an unreadable texture.
- **Two buttons in the `split-nav` may crowd the collapsed navbar** or be hidden behind the existing CSS-only hamburger on mobile. → The nav's collapsible behavior is CSS-only and has no JS hook, so the control cannot be moved or restyled by the script. Verify the control remains reachable at narrow widths as part of implementation.
- **The `v2.0.2` pin is inert only if the releases are truly byte-identical.** → After re-pinning, confirm `scripts/check-papercss.mjs` reports the same integrity as `v2.0.1`. If it differs, the byte-identical assumption is wrong; stop and explain the difference before trusting the pin.
- **The pre-paint inline script may add an htmlvalidate error.** The baseline is 238 total errors, 8 of them `no-inline-style`. → Measure the delta and attribute each new error to this change rather than re-baselining reflexively; `make check-update-baseline` can mask a regression you did not fix.

## Migration Plan

Additive and gated. A site that does not set `enableDarkMode` renders exactly as before — no control in the nav, no `dark` class, no `theme.js` request. Rollback is reverting the change or setting the parameter to `false`.

The framework re-pin is provenance-only: the stylesheet bytes and digest are unchanged, so there is no consumer-visible migration. The one migration hazard is the `assets/css/custom.css` rewrite: it touches rules that apply regardless of `enableDarkMode`. Those rules must be rewritten so their light-mode computed values are unchanged — same colors, expressed through custom properties. Verify by diffing the light-mode computed styles before and after, not by eye.

## Open Questions

None. The former open question — whether a published upstream release already corrects the `--primary-text` defect — is answered: `v2.0.2` does not, so the local correction is carried and its upstream report filed.
