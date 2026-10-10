---
title: "Papercss Shortcodes"
date: 2019-02-26T13:50:01-06:00
tags: [shortcodes]
show_summary: false
---

## collapsible

```
{{</* collapsible summary="First" */>}}
Bacon ipsum dolor sit amet beef venison beef ribs kielbasa.
{{</* /collapsible */>}}

{{</* collapsible summary="Second" */>}}
Bacon ipsum dolor sit amet landjaeger sausage brisket.
{{</* /collapsible */>}}
```

{{< collapsible summary="First" >}}
Bacon ipsum dolor sit amet beef venison beef ribs kielbasa.
{{< /collapsible >}}

{{< collapsible summary="Second" >}}
Bacon ipsum dolor sit amet landjaeger sausage brisket.
{{< /collapsible >}}

## border

```
{{</* border */>}}
Regular
{{</* /border */>}}

{{</* border style="dashed" */>}}
Dashed
{{</* /border */>}}

{{</* border style="dotted" */>}}
Dotted
{{</* /border */>}}

{{</* border style="dashed thick" */>}}
Dashed Thick
{{</* /border */>}}

{{</* border style="dotted thick" */>}}
Dotted Thick
{{</* /border */>}}
```

{{< border >}}
Regular
{{< /border >}}

{{< border style="dashed" >}}
Dashed
{{< /border >}}

{{< border style="dotted" >}}
Dotted
{{< /border >}}

{{< border style="dashed thick" >}}
Dashed Thick
{{< /border >}}

{{< border style="dotted thick" >}}
Dotted Thick
{{< /border >}}

## color

```
{{</* color type="primary" */>}}
Text primary
{{</* /color */>}}

{{</* color type="secondary" */>}}
Text secondary
{{</* /color */>}}

{{</* color type="success" */>}}
Text success
{{</* /color */>}}

{{</* color type="warning" */>}}
Text warning
{{</* /color */>}}

{{</* color type="danger" */>}}
Text danger
{{</* /color */>}}

{{</* color type="muted" */>}}
Text muted
{{</* /color */>}}
```

{{< color type="primary" >}}
Text primary
{{< /color >}}

{{< color type="secondary" >}}
Text secondary
{{< /color >}}

{{< color type="success" >}}
Text success
{{< /color >}}

{{< color type="warning" >}}
Text warning
{{< /color >}}

{{< color type="danger" >}}
Text danger
{{< /color >}}

{{< color type="muted" >}}
Text muted
{{< /color >}}

## background

```
{{</* background type="primary" */>}}
Background primary
{{</* /background */>}}

{{</* background type="secondary" */>}}
Background secondary
{{</* /background */>}}

{{</* background type="success" */>}}
Background success
{{</* /background */>}}

{{</* background type="warning" */>}}
Background warning
{{</* /background */>}}

{{</* background type="danger" */>}}
Background danger
{{</* /background */>}}
```

{{< background type="primary" >}}
Background primary
{{< /background >}}

{{< background type="secondary" >}}
Background secondary
{{< /background >}}

{{< background type="success" >}}
Background success
{{< /background >}}

{{< background type="warning" >}}
Background warning
{{< /background >}}

{{< background type="danger" >}}
Background danger
{{< /background >}}

## alert

```
{{</* alert type="primary" */>}}
Alert-primary
{{</* /alert */>}}

{{</* alert type="secondary" */>}}
Alert-secondary
{{</* /alert */>}}

{{</* alert type="success" */>}}
Alert-success
{{</* /alert */>}}

{{</* alert type="warning" */>}}
Alert-warning
{{</* /alert */>}}

{{</* alert type="danger" */>}}
Alert-danger
{{</* /alert */>}}
```

{{< alert type="primary" >}}
Alert-primary
{{< /alert >}}

{{< alert type="secondary" >}}
Alert-secondary
{{< /alert >}}

{{< alert type="success" >}}
Alert-success
{{< /alert >}}

{{< alert type="warning" >}}
Alert-warning
{{< /alert >}}

{{< alert type="danger" >}}
Alert-danger
{{< /alert >}}

## badge

