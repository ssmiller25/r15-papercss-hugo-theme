help:           ## Show this help.
	@fgrep -h "##" $(MAKEFILE_LIST) | fgrep -v fgrep | sed -e 's/\\$$//' | sed -e 's/##//'

.phony: run-example
run-example:  ## Run the example site. 
	@(cd exampleSite; hugo serve --themesDir ../..; cd ..)

.phony: build-example
build-example:   ## Build the example site
	@(cd exampleSite; hugo --themesDir ../..; cd ..)

# Help Source: https://gist.github.com/prwhite/8168133