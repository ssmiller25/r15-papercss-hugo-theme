#!/usr/bin/env node
/*
 * Reject floating version references in the theme's consumer documentation.
 *
 * Run through `make check`, or directly:
 *
 *     node scripts/check-distribution.mjs
 *
 * A consumer must be able to pin an exact version, so the install and upgrade
 * documentation may only reference exact `vX.Y.Z` versions — never a latest
 * alias, a branch, a partial version, or a bare commit. A version shown
 * dynamically (a badge sourced from the repository's releases) is a display,
 * not an instruction, and is not treated as a floating reference.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DOCS = ["README.md", "UPGRADE.md"].map((name) => path.join(ROOT, name));

// Each rule flags a shape that would let a consumer resolve something other
// than an exact version. Exact references like `@v1.0.0` do not match.
const RULES = [
  { re: /@latest\b/gi, why: "a `@latest` alias" },
  { re: /@(?:main|master|HEAD)\b/g, why: "a branch or `HEAD` reference" },
  { re: /@v?\d+\.\d+(?!\.\d)/g, why: "a partial version such as `v1.0`" },
  { re: /@v?\d+(?!\.\d)/g, why: "a major-only version such as `v1`" },
  { re: /@[0-9a-f]{7,40}\b/g, why: "a bare commit reference" },
];
const SUBMODULE_ADD = /git\s+submodule\s+add\b/;
const PINNED_SUBMODULE = /-b\s+v?\d+\.\d+\.\d+/;

const findings = [];
for (const doc of DOCS) {
  let text;
  try {
    text = readFileSync(doc, "utf8");
  } catch {
    continue;
  }
  const relative = path.relative(ROOT, doc);

  for (const { re, why } of RULES) {
    for (const match of text.matchAll(re)) {
      findings.push(`${relative}: ${why} — \`${match[0]}\``);
    }
  }

  for (const line of text.split("\n")) {
    if (SUBMODULE_ADD.test(line) && !PINNED_SUBMODULE.test(line)) {
      findings.push(`${relative}: \`git submodule add\` without a pinned tag — \`${line.trim()}\``);
    }
  }
}

if (findings.length > 0) {
  console.error(`\nFloating version references in distribution docs:\n  ${findings.join("\n  ")}`);
  console.error("\nPin an exact `vX.Y.Z` version, or move the reference out of install/upgrade instructions.");
  process.exit(1);
}

console.log("distribution: install/upgrade docs reference only exact versions");
