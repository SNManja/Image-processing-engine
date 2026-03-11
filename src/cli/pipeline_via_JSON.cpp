#include "cli_helpers.h"
#include "image.h"
#include "filter.h"
#include <json.hpp>
#include <fstream>
#include <dirent.h>
#include "histogram.h"
#include <iostream>
#include <filesystem>
#include <chrono>
#include "registry/filter_registry.hpp"


const auto& filterRegistry = getFilterRegistry();

using json = nlohmann::json;
namespace fs = std::filesystem;

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

void ensureFolder(const std::string& ruta) {
    try {
        // create_directories no lanza error si la carpeta ya existe, 
        // simplemente devuelve false.
        if (fs::create_directories(ruta)) {
            std::cout << "Folder made at: " << ruta << std::endl;
        }
    } catch (const fs::filesystem_error& e) {
        std::cerr << "Error creating folder: " << e.what() << std::endl;
    }
}

void batchPipelineViaJson(std::string PICS_DIR, std::string OUTPUT_DIR, std::string JSON_PATH) {
    
    auto time_init = std::chrono::high_resolution_clock::now();


    std::ifstream file(JSON_PATH);
    if (!file.is_open()) throw std::runtime_error("Could not open JSON: " + JSON_PATH);

    json data = json::parse(file);
    
    if(!(data.contains("pipeline"))) throw std::invalid_argument("Invalid JSON: pipeline not found");   
    if(!data["pipeline"].is_array()) throw std::invalid_argument("Invalid JSON: pipeline is not an array");
    if(data["pipeline"].empty()) throw std::invalid_argument("Invalid JSON: pipeline is empty");

    DIR* directory = opendir(PICS_DIR.c_str());
    if(!directory) throw std::runtime_error("Could not open directory: " + PICS_DIR);  // Directory opened successfully
    
    std::vector<std::string> imgQueue;
    

    struct dirent* dirEntry;
    clearFolder(OUTPUT_DIR + "/stats/");
    while ((dirEntry = readdir(directory)) != NULL) {
        if (dirEntry->d_type == DT_REG) {
            std::string fileName = dirEntry->d_name;
            std::string ext = fileName.substr(fileName.find_last_of(".") + 1);
            if (ext == "ppm" || ext == "jpg" || ext == "jpeg" || ext == "png") {
                imgQueue.push_back(fileName);
            }
        }
    }
    closedir(directory);

    for (const auto& step : imgQueue){
        printf("%s, ", step.c_str());
    }
    printf("\n");
    std::string fileName;  

    while (true) {
        {
            if (imgQueue.empty()) { 
                auto time_end = std::chrono::high_resolution_clock::now();
                std::chrono::duration<double> elapsed = time_end - time_init;

                printf("Pipeline finished in %.3f seconds\n", elapsed.count());
                return;
            }
            printf("Processing image %s\n", imgQueue.back().c_str());
            fileName = imgQueue.back();
            imgQueue.pop_back();
        }    
        processSingleImage(fileName, PICS_DIR, OUTPUT_DIR, data);
        printf("Finished image %s\n", fileName.c_str());
    }

   
}

void processSingleImage(std::string fileName, std::string PICS_DIR, std::string OUTPUT_DIR,const json& data){
    std::string ext = fileName.substr(fileName.find_last_of(".") + 1);
    if (ext == "ppm" || ext == "jpg" || ext == "jpeg" || ext == "png") {
        image<float> src = read_image(PICS_DIR + "/" + fileName);
        image<float> original = src; // Keep a copy of the original image
        for(const auto& step : data["pipeline"]){
            if (step.contains("filter")) {
                image<float> dst;
                std::string filterName = step.at("filter");
                auto desc = filterRegistry.getDescriptor(filterName);
                if (!desc) {
                    throw std::invalid_argument("Invalid filter in pipeline: " + filterName);
                }
                auto fn = desc->filterFunction();
                if (!fn) {
                    throw std::invalid_argument("Invalid filter in pipeline: " + filterName);
                }
                // Construir explícitamente el contexto para evitar depender del orden positional
                filterContext ctx{ step, original };
                fn(src, dst, ctx);
                std::swap(src, dst);
            }
        }
        // Build output filename safely: base + optional suffix + '.' + chosen extension
        std::string base = fileName.substr(0, fileName.find_last_of("."));
        std::string chosenExt = ext;
        if (data.contains("output_extension") && data["output_extension"].is_string()) {
            std::string v = data["output_extension"];
            if (v == "jpg" || v == "jpeg" || v == "png" || v == "ppm") chosenExt = v;
        }
        std::string suffix = "";
        if (data.contains("output_suffix") && data["output_suffix"].is_string()) {
            suffix = data["output_suffix"];
        }
        fileName = base + suffix + "." + chosenExt;

        json statsConfig = json::object();
        if (data.contains("statistics")) {
            statsConfig = data["statistics"];
            std::string histogramPath = OUTPUT_DIR + "/stats/";
            ensureFolder(histogramPath);
            calcStatistics((image<unsigned char>)src, statsConfig, histogramPath, fileName);
        }

        
        std::string outPath = OUTPUT_DIR + "/" + fileName;
        write_image(src, outPath.c_str());
    }
}

void saveJson(const json& j, const std::string& path) {
    std::ofstream out(path);
    if (!out.is_open()) {
        throw std::runtime_error("Could not open file: " + path);
    }
    out << j.dump(4); // 4 = indent bonito
}

void calcStatistics(const image<unsigned char>& img, const json& statsConfig, std::string OUT_PATH, std::string fileName) {
    std::string STAT_PATH = OUT_PATH + fileName.substr(0, fileName.find_last_of(".")) + "_stats.json";
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



