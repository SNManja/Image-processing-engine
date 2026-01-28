# ---- CMake wrapper (native + tests) ----
BUILD_DIR ?= build
BUILD_TYPE ?= Release
CMAKE := /usr/bin/cmake

.PHONY: all configure build test run clean cmake_clean wasm

all: build

configure:
	$(CMAKE) -S . -B $(BUILD_DIR) -DCMAKE_BUILD_TYPE=$(BUILD_TYPE)

build: configure
	$(CMAKE) --build $(BUILD_DIR) -j

test: build
	ctest --test-dir $(BUILD_DIR) --output-on-failure

run: build
	./$(BUILD_DIR)/imgengine

clean: cmake_clean

cmake_clean:
	rm -rf $(BUILD_DIR)


# ---- WASM ----
EMCC = emcc
WASM_OUT_DIR = out_web
WASM_OUT = $(WASM_OUT_DIR)/engine.js
WASM_BRIDGE = web/wasm_bridge.cpp

SRCS = $(shell find src -name "*.cpp")
CLI_MAIN = src/main.cpp
CORE_SRCS = $(filter-out $(CLI_MAIN), $(SRCS))

WASM_FLAGS = -std=c++17 -O3 -Iinclude \
            -pthread \
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
