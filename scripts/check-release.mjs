#!/usr/bin/env node
/*
 * Verify the theme's version identity before anything is released.
 *
 * Run through `make check`, or against a tag directly:
 *
 *     node scripts/check-release.mjs --tag v1.0.0
 *
 * The release tag is the source of truth, and no version file is committed.
 * With a tag (from `--tag`, or GitHub's `GITHUB_REF_TYPE=tag` and
 * `GITHUB_REF_NAME`), the changelog must carry a section for it and the README
 * must name it. With no tag, the version is the newest changelog section and the
 * README must agree with it; if there is no released version yet, there is
 * nothing to reconcile and the check is inert.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CHANGELOG = path.join(ROOT, "CHANGELOG.md");
const README = path.join(ROOT, "README.md");
const THEME = "r15-papercss-hugo-theme";
const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.]+)?$/;

function fail(message) {
  console.error(`error: ${message}`);
  process.exit(2);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const args = process.argv.slice(2);
const flagIndex = args.indexOf("--tag");
const explicitTag = flagIndex >= 0 ? args[flagIndex + 1] : undefined;
const envTag = process.env.GITHUB_REF_TYPE === "tag" ? process.env.GITHUB_REF_NAME : undefined;
const tag = explicitTag || envTag;

let changelog;
try {
  changelog = readFileSync(CHANGELOG, "utf8");
} catch {
  fail("CHANGELOG.md is missing");
}

function hasSection(version) {
  const re = new RegExp(`^##\\s+v?${escapeRegExp(version)}(\\s|—|-|$)`, "m");
  return re.test(changelog);
}

function newestChangelogVersion() {
  const match = changelog.match(/^##\s+v?(\d+\.\d+\.\d+(?:-[0-9A-Za-z.]+)?)(?=\s|—|$)/m);
  return match ? match[1] : null;
}

let version;
let source;
if (tag) {
  version = tag.replace(/^v/, "");
  if (!SEMVER.test(version)) {
    fail(`unexpected tag ${tag}; expected vX.Y.Z`);
  }
  source = `tag ${tag}`;
} else {
  version = newestChangelogVersion();
  if (!version) {
    console.log("release check: no released version yet (no tag, no changelog section); nothing to reconcile");
    process.exit(0);
  }
  source = "newest changelog section";
}

// A candidate is documented as the release it prepares: a prerelease tag
// (vX.Y.Z-rc.1) is checked against X.Y.Z's changelog section and docs, so the
// install documentation never has to name a candidate.
const documented = version.replace(/-.*$/, "");
const failures = [];
if (!hasSection(documented)) {
  failures.push(`CHANGELOG.md has no section for ${documented}`);
}

const readme = readFileSync(README, "utf8");
const anchor = `${THEME}@v${documented}`;
if (!readme.includes(anchor)) {
  failures.push(`README.md does not name the version (expected to contain ${anchor})`);
}

if (failures.length > 0) {
  console.error(`\nrelease check failed (version ${version}, from ${source}; documented as ${documented}):`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(`release check: ${version} consistent with ${documented} (changelog section and README ${anchor}), from ${source}`);
