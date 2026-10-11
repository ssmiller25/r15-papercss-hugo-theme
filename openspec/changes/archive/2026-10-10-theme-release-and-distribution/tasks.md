# Tasks

## 1. Version Identity and Consistency Gate

*Capability: `theme-versioning`. Establishes the tag as the single source of the version and a check that keeps the changelog and the docs reconciled with it. No release is cut in this group.*

- [x] 1.1 Add `scripts/check-release.mjs` that derives the expected version from the release tag (`GITHUB_REF_TYPE=tag`, or `--tag`) when the ref is one, and otherwise from the newest `CHANGELOG.md` section, then checks that the changelog and the version named in `README.md` agree with it, failing with a message naming which source disagrees
- [x] 1.2 Wire `check-release` into the `Makefile`'s `check` target, and verify `make check` fails when the README version disagrees with the newest changelog section, and when a tag disagrees with either
- [x] 1.3 Verify the theme commits no separate version file — the tag is the only source of the theme's version — and that the check passes on a consistent tree
- [x] 1.4 Verify the check is inert with no tag and no changelog section, and that it fails only on genuine disagreement
- [x] 1.5 Support prerelease tags: check a `vX.Y.Z-<suffix>` candidate against the base version's changelog section and docs, and verify a candidate tag passes while the release workflow marks it a prerelease

## 2. Changelog and Upgrade Guidance

*Capability: `theme-versioning`. Makes the changelog consumer-facing and versioned, and adds the before/after a consumer needs for the breaking changes already merged.*

- [x] 2.1 Restructure `CHANGELOG.md` into a section per release with the newest first, promoting the current `Unreleased` content into a `1.0.0` section
- [x] 2.2 Add `UPGRADE.md` stating, for each breaking change, what it was, what it is now, and the substitution a consumer makes — covering the quality-framework markup changes and the raised `min_version`
- [x] 2.3 Verify the changelog's newest section is the version the consistency gate anchors on and links to `UPGRADE.md` for the breaking changes
- [x] 2.4 Document the release process (tag is the source of truth; gates run before publish) in a place a maintainer will find it

## 3. Release Pipeline

*Capability: `theme-release`. Turns the tag into a gated, verifiable GitHub Release.*

- [x] 3.1 Add `.github/workflows/release.yml`, triggered by a `v*` tag, that runs the theme's own `make check` and only then creates the GitHub Release with a source archive and generated notes
- [x] 3.2 Verify the workflow publishes nothing when the gates fail, via a dispatchable dry run that lists the artifact set without creating a release
- [x] 3.3 Make releases verifiable: cut tags SSH-signed, mark releases immutable, and attest the source archive with `actions/attest`; verify a released artifact's provenance and that the release cannot be mutated
- [x] 3.4 Document the one-time repository setup this depends on (immutable releases enabled; the maintainer's SSH signing key registered)
- [x] 3.5 Add a `make release TAG=vX.Y.Z` target that creates the SSH-signed tag and prints the push command, document the release procedure in terms of it, and verify it appears in `make help` and that the release documentation names no bare `git`/`gh` command as the step to run

## 4. Distribution

*Capability: `theme-distribution`. Supports both consumption methods, each pinned to an exact version, and guards the documentation against floating references.*

- [x] 4.1 Add a root `go.mod` declaring the module path, and verify the exampleSite build and `make check` remain green with it present
- [x] 4.2 Rewrite the README installation section to document both methods — Hugo Module (`hugo mod get …@vX.Y.Z`) and git submodule pinned to an exact tag — each with its prerequisite
- [x] 4.3 Rewrite the README upgrade section to document moving each method to a chosen exact version, replacing the floating `--remote` instruction
- [x] 4.4 Add `scripts/check-distribution.mjs` that scans the installation and upgrade documentation and fails on a floating reference (`@latest`, a branch, a partial version, or a bare commit), and wire it into `make check`
- [x] 4.5 Verify the distribution check catches a deliberately introduced floating reference and passes on the pinned docs
- [x] 4.6 Add a version badge to the README sourced dynamically from the repository's releases or tags, and verify it displays the latest release without a hardcoded version and is not treated as a floating reference by the distribution check

## 5. Distribution Metadata

*Capability: `theme-distribution`. Makes the theme unambiguously identifiable.*

- [x] 5.1 Give `theme.toml` a unique `name` that does not collide with an existing Hugo theme, and add a `demosite`; verify the demo address resolves and the declared `min_version` still matches the environment

## 6. Verification

*Checks that span the groups above.*

- [x] 6.1 Run the full `make check` and verify it is green with the new checks included
- [ ] 6.2 Cut a release candidate with `make release TAG=vX.Y.Z-rc.N` (for example `v1.0.0-rc.1`), push the tag, and verify the release workflow publishes a prerelease with its source archive, that the release is immutable, and that provenance verifies
- [ ] 6.3 From a scratch site, install the theme by each documented method pinned to the released (candidate) version, and verify the site builds with the pinned version and that a floating reference is rejected by the documentation check
