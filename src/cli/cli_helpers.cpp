#include <map>
#include <string>
#include "filter.h"
#include "cli_helpers.h"

FilterDescriptor getFilterDescriptor(const std::string& filterName) {
    printf("Looking for %s\n", filterName.c_str());
    FilterRegistry registry = getRegistry();
    if (!filterName.empty()) {
        if (registry.find(filterName) != registry.end()) {
            return registry[filterName];
        }
    }
    return {};
}

void printHelp() {
    FilterRegistry registry = getRegistry();
    printf("Filter list:\n\n");
    for (const auto& entry : registry) {

        printf("- %s\n", entry.first.c_str());
        printf("  Description: %s\n", entry.second.description.c_str());
        printf("  Category: %s\n", entry.second.category.c_str());
        if (!entry.second.paramsDesc.empty()) {
            printf("  Usage:\n");
            for (const std::string& param : entry.second.paramsDesc) {
                printf("    %s\n", param.c_str());
            }
        }
        printf("\n");
    }
}