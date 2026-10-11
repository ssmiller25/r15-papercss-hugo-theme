# Releasing

The release tag is the source of truth. No version file is committed: a
`vX.Y.Z` tag is the version, and `CHANGELOG.md` and the README must agree with
it. `make check` runs `scripts/check-release.mjs`, which reconciles them — with a
tag from the environment, or, with none, from the newest changelog section.

Nothing is published by hand. Pushing a tag triggers the release workflow, which
runs the theme's own gates and, only if they pass, creates the GitHub Release.

## Cutting a release

1. Land the changes on `main` through a pull request with `make check` green.
2. Add a `CHANGELOG.md` section for the version, move any breaking change into
   `UPGRADE.md`, and update the version named in the README's install examples.
3. Confirm the three agree:

   ```sh
   node scripts/check-release.mjs --tag vX.Y.Z
   ```

4. Create and push the **signed** tag with `make release`, which prints the push
   command:

   ```sh
   make release TAG=vX.Y.Z
   ```

   The tag is created locally with `git tag -s`, so the GitHub UI cannot produce
   it; a signed tag covers the tagged tree.

5. Watch the **Release** workflow. It runs `make check`; only when the gates pass
   does it create the release and attach the source archive. If the gates fail,
   no release is created — fix the tree and re-tag rather than publishing a
   failed build.

## One-time repository setup

Two guarantees live in repository settings rather than in code:

- **Immutable releases** — enable in the repository settings so a published
  release's assets and tag cannot be altered afterward.
- **SSH signing key** — register the maintainer's SSH key as a signing key on
  GitHub, and configure git to sign tags:

  ```sh
  git config gpg.format ssh
  git config user.signingkey ~/.ssh/id_ed25519.pub
  ```

Without these the workflow still runs, but the release is not verifiable.
