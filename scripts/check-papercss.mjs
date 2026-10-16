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
 *   2. Offline, always: the override layer (`assets/css/custom.css`) neutralizes
 *      the framework's element-scoped `nav` menu presentation for the table of
 *      contents. The framework styles every `<nav>` as a menu control, which
 *      reaches Hugo's `<nav id="TableOfContents">` landmark; the override layer
 *      clears that menu-control underline and restores left alignment for the
 *      TOC only. This guard fails if either correction is dropped or if either
 *      is widened to all `nav` links or lists, so a re-leak cannot ship unseen.
 *   3. Online, best effort: the pinned URL serves bytes matching the recorded
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
const CUSTOM_CSS = path.join(ROOT, "assets", "css", "custom.css");

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

/*
 * Split a stylesheet into flat rules, recording each rule's at-rule context so
 * declarations nested in a media query are still seen. Comments are stripped
 * first. This is deliberately a small parser: it reads the override layer to
 * assert the TOC corrections are present and scoped, not to interpret CSS.
 */
function parseRules(css) {
  const source = css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\{\{[\s\S]*?\}\}/g, "");
  const rules = [];
  const stack = [];
  let buffer = "";
  for (const ch of source) {
    if (ch === "{") {
      stack.push(buffer.trim());
      buffer = "";
    } else if (ch === "}") {
      const selectors = stack.filter((part) => !part.startsWith("@") && part.length > 0);
      if (selectors.length > 0) {
        rules.push({
          selectors: selectors[selectors.length - 1].split(",").map((s) => s.trim()),
          declarations: buffer
            .split(";")
            .map((part) => {
              const colon = part.indexOf(":");
              if (colon === -1) return null;
              return {
                prop: part.slice(0, colon).trim().toLowerCase(),
                value: part.slice(colon + 1).trim().replace(/\s+/g, " ").toLowerCase(),
              };
            })
            .filter((decl) => decl && decl.prop),
        });
      }
      buffer = "";
      stack.pop();
    } else {
      buffer += ch;
    }
  }
  return rules;
}

const LINK_END = /(?:^|[\s>+~])a(?::[a-z-]+)?$/i;
const LIST_END = /(?:^|[\s>+~])ul$/i;
const BORDER_RESET = (decl) =>
  (decl.prop === "border-bottom" && /(?:^|\s)none(?:\s|$)/.test(decl.value)) ||
  (decl.prop === "border-bottom-style" && decl.value === "none") ||
  (decl.prop === "border-bottom-width" && /^0(?:px)?$/.test(decl.value));
const ALIGN_RESET = (decl) => decl.prop === "text-align" && /^(?:start|left)$/.test(decl.value);
const TOC_SCOPED = (selector) => /\.toc\b/.test(selector);
const hasImportant = (rule) => rule.declarations.some((decl) => decl.value.includes("!important"));

const overrideRules = parseRules(readFileSync(CUSTOM_CSS, "utf8"));

const borderCorrection = overrideRules.find(
  (rule) =>
    rule.selectors.some((selector) => TOC_SCOPED(selector) && LINK_END.test(selector)) &&
    rule.declarations.some(BORDER_RESET)
);
if (!borderCorrection) {
  fail(
    "the override layer no longer clears the framework's nav-link underline for the table of contents: " +
      "custom.css declares no `.toc a… { border-bottom: none }` rule"
  );
}
if (hasImportant(borderCorrection)) {
  fail("the table-of-contents border correction uses `!important`; it should win on selector specificity alone");
}

const alignCorrection = overrideRules.find(
  (rule) =>
    rule.selectors.some((selector) => TOC_SCOPED(selector) && LIST_END.test(selector)) &&
    rule.declarations.some(ALIGN_RESET)
);
if (!alignCorrection) {
  fail(
    "the override layer no longer restores left alignment for the table of contents below the framework's " +
      "menu breakpoint: custom.css declares no `.toc ul { text-align: start }` rule"
  );
}
if (hasImportant(alignCorrection)) {
  fail("the table-of-contents alignment correction uses `!important`; it should win on selector specificity alone");
}

const widened = overrideRules.find(
  (rule) =>
    rule.selectors.some(
      (selector) =>
        !TOC_SCOPED(selector) &&
        (/^nav\s+a(?::[a-z-]+)?$/i.test(selector) || /^nav\s+ul$/i.test(selector))
    ) &&
    rule.declarations.some((decl) => BORDER_RESET(decl) || ALIGN_RESET(decl))
);
if (widened) {
  fail(
    "the table-of-contents correction leaked onto all `nav` links or lists: " +
      `custom.css declares \`${widened.selectors.join(", ")}\` clearing the framework's menu presentation. ` +
      "Scope the correction to `.toc` so the main menu keeps its hand-drawn underline and centered layout."
  );
}

console.log("papercss: table-of-contents menu-presentation corrections present and scoped to .toc");

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
