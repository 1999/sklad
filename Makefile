# use NODE_ENV=development by default
NODE_ENV ?= development

all:: build

clean::
	@echo "Delete node modules"
	@rm -fr ./node_modules

# default target
build::
	@echo "Install npm dependencies..."
	npm install --loglevel=http

release::
	@echo "Build production minified release..."
	@NODE_ENV=production ./node_modules/.bin/webpack

	@echo "Build development release..."
	@NODE_ENV=development ./node_modules/.bin/webpack

watch::
	@IS_DEVELOPMENT_PROCESS=1 ./node_modules/.bin/webpack

.PHONY: all build release watch
