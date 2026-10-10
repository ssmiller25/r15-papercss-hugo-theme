# Design

## Context

See `proposal.md` — Why.

Constraints that shape the approach, discovered by reading the current files:

- **The dark palette is a class selector, not a media query.** `static/css/paper.css:58` keys entirely on `html.dark`. Nothing in that file reads `prefers-color-scheme`. So the system-preference fallback has to be resolved in JavaScript and expressed by toggling that class — the vendored CSS cannot do it for us.
- **The override layer already exists and already wins.** `layouts/partials/head.html` loads `css/custom.css` after `paper.css`, via `resources.ExecuteAsTemplate`. That is the correct home for every theme-owned correction, and it is the file `make check` runs stylelint against. `static/css/paper.css` is skipped by stylelint by design and must stay byte-identical to upstream.
- **The vendored dark palette is not sufficient on its own.** In `html.dark`, `--primary` flips to `#fff` but `--primary-text` is `#41403e` — the same value as `--main-background`. Any rule that resolves to `--primary-text` is therefore invisible on the dark ground. This is an upstream defect the theme inherits; per the `papercss-integration` constraints in `template-quality-framework` it must be corrected locally and recorded with an upstream report, not by editing `paper.css`.
- **Theme-owned CSS pins light values in three places.** `assets/css/custom.css` hardcodes `rgb(0 0 238)` for anchors and `#41403e` for nav links. `#41403e` happens to be the light palette's `--primary`, so these are custom-property lookups spelled out as literals.
- **`layouts/index.html` carries colors as inline styles**, not CSS: `#ddd`, `white`, `#eee`, `#666`, `#f4f4f4`, `#999`, plus a literal `background: white`. Inline styles cannot resolve custom properties to *different* values by mode without CSS, but they can reference `var()`, so the fix is to move them into a small set of theme-owned classes.
- **The build has no JavaScript toolchain.** There is no root `package.json` and no `node_modules`; `static/js/search.js` is plain ES5 served verbatim, and CI runs `make check` inside a devcontainer with globally pinned linters. Introducing `js.Build` would mean creating an npm project the CI does not currently install.
- **`layouts/_default/baseof.html` is the only place `<html>` is opened**, so it is the one place the mode can be expressed globally.

## Goals / Non-Goals

**Goals:**

- Reuse the vendored `html.dark` palette rather than authoring a parallel one.
- Put every color decision in CSS, expressed through custom properties, so that runtime-generated content cannot get out of sync with the stylesheet.
- Add no dependency surface: no npm manifest, no bundler, no new CI install step.
- Keep the feature fully inert for sites that do not opt in.

**Non-Goals:**

- No attempt to improve the upstream dark palette's design. Where it is wrong the theme patches the symptom, and does not attempt to restyle it.
- No `data-theme` attribute abstraction. The vendored CSS gives us `html.dark` and only `html.dark`; inventing a second vocabulary means mapping one onto the other for no gain.
- No support for more than light, dark, and automatic. No palettes, no font switching, no per-site accent color.
- No moving the commit feed out of `layouts/index.html`, even though inline styles there are the change's messiest part. That is a separate refactor; this change only makes the existing markup mode-aware.

## Decisions

### The mode is expressed as a class on `<html>`, not a data attribute

**Chosen:** JavaScript toggles `dark` on `document.documentElement`.

herdr.dev — the site this feature is modelled on — uses `data-mode="ink|paper"` plus a separate `data-palette` attribute, because it supports multiple palettes and its CSS is built around custom properties it owns. That indirection is not warranted here. `paper.css` already defines the exact selector we need. Adding `data-mode` would mean shipping a rule that maps it onto `html.dark`, which is a second source of truth for a value the vendored file already reacts to.

**Alternative considered:** render the class server-side from a cookie. Rejected — it moves a purely client-side preference into the build, requires cookie handling Hugo does not do natively, and buys nothing since the pre-paint script must run anyway.

### Automatic mode is resolved in JavaScript, not CSS

**Chosen:** the pre-paint script reads a stored preference; if absent it consults `matchMedia('(prefers-color-scheme: dark)').matches` and applies the resulting class.

There is no CSS-only way to express this. The vendored file keys on a class and has no media query. Resolving it in JS costs one `matchMedia` call at head-parse time and gives us a single mechanism — "apply the right class" — shared by the first paint and by later toggle clicks.

**Trade-off:** a visitor with JavaScript disabled gets light mode regardless of their system setting. Accepted: the theme's non-JS behavior is unchanged from today, and the pre-paint script is inline and cannot plausibly be blocked in a way the rest of the script is not.

### The pre-paint application is a small inline script in `head.html`, and the interactive behavior is a separate static file

**Chosen:** two pieces of JavaScript, in two places, for two different jobs.

The inline snippet is synchronous and runs before the stylesheets are processed; it does nothing but read a preference and set one class. It must be inline because a deferred or external file runs too late to prevent the flash — that is the whole point. Everything else — click handling, `aria-pressed` updates, persistence writes, the `storage` event listener — goes in `static/js/theme.js`, referenced from `baseof.html`, matching how `search.js` is delivered.

