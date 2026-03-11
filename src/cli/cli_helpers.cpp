#include <map>
#include <string>
#include "filter.h"
#include "cli_helpers.h"
#include <iostream>
#include "registry/filter_registry.hpp"
#include "histogram.h"



// usa el registry global
std::shared_ptr<FilterDescriptor> getFilterDescriptor(const std::string& filterName) {
    return getFilterRegistry().getDescriptor(filterName);
}

void filterList() {
    auto& reg = getFilterRegistry();
    auto j = reg.toJson();
    // j es un objeto mapping name -> descriptorJson
    for (auto it = j.begin(); it != j.end(); ++it) {
        const std::string& name = it.key();
        const auto& desc = it.value();
        std::string description = "";
        if (desc.contains("description") && desc["description"].is_string()) {
            description = desc["description"];
        }
        std::cout << name << " - " << description << std::endl;
    }
}

void printHelp() {
    constexpr const char* HELP_TEXT = R"(

=============================================================================================================================================
                                                Image Processing Engine
=============================================================================================================================================

How it works:
-------------
1. Move your images to ./src
2. Modify pipeline.json with the pipeline of your liking
3. Run the engine with: ./imgengine
4. Results will be written to ./output

---------------------------------------------------------------------------------------------------------------------------------------------

JSON pipeline format:
--------------------
{
  "pipeline": [
    {
      "filter": "filter_name",
      "params": {
        "param1": "value1",
        "param2": "value2",
            .
            .
            .
      }
    }
  ],
  "statistics": {
    "histograms": {
      "histogramType1": (bool),
      "histogramType2": (bool),
            .
            .
            .
    }
  },
  "output_suffix": (string),
  "output_extension": (string) <= "auto" | "jpg" | "jpeg" | "png" | "ppm"
}

Notes:
------
- Filters are applied sequentially in the order they appear in the pipeline.
- The JSON pipeline is the only supported external API.
- All images are processed as [0,1] linearized HDR pipeline.
- Histogram support. Calculated at the end of the pipeline before output.
- Blending not working after applying stride in previous filter (differs base image size with src image size)

---------------------------------------------------------------------------------------------------------------------------------------------

Info commands:
--------------
- --help : Displays this help message.
- --list : Lists all available filters, with their respective descriptions and parameters.
- --histograms: List all available histograms and output format
)";
    std::puts(HELP_TEXT);
}


void printHistograms(){
    HistogramRegistry histogramsReg = getHistogramRegistry();

    printf("\nAvailable histograms:\n");
    printf("-----------------------\n");
    for (const auto& [name, desc] : histogramsReg) {
        printf("- %s: %s\n", name.c_str(), desc.description.c_str());
    }
    constexpr const char* HELP_TEXT = R"(

---------------------------------------------------------------------------------------------------------------------------------------------

Output format:
--------------
Histogram output can be seen in ./output/stats/ directory
    
The format is:
{
    "histogramName1": [value0, value1, ..., value255],
    "histogramName2": [value0, value1, ..., value255],
    "histogramName3": [value0, value1, ..., value255]
        .
        .
        .
}

---------------------------------------------------------------------------------------------------------------------------------------------

More statistic tools will be implemented in the future.

)";

    std::puts(HELP_TEXT);

}