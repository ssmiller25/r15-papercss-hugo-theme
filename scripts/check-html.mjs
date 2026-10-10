#!/usr/bin/env node
/*
 * Validate the HTML that exampleSite generates and compare the result against
 * the committed error baseline in .htmlvalidate-baseline.json.
 *
 * Run through `make check`, or directly:
 *
 *     make build-example && node scripts/check-html.mjs
 *
 * Tools invoked
 * -------------
 *   hugo            Not invoked here. `make check` builds first; this script
 *                   only reads exampleSite/public and fails with a clear
 *                   message if that build output is missing.
 *   html-validate   The only HTML validator used, and the only external
 *                   command this script runs. Called with
 *                   `--formatter=json` so its report can be counted per rule.
 *                   It parses no arguments about severity, baseline, or
 *                   exclusions - it is asked one question: is this document
 *                   valid?
 *   stylelint       Not invoked here. The CSS gate runs separately from the
 *                   Makefile, so this script and the stylesheet gate can fail
 *                   independently.
 *
 * What this script adds, because no tool above offers it
 * -------------------------------------------------------
 *   Discovery        Walking the built tree, rather than a shell glob, so the
 *                    file set does not depend on `globstar` being enabled.
 *   Scoping          Identifying Hugo's alias stubs by content and excluding
 *                    them as files, so the exclusion is visible and counted
 *                    rather than being a rule switched off in a config.
 *   Ratcheting       A per-rule ceiling read from the committed baseline.
 *                    Neither html-validate nor stylelint has any equivalent:
 *                    the only threshold either offers is `--max-warnings`,
 *                    which caps an aggregate and so lets a gain in one rule
 *                    pay for a regression in another.
 *
 * The baseline is a ratchet, not a target. Lower it with
 * `node scripts/check-html.mjs --update` (or `make check-update-baseline`)
 * once counts have actually dropped. A passing run never raises or lowers a
 * ceiling on its own.
 */

import { spawnSync } from "node:child_process";
import { closeSync, mkdtempSync, openSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = path.join(ROOT, "exampleSite", "public");
const CONFIG = path.join(ROOT, ".htmlvalidate.json");
const BASELINE = path.join(ROOT, ".htmlvalidate-baseline.json");
const ALIAS_REFRESH = /<meta\b[^>]*http-equiv\s*=\s*["']?refresh/i;

const update = process.argv.slice(2).includes("--update");

// Rules whose remaining violations are not authored by the theme. They come
// from Hugo's internal templates or from the example site's own markdown, so
// they cannot reach zero without editing files the theme does not own. Every
// rule NOT listed here is theme-owned and must reach zero: the recorded
// baseline is a ceiling, but a theme-owned rule must not be used as one.
const EXTERNAL_RULES = {
  "no-trailing-whitespace": "Hugo's internal google_analytics template and example-site content",
  "no-inline-style": "inline styles authored in example-site content",
};

function fail(message) {
  console.error(`error: ${message}`);
  process.exit(2);
}

// Walk a directory tree and return every file whose name satisfies `match`.
// Used to find empty templates independently of the generated-HTML gate.
function findFiles(dir, match, found = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return found;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findFiles(full, match, found);
    } else if (entry.isFile() && match(entry.name)) {
      found.push(full);
    }
  }
  return found;
}

// An empty template is a build failure: Hugo renders nothing for it, so a
// zero-byte 404.html silently returns an empty page rather than erroring.
// This runs before the HTML gate because it is independent of the build.
const emptyTemplates = findFiles(path.join(ROOT, "layouts"), (name) => name.endsWith(".html"))
  .filter((file) => readFileSync(file).length === 0);
if (emptyTemplates.length > 0) {
  fail(`empty template files are a build failure:\n  ${emptyTemplates.map((file) => path.relative(ROOT, file)).join("\n  ")}`);
}

function collectHtml(dir, found = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectHtml(full, found);
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      found.push(full);
    }
  }
  return found;
}

let generated;
try {
  generated = collectHtml(SITE);
} catch {
  fail("exampleSite/public does not exist - run `make build-example` first");
}

if (generated.length === 0) {
  fail("exampleSite/public contains no HTML - did the build produce output?");
}

const pages = generated.filter((file) => !ALIAS_REFRESH.test(readFileSync(file, "utf8")));
const aliases = generated.length - pages.length;

if (pages.length === 0) {
  fail("no theme-rendered pages found - the alias filter may be matching too broadly");
}

