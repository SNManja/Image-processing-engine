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
        if (!entry.second.usage.empty()) {
            printf("  Usage: %s\n", entry.second.usage.c_str());
        }
        printf("\n");
    }
}