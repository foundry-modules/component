all: join resolve-namespace wrap-core

include ../../build/modules.mk

MODULE = component

SOURCE_FILES = ${SOURCE_DIR}/${MODULE}.js \
${SOURCE_DIR}/${MODULE}.mvc.js \
${SOURCE_DIR}/${MODULE}.exports.js