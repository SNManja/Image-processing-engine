#include <catch2/catch_all.hpp>

#include "image.h"
#include "cli_helpers.h"
#include <dirent.h>
#include <string>
#include "test_utils.h"


TEST_CASE("Double mirror keeps identity (batch)", "[identity]") {
    testBatchWithAnOperation(PICS_DIR, OUTPUT_DIR, JSON_PATH, [](const image<float>& src, const image<float>& dst){
        return src == dst;
    });
}
