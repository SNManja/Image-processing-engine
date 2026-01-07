#include <stdio.h>
#include <vector>
#include <string.h>
#include <dirent.h>
#include "image.h"
#include "filter.h"
#include "args_parser.h"


int main(const int argc, const char* argv[]) 
{
    const std::string filterName = getStringArg(argv, 1, "");
    if (filterName.empty()) {
        perror("No filter name provided");
        return 1;
    }
    FilterDescriptor filterDesc = getFilterDescriptor(filterName);
    if (filterDesc.func != nullptr) {
        applyFilterOnEveryPPM("./pics", filterDesc.func, argv);
    } else {
        printf("Filter not found: %s\n", filterName.c_str());
    }
    printf("Process completed\n");
    return 0;
}