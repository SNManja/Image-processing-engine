#include <map>
#include <string>
#include "filter.h"


typedef std::map<std::string, FilterDescriptor> FilterRegistry;
FilterRegistry getRegistry(){
    return  {
        {
            "blur", {
                boxblurFilter, 
                "Box blur. A simple blur.",
                ""
            }
        },
        {
            "invert", {
                invertFilter,
                "Color inverter, also called negative filter.",
                ""
            }
        },
        {
            "threshold", {
                thresholdingFilter,
                "Binarize the image.",
                ""
            }
        },
        {
            "bnw", {
            blackAndWhiteFilter,
            "Classic black and white filter.",
            ""
        }
        },
        {
            "sepia", {
                sepiaFilter,
                "Sepia filter. Gives a warm, brownish tone.",
                ""
            }
        },
        {
            "mirror", {
                mirrorFilter,
                "Mirrors the image.",
                ""
            }
        },
        {
            "sharpen", {
                sharpenFilter,
                "Sharpens the image. Makes borders more saturated",
                "--sharpen (float): Takes a float and uses it for the center kernel value"
            }
        },
        {
            "enboss", {
                enbossFilter,
                "Enboss filter. Highlights edges and contours.",
                ""
            }
        },
        {
            "lof", {
                laplacianOfGaussianFilter,
                "Laplacian of Gaussian filter. Edge detection.",
                ""
            }
        },
        {
            "motionblur", {
            motionblurFilter,
            "Motion blur filter. Simulates the effect of motion blur.",
            ""
            }
        }
    };
}

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
    for (const auto& entry : registry) {
        printf("Filter: %s\n", entry.first.c_str());
        printf("Description: %s\n", entry.second.description.c_str());
        if (!entry.second.usage.empty()) {
            printf("Usage: %s\n", entry.second.usage.c_str());
        }
        printf("\n");
    }
}