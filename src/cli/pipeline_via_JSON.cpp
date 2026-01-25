#include "cli_helpers.h"
#include "image.h"
#include "filter.h"
#include <json.hpp>
#include <fstream>
#include <dirent.h>
#include "histogram.h"
#include <iostream>
#include <filesystem>
#include <thread>
#include <mutex>


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
            std::cout << "Folder made: " << ruta << std::endl;
        }
    } catch (const fs::filesystem_error& e) {
        std::cerr << "Error al crear la carpeta: " << e.what() << std::endl;
    }
}

void batchPipelineViaJson(std::string PICS_DIR, std::string OUTPUT_DIR, std::string JSON_PATH) {
    
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


    std::string histogramPath = OUTPUT_DIR + "/stats/";
    ensureFolder(histogramPath);
    clearFolder(histogramPath);
    
    std::vector<std::string> imgQueue;
    int threadNum = std::thread::hardware_concurrency();
    std::vector<std::thread> threads;
    std::mutex queueMutex;
    if (threadNum == 0) threadNum = 2; // Fallback
    

    struct dirent* dirEntry;
    clearFolder(OUTPUT_DIR + "/stats/");
    while ((dirEntry = readdir(directory)) != NULL) {
        if (dirEntry->d_type == DT_REG) {
            std::string fileName = dirEntry->d_name;
            std::string ext = fileName.substr(fileName.find_last_of(".") + 1);
            // processSingleImage(ext, fileName, PICS_DIR, OUTPUT_DIR, data);
            if (ext == "ppm" || ext == "jpg" || ext == "jpeg" || ext == "png") {
                imgQueue.push_back(fileName);
            }
        }
    }
    closedir(directory);

    for (int i = 0; i < threadNum; ++i) {
        threads.emplace_back([&,i]{
            std::string fileName;
            int threadNum = i;
            while (true) {
                {
                    std::lock_guard<std::mutex> lock(queueMutex);
                    if (imgQueue.empty()) { 
                        return;
                    }
                    printf("Thread num %d took image %s\n", threadNum, imgQueue.back().c_str());
                    fileName = imgQueue.back();
                    imgQueue.pop_back();
                }    
                processSingleImage(fileName, PICS_DIR, OUTPUT_DIR, data);
                printf("Thread num %d finished image %s\n", threadNum, fileName.c_str());
            }
            
        });
    }
    for (auto& t : threads) {
        if (t.joinable()) t.join();
    }

}

void processSingleImage(std::string fileName, std::string PICS_DIR, std::string OUTPUT_DIR, json data){
    std::string ext = fileName.substr(fileName.find_last_of(".") + 1);
    if (ext == "ppm" || ext == "jpg" || ext == "jpeg" || ext == "png") {
        image<float> src = read_image(PICS_DIR + "/" + fileName);
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
            fileName += ".";
            fileName += ext;
        }
        std::string outPath = OUTPUT_DIR + "/" + fileName;
        // calcStatistics(ucharRes, statsConfig, histogramPath, fileName);
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



