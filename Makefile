
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


all: $(TARGET)

$(TARGET): $(SRCS)
	$(CXX) $(CXXFLAGS) $(SRCS) -o $(TARGET)

wasm:
	mkdir -p $(WASM_OUT_DIR)
	$(EMCC) $(WASM_BRIDGE) $(CORE_SRCS) $(WASM_FLAGS) -o $(WASM_OUT)

clean:
	rm -f $(TARGET) $(TEST_BIN)



TEST_BIN = run_test
TEST_SRCS = $(wildcard tests/*.cpp)
TEST_CXXFLAGS = $(CXXFLAGS) -Iexternal/catch2/src -Itests


CATCH2_IMPL = external/catch2/src/catch_all.cpp

test: $(CORE_SRCS) $(TEST_SRCS) $(CATCH2_IMPL)
	@test -f external/catch2/src/catch_all.hpp -o -f external/catch2/src/catch2/catch.hpp || \
	( echo "Missing Catch2 submodule. Run: git submodule update --init --recursive" && exit 1 )
	$(CXX) $(TEST_CXXFLAGS) $^ -o $(TEST_BIN)
	./$(TEST_BIN)
