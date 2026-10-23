#!/usr/bin/env node
/*
 * Assert the table-of-contents partial renders a box only when it has entries.
 *
 * Run through `make check`, or directly:
 *
 *     make build-example && node scripts/check-toc.mjs
 *
 * Why this exists
 * ---------------
 * Hugo returns a `<nav id="TableOfContents">` element for every page, even a
 * page whose content has no headings for it to list. Testing that value for
 * truthiness therefore passes on every page, and the partial emitted an empty
 * "Table of contents" box on short pages. html-validate does not object: an
 * empty `<nav>` is valid HTML, so no existing gate can see the defect.
 *
 * What it checks
 * --------------
 *   Empty boxes     No built page contains a table-of-contents landmark without
 *                   list entries.
 *   Live coverage   At least one built page renders a populated table of
 *                   contents, so a partial that stopped rendering entirely
 *                   cannot pass by producing no boxes at all.
 *
 * The example site is read from `exampleSite/public`, which `make check`
 * builds first; this script never invokes Hugo itself.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = path.join(ROOT, "exampleSite", "public");
const TOC = /<nav id="TableOfContents"[^>]*>([\s\S]*?)<\/nav>/g;

function walk(dir) {
  const found = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      found.push(...walk(full));
    } else if (entry.endsWith(".html")) {
      found.push(full);
    }
  }
  return found;
}

if (!statSync(PUBLIC, { throwIfNoEntry: false })) {
  console.error(`error: no build output at ${PUBLIC} — run make build-example first`);
  process.exit(2);
}

const empty = [];
let populated = 0;

for (const file of walk(PUBLIC)) {
  const html = readFileSync(file, "utf8");
  const page = path.relative(PUBLIC, file);
  for (const [, inner] of html.matchAll(TOC)) {
    if (/<li[\s>]/.test(inner)) {
      populated += 1;
    } else {
      empty.push(page);
    }
  }
}

let failed = false;

for (const page of empty) {
  console.error(`error: ${page} renders a table of contents with no entries`);
  failed = true;
}

if (populated === 0) {
  console.error(
    "error: no built page renders a populated table of contents — the example site no longer exercises the partial"
  );
  failed = true;
}

if (failed) process.exit(1);

console.log(`table of contents: ${populated} populated, 0 empty`);