**Alternative considered:** one file, loaded synchronously in `head.html`. Rejected — it would block rendering on every page for behavior that is not needed until the visitor interacts with the control.

### The control is a three-button group using `aria-pressed`

**Chosen:** three native `<button type="button">` elements — Light, Dark, Auto — with `aria-pressed` reflecting which is active, inside a container carrying `role="group"` and an accessible label.

The site this is modelled on uses two buttons (ink/paper) with `aria-pressed`, which is a good pattern. We need a third state, because the spec requires that a visitor can return the control to automatic and have the site follow their system again. Native buttons give keyboard operation and focus handling for free — no `role` switching, no keydown handling, and it satisfies the "keyboard operable" requirement without any script.

herdr.dev's two-button version does not work here because a visitor who picks a mode has no way back to automatic without clearing site data, and the spec requires that path.

### `theme-color` is set by the pre-paint script rather than by media-query meta tags

**Chosen:** the inline snippet writes the `content` attribute of the single `<meta name="theme-color">` element based on the mode it just applied.

The usual approach is two `<meta name="theme-color">` tags with `prefers-color-scheme` media attributes. That works only when the page's mode *is* the system preference. Here the visitor can override it, at which point the media-scoped tag would advertise the wrong chrome color. Since the snippet already knows the resolved mode, having it write the value is both simpler and always correct.

### Runtime-rendered content moves from inline styles to theme-owned classes

**Chosen:** replace the six inline `style` attributes in `layouts/index.html` with classes defined in `assets/css/custom.css`, whose color declarations use `var()`.

Inline styles carrying literal hex values cannot vary by mode. Inline styles *can* use `var()`, which would be a smaller diff, but it would leave every color decision scattered through a template's `style` attributes — and those attributes are what the HTML baseline currently counts as 81 `no-inline-style` errors. Moving them to CSS both makes them mode-aware and reduces baseline errors.

**Risk noted:** `.htmlvalidate-baseline.json` records 454 committed errors, and `make check` compares against it. Removing inline styles should *reduce* the count. The Makefile's own help text warns that `check-update-baseline` "hides regressions you did not fix," so the baseline should only be re-measured if the drop is attributable to these removals — otherwise the reduced count masks an unrelated regression.

### Local correction for the upstream `--primary-text` defect

**Chosen:** in `assets/css/custom.css`, re-declare `--primary-text` under `html.dark` to a legible value, with a comment recording that this corrects an upstream defect and why the vendored version still carries it.

Per `template-quality-framework`'s `papercss-integration` capability, a theme-local correction is permitted but must be documented with its cause, accompanied by an upstream report, and checked against whether a published upstream release already fixes it. That check is a task, not an assumption — the vendored version has not been compared against the latest release for this specific defect.

### Persistence uses a namespaced key

**Chosen:** `localStorage` under a key namespaced to the theme, with every access wrapped so a storage failure (Safari private browsing, disabled cookies, quota) degrades to "no stored preference."

herdr.dev reads `starlight-theme` because it is a Starlight site and that is Starlight's key. Copying the key would couple this theme to another project's storage layout for no reason.

## Risks / Trade-offs

- **The upstream dark palette may be visually poor in places** beyond the `--primary-text` defect found. Its `--muted` value is unchanged from light mode, and several `-light` values go to near-white in dark, which will be aggressive on a dark ground. → Audit every palette value against the dark background during implementation and patch in the override layer. Accept that the result is "PaperCSS's dark mode, corrected", not a designed dark theme, and say so in the README rather than overselling it.
- **`geometry2.png` is a light-mode background texture on `<body>`.** It will sit behind the dark page and may read as a bright halo. → Determine whether it needs to be suppressed or replaced under `html.dark`. If suppressing it is the answer, that is a visual regression for dark mode that is arguably still better than an unreadable texture.
- **Three buttons in the `split-nav` may crowd the collapsed navbar** or be hidden behind the existing CSS-only hamburger on mobile. → The nav's collapsible behavior is CSS-only and has no JS hook, so the control cannot be moved or restyled by the script. Verify the control remains reachable at narrow widths as part of implementation.
- **`make check-update-baseline` can mask regressions.** → Re-measure only after attributing the error delta; do not run it reflexively.
- **Pre-paint inline script trips `htmlvalidate`.** → Inline scripts are already present in `layouts/index.html`, so this is an existing pattern, but the head script's exact error count must be captured in the task list rather than discovered at the end.

## Migration Plan

Additive and gated. A site that does not set `enableDarkMode` renders exactly as before — no control in the nav, no `dark` class, no `theme.js` request, no CSS changes, since the `html.dark` block in `paper.css` was already inert. Rollback is reverting the change or setting the parameter to `false`.

The one migration hazard is the `assets/css/custom.css` rewrite: it touches rules that apply regardless of `enableDarkMode`. Those rules must be rewritten so their light-mode computed values are unchanged — same colors, expressed through custom properties. Verify by diffing the light-mode computed styles before and after, not by eye.

## Open Questions

- Whether a published upstream PaperCSS release already corrects the `--primary-text` defect. This is a bounded check with a definite answer, and if the answer is yes the change adopts the release instead of carrying a local patch — which is a task, not an open design question.
