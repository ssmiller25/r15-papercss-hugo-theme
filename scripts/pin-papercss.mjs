#!/usr/bin/env node
/*
 * Re-pin the theme to a PaperCSS release.
 *
 *     make papercss-pin TAG=v2.0.2
 *     node scripts/pin-papercss.mjs v2.0.2
 *
 * Fetches `dist/paper.min.css` for the given tag from the same CDN the theme
 * loads it from, computes its size and subresource-integrity digest, and
 * rewrites the three places the pin lives:
 *
 *   - papercss.lock.json            (version, tag, url, integrity, bytes)
 *   - layouts/partials/head.html    (the <link> url and integrity)
 *   - README.md                     (the documented version and url)
 *
 * It then prints a reminder to run `make check`. Nothing is written unless the
 * fetch succeeds and the response is a stylesheet, so a bad tag cannot leave the
 * repository half-pinned.
 */

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPO = "ssmiller25/papercss";
const LOCK = path.join(ROOT, "papercss.lock.json");
const HEAD = path.join(ROOT, "layouts", "partials", "head.html");
const README = path.join(ROOT, "README.md");

function fail(message) {
  console.error(`error: ${message}`);
  process.exit(2);
}

let tag = process.argv[2];
if (!tag) {
  fail("usage: node scripts/pin-papercss.mjs <tag>   (for example v2.0.2)");
}
if (!tag.startsWith("v")) {
  tag = `v${tag}`;
}
if (!/^v\d+\.\d+\.\d+(?:-[0-9A-Za-z.]+)?$/.test(tag)) {
  fail(`tag must look like vX.Y.Z or vX.Y.Z-rc.1 (got ${tag})`);
}
const version = tag.replace(/^v/, "");
const url = `https://cdn.jsdelivr.net/gh/${REPO}@${tag}/dist/paper.min.css`;

// 1. Fetch the exact bytes the browser will load and derive the pin from them.
let response;
try {
  response = await fetch(url, { redirect: "follow" });
} catch (error) {
  fail(`could not reach ${url}: ${error.message}`);
}
if (!response.ok) {
  fail(`${url} returned ${response.status} ${response.statusText} - does the tag exist and has the CDN picked it up?`);
}
const contentType = response.headers.get("content-type") ?? "";
if (!contentType.includes("css")) {
  fail(`${url} returned "${contentType}", not CSS - the tag likely does not exist`);
}
const css = Buffer.from(await response.arrayBuffer());
if (css.length === 0) {
  fail(`${url} returned an empty stylesheet`);
}

const integrity = `sha384-${createHash("sha384").update(css).digest("base64")}`;
const bytes = css.length;

// 2. Best-effort release date from the GitHub API (not fatal if unavailable).
let released = null;
try {
  const api = await fetch(`https://api.github.com/repos/${REPO}/releases/tags/${tag}`, {
    headers: { accept: "application/vnd.github+json" },
  });
  if (api.ok) {
    released = ((await api.json()).published_at ?? "").slice(0, 10) || null;
  }
} catch {
  // leave released null
}

// 3. Rewrite the lock.
let lock;
try {
  lock = JSON.parse(readFileSync(LOCK, "utf8"));
} catch {
  fail("papercss.lock.json is missing or unreadable");
}
lock.repository = `https://github.com/${REPO}`;
lock.version = version;
lock.tag = tag;
if (released) lock.released = released;
lock.stylesheet = { url, integrity, bytes };
writeFileSync(LOCK, `${JSON.stringify(lock, null, 2)}\n`);

// 4. Rewrite the stylesheet reference in head.html.
const URL_RE = new RegExp(`https://cdn\\.jsdelivr\\.net/gh/${REPO}@[^/]+/dist/paper\\.min\\.css`);
let head = readFileSync(HEAD, "utf8");
if (!URL_RE.test(head)) {
  fail("head.html does not contain the PaperCSS CDN stylesheet URL");
}
head = head.replace(URL_RE, url);
if (/integrity="sha384-[^"]*"/.test(head)) {
  head = head.replace(/integrity="sha384-[^"]*"/, `integrity="${integrity}"`);
} else {
  fail('head.html has no integrity="sha384-…" to update on the PaperCSS link');
}
writeFileSync(HEAD, head);

// 5. Update the documented version and URL in the README, if present.
let readme = readFileSync(README, "utf8");
readme = readme.replace(URL_RE, url);
readme = readme.replace(
  /(\*\*`v)\d+\.\d+\.\d+(?:-[0-9A-Za-z.]+)?(`\*\* and loaded from jsDelivr)/,
  `$1${version}$2`
);
writeFileSync(README, readme);

console.log(`Pinned PaperCSS to ${tag}`);
console.log(`  url       ${url}`);
console.log(`  integrity ${integrity}`);
console.log(`  bytes     ${bytes}`);
console.log("\nRun `make check` to verify the pin.");
