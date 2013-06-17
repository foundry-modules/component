all: join-script-files resolve-namespace wrap-script minify-script

include ../../build/modules.mk

MODULE = component

SOURCE_SCRIPT_FILES = ${SOURCE_SCRIPT_FOLDER}/${MODULE}.js \
${SOURCE_SCRIPT_FOLDER}/${MODULE}.mvc.js \
${SOURCE_SCRIPT_FOLDER}/${MODULE}.exports.js