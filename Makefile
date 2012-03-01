include ../../build/modules.mk

MODULE = component
FILENAME = ${MODULE}.js
RAWFILE = ${DEVELOPMENT_DIR}/${MODULE}.raw.js

SOURCE = ${SOURCE_DIR}/${MODULE}.js \
${SOURCE_DIR}/${MODULE}.mvc.js

PRODUCTION = ${PRODUCTION_DIR}/${FILENAME}
DEVELOPMENT = ${DEVELOPMENT_DIR}/${FILENAME}

all: raw module clean

module:
	${WRAP} ${RAWFILE} > ${DEVELOPMENT}
	${UGLIFYJS} ${DEVELOPMENT} > ${PRODUCTION}

raw:
	cat ${SOURCE} > ${RAWFILE}

clean:
	rm -fr ${RAWFILE}
