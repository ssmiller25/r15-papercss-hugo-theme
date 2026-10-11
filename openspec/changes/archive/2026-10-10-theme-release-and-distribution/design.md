# Design

## Context

The theme has no release history: zero tags, zero releases, no version declared anywhere, and installation is a `git submodule` whose documented update (`--remote --merge`) floats to `main`. The just-merged quality-framework change is entirely breaking, and a consumer has no version to pin, no release to cite, and no before/after to follow.

The downstream framework, `ssmiller25/papercss`, already runs the model this change adopts: a `vX.Y.Z` tag is the single source of truth, a consistency script fails the build when the tag and the declared/documentation versions disagree, a release workflow runs the repository's own gates before publishing, and releases are immutable, signed, and attested. This change brings the same discipline to the theme, scaled to a repository that is a Hugo theme rather than a CSS package.

Constraints that shape the approach:

- **Hugo themes have no version file convention — and need none.** `theme.toml` has no `version` field, a Hugo Module's version is its git tag, and nothing in this theme reads or renders its own version. The tag is therefore the source of truth, with no committed version file; the consistency gate anchors on the tag when present, and on the newest changelog section otherwise.
- **Two consumption methods must coexist.** Submodule consumers have no Go toolchain and must keep working; module consumers want `go.mod`/`go.sum` pinning. The repository can support both: a root `go.mod` makes it importable as a module without affecting the submodule flow.
- **Some guarantees live in repository settings, not code.** Immutable releases and signed-tag requirements are GitHub settings and a maintainer's SSH signing key. The change documents them and makes the workflow depend on them, but cannot enforce them from a file.

## Goals / Non-Goals

**Goals:**
- A consumer can name and pin an exact version, by either method.
- A release cannot be published from a tree that fails the theme's own gates.
- The tag, the changelog, and the docs cannot drift.
- Releases are verifiable without trusting a manual upload.

**Non-Goals:**
- Publishing to a package registry. The theme is consumed from git or as a module, not from npm or a Go proxy index specifically.
- A themed changelog tool (towncrier, changesets, etc.). The changelog stays a hand-written Markdown file.
- Automating the first release from this change's own merge; `v1.0.0` is cut deliberately afterward.

## Decisions

### Decision 1: The tag is the source of truth; no committed version file

The release `vX.Y.Z` tag is authoritative. Because `theme.toml` has no version field, a Hugo Module's version is only its tag, and nothing in this theme reads or renders its own version, no committed version file is added — it would be a redundant copy that nothing consumes. `scripts/check-release.mjs` derives the expected version from the tag when the ref is one (`GITHUB_REF_TYPE=tag`, or `--tag`), and otherwise from the newest `CHANGELOG.md` section, then fails `make check` when the changelog and the `README.md` version do not agree with it.

**Why this differs from the framework.** `ssmiller25/papercss` does commit version files (`package.json`, `docs/data/release.json`) and reconciles them against the tag — but it needs them: one feeds npm-facing tooling and the other feeds its documentation site, which renders the version. This theme has neither consumer, so such files would carry no information the tag and the changelog do not already carry.

**Alternative considered:** a root `VERSION` file, mirroring the framework. Rejected as ceremony — a third copy of a value nothing reads, and one more file to bump on every release.

**Trade-off.** Without a file, the gate's branch-time anchor is the changelog's newest heading, so the gate parses that heading format — the same contract the framework's gate already relies on. A committed file would avoid that coupling at the cost of the redundant copy.

**Prereleases.** A candidate tag (`vX.Y.Z-rc.1`) is checked against `X.Y.Z`'s changelog section and documented version, not the candidate string: a candidate is documented as the release it prepares, and the install instructions should never name a candidate. The release workflow publishes a `-` tag as a prerelease, so a candidate never becomes the release consumers are offered as current. This also lets the release pipeline be exercised end to end with a candidate before the stable tag is cut — which matters, because an immutable release cannot be deleted if it mistakes the version.

### Decision 2: One release pipeline, gated on `make check`

`.github/workflows/release.yml` is triggered by a `v*` tag, runs the theme's own `make check` in the devcontainer, and only then creates the GitHub Release with a source archive and generated notes. This mirrors the framework's `release.yml`. The tag is created locally (SSH-signed), never by the GitHub UI, so the signed tag covers the tagged tree. A `make release TAG=vX.Y.Z` target wraps that local tag creation and prints the push command, so the documented release step is a task-runner target rather than a bare `git` invocation — which keeps `template-architecture`'s requirement ("documented maintenance commands exist as executable targets") satisfied without changing that spec.

