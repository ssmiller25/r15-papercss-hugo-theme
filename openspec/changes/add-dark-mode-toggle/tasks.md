# Tasks

## 1. Upstream check before writing any code

Both risks flagged during planning are settled here, against the PaperCSS release this theme actually vendors. If upstream has since fixed either one, the work in groups 3-6 changes shape; do not start them before this group completes.

- [ ] 1.1 **Flagged risk 1 — palette defect.** Determine which PaperCSS release the theme currently vendors and compare it against the latest published release. Verify whether a newer release exists, and whether it corrects the `--primary-text` defect — the `html.dark` block setting `--primary-text` to `#41403e`, the same value as `--main-background`, which makes anything resolving to it invisible on the dark ground. Confirm the finding against the vendored file rather than taking it from design.md. Record the vendored version in the repository per the `papercss-integration` requirements in `template-quality-framework`.
- [ ] 1.2 **Flagged risk 2 — nav reachability.** Determine whether the vendored release's `.split-nav` and `.collapsible` rules place any upper bound on nav child width, or hide or overflow the collapsible body below a breakpoint — the condition under which a three-button control in the nav would be clipped or unreachable on narrow screens. Verify by reading the vendored rules and, if ambiguous, by rendering the nav at a narrow viewport with placeholder buttons before the real markup exists. This exists because the nav is CSS-only with no JavaScript hook, so the control cannot be repositioned or restyled by script; if it does not fit, the fallback (a control outside the nav) must be decided here, not discovered in 4.6.
- [ ] 1.3 Based on 1.1, choose: adopt the newer release if it corrects the defect, or keep the vendored version and carry a local correction. Verify the choice is written down with its reason before any override-layer edit is made.
- [ ] 1.4 Audit every color in the vendored `html.dark` block against the dark background for legibility, using whichever release 1.3 settled on. Verify each unusable value is listed explicitly — do not assume the palette is otherwise sound, since `--muted` is unchanged from light mode and several `-light` values go to near-white.

## 2. Site parameter

- [ ] 2.1 Add `enableDarkMode: true` to `exampleSite/config.yaml` params, alongside the existing `enable_search`. Verify a build succeeds and the parameter is readable as `site.Params.enableDarkMode`.
- [ ] 2.2 Confirm the parameter defaults to off for sites that do not set it. Verify a build of a site without the parameter renders no mode control and requests no theme script.

## 3. Pre-paint mode resolution

- [ ] 3.1 Add a synchronous inline script to `layouts/partials/head.html`, before the stylesheet links, that reads a stored preference from `localStorage` under a theme-namespaced key and, if absent, consults `matchMedia('(prefers-color-scheme: dark)')`. Verify the mode is applied to `document.documentElement` as the `dark` class.
- [ ] 3.2 Wrap every `localStorage` access in the script so a storage failure (private browsing, disabled storage, quota) degrades to no stored preference rather than throwing. Verify the page still renders and the system preference is honored when storage is unavailable.
- [ ] 3.3 Make the script also set the `content` of the existing `<meta name="theme-color">` element to match the mode it just applied, per design.md. Verify the value matches the rendered ground in both modes.
- [ ] 3.4 Confirm the script is positioned so it executes before the stylesheets are processed. Verify by loading a page in dark mode with a stored preference and confirming no light flash occurs.

## 4. Mode control

- [ ] 4.1 Add the three-button control to `layouts/partials/nav.html`, gated on `site.Params.enableDarkMode`. Use native `<button type="button">` elements in a `role="group"` container with an accessible label, per design.md. Verify the group is absent when the parameter is off and present when on.
- [ ] 4.2 Create `static/js/theme.js` handling click on each button: write the chosen mode to `localStorage`, apply the `dark` class to `<html>`, and update every button's `aria-pressed` to reflect the active mode. Verify the `aria-pressed` state matches the rendered mode after a click.
- [ ] 4.3 Handle the Auto button: clearing the stored preference so later visits follow the system again. Verify that returning the control to Auto and reloading produces the system-preference mode.
- [ ] 4.4 Reference `static/js/theme.js` from `layouts/_default/baseof.html`, gated on the parameter and matching the delivery style of `search.js`. Verify no `js.Build`, no bundler config, and no root `package.json` are introduced, and the file is served verbatim from `static/`.
- [ ] 4.5 Verify the control is reachable and operable by keyboard alone, tabbing to it and activating with Enter and Space, with a visible focus indicator in both modes.
- [ ] 4.6 Verify the control is reachable and operable at narrow widths, confirming the behavior 1.2 predicted. If it was clipped or unreachable, implement the fallback 1.2 selected rather than reopening the placement question here. Record the observed behavior.

