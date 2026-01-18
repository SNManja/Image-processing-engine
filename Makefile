
CXX = g++
CXXFLAGS = -Wall -Iinclude -std=c++17 -O3
TARGET = imgengine

SRCS = $(shell find src -name "*.cpp")
CLI_MAIN = src/main.cpp
CORE_SRCS = $(filter-out $(CLI_MAIN), $(SRCS))

EMCC = emcc
WASM_OUT_DIR = out_web
WASM_OUT = $(WASM_OUT_DIR)/engine.js
WASM_BRIDGE = web/wasm_bridge.cpp

WASM_FLAGS = -std=c++17 -O3 -Iinclude \
			-s MODULARIZE=1 \
			-s EXPORT_NAME='createEngine' \
			-s ALLOW_MEMORY_GROWTH=1 \
			-s EXPORTED_RUNTIME_METHODS='["cwrap", "ccall", "FS"]' \
			--bind


all: $(TARGET)

$(TARGET): $(SRCS)
	$(CXX) $(CXXFLAGS) $(SRCS) -o $(TARGET)

wasm:
	mkdir -p $(WASM_OUT_DIR)
	$(EMCC) $(WASM_BRIDGE) $(CORE_SRCS) $(WASM_FLAGS) -o $(WASM_OUT)

clean:
	rm -f $(TARGET)