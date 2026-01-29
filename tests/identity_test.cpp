#include <catch2/catch_all.hpp>
#include "image.h"
#include "cli_helpers.h"
#include "test_utils.h"



static const std::string JSON_LINEAR  = std::string(PROJECT_ROOT) + "/tests/identity.json";
static const std::string JSON_DOUBLE_MIRROR  = std::string(PROJECT_ROOT) + "/tests/mirror.json";
static const std::string JSON_BLUR  = std::string(PROJECT_ROOT) + "/tests/blur.json";
static const std::string JSON_SHARPEN  = std::string(PROJECT_ROOT) + "/tests/sharpen.json";

TEST_CASE("Identity filter keeps image unchanged (batch)", "[identity]") {
    testBatchWithAnOperation(PICS_DIR, OUTPUT_DIR, JSON_LINEAR, [](const image<float>& src, const image<float>& dst){
        return src == dst;
    });
}

TEST_CASE("Double mirror keeps identity (batch)", "[identity]") {
    testBatchWithAnOperation(PICS_DIR, OUTPUT_DIR, JSON_DOUBLE_MIRROR, [](const image<float>& src, const image<float>& dst){
        return src == dst;
    });
}

TEST_CASE("Blur size 1 keeps identity (batch)", "[identity]") {
    testBatchWithAnOperation(PICS_DIR, OUTPUT_DIR, JSON_BLUR, [](const image<float>& src, const image<float>& dst){
        return src == dst;
    });
}



TEST_CASE("Sharpen by default keeps identity (batch)", "[identity]") {
    testBatchWithAnOperation(PICS_DIR, OUTPUT_DIR, JSON_SHARPEN, [](const image<float>& src, const image<float>& dst){
        return src == dst;
    });
}