# Proposal

## Why

The theme already ships a complete dark palette that no one can reach. The referenced PaperCSS release — `ssmiller25/papercss@v2.0.1`, loaded from jsDelivr and pinned by tag and subresource-integrity digest in `papercss.lock.json` — defines an `html.dark` block of CSS custom properties, a full dark theme written by the upstream framework. But nothing in the theme ever sets that class, and nothing reads a saved preference. Meanwhile theme-owned CSS (`assets/css/custom.css`) hardcodes light-mode values for `body`, `a:visited`, `nav a`, and the runtime-rendered commit feed, so dark mode is not a toggle away; it is unimplemented.

Visitors who want a dark ground have no way to get one, and the theme cannot claim the accessibility and comfort benefits dark mode provides at night or in low light. This change wires up the palette the theme already owns, and moves the referenced framework to the latest immutable release while the upstream question is open.

## What Changes

- Add a Paper/Ink color-mode switch to the site navigation, gated behind a new `enableDarkMode` site parameter (off by default, matching the existing `enable_search` convention). With no stored choice the site follows the system preference; once a visitor chooses, the choice is remembered.
- Apply the visitor's mode before first paint so the page never flashes the wrong ground. A stored preference wins; with no stored preference the visitor's `prefers-color-scheme` decides.
- Persist an explicit choice to `localStorage` and restore it on subsequent visits.
- Convert the theme's hardcoded light values in `assets/css/custom.css` — including the runtime-rendered commit feed's colors — into custom-property-based rules so they follow the active mode.
- Update `<meta name="theme-color">` to track the active mode.
- Re-pin the referenced PaperCSS release from `v2.0.1` to the latest immutable release, `v2.0.2`. The two releases ship a byte-identical stylesheet, so the pin's integrity digest does not change; `v2.0.2` does not correct the `--primary-text` defect, so the theme still carries its local correction.

Non-goals: no `prefers-color-scheme` fallback styling inside the referenced framework stylesheet, and no attempt to restyle the upstream palette. All corrections live in `assets/css/custom.css`.

## Capabilities

### New Capabilities
- `theme-mode-switching`: How a visitor selects, the theme persists, and the theme applies a light or dark ground — including the pre-paint application that prevents a flash, the fallback to the operating system's preference, and the requirement that every theme-owned color follow the active mode.

### Modified Capabilities
None. This change adds a new capability and complies with existing specs rather than changing them: the framework re-pin implements `papercss-integration`'s existing "pinned to an immutable release" requirement and its defect-adoption rule, and the nav control complies with `document-semantics` and `template-architecture`. No existing requirement's behavior changes, so no delta spec is required.

## Impact

- `layouts/_default/baseof.html` — the mode is applied to the root `<html>` element.
- `layouts/partials/head.html` — pre-paint application snippet, a mode-aware `theme-color`, and the re-pinned framework `<link>`.
- `layouts/partials/nav.html` — the switch control.
- `static/js/theme.js` (new) — preference read/write and control wiring, following the existing no-build pattern in `static/js/search.js`. No npm project or `js.Build` is introduced.
- `assets/css/custom.css` — hardcoded light colors replaced with mode-following rules, including the commit feed's. This file is covered by `stylelint` in `make check`.
- `exampleSite/config.yaml` — the `enableDarkMode` parameter.
- `papercss.lock.json` and `README.md` — the `v2.0.2` pin, rewritten by `make papercss-pin TAG=v2.0.2`.
- `layouts/index.html` and `static/js/search.js` — **not modified**. The commit feed already renders class-based markup; only its colors in `custom.css` change.
- The referenced framework stylesheet — **not modified**. It is consumed unmodified by reference, and `scripts/check-papercss.mjs` enforces that the pinned tag and digest match.
