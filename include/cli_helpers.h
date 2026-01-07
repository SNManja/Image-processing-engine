#ifndef CLI_HELPERS_H
#define CLI_HELPERS_H

#include <map>
#include <string>
#include "filter.h"

FilterDescriptor getFilterDescriptor(const std::string& filterName);

typedef std::map<std::string, FilterDescriptor> FilterRegistry;
FilterRegistry getRegistry();

void printHelp();

#endif

