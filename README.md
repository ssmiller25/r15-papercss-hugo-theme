# PaperCSS

A Hugo theme made with PaperCSS, the less formal CSS framework.

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/ssmiller25/r15-papercss-hugo-theme)
[![Release](https://img.shields.io/github/v/release/ssmiller25/r15-papercss-hugo-theme)](https://github.com/ssmiller25/r15-papercss-hugo-theme/releases/latest)

Based in the excellent [original papercss-hugo-theme by Zachary Betz](https://github.com/zwbetz-gh/papercss-hugo-theme).  Mostly for persoanl use with my blog and other sub-sites, but completely usable to anyone else you might find it useful.

## Table of contents

- [PaperCSS](#papercss)
  - [Table of contents](#table-of-contents)
  - [Demo](#demo)
  - [Minimum Hugo version](#minimum-hugo-version)
  - [Installation](#installation)
  - [Updating](#updating)
  - [Run example site](#run-example-site)
  - [Configuration](#configuration)
  - [Color mode](#color-mode)
  - [PaperCSS](#papercss)
  - [Development and verification](#development-and-verification)
  - [Git commits homepage](#git-commits-homepage)
    - [Correcting a commit's displayed text](#correcting-a-commits-displayed-text)
  - [Favicons](#favicons)
  - [Shortcodes](#shortcodes)
  - [Disable toc for a blog post](#disable-toc-for-a-blog-post)
  - [Disable summary for a blog post](#disable-summary-for-a-blog-post)
  - [Getting help](#getting-help)
  - [Credits](#credits)

## Demo

https://r15-papercss-hugo.r15cookie.com

## Minimum Hugo version

Hugo version `0.131.0` or higher is required. View the [Hugo releases](https://github.com/gohugoio/hugo/releases) and download the binary for your OS. This floor is the version the theme is built and verified against; `theme.toml` declares it and `make check` fails if the two drift apart.

## Installation

There are two ways to use the theme. Both pin an exact version — do not track a
branch, because the theme's markup changes between releases and
[`UPGRADE.md`](UPGRADE.md) records what a consumer must adjust.

### As a Hugo Module (requires Go)

From the root of your site:

```
hugo mod init github.com/you/your-site
hugo mod get github.com/ssmiller25/r15-papercss-hugo-theme@v1.1.1
```

Then import it from your site configuration:

```toml
[module]
  [[module.imports]]
    path = 'github.com/ssmiller25/r15-papercss-hugo-theme'
```

The resolved version is recorded in your `go.mod` and `go.sum`, so a build is
reproducible; commit both.

### As a git submodule (no Go toolchain required)

From the root of your site:

```
git submodule add -b v1.1.1 https://github.com/ssmiller25/r15-papercss-hugo-theme.git themes/r15-papercss-hugo-theme
```

The `-b v1.1.1` pins the submodule to the release tag rather than the default
branch.

## Updating

Move the pin to the release you want — read `CHANGELOG.md` and `UPGRADE.md`
first.

Hugo Module:

```
hugo mod get github.com/ssmiller25/r15-papercss-hugo-theme@v1.1.1
```

git submodule:

```
git -C themes/r15-papercss-hugo-theme fetch --tags
git -C themes/r15-papercss-hugo-theme checkout v1.1.1
git add themes/r15-papercss-hugo-theme
```

Replace `v1.1.1` with the target release.

## Run example site

From the root of `themes/papercss-hugo-theme/exampleSite`:

```
hugo server --themesDir ../..
```

## Configuration

Copy `config.yaml` from the [`exampleSite`](https://github.com/ssmiller25/r15-papercss-hugo-theme/blob/main/exampleSite/config.yaml), then edit as desired. 

## Color mode

Set `params.enableDarkMode` to add a Paper/Ink color-mode switch to the
navigation. It is **off by default**, so a site that does not set it renders
exactly as before.

```yaml
params:
  enableDarkMode: true
```

With no stored choice the site follows the operating system's
`prefers-color-scheme`, and keeps following it when the system setting changes.
Once a visitor picks Paper or Ink, that choice is remembered in `localStorage`
and used on later visits. The mode is applied before first paint, so the page
never flashes the wrong ground, and the browser chrome color follows it.

There is no "automatic" button: to return to following the system after an
explicit choice, clear the site's stored data.

The control sits at the right of the navigation bar as two small options stacked
vertically, with the active one filled in. They are labelled **Paper** (light)
and **Ink** (dark) by default. Override either in your site configuration:

```yaml
params:
  lightModeLabel: Light
  darkModeLabel: Dark
```

## PaperCSS

This theme references PaperCSS from the maintained copy at
[`ssmiller25/papercss`](https://github.com/ssmiller25/papercss), pinned to the
immutable release **`v2.0.2`** and loaded from jsDelivr:

```
https://cdn.jsdelivr.net/gh/ssmiller25/papercss@v2.0.2/dist/paper.min.css
```

The pin is recorded in `papercss.lock.json` together with a subresource-integrity
(SRI) digest, and `head.html` carries both. A browser refuses to apply the
stylesheet if the served bytes do not match the digest, and `make check` verifies
that `head.html` still references exactly the pinned URL and digest — and, when
online, that the URL still serves those bytes and that the stylesheet's fonts
resolve. Because the tag is immutable and the bytes are integrity-checked, the
stylesheet is referenced rather than vendored.

The framework is not forked or patched. Every theme-side style lives in
`assets/css/custom.css`, which loads after the framework stylesheet, is minified
and fingerprinted, and is served with a subresource-integrity digest. The
framework's own fonts (Neucha and Patrick Hand SC) are self-hosted by the
referenced stylesheet, so the page makes no separate font request.

### Dark-mode corrections

The dark palette is PaperCSS's own, corrected in `assets/css/custom.css` where
two reachable defects would otherwise make text illegible; both are reported
upstream:

- `.alert-muted` resolved its text and its surface to the same dark value
  (`--muted-text` equals `--muted-light`), hiding the text. The theme
  re-declares `--muted-text` under `html.dark`.
- `.background-{type}` set a light surface but left the text inherited (white in
  dark), so `.background-primary` was white on white. The theme gives each type
  the matching `--{type}-text` color under `html.dark`.

Values that stay low-contrast but legible — the non-primary `.alert-*` and
`.background-*` variants, `.text-secondary`, `.text-danger`, `.text-muted`, and
`.badge` — are left as PaperCSS publishes them rather than restyled. The result
is "PaperCSS's dark mode, corrected", not a purpose-designed dark theme.

### Table-of-contents correction

PaperCSS styles the `nav` element as a navigation menu control by element type,
so its `nav a` / `nav ul` rules also reach Hugo's `<nav id="TableOfContents">`
landmark — a document landmark, not a menu. `assets/css/custom.css` opts the
table of contents out of that presentation: it clears the menu's underline on
table-of-contents links, which otherwise sits below each entry and overlaps the
one beneath it, and restores default alignment so the table of contents stays
left-aligned below the framework's 992px breakpoint. The main navigation menu
keeps its underline and centered small-screen layout. The over-broad selector is
reported upstream as
[`ssmiller25/papercss#18`](https://github.com/ssmiller25/papercss/issues/18).

## Development and verification

Run the full verification gate from the repository root:

```
make check
```

It runs the same sequence continuous integration runs:

1. builds `exampleSite` into `exampleSite/public`, cleaning stale output first;
2. validates the generated HTML against the committed error budget in
   `.htmlvalidate-baseline.json`;
3. confirms two consecutive builds are byte-identical;
4. verifies the pinned PaperCSS reference (tag, integrity digest, and resolved assets); and
5. checks that `theme.toml`'s declared Hugo floor matches the version in use.

Lower the recorded HTML error budget deliberately, after a real improvement, with
`make check-update-baseline`; a passing run never changes it on its own.

## Git commits homepage

If `data/commits.json` exists in the consuming site (generated by
`scripts/generate-commits-data.py`, run via `make generate-commits`), the
homepage shows the site's recent git commits instead of a blog post
listing. Set `params.github_repo` (owner/repo) in `config.yaml` for commit
links, and `params.enable_search` to enable the search box.

### Correcting a commit's displayed text

The homepage renders git commit messages directly, so a typo or unclear
message would otherwise be permanent-looking without editing history.
Instead, attach a "display override" note — it doesn't touch the commit
or its hash, so no history rewrite or force-push is needed:

```sh
make note HASH=<commit-hash>   # opens $EDITOR: first line = heading,
                                # blank line, then body text
make notes-push                # publish the note to origin
```

A commit with no note shows its real message, unchanged. To remove an
override: `git notes --ref=refs/notes/site-display remove <commit-hash>`.

Notes live under `refs/notes/site-display` and aren't fetched by a normal
`git pull`/clone, so pull down anyone else's notes with:

```sh
make notes-sync
```

## Favicons

Upload your image to [RealFaviconGenerator](https://realfavicongenerator.net/) then copy-paste the generated favicon files under `static`. 

## Shortcodes

See the [full list of supported shortcodes](https://papercss-hugo-theme.netlify.com/papercss-shortcodes/).

## Disable toc for a blog post

Blog posts that have two or more subheadings (`<h2>`s) automatically get a table of contents. To disable this set `toc` to `false`. For example:

```
---
title: "My page with a few headings"
toc: false
---
```

## Disable summary for a blog post

The homepage blog post listing shows a summary for each post. To disable this for an individual post set `show_summary` to `false`. For example:

```
---
title: "My page with some stellar content"
show_summary: false
---
```

## Getting help

If you run into an issue that isn't answered by this documentation or the [`exampleSite`](https://github.com/zwbetz-gh/papercss-hugo-theme/tree/master/exampleSite), then visit the [Hugo forum](https://discourse.gohugo.io/). The folks there are helpful and friendly. **Before** asking your question, be sure to read the [requesting help guidelines](https://discourse.gohugo.io/t/requesting-help/9132).

## Credits

Thank you to [Rhyne Vlaservich](https://www.vlaservich.com/) for creating [PaperCSS](https://www.getpapercss.com/), and all the  [contributors](https://github.com/papercss/papercss/graphs/contributors).
