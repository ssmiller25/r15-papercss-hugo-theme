# Proposal

## Why

The theme already ships a complete dark palette that no one can reach. `static/css/paper.css:58` defines an `html.dark` block of CSS custom properties — a full dark theme, written by the upstream framework and vendored here byte-identical — but nothing in the theme ever sets that class, and nothing reads a saved preference. Meanwhile theme-owned CSS (`assets/css/custom.css`) hardcodes light-mode values for `body`, `a:visited`, and `nav a`, so dark mode is not a toggle away; it is unimplemented.

Visitors who want a dark ground have no way to get one, and the theme cannot claim the accessibility and comfort benefits dark mode provides at night or in low light. This change wires up the palette the theme already owns.

## What Changes

- Add a light/dark/auto mode switch to the site navigation, gated behind a new `enableDarkMode` site parameter (off by default, matching the existing `enable_search` convention).
- Apply the visitor's mode before first paint so the page never flashes the wrong ground. A stored preference wins; with no stored preference the visitor's `prefers-color-scheme` decides.
- Persist an explicit choice to `localStorage` and restore it on subsequent visits.
- Convert the theme's hardcoded light values in `assets/css/custom.css` into custom-property-based rules so they follow the active mode, and add the theme-owned corrections the upstream dark palette does not cover.
- Convert the hardcoded light hex colors in `layouts/index.html`'s inline commit-list script to the framework's custom properties, so the home page's commit feed is legible in dark mode.
- Update `<meta name="theme-color">` to track the active mode.

Non-goals: no `prefers-color-scheme` fallback styling inside the vendored stylesheet, and no attempt to restyle the upstream palette. All corrections live in `assets/css/custom.css`.

## Capabilities

### New Capabilities
- `theme-mode-switching`: How a visitor selects, the theme persists, and the theme applies a light or dark ground — including the pre-paint application that prevents a flash, the fallback to the operating system's preference, and the requirement that every theme-owned color follow the active mode.

### Modified Capabilities
None. `openspec/specs/` is empty, so there are no existing requirements whose behavior changes. The in-flight `template-quality-framework` change already constrains vendored-file edits and the override layer; this change complies with those constraints rather than altering them, and will be reconciled with that spec when both changes are archived.

## Impact

- `layouts/_default/baseof.html` — the mode is applied to the root `<html>` element.
- `layouts/partials/head.html` — pre-paint application snippet and a mode-aware `theme-color`.
- `layouts/partials/nav.html` — the switch control.
- `static/js/theme.js` (new) — preference read/write and control wiring, following the existing no-build pattern in `static/js/search.js`. No npm project or `js.Build` is introduced.
- `assets/css/custom.css` — hardcoded light colors replaced with mode-following rules. This file is covered by `stylelint` in `make check`.
- `layouts/index.html` — inline commit-list script colors. Refactoring this markup is gated by `.htmlvalidate-baseline.json` (454 committed errors) and may require `make check-update-baseline`.
- `exampleSite/config.yaml` — the `enableDarkMode` parameter.
- `static/css/paper.css` — **not modified**. Per the `papercss-integration` constraints in `template-quality-framework`, it must stay byte-identical to a published upstream artifact, and `make check` already skips it for stylelint.