```
<h3>Example badge {{</* badge */>}}123{{</* /badge */>}}</h3>

<h3>Example badge {{</* badge type="secondary" */>}}123{{</* /badge */>}}</h3>

<h3>Example badge {{</* badge type="success" */>}}123{{</* /badge */>}}</h3>

<h3>Example badge {{</* badge type="warning" */>}}123{{</* /badge */>}}</h3>

<h3>Example badge {{</* badge type="danger" */>}}123{{</* /badge */>}}</h3>
```

<h3>Example badge {{< badge >}}123{{< /badge >}}</h3>

<h3>Example badge {{< badge type="secondary" >}}123{{< /badge >}}</h3>

<h3>Example badge {{< badge type="success" >}}123{{< /badge >}}</h3>

<h3>Example badge {{< badge type="warning" >}}123{{< /badge >}}</h3>

<h3>Example badge {{< badge type="danger" >}}123{{< /badge >}}</h3>

## card

The `img` param accepts an [image page resource](https://gohugo.io/content-management/page-resources/) name.

The `command` and `options` params accept [image processing](https://gohugo.io/content-management/image-processing/#readout) args.

Required params: `img`, `command`, `options`.

Optional params: `title`, `subtitle`, `text`.

```
{{</* card
img="sun.jpg"
command="Resize"
options="900x"
title="The Sun"
subtitle="It's the Sun, dude"
text="The Sun is the star at the center of the Solar System. It is a nearly perfect sphere of hot plasma, with internal convective motion that generates a magnetic field via a dynamo process. It is by far the most important source of energy for life on Earth. [Credits](https://images.nasa.gov/details-GSFC_20171208_Archive_e000393.html)." */>}}
```



{{< card
img="sun.jpg"
command="Resize"
options="900x"
title="The Sun"
subtitle="It's the Sun, dude"
text="The Sun is the star at the center of the Solar System. It is a nearly perfect sphere of hot plasma, with internal convective motion that generates a magnetic field via a dynamo process. It is by far the most important source of energy for life on Earth. [Credits](https://images.nasa.gov/details-GSFC_20171208_Archive_e000393.html)." >}}

## With Markdown

```
{{</* border */>}}
* Testing GitHub issue <https://github.com/zwbetz-gh/papercss-hugo-theme/issues/8>
* **bold**
* _italic_
{{</* /border */>}}

{{</* color type="success" */>}}
* Testing GitHub issue <https://github.com/zwbetz-gh/papercss-hugo-theme/issues/8>
* **bold**
* _italic_
{{</* /color */>}}

{{</* background type="success" */>}}
* Testing GitHub issue <https://github.com/zwbetz-gh/papercss-hugo-theme/issues/8>
* **bold**
* _italic_
{{</* /background */>}}

{{</* alert type="success" */>}}
* Testing GitHub issue <https://github.com/zwbetz-gh/papercss-hugo-theme/issues/8>
* **bold**
* _italic_
{{</* /alert */>}}

<h3>Example badge {{</* badge type="success" */>}}[link](https://gohugo.io/functions/markdownify/), **bold**, _italic_{{</* /badge */>}}</h3>
```

{{< border >}}
* Testing GitHub issue <https://github.com/zwbetz-gh/papercss-hugo-theme/issues/8>
* **bold**
* _italic_
{{< /border >}}

<br>

{{< color type="success" >}}
* Testing GitHub issue <https://github.com/zwbetz-gh/papercss-hugo-theme/issues/8>
* **bold**
* _italic_
{{< /color >}}

<br>

{{< background type="success" >}}
* Testing GitHub issue <https://github.com/zwbetz-gh/papercss-hugo-theme/issues/8>
* **bold**
* _italic_
{{< /background >}}

<br>

{{< alert type="success" >}}
* Testing GitHub issue <https://github.com/zwbetz-gh/papercss-hugo-theme/issues/8>
* **bold**
* _italic_
{{< /alert >}}

<h3>Example badge {{< badge type="success" >}}[link](https://gohugo.io/functions/markdownify/), **bold**, _italic_{{< /badge >}}</h3>
