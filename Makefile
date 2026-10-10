NOTES_REF := refs/notes/site-display

help:           ## Show this help.
	@fgrep -h "##" $(MAKEFILE_LIST) | fgrep -v fgrep | sed -e 's/\\$$//' | sed -e 's/##//'

.PHONY: run-example
run-example:  ## Run the example site. 
	@(cd exampleSite; hugo serve --themesDir ../..; cd ..)

.PHONY: generate-commits
generate-commits:   ## Generate data/commits.json for the commits homepage (see README)
	@python3 scripts/generate-commits-data.py

.PHONY: papercss-pin
papercss-pin:   ## Pin the theme to a PaperCSS release: make papercss-pin TAG=v2.0.2 (rewrites papercss.lock.json, head.html, README, then verifies)
	@test -n "$(TAG)" || (echo "Usage: make papercss-pin TAG=v2.0.2"; exit 1)
	@node scripts/pin-papercss.mjs "$(TAG)"
	@node scripts/check-papercss.mjs

.PHONY: build-example
build-example:   ## Build the example site
	@# --cleanDestinationDir matters for correctness, not tidiness: Hugo leaves
	@# output from a previous build in place when a template stops producing a
	@# page, and the verification gate would otherwise validate that stale file
	@# as though it were current output.
	@(cd exampleSite; hugo --cleanDestinationDir --themesDir ../..; cd ..)

.PHONY: check
check:   ## Run the full verification gate - build the example site, validate the generated HTML against the committed error baseline, confirm the build is deterministic, verify the pinned PaperCSS reference and the declared Hugo floor, then lint the theme's stylesheet (same sequence as CI)
	@$(MAKE) build-example
	@node scripts/check-html.mjs
	@node scripts/check-determinism.mjs
	@node scripts/check-papercss.mjs
	@node scripts/check-hugo-version.mjs
	@# stylelint resolves a shareable `extends` against the config file, the
	@# working directory, and finally a directory it infers from the node
	@# binary. The linters are installed globally and that inference does not
	@# reliably point at where npm put them, so name it explicitly.
	@stylelint --config-basedir "$$(npm root --global)" "assets/css/**/*.css"

.PHONY: check-update-baseline
check-update-baseline:   ## Re-measure the HTML error baseline. Only run this when the counts have genuinely dropped; it hides regressions you did not fix
	@$(MAKE) build-example
	@node scripts/check-html.mjs --update

.PHONY: note
note:   ## Add/edit a display-override note: make note HASH=<hash> (local only - git push does NOT push notes, run notes-push after)
	@test -n "$(HASH)" || (echo "Usage: make note HASH=<commit-hash>"; exit 1)
	@git notes --ref=$(NOTES_REF) edit $(HASH)
	@echo "Note saved locally. Run 'make notes-push' to publish it."

.PHONY: notes-push
notes-push:   ## Push refs/notes/site-display to origin (required after 'make note' - not included in a normal git push)
	@git push origin $(NOTES_REF)

.PHONY: notes-sync
notes-sync:   ## Pull refs/notes/site-display from origin (not included in a normal git fetch/pull/clone)
	@git fetch origin $(NOTES_REF):$(NOTES_REF)

# Help Source: https://gist.github.com/prwhite/8168133