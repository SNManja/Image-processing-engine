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
    printf("Filter %s not found\n", filterName.c_str());
    return {};
}

void filterList() {
    FilterRegistry registry = getRegistry();
    printf("Filter list:\n\n");

    printf("Note: All parameters described in this section must be provided inside the 'params' object of the JSON pipeline, using the exact names shown below.\n");
    for (const auto& entry : registry) {

        printf("- %s\n", entry.first.c_str());
        printf("  Description: %s\n", entry.second.description.c_str());
        printf("  Category: %s\n", entry.second.category.c_str());
        if (!entry.second.paramsDesc.empty()) {
            printf("  Parameters:\n");
            for (const std::string& param : entry.second.paramsDesc) {
                printf("    %s\n", param.c_str());
            }
        }
        printf("\n");
    }
}

void printHelp() {
    constexpr const char* HELP_TEXT = R"(

=============================================================================================================================================
                                                Image Processing Engine
=============================================================================================================================================

How it works:
-------------
1. Move your PPM images to ./src
2. Modify pipeline.json with the pipeline of your liking
3. Run the engine with: ./imgengine
4. Results will be written to ./output

---------------------------------------------------------------------------------------------------------------------------------------------

JSON pipeline format example:

{
  "pipeline": [
    {
      "filter": "filter_name",
      "params": {
        "param1": "value1",
        "param2": "value2"
      }
    }
  ],
  "statistics": (bool),
  "output_suffix": (string)
}

Notes:
------
- Filters are applied sequentially in the order they appear in the pipeline.
- The JSON pipeline is the only supported external API.
- All images are processed as 8-bit RGB.
- Intermediate results are clamped to [0, 255].
- statistics are currently not implemented.
- Blending not working after applying stride in previous filter (differs base image size with src image size)

---------------------------------------------------------------------------------------------------------------------------------------------

Info commands:
--------
- --help : Displays this help message.
- --list : Lists all available filters, with their respective descriptions and parameters.

)";
    std::puts(HELP_TEXT);
}