// Every generated page must declare its language and a canonical address.
// html-validate 11.x has no rule for either, so they are asserted here.
const LANG_RE = /<html\b[^>]*\blang\s*=\s*["'][^"']+["']/i;
const CANONICAL_RE = /<link\b[^>]*\brel\s*=\s*["']canonical["'][^>]*\bhref\s*=\s*["'][^"']+["']/i;
const missingMeta = pages.filter((file) => {
  const html = readFileSync(file, "utf8");
  return !LANG_RE.test(html) || !CANONICAL_RE.test(html);
});
if (missingMeta.length > 0) {
  fail(
    `pages missing a language declaration or canonical address:\n  ${missingMeta
      .map((file) => path.relative(ROOT, file))
      .join("\n  ")}`
  );
}

// `html-validate` exits non-zero whenever it reports anything, so a non-zero
// status is expected here and only an unusable report is a real failure. The
// report is streamed to a file rather than piped, because the pipe buffer
// truncates a report of this size long before it is complete.
const reportDir = mkdtempSync(path.join(os.tmpdir(), "check-html-"));
const reportPath = path.join(reportDir, "report.json");
const reportFd = openSync(reportPath, "w");

let run;
try {
  run = spawnSync("html-validate", ["--config", CONFIG, "--formatter", "json", ...pages], {
    cwd: ROOT,
    stdio: ["ignore", reportFd, "pipe"],
    encoding: "utf8",
  });
} finally {
  closeSync(reportFd);
}

if (run.error) {
  rmSync(reportDir, { recursive: true, force: true });
  fail(`could not run html-validate: ${run.error.message}`);
}

const report = readFileSync(reportPath, "utf8");
rmSync(reportDir, { recursive: true, force: true });

let results;
try {
  results = JSON.parse(report);
} catch {
  fail(`html-validate produced no parsable report (exit ${run.status})\n${run.stderr || report.slice(0, 2000)}`);
}

const byRule = {};
for (const result of results) {
  for (const message of result.messages) {
    if (message.severity !== 2) continue;
    byRule[message.ruleId] = (byRule[message.ruleId] || 0) + 1;
  }
}
const total = Object.values(byRule).reduce((sum, count) => sum + count, 0);

if (update) {
  writeFileSync(
    BASELINE,
    `${JSON.stringify(
      {
        total,
        pages: pages.length,
        aliasesExcluded: aliases,
        byRule: Object.fromEntries(Object.entries(byRule).sort(([a], [b]) => a.localeCompare(b))),
      },
      null,
      2
    )}\n`
  );
  console.log(`Updated ${path.relative(ROOT, BASELINE)}: ${total} errors across ${pages.length} pages`);
  process.exit(0);
}

let baseline;
try {
  baseline = JSON.parse(readFileSync(BASELINE, "utf8"));
} catch {
  fail(`${path.relative(ROOT, BASELINE)} is missing or unreadable - run with --update to create it`);
}

const regressions = [];
if (total > baseline.total) {
  regressions.push(`total errors: ${total} (baseline ${baseline.total})`);
}
for (const rule of new Set([...Object.keys(byRule), ...Object.keys(baseline.byRule)])) {
  if ((byRule[rule] ?? 0) > (baseline.byRule[rule] ?? 0)) {
    regressions.push(`${rule}: ${byRule[rule]} (baseline ${baseline.byRule[rule] ?? 0})`);
  }
}

// Theme-owned rules must reach zero. A rule in EXTERNAL_RULES carries a
// documented, non-zero floor because its remaining violations belong to Hugo's
// internal templates or to example-site content, not to the theme.
const themeOwned = Object.entries(byRule).filter(([rule, count]) => count > 0 && !(rule in EXTERNAL_RULES));

console.log(`html-validate: ${total} errors across ${pages.length} pages (${aliases} alias stubs excluded)`);
for (const rule of Object.keys(byRule).sort((a, b) => byRule[b] - byRule[a] || a.localeCompare(b))) {
  const count = byRule[rule];
  const allowed = baseline.byRule[rule] ?? 0;
  const mark = count > allowed ? "REGRESSION" : count < allowed ? "improved  " : "at baseline";
  const external = rule in EXTERNAL_RULES ? "  [external: not theme-authored]" : "";
  console.log(`  ${mark}  ${rule}: ${count} (baseline ${allowed})${external}`);
}
for (const rule of Object.keys(baseline.byRule).sort()) {
  if (!(rule in byRule)) {
    console.log(`  resolved    ${rule}: 0 (baseline ${baseline.byRule[rule]})`);
  }
}

if (regressions.length > 0 || themeOwned.length > 0) {
  if (regressions.length > 0) {
    console.error(`\nHTML error budget exceeded:\n  ${regressions.join("\n  ")}`);
  }
  if (themeOwned.length > 0) {
    console.error(
      `\nTheme-owned rules must reach zero:\n  ${themeOwned
        .map(([rule, count]) => `${rule}: ${count}`)
        .join("\n  ")}\nOnly rules in EXTERNAL_RULES may carry a non-zero floor.`
    );
  }
  console.error("\nFix these, or run `node scripts/check-html.mjs --update` if the baseline itself is wrong.");
  process.exit(1);
}

console.log("\nHTML error budget met.");