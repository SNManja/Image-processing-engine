#ifndef CLI_HELPERS_H
#define CLI_HELPERS_H

#include <map>
#include <string>
#include "filter.h"


struct FilterDescriptor { // This will be used in the filter registry
    BasicFilter func;
    const std::string description;
    const std::string category;
    std::vector<std::string> paramsDesc;
};

FilterDescriptor getFilterDescriptor(const std::string& filterName);

typedef std::map<std::string, FilterDescriptor> FilterRegistry;
FilterRegistry getRegistry();
std::vector<std::string> getPostProcessingParamsList();


void filterList();
void printHelp();
void printHistograms();

void batchPipelineViaJson(std::string PICS_DIR, std::string OUTPUT_DIR, std::string JSON_PATH);
void processSingleImage(std::string fileName, std::string PICS_DIR, std::string OUTPUT_DIR,const json& data);
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

