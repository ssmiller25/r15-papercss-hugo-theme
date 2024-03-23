HUGO_VERSION := 0.122.0

help:           ## Show this help.
	@fgrep -h "##" $(MAKEFILE_LIST) | fgrep -v fgrep | sed -e 's/\\$$//' | sed -e 's/##//'

.phony: run-example
run-example: .bin/hugo   ## Run the example site
	@(cd exampleSite; ../.bin/hugo serve --themesDir ../..; cd ..)

.phony: build-example
build-example: .bin/hugo   ## Build the example site
	@(cd exampleSite; ../.bin/hugo --themesDir ../..; cd ..)


.bin/hugo:
	@mkdir .bin || true
	@curl -Lo .bin/hugo.tar.gz https://github.com/gohugoio/hugo/releases/download/v$(HUGO_VERSION)/hugo_$(HUGO_VERSION)_linux-amd64.tar.gz
	@tar -xzf .bin/hugo.tar.gz -C .bin
	@rm .bin/hugo.tar.gz

# Help Source: https://gist.github.com/prwhite/8168133