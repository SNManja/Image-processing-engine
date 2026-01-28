cmake_minimum_required(VERSION 3.20)
project(ImageProcessingEngine LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Para tooling (clangd/VSCode)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

# Defaults estilo Makefile: -O3 y warnings
# (si preferís controlar por build type, lo ajustamos luego)
add_compile_options(-Wall)

# --- Core sources (todo src menos main.cpp) ---
file(GLOB_RECURSE CORE_SOURCES CONFIGURE_DEPENDS
    ${CMAKE_SOURCE_DIR}/src/*.cpp
)
list(REMOVE_ITEM CORE_SOURCES "${CMAKE_SOURCE_DIR}/src/main.cpp")

add_library(imgengine_core STATIC ${CORE_SOURCES})
target_include_directories(imgengine_core PUBLIC ${CMAKE_SOURCE_DIR}/include)
target_compile_options(imgengine_core PRIVATE -O3)

# Threads (por si tu core usa std::thread; en Linux suele ser necesario)
find_package(Threads REQUIRED)
target_link_libraries(imgengine_core PUBLIC Threads::Threads)

# --- CLI executable ---
add_executable(imgengine ${CMAKE_SOURCE_DIR}/src/main.cpp)
target_link_libraries(imgengine PRIVATE imgengine_core)
target_compile_options(imgengine PRIVATE -O3)

# --- Catch2 (vendorizado como submodule) ---
add_subdirectory(external/catch2)

enable_testing()

# --- Tests ---
file(GLOB TEST_SOURCES CONFIGURE_DEPENDS
    ${CMAKE_SOURCE_DIR}/tests/*.cpp
)

list(REMOVE_ITEM TEST_SOURCES "${CMAKE_SOURCE_DIR}/tests/test_main.cpp")

add_executable(imgengine_tests ${TEST_SOURCES})

target_compile_definitions(imgengine_tests PRIVATE PROJECT_ROOT="${CMAKE_SOURCE_DIR}")
target_link_libraries(imgengine_tests PRIVATE imgengine_core Catch2::Catch2WithMain)
target_include_directories(imgengine_tests PRIVATE ${CMAKE_SOURCE_DIR}/include)
target_compile_options(imgengine_tests PRIVATE -O3)

include(external/catch2/extras/Catch.cmake)
catch_discover_tests(imgengine_tests
  WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
)
