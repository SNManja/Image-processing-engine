#include "cli_helpers.h"
#include "image.h"
#include "filter.h"
#include <json.hpp>
#include <fstream>
#include <dirent.h>

std::string PICS_DIR = "./pics";
std::string OUTPUT_DIR = "./output";
std::string JSON_PATH = "./pipeline.json";
using json = nlohmann::json;

void pipelineViaJSON() {
    std::ifstream file(JSON_PATH);
    assert(file.is_open());
    json data = json::parse(file);

    assert(data.contains("pipeline") && data["pipeline"].is_array());   

    json statsConfig = json::object();
    if (data.contains("statistics")) {
        statsConfig = data["statistics"];
    }

    DIR* directory = opendir(PICS_DIR.c_str());
    assert(directory); // Directory opened successfully

    struct dirent* dirEntry;
    int numberOfImages = 0;
    while ((dirEntry = readdir(directory)) != NULL) {
        if (dirEntry->d_type == DT_REG) {
            std::string fileName = dirEntry->d_name;
            if (fileName.substr(fileName.find_last_of(".") + 1) == "ppm") {
                image src = read_image((PICS_DIR + "/" + fileName).c_str());
                image original = src; // Keep a copy of the original image
                for(const auto& step : data["pipeline"]){
                    if (step.contains("filter")) {
                        image dst;
                        std::string filterName = step.at("filter");
                        FilterDescriptor fdesc = getFilterDescriptor(filterName);
                        if (fdesc.func == nullptr) {
                            printf("Skipping unknown filter %s\n", filterName.c_str());
                            continue;
                        }
                        fdesc.func(src, dst, { step, original });
                        std::swap(src, dst);
                    }
                }
                if(data.contains("output_suffix")) {
                    std::string outputSuffix = data["output_suffix"];
                    fileName = fileName.substr(0, fileName.find_last_of(".")) + outputSuffix;
                    fileName += ".ppm";
                }
                std::string ppmOutPath = OUTPUT_DIR + "/" + fileName;

                std::string statsName = OUTPUT_DIR + "/" + fileName.substr(0, fileName.find_last_of(".")) + "_stats.json";
                calcStatistics(src, statsConfig, OUTPUT_DIR);
                printToPPM(src, ppmOutPath.c_str());
                numberOfImages++;
            }
        }
                
    }
    closedir(directory);
}

void calcStatistics(const image& img, const json& statsConfig, std::string outPath) {
    if(statsConfig.contains("histograms")){
        if(statsConfig["histograms"]["red"]) {
            // Calculate and print histogram for red channel
        }
        if(statsConfig["histograms"]["green"]) {
            // Calculate and print histogram for green channel
        }
        if(statsConfig["histograms"]["blue"]) {
            // Calculate and print histogram for blue channel
        }
    }
}