# PaperCSS

A Hugo theme made with PaperCSS, the less formal CSS framework.

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/ssmiller25/r15-papercss-hugo-theme)

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
  - [Favicons](#favicons)
  - [Shortcodes](#shortcodes)
  - [Disable toc for a blog post](#disable-toc-for-a-blog-post)
  - [Disable summary for a blog post](#disable-summary-for-a-blog-post)
  - [Getting help](#getting-help)
  - [Credits](#credits)

## Demo

https://r15-papercss-hugo.r15cookie.com

## Minimum Hugo version

Hugo version `0.81.0` or higher is required. View the [Hugo releases](https://github.com/gohugoio/hugo/releases) and download the binary for your OS.

## Installation

From the root of your site:

```
git submodule add https://github.com/ssmiller25/r15-papercss-hugo-theme.git themes/r15-papercss-hugo-theme
```

## Updating

From the root of your site:

```
git submodule update --remote --merge
```

## Run example site

From the root of `themes/papercss-hugo-theme/exampleSite`:

```
hugo server --themesDir ../..
```

## Configuration

Copy `config.yaml` from the [`exampleSite`](https://github.com/ssmiller25/r15-papercss-hugo-theme/blob/main/exampleSite/config.yaml), then edit as desired. 

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
