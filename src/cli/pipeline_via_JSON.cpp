#include "cli_helpers.h"
#include "image.h"
#include "filter.h"
#include <json.hpp>
#include <fstream>
#include <dirent.h>
#include "histogram.h"


using json = nlohmann::json;

void clearFolder(std::string path){
    DIR* directory = opendir(path.c_str());
    if(!directory){
        return;
    }
    struct dirent* dirEntry;
    while((dirEntry = readdir(directory)) != NULL){
        // TODO delete file
        if(dirEntry->d_type == DT_REG || dirEntry->d_type == DT_LNK) {
            std::string filePath = path + "/" + dirEntry->d_name;
            if (remove(filePath.c_str()) != 0) {
                perror(("Error deleting file: " + filePath).c_str());
            }
        }
    }
}

void pipelineViaJSON(std::string PICS_DIR, std::string OUTPUT_DIR, std::string JSON_PATH) {
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
    clearFolder(OUTPUT_DIR + "/stats/");
    while ((dirEntry = readdir(directory)) != NULL) {
        if (dirEntry->d_type == DT_REG) {
            std::string fileName = dirEntry->d_name;
            if (fileName.substr(fileName.find_last_of(".") + 1) == "ppm") {
                image<float> src = read_image((PICS_DIR + "/" + fileName).c_str());
                image<float> original = src; // Keep a copy of the original image
                for(const auto& step : data["pipeline"]){
                    if (step.contains("filter")) {
                        image<float> dst;
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
                //printf("Processed img %d\n", numberOfImages);
                //printf("Output path: %s\n", ppmOutPath.c_str());
                image<unsigned char> ucharRes = src;
                calcStatistics(ucharRes, statsConfig, fileName);
                printToPPM(ucharRes, ppmOutPath.c_str());
                numberOfImages++;
            }
        }
                
    }
    closedir(directory);
}

void saveJson(const json& j, const std::string& path) {
    std::ofstream out(path);
    if (!out.is_open()) {
        throw std::runtime_error("Could not open file: " + path);
    }
    out << j.dump(4); // 4 = indent bonito
}

void calcStatistics(const image<unsigned char>& img, const json& statsConfig, std::string fileName) {
    std::string STAT_PATH = "./output/stats/" + fileName.substr(0, fileName.find_last_of(".")) + "_stats.json";
    json histogramsJson = json::object();
    HistogramRegistry histogramsReg = getHistogramRegistry();
    if(statsConfig.contains("histograms")){
        for(const auto& [name, desc] : histogramsReg) {
            if(statsConfig["histograms"].contains(name) && statsConfig["histograms"][name]) {
                histogram histResult = desc.func(img);
                graphicHistogram(histResult, fileName + "_" + name);
                histogramsJson[name] = histResult;
            }
        }
    }
    saveJson(histogramsJson, STAT_PATH);
}

