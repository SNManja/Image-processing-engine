#include "cli_helpers.h"
#include "image.h"
#include "filter.h"
#include <json.hpp>
#include <fstream>
#include <dirent.h>
#include "histogram.h"

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
                calcStatistics(src, statsConfig, fileName);
                printToPPM(src, ppmOutPath.c_str());
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

void calcStatistics(const image& img, const json& statsConfig, std::string fileName) {
    std::string STAT_PATH = "./output/stats/" + fileName.substr(0, fileName.find_last_of(".")) + "_stats.json";
    json histogramsJson = json::object();
    if(statsConfig.contains("histograms")){
        if(statsConfig["histograms"].contains("red") && statsConfig["histograms"]["red"]) {
            histogram redHist = redChannelHistogram(img);
            graphicHistogram(redHist, fileName + "_red");
            histogramsJson["red"] = redHist;
        }
        if(statsConfig["histograms"].contains("green") && statsConfig["histograms"]["green"]) {
            histogram greenHist = greenChannelHistogram(img);
            graphicHistogram(greenHist, fileName + "_green");
            histogramsJson["green"] = greenHist;
        }
        if(statsConfig["histograms"].contains("blue") && statsConfig["histograms"]["blue"]) {
            histogram blueHist = blueChannelHistogram(img);
            graphicHistogram(blueHist, fileName + "_blue");
            histogramsJson["blue"] = blueHist;
        }
        if(statsConfig["histograms"].contains("greyscale") && statsConfig["histograms"]["greyscale"]){
            histogram greyHist = greyscaleHistogram(img);
            graphicHistogram(greyHist, fileName + "_greyscale");
            histogramsJson["greyscale"] = greyHist;
        }
        if(statsConfig["histograms"].contains("intensity") && statsConfig["histograms"]["intensity"]){
            histogram intensityHist = intensityHistogram(img);
            graphicHistogram(intensityHist, fileName + "_intensity");
            histogramsJson["intensity"] = intensityHist;
        }
        if(statsConfig["histograms"].contains("value") && statsConfig["histograms"]["value"]){
            histogram valueHist = valueHistogram(img);
            graphicHistogram(valueHist, fileName + "_value");
            histogramsJson["value"] = valueHist;
        }
        if(statsConfig["histograms"].contains("chroma") && statsConfig["histograms"]["chroma"]){
            histogram chromaHist = chromaHistogram(img);
            graphicHistogram(chromaHist, fileName + "_chroma");
            histogramsJson["chroma"] = chromaHist;
        }

    }
    
    saveJson(histogramsJson, STAT_PATH);
}