## 5. Theme-owned CSS

- [ ] 5.1 Rewrite the anchor rule in `assets/css/custom.css` (`a, a:visited`, currently `rgb(0 0 238)`) to resolve through the active mode's palette. Verify the light-mode computed color is unchanged from before the rewrite — this rule applies whether or not dark mode is enabled.
- [ ] 5.2 Rewrite the nav link rule (`nav a, nav a:visited`, currently `#41403e`) the same way. Verify its light-mode computed color is unchanged, and that the existing `no-descending-specificity` disable block and its explanatory comment are preserved intact.
- [ ] 5.3 Decide how the `<body>` `geometry2.png` background texture behaves under `html.dark`. Verify the dark page does not show a light texture reading as a bright halo, and that the light page is unaffected.
- [ ] 5.4 Apply the `html.dark` corrections identified in 1.4, including the `--primary-text` value — unless 1.3 adopted a release that already fixes it, in which case verify the defect is gone from the vendored file and carry no local patch. For each remaining correction, verify a comment records the framework rule it counteracts and why the vendored version still carries the defect, per `template-quality-framework`'s correction requirements.
- [ ] 5.5 Confirm no literal color value in `assets/css/custom.css` is pinned to a single mode. Verify by searching the file for hex and `rgb()` literals and confirming each remaining one is either a comment or intentional.
- [ ] 5.6 Open an upstream report for the `--primary-text` defect, referencing the vendored version. Verify the report exists and that local work did not wait on it.

## 6. Runtime-rendered commit feed

- [ ] 6.1 Move the colors out of the six inline `style` attributes in `layouts/index.html` into classes defined in `assets/css/custom.css`, using `var()` for every color. Covers the `#ddd` borders, `white` background, `#eee` divider, `#666` meta text, `#f4f4f4` hash chip, and `#999` status label.
- [ ] 6.2 Verify the commit feed is legible in dark mode: text, borders, and backgrounds all resolve to values readable against the dark ground, and no value is one that only works on a light background.
- [ ] 6.3 Verify the commit feed updates its colors when the mode changes without a page load, since it is rendered at runtime after the stylesheet has loaded.
- [ ] 6.4 Record the htmlvalidate error delta attributable to 6.1 before touching the baseline. Verify each removed error traces to an inline style this task deleted, and that no error of another class appeared.

## 7. Integration checks

- [ ] 7.1 Run `make check` and verify the build, `scripts/check-html.mjs`, and stylelint all pass. Address any new htmlvalidate error from the head script or nav markup rather than accepting it.
- [ ] 7.2 Re-measure `.htmlvalidate-baseline.json` only if the count changed, and only after 6.4 attributes the change. Verify the new baseline does not hide an error class that was not previously present.
- [ ] 7.3 Verify `static/css/paper.css` is byte-identical to its state before this change, confirming no vendored-file edit crept in.
- [ ] 7.4 Walk each scenario in `specs/theme-mode-switching/spec.md` against a running build: stored preference wins, no preference follows the system, no system preference falls back to light, mode survives navigation, Auto clears the preference, the control reports and is keyboard operable, and theme-owned and runtime-rendered colors both follow the mode.

## 8. Documentation

- [ ] 8.1 Document `enableDarkMode` in the theme's README alongside `enable_search` — what it does, that it defaults to off, and that automatic mode follows `prefers-color-scheme`. Verify the documented setting produces the described behavior.
- [ ] 8.2 State plainly in the README that dark mode is PaperCSS's own vendored palette with local corrections applied, not a purpose-designed dark theme, and list the corrections made. Verify each listed correction is present in `assets/css/custom.css`.
