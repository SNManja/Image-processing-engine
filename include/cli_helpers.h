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

void pipelineViaJSON();
void calcStatistics(const image<unsigned char>& img, const json& statsConfig, std::string outPath);

#endif

