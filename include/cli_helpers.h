#ifndef CLI_HELPERS_H
#define CLI_HELPERS_H

#include <map>
#include <string>
#include <memory>

#include "filter.h"
#include "image.h"
#include "json.hpp"

// Registry headers
#include "registry/filter_registry.hpp"


using json = nlohmann::json;

// Accesores / helpers usados por el CLI (declaraciones públicas)
std::shared_ptr<FilterDescriptor> getFilterDescriptor(const std::string& name);
void filterList();
void printHelp();
void printHistograms();

void batchPipelineViaJson(std::string PICS_DIR, std::string OUTPUT_DIR, std::string JSON_PATH);
void processSingleImage(std::string fileName, std::string PICS_DIR, std::string OUTPUT_DIR, const json& data);
void calcStatistics(const image<unsigned char>& img, const json& statsConfig, std::string outPath, std::string name);
void clearFolder(std::string path);

template<typename T>
T getJSONParam(const filterContext& cfg, const std::string& key, const T& defaultValue) {
    if (cfg.data.contains("params") && cfg.data["params"].contains(key)) {
        return cfg.data["params"][key];
    }
    return defaultValue;
}

#endif

