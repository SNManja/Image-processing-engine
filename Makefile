# ---- CMake wrapper (native + tests) ----
BUILD_DIR ?= build
BUILD_TYPE ?= Release

# encuentra cmake/ctest en PATH (portable a GitHub Actions y tu PC)
CMAKE  ?= $(shell command -v cmake  2>/dev/null)
CTEST  ?= $(shell command -v ctest  2>/dev/null)

.PHONY: all configure build test run clean cmake_clean wasm

all: build

configure:
	@test -n "$(CMAKE)" || (echo "ERROR: cmake not found in PATH" && exit 127)
	$(CMAKE) -S . -B $(BUILD_DIR) -DCMAKE_BUILD_TYPE=$(BUILD_TYPE)

build: configure
	$(CMAKE) --build $(BUILD_DIR) -j

test: build
	@test -n "$(CTEST)" || (echo "ERROR: ctest not found in PATH (install CMake/CTest)" && exit 127)
	$(CTEST) --test-dir $(BUILD_DIR) --output-on-failure

run: build
	./$(BUILD_DIR)/imgengine

clean: cmake_clean
cmake_clean:
	rm -rf $(BUILD_DIR)


# ---- WASM ----
EMCC = emcc
WASM_OUT_DIR = build/web
WASM_OUT = $(WASM_OUT_DIR)/engine.js
WASM_BRIDGE = web/wasm_bridge.cpp

SRCS = $(shell find src -name "*.cpp")
CLI_MAIN = src/main.cpp
CORE_SRCS = $(filter-out $(CLI_MAIN), $(SRCS))

WASM_FLAGS = -std=c++17 -O3 -Iinclude \
            -pthread \
            -s USE_PTHREADS=1 \
            -s PTHREAD_POOL_SIZE=8 \
            -s MODULARIZE=1 \
            -s EXPORT_NAME='createEngine' \
            -s EXPORTED_RUNTIME_METHODS='["cwrap", "ccall", "FS"]' \
            -s TEXTDECODER=1 \
            -s ASSERTIONS=1 \
            --bind \
            --preload-file assets/presets@/presets \
            --preload-file assets/exportedPics@/pics

WASM_FLAGS += -s INITIAL_MEMORY=1024MB
WASM_FLAGS += -s ALLOW_MEMORY_GROWTH=1
WASM_FLAGS += -s MAXIMUM_MEMORY=2048MB

wasm:
	mkdir -p $(WASM_OUT_DIR)
	$(EMCC) $(WASM_BRIDGE) $(CORE_SRCS) $(WASM_FLAGS) -o $(WASM_OUT)


DIST_DIR ?= dist

.PHONY: dist dist_clean serve

dist: wasm
	rm -rf $(DIST_DIR)
	mkdir -p $(DIST_DIR)

	cp -f $(WASM_OUT_DIR)/engine.js   $(DIST_DIR)/
	cp -f $(WASM_OUT_DIR)/engine.wasm $(DIST_DIR)/
	@if [ -f "$(WASM_OUT_DIR)/engine.data" ]; then cp -f $(WASM_OUT_DIR)/engine.data $(DIST_DIR)/; fi
	@if [ -f "$(WASM_OUT_DIR)/engine.worker.js" ]; then cp -f $(WASM_OUT_DIR)/engine.worker.js $(DIST_DIR)/; fi

	cp -f web/index.html $(DIST_DIR)/
	cp -f web/main.js    $(DIST_DIR)/

	cp -r web/ui             $(DIST_DIR)/
	cp -r web/file-processing $(DIST_DIR)/
	@if [ -d "web/vendor" ]; then cp -r web/vendor $(DIST_DIR)/; fi

	@if [ -f "web/coi-serviceworker.js" ]; then cp -f web/coi-serviceworker.js $(DIST_DIR)/; fi

dist_clean:
	rm -rf $(DIST_DIR)

