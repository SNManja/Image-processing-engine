#ifndef CLI_HELPERS_H
#define CLI_HELPERS_H

#include <map>
#include <string>
#include "filter.h"


struct FilterDescriptor { // This will be used in the filter registry
    basicFilter func;
    const std::string description;
    std::vector<std::string> paramsDesc;
};

FilterDescriptor getFilterDescriptor(const std::string& filterName);

typedef std::map<std::string, FilterDescriptor> FilterRegistry;
FilterRegistry getRegistry();

void printHelp();

#endif

