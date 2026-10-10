#!/usr/bin/env node
/*
 * Verify the theme's reference to PaperCSS and the publishing of that release.
 *
 * Run through `make check`, or directly:
 *
 *     node scripts/check-papercss.mjs
 *     PAPERCSS_SKIP_ONLINE=1 node scripts/check-papercss.mjs   # offline check only
 *
 * Assertions:
 *   1. Offline, always: `head.html` references exactly the pinned URL and
 *      subresource-integrity digest recorded in papercss.lock.json, and the URL
 *      names the pinned tag. This is what stops the reference drifting.
 *   2. Online, best effort: the pinned URL serves bytes matching the recorded
 *      integrity, and every asset the stylesheet references by a relative
 *      address (the fonts) resolves alongside it. A network failure warns
 *      rather than fails, so the gate stays runnable offline; a hash mismatch
 *      always fails.
 */

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LOCK = path.join(ROOT, "papercss.lock.json");
const HEAD = path.join(ROOT, "layouts", "partials", "head.html");

function fail(message) {
  console.error(`error: ${message}`);
  process.exit(2);
}

function warn(message) {
  console.error(`warning: ${message}`);
}

let lock;
try {
  lock = JSON.parse(readFileSync(LOCK, "utf8"));
} catch {
  fail("papercss.lock.json is missing or unreadable");
}

const { url, integrity } = lock.stylesheet ?? {};
if (!url || !integrity) {
  fail("papercss.lock.json does not declare a stylesheet url and integrity");
}
if (!url.includes(`@${lock.tag}`)) {
  fail(`the pinned stylesheet URL does not name the tag ${lock.tag}: ${url}`);
}

const head = readFileSync(HEAD, "utf8");
if (!head.includes(url)) {
  fail(`head.html does not reference the pinned stylesheet URL:\n  ${url}`);
}
if (!head.includes(`integrity="${integrity}"`)) {
  fail(`head.html does not carry the pinned integrity digest:\n  ${integrity}`);
}

console.log(`papercss: pinned to ${lock.tag} (${lock.repository})`);

if (process.env.PAPERCSS_SKIP_ONLINE) {
  console.log("papercss: online verification skipped (PAPERCSS_SKIP_ONLINE set)");
  process.exit(0);
}

function sriOf(buffer) {
  return `sha384-${createHash("sha384").update(buffer).digest("base64")}`;
}

async function get(target) {
  const response = await fetch(target, { redirect: "follow" });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

let css;
try {
  css = await get(url);
} catch (error) {
  warn(`could not fetch the pinned stylesheet to verify it (${error.message}); skipping online checks`);
  process.exit(0);
}

const actual = sriOf(css);
if (actual !== integrity) {
  fail(`the pinned stylesheet no longer matches its integrity:\n  expected ${integrity}\n  actual   ${actual}`);
}

// Resolve every relative url(...) the stylesheet references against the
// stylesheet's own address, and confirm it serves.
const base = new URL("./", url);
const referenced = [...css.toString("utf8").matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g)]
  .map((match) => match[2].trim())
  .filter((ref) => !/^(data:|https?:|\/\/|#)/i.test(ref));

const missing = [];
for (const ref of referenced) {
  try {
    await get(new URL(ref, base).href);
  } catch (error) {
    missing.push(`${ref} (${error.message})`);
  }
}
if (missing.length > 0) {
  fail(`the pinned stylesheet references assets that do not resolve:\n  ${missing.join("\n  ")}`);
}

console.log(
  `papercss: integrity verified at ${lock.tag}, ${referenced.length} referenced asset(s) resolve`
);
