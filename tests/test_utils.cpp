#include <catch2/catch_all.hpp>
#include "image.h"
#include "cli_helpers.h"
#include <dirent.h>
#include <string>
#include "test_utils.h"
#include <fstream>


bool compareImageInAndOut(const std::string& in_path, const std::string& out_path, std::function<bool(const image<float>&,const image<float>&)> compareFunc) {
    auto src = read_image(in_path);
    auto dst = read_image(out_path);
    bool ok = compareFunc(src, dst);
    return ok;
}

bool compareInAndOutFolder(const std::string& in_path, const std::string& out_path, const std::string& suffix, std::function<bool(const image<float>&, const image<float>&)> compareFunc) {
    auto inPaths = getAllFilePathsInFolder(in_path);
    
    bool allMatch = true;
    for (size_t i = 0; i < inPaths.size(); ++i) {
        const std::string& img_in_path = inPaths[i];
        const std::string& img_out_path = getImageOutPath(img_in_path, suffix);
        bool imgMatched = compareImageInAndOut(img_in_path, img_out_path, compareFunc);
        CHECK(imgMatched);
        allMatch &= imgMatched;
    }
    return allMatch;
}


std::vector<std::string> getAllFilePathsInFolder(std::string path) {
    std::vector<std::string> imagePaths;
	if (!path.empty() && path.back() != '/' && path.back() != '\\')
    	path.push_back('/');

    DIR* directory = opendir(path.c_str());
    REQUIRE(directory != nullptr);

    dirent* dirEntry = nullptr;
    while ((dirEntry = readdir(directory)) != nullptr) {
        if (dirEntry->d_type != DT_REG) continue;

        std::string fileName = dirEntry->d_name;
        size_t dotPos = fileName.find_last_of('.');
        if (dotPos == std::string::npos) continue;

        std::string ext = fileName.substr(dotPos + 1);
        if (ext != "ppm" && ext != "png") continue;

        imagePaths.push_back(path + fileName);
    }

    closedir(directory);
    return imagePaths;
}

std::string getImageOutPath(const std::string& img_path, const std::string& suffix){
    const size_t slash = img_path.find_last_of("/\\");
    const std::string fileName = (slash == std::string::npos) ? img_path : img_path.substr(slash + 1);

    const size_t dot = fileName.find_last_of('.');
    REQUIRE(dot != std::string::npos);

    const std::string base = fileName.substr(0, dot);
    const std::string ext  = fileName.substr(dot + 1);

    return OUTPUT_DIR + base + suffix + "." + ext;
}

void testBatchWithAnOperation(const std::string& in_path, const std::string& out_path, const std::string& json_path, std::function<bool(const image<float>&, const image<float>&)> compareFunc){
	batchPipelineViaJson(in_path, out_path, json_path);
	std::ifstream f(json_path);
	
	REQUIRE(f.is_open());
	nlohmann::json json = nlohmann::json::parse(f);
	
	std::string suffix = json["output_suffix"];
	bool pass = compareInAndOutFolder(in_path, out_path, suffix, compareFunc);
	REQUIRE(pass);
}