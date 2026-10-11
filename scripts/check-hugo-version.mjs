#!/usr/bin/env node
/*
 * Assert that theme.toml's declared minimum Hugo version matches the version
 * the environment actually builds with.
 *
 * Run through `make check`, or directly:
 *
 *     node scripts/check-hugo-version.mjs
 *
 * The declared floor must describe a version the theme has been exercised on,
 * so a mismatch fails rather than silently overstating (or understating) what
 * the theme requires.
 */

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function fail(message) {
  console.error(`error: ${message}`);
  process.exit(2);
}

const themeToml = readFileSync(path.join(ROOT, "theme.toml"), "utf8");
const declared = (themeToml.match(/^\s*min_version\s*=\s*"([^"]+)"/m) || [])[1];
if (!declared) {
  fail("theme.toml does not declare a min_version");
}

const run = spawnSync("hugo", ["version"], { encoding: "utf8" });
if (run.error) {
  fail(`could not run hugo: ${run.error.message}`);
}

const exercised = (run.stdout.match(/v(\d+\.\d+\.\d+)/) || [])[1];
if (!exercised) {
  fail(`could not parse a version from \`hugo version\`:\n${run.stdout}`);
}

if (declared !== exercised) {
  fail(
    `theme.toml declares min_version ${declared}, but the environment builds with ${exercised}. ` +
      `Update theme.toml (and the devcontainer pin) so they agree.`
  );
}

console.log(`hugo version: declared min_version ${declared} matches the exercised ${exercised}`);
