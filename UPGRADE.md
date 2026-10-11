# Upgrading the theme

What changed between releases, and what to do about it. The changelog records
what shipped; this records the before/after and the substitution a consumer
makes. Each section states what it was, what it is now, and what to do.

## 1.0.0

This is the first tagged release. Everything below changed on the way to it, so
a site tracking the theme by branch will need to adjust.

### The document gains landmarks, a footer, and a skip link

**What it was.** The base template emitted a bare `<main>` around page content.

**What it is now.** `baseof.html` emits a `<header>` (wrapping the nav), an
identifiable `<main id="main-content">`, and a `<footer>`, with a skip link as
the first focusable element.

**Why.** A page with no landmarks and no way to bypass the navigation is harder
to navigate with a keyboard or a screen reader.

**What to do.** If your CSS assumed there is no footer, or targeted `main`
without accounting for the id, update it. If you added your own skip link or
footer, remove it — the theme now owns both.

### Listings are marked up as lists

**What it was.** Each entry in a listing was a sibling `<h2 class="post-list">`,
so a page with twenty entries had twenty top-level headings and a meaningless
heading outline.

**What it is now.** Listings render as a list:

```html
<ul class="post-list-items">
  <li>
    <h2 class="post-list summary"><a href="…">…</a></h2>
    …
  </li>
</ul>
```

**Why.** Entries are items in a sequence, not sections of the document.

**What to do.** The `post-list` and `summary` hooks are retained, so class-based
overrides keep working. A selector that assumed the heading was a direct child
of `main` needs updating to account for the `<ul>`/`<li>`.

### Section lists paginate

**What it was.** `_default/list.html` and `recipe/list.html` rendered every page
in the section.

**What it is now.** They paginate at `pagerSize` (the example site uses 5),
adding `/page/2/` and so on.

**Why.** A large section should not render hundreds of entries on one page.

**What to do.** Set `pagination.pagerSize` in your site config to control the
page size. If you relied on a section rendering everything, raise it.

### The navigation toggle markup changed

**What it was.**

```html
<input id="collapsible1" type="checkbox">
<button>
  <label for="collapsible1"><div class="bar1"></div>…</label>
</button>
```

**What it is now.**

```html
<input id="collapsible1" type="checkbox" aria-label="Toggle navigation">
<label for="collapsible1"><span class="bar1"></span>…</label>
```

**Why.** A `<label>` may only contain phrasing content, and a `<label>` may not
be nested inside a `<button>`; both were invalid. The framework styles
`.bar1`/`.bar2`/`.bar3` by class, so the element type was never load-bearing.

**What to do.** Update CSS keyed to `button > label` or to `label div`. A
selector based on `.barN` needs no change.

### The collapsible shortcode's identifiers are deterministic

**What it was.** `{{< collapsible >}}` derived its DOM id from a reshuffled
constant seed, so every build emitted different identifiers.

**What it is now.** The id is `collapsible_<ordinal>`, stable across builds.

**Why.** Non-deterministic identifiers defeat output diffing and make preview
deploys irreproducible.

**What to do.** If your CSS keyed to a particular generated id, target the
`collapsible` prefix instead.

### Shortcode parameters are named

**What it was.** Shortcodes took positional parameters, e.g.
`{{< alert "success" >}}`.

**What it is now.** Parameters are named, e.g. `{{< alert type="success" >}}`,
and an invalid value fails the build with a message naming the parameter, the
offending value, its position, and the accepted values.

**Why.** A positional parameter's meaning depends on its position; a named one
does not, and invalid input should fail loudly rather than render wrong output.

**What to do.** Update shortcode calls in your content:

| Shortcode | Before | After |
|---|---|---|
| `alert` | `{{< alert "success" >}}` | `{{< alert type="success" >}}` |
| `background` | `{{< background "success" >}}` | `{{< background type="success" >}}` |
| `badge` | `{{< badge "success" >}}` | `{{< badge type="success" >}}` |
| `color` | `{{< color "success" >}}` | `{{< color type="success" >}}` |
| `border` | `{{< border "dashed" >}}` | `{{< border style="dashed" >}}` |
| `collapsible` | `{{< collapsible "Summary" >}}` | `{{< collapsible summary="Summary" >}}` |

`card` already used named parameters; it now also fails with a message naming an
image resource it cannot resolve, rather than a nil-reference error.

### The Hugo version floor is stated truthfully

**What it was.** `theme.toml` declared `min_version = "0.81.0"`.

**What it is now.** `min_version = "0.131.0"`.

**Why.** The old declaration was not true: `head.html` uses
`resources.ExecuteAsTemplate`, and the templates use `.Site.Language.Lang` and
`site.Data`, all of which postdate `0.81.0`. The theme has never run on the
declared floor.

**What to do.** Build with Hugo `0.131.0` or newer. If you were (somehow) on an
older version, the theme would already have failed — the declaration now matches
what it always required.

### PaperCSS moved to 2.0.1

The framework stylesheet is now the `v2.0.1` release of
[`ssmiller25/papercss`](https://github.com/ssmiller25/papercss), referenced from
jsDelivr and pinned by tag and subresource-integrity digest. The framework's own
[`UPGRADE.md`](https://github.com/ssmiller25/papercss/blob/main/UPGRADE.md) is
the canonical before/after for the framework changes. The one theme-visible
consequence:

- The framework's fonts (Neucha and Patrick Hand SC) are self-hosted by the
  referenced stylesheet. If you added the Google Fonts `<link>` that the
  framework's `2.0.0` `UPGRADE.md` suggested, remove it — the fonts now load
  automatically and the link loads them twice.
