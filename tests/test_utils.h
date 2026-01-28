#include <catch2/catch_all.hpp>

#include "image.h"
#include "cli_helpers.h"
#include <dirent.h>
#include <string>

std::vector<std::string> getAllFilePathsInFolder(std::string path);
std::string getImageOutPath(const std::string& img_path, const std::string& suffix);
bool compareImageInAndOut(const std::string& in_path, const std::string& out_path, std::function<bool(const image<float>&, const image<float>&)> compareFunc);
void testBatchWithAnOperation(const std::string& in_path, const std::string& out_path, const std::string& json_path, std::function<bool(const image<float>&, const image<float>&)> compareFunc);

static const std::string JSON_PATH  = std::string(PROJECT_ROOT) + "/tests/identity.json";
static const std::string PICS_DIR   = std::string(PROJECT_ROOT) + "/pics/";
static const std::string OUTPUT_DIR = std::string(PROJECT_ROOT) + "/tests/test_output/";
