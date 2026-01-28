#include <catch2/catch_all.hpp>

#include "image.h"
#include "cli_helpers.h"
#include <dirent.h>
#include <string>

static const std::string PICS_DIR   = "./pics/";
static const std::string OUTPUT_DIR = "./tests/test_output/";
static const std::string JSON_PATH  = "./tests/mirror.json";

TEST_CASE("Double mirror keeps identity (batch)", "[mirror]") {
    batchPipelineViaJson(PICS_DIR, OUTPUT_DIR, JSON_PATH);

    DIR* directory = opendir(PICS_DIR.c_str());
    REQUIRE(directory != nullptr);

    bool pass = true;

    dirent* dirEntry = nullptr;
    while ((dirEntry = readdir(directory)) != nullptr) {
        if (dirEntry->d_type != DT_REG) continue;

        std::string fileName = dirEntry->d_name;
        size_t dotPos = fileName.find_last_of('.');
        if (dotPos == std::string::npos) continue;

        std::string name = fileName.substr(0, dotPos);
        std::string ext  = fileName.substr(dotPos + 1);

        if (ext != "ppm" && ext != "png") continue;

        std::string in_path  = PICS_DIR + fileName;
        std::string out_path = OUTPUT_DIR + name + "_mirror." + ext;

        auto src = read_image(in_path);
        auto dst = read_image(out_path);

        // Cada archivo cuenta como un "sub-check" con contexto
        INFO("file=" << fileName);
        CHECK(src == dst);

        pass = pass && (src == dst);
    }

    closedir(directory);

    REQUIRE(pass);
}
