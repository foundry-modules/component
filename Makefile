include ../../build/modules.mk

MODULE = component
FILENAME = ${MODULE}.js
RAWFILE = ${DEVELOPMENT_DIR}/${MODULE}.raw.js

SOURCE = ${SOURCE_DIR}/${MODULE}.js \
${SOURCE_DIR}/${MODULE}.mvc.js \
${SOURCE_DIR}/${MODULE}.exports.js

PRODUCTION = ${PRODUCTION_DIR}/${FILENAME}
DEVELOPMENT = ${DEVELOPMENT_DIR}/${FILENAME}

all: raw module clean

module:
	${WRAP} -c ${RAWFILE} > ${DEVELOPMENT}
	${UGLIFYJS} ${DEVELOPMENT} > ${PRODUCTION}

raw:
	cat ${SOURCE} | ${RESOLVE_NAMESPACE} > ${RAWFILE}

clean:
	rm -fr ${RAWFILE}
