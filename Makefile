NOTES_REF := refs/notes/site-display

help:           ## Show this help.
	@fgrep -h "##" $(MAKEFILE_LIST) | fgrep -v fgrep | sed -e 's/\\$$//' | sed -e 's/##//'

.PHONY: run-example
run-example:  ## Run the example site. 
	@(cd exampleSite; hugo serve --themesDir ../..; cd ..)

.PHONY: build-example
build-example:   ## Build the example site
	@(cd exampleSite; hugo --themesDir ../..; cd ..)

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