**Alternative considered:** a `workflow_dispatch` release that builds from `main`. Rejected — releasing a moving target rather than an exact tagged commit defeats the reproducibility the pinning is for.

### Decision 3: Verifiable releases: signed tags, immutable releases, provenance

Tags are SSH-signed; releases are marked immutable; the workflow attests the source archive with `actions/attest`. This is the framework's model. Two parts are repository settings a maintainer enables once (immutable releases, registered SSH signing key) and are documented rather than encoded.

**Alternative considered:** plain releases with no attestation. Rejected for a public theme whose whole point in the framework was verifiable, reproducible artifacts.

### Decision 4: Support both Hugo Modules and a pinned submodule; never a floating reference

A root `go.mod` exposes the theme as a module so consumers can `hugo mod get …@v1.0.0` with the version in `go.mod`/`go.sum`. The submodule flow stays, but its documented command pins an exact tag rather than `--remote`. A new `scripts/check-distribution.mjs`, wired into `make check`, scans the install/upgrade docs and fails on a floating reference (`@latest`, a branch, a partial version, or a bare commit).

**Alternative considered:** submodule-only, or module-only. Rejected — submodule-only cannot express a version constraint in a build; module-only drops consumers without Go. The two are cheap to support together.

**Risk noted:** adding a root `go.mod` changes how Hugo resolves the repository. The exampleSite builds via `--themesDir`, not a module, so it should be unaffected, but the change verifies the exampleSite build and `make check` after adding it.

### Decision 5: A unique `theme.toml` name and a documented demo site

`theme.toml`'s `name` is currently `"PaperCSS"`, which collides with the several existing Hugo themes of that name. It becomes a unique name, and a `demosite` is added. This is what an index or a consumer reads to identify the theme.

### Decision 6: The current release is surfaced with a dynamic badge, not a hardcoded number

The README shows the current release with a version badge sourced dynamically from the repository's releases or tags (shields.io), so the displayed version tracks the latest release without a documentation edit — and cannot drift the way a hand-edited number would. This is deliberately separate from the install and upgrade instructions, which name exact versions: the badge *displays*, it does not *instruct*. `check-distribution.mjs` therefore exempts a dynamically-sourced version display from the exact-version rule while still rejecting floating references in the commands a consumer copies.

**Alternative considered:** a hardcoded version string near the top of the README. Rejected — it is another thing to remember to bump on every release, and it drifts silently when forgotten.

## Risks / Trade-offs

**The changelog's newest heading is the branch-time version anchor** → `check-release.mjs` derives the version from that heading when no tag is present, so the heading format becomes a small contract; the gate parses it the same way the framework's does. A missing or malformed newest heading fails the gate rather than passing silently.

**The version badge could be read as a floating reference** → The distribution check exempts a dynamically-sourced version display and scopes the exact-version rule to install/upgrade instructions; the design records that distinction so the badge is not flagged as drift.

**Adding `go.mod` breaks the existing submodule build** → The exampleSite uses `--themesDir`; verification runs `make check` after the change and must stay green before the module is announced.

**Immutable releases and signed tags are settings, not code** → Documented as a one-time setup step in the release section; the workflow still succeeds without them but the verifiability guarantee does not hold, so the setup is called out as required.

**Consumers on the old floating submodule flow** → The README keeps the submodule method but pins it; a consumer mid-update is shown the pinned command and `UPGRADE.md` carries the breaking-change notes.

## Migration Plan

1. Add `scripts/check-release.mjs` and wire it into `make check`; it anchors the version on the tag when present and on the newest changelog section otherwise. No version changes yet; the gate is inert until a tag exists or a changelog section is added.
2. Version `CHANGELOG.md` and add `UPGRADE.md` covering the quality-framework breaking changes.
3. Add `scripts/check-distribution.mjs` and rewrite the README install/upgrade sections for both methods, pinned.
4. Add a root `go.mod`; verify the exampleSite build and `make check` remain green.
5. Add `.github/workflows/release.yml`; document the one-time settings (immutable releases, SSH signing key).
6. Update `theme.toml` (name, demosite).
7. Cut `v1.0.0` after merge with `make release TAG=v1.0.0`, push the tag, and confirm the workflow publishes the release.
