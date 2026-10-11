# Proposal

## Why

The theme has never been released. There are no tags and no GitHub Releases, so a consumer cannot say which version they use: installation is a `git submodule` whose `update --remote` silently floats to whatever `main` holds. The just-merged quality-framework change proves the cost of that — it is full of **breaking** rendered-markup changes, yet there is no version to pin to, no release to cite, and no consumer-facing before/after. The downstream `ssmiller25/papercss` framework already solves this with a tag-as-source-of-truth, gates-before-publish release model; the theme should adopt the same discipline so it can be distributed and upgraded predictably.

## What Changes

- **Adopt SemVer, with the tag as the source of truth.** The first release is `v1.0.0`, cut after this work lands. A release is identified by an immutable `vX.Y.Z` tag; the theme does not stamp a version into rendered output.
- **Add a release-consistency gate.** `scripts/check-release.mjs` runs inside `make check` and derives the version from the release tag — or, with no tag, from the newest `CHANGELOG.md` section — failing when the changelog and the version named in the README do not agree with it. No version file is committed; the tag is the source of truth. Nothing is released from a tree that fails its own gates.
- **Version the changelog and add consumer upgrade guidance.** `CHANGELOG.md` gains a section per release; `UPGRADE.md` carries the before/after for breaking changes, starting with the quality-framework markup changes and the raised `min_version`.
- **Add a release pipeline.** `.github/workflows/release.yml` runs the theme's own gates via `make check` and, only if they pass, creates the GitHub Release and attaches a source archive. A `make release TAG=vX.Y.Z` target wraps the local, SSH-signed tag creation so the documented release step is a task-runner target rather than a bare `git` invocation. Nothing is published by hand.
- **Make releases verifiable.** Releases are cut from SSH-signed tags, marked immutable, and carry a build-provenance attestation, mirroring the framework.
- **Support both consumption methods, each pinned to a version.** Keep git submodules for consumers who do not want a Go toolchain, showing how to pin a submodule to an exact tag instead of a floating remote; and add a root `go.mod` so the theme is also importable as a Hugo Module, pinned in the consumer's `go.mod`/`go.sum` (`hugo mod get github.com/ssmiller25/r15-papercss-hugo-theme@v1.0.0`). The README documents installing and upgrading both ways. A documentation gate rejects any floating reference (`@latest`, branch, or bare commit) in install/upgrade instructions.
- **Polish distribution metadata.** `theme.toml` gains a unique name (avoiding collision with the several existing "PaperCSS" themes) and a `demosite`; the theme becomes eligible for the Hugo themes gallery.
- **Show the current release.** The README carries a version badge sourced dynamically from the repository's releases, so the displayed version tracks the latest release without a hand-maintained number.

## Capabilities

### New Capabilities

- `theme-versioning`: The theme's version identity — the release tag as the source of truth, reconciled with the changelog and the documentation, with a consumer-facing upgrade record for breaking changes.
- `theme-release`: How a release is produced and published — gated on the theme's own verification, published as an immutable, verifiable GitHub Release with a source archive.
- `theme-distribution`: How a consumer obtains and pins the theme — two supported methods (Hugo Modules, and a tag-pinned git submodule), each documented and each pinned to an exact version, with documentation that never points at a floating reference and a current-release version surfaced dynamically rather than hardcoded.

### Modified Capabilities

None. This change is additive: it introduces three new capabilities and changes no existing capability's requirements. It was checked against the project's existing specs — `build-verification`, `document-semantics`, `page-metadata`, `papercss-integration`, `shortcode-contract`, `template-architecture`. The only interaction is that `build-verification`'s single local entry point (`make check`) will also run the new release-consistency and distribution checks, which its existing requirement ("one documented command runs the full verification sequence", "the same gates that continuous integration runs") already covers without a text change. The release procedure's documented commands are provided as task-runner targets (`make release`) rather than bare `git` invocations, so `template-architecture`'s requirement that documented maintenance commands resolve to defined targets stays satisfied.

## Impact

**New files**
- `.github/workflows/release.yml` — tag-triggered, gates-before-publish release.
- `scripts/check-release.mjs` — tag (or newest changelog section) ↔ changelog ↔ README consistency.
- `scripts/check-distribution.mjs` — rejects floating version references in the docs.
- `go.mod` / `go.sum` — makes the theme importable as a Hugo Module.
- `UPGRADE.md` — consumer before/after for breaking changes.

**Changed files**
- `Makefile` — wire `check-release` and `check-distribution` into `make check`; a release helper.
- `CHANGELOG.md` — versioned sections.
- `README.md` — pinned installation/upgrade instructions and a dynamic current-release badge.
- `theme.toml` — unique `name`, `demosite`.
- `openspec/changes/template-quality-framework/*` — the in-flight change already documents its breaking changes; `UPGRADE.md` is where consumers read them.

**Dependencies**
- Consumers using Hugo Modules need Go; submodule consumers do not. Documented per method.

**Compatibility**
- Distribution changes are consumer-facing: existing submodule consumers can stay, but are shown how to pin a tag; module consumers are new. No rendered output changes.
