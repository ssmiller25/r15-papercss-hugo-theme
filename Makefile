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
note:   ## Add/edit a display-override note for a commit: make note HASH=<commit-hash>
	@test -n "$(HASH)" || (echo "Usage: make note HASH=<commit-hash>"; exit 1)
	@git notes --ref=$(NOTES_REF) edit $(HASH)
	@echo "Note saved locally. Run 'make notes-push' to publish it."

.PHONY: notes-push
notes-push:   ## Publish local display-override notes to origin
	@git push origin $(NOTES_REF)

.PHONY: notes-sync
notes-sync:   ## Fetch display-override notes from origin
	@git fetch origin $(NOTES_REF):$(NOTES_REF)

# Help Source: https://gist.github.com/prwhite/8168133