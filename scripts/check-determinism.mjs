#!/usr/bin/env node
/*
 * Assert that building the example site twice produces byte-identical output.
 *
 * Run through `make check`, or directly:
 *
 *     node scripts/check-determinism.mjs
 *
 * A template that derives an identifier from `shuffle`, `md5`, `now`, or any
 * other per-invocation source makes the output differ between builds, which
 * defeats output diffing and makes preview deploys irreproducible. This check
 * builds to two temporary destinations and compares every file.
 */

import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = path.join(ROOT, "exampleSite");

function fail(message) {
  console.error(`error: ${message}`);
  process.exit(2);
}

function build(destination) {
  const run = spawnSync(
    "hugo",
    ["--themesDir", "../..", "--cleanDestinationDir", "--destination", destination],
    { cwd: SITE, encoding: "utf8" }
  );
  if (run.error) {
    fail(`could not run hugo: ${run.error.message}`);
  }
  if (run.status !== 0) {
    fail(`hugo failed:\n${run.stderr || run.stdout}`);
  }
}

function collect(dir, base = dir, out = new Map()) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collect(full, base, out);
    } else if (entry.isFile()) {
      out.set(path.relative(base, full), readFileSync(full));
    }
  }
  return out;
}

const tmp = mkdtempSync(path.join(os.tmpdir(), "check-determinism-"));
const first = path.join(tmp, "build-a");
const second = path.join(tmp, "build-b");

try {
  build(first);
  build(second);

  const a = collect(first);
  const b = collect(second);
  const differences = [];

  for (const key of new Set([...a.keys(), ...b.keys()])) {
    if (!a.has(key)) {
      differences.push(`only in the second build: ${key}`);
    } else if (!b.has(key)) {
      differences.push(`only in the first build: ${key}`);
    } else if (!a.get(key).equals(b.get(key))) {
      differences.push(`content differs: ${key}`);
    }
  }

  if (differences.length > 0) {
    console.error(`\nBuilds are not deterministic:\n  ${differences.slice(0, 50).join("\n  ")}`);
    process.exit(1);
  }

  console.log(`determinism: two builds are byte-identical (${a.size} files)`);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
