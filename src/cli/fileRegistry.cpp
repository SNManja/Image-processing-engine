#include <map>
#include <string>
#include <vector>
#include "filter.h"
#include "cli_helpers.h"

std::vector<std::string> getConvolutionalParamsList() {
    return {
        "--stride (int): Takes an integer for the stride, which modifies the step size of the filter. Changes image size when different to 1",
        "--scale (float): Takes a float for the scaling factor applied to the filter output.",
        "--offset (float): Takes a float for the offset added to the filter output.",
        "--border (string): Takes a string for the border strategy (clamp, wrap, mirror, constant)."
    };
};


typedef std::map<std::string, FilterDescriptor> FilterRegistry;
FilterRegistry getRegistry(){
    FilterRegistry registry = {
        {
            "blur", {
                boxblurFilter, 
                "Box blur. A simple blur.",
                "Convolutional",
                {
                    "--size (int): Takes an integer for the blur size. Only odd values (kernel has to have a defined center)",   
                }
            }
        },
        {
            "invert", {
                invertFilter,
                "Color inverter, also called negative filter.",
                "Point",
                {}
            }
        },
        {
            "threshold", {
                thresholdingFilter,
                "Binarize the image.",
                "Point",
                {}
            }
        },
        {
            "bnw", {
                blackAndWhiteFilter,
                "Classic black and white filter.",
                "Point",
                {}
            }
        },
        {
            "sepia", {
                sepiaFilter,
                "Sepia filter. Gives a warm, brownish tone.",
                "Point",
                {}
            }
        },
        {
            "mirror", {
                mirrorFilter,
                "Mirrors the image.",
                "Geometric",
                {}
            }
        },
        {
            "sharpen", {
                sharpenFilter,
                "Sharpens the image. Makes borders more saturated",
                "Convolutional",
                {
                    "--amount (float): Takes a float and uses it for controlling the amount of sharpness"
                }
            }
        },
        {
            "enboss", {
                enbossFilter,
                "Enboss filter. Highlights edges and contours.",
                "Convolutional",
                {}
            }
        },
        {
            "lof", {
                laplacianOfGaussianFilter,
                "Laplacian of Gaussian filter. Edge detection.",
                "Convolutional",
                {}
            }
        },
        {
            "motionblur", {
                motionblurFilter,
                "Motion blur filter. Simulates the effect of motion blur.",
                "Convolutional",
                {}
            }
        }
    };
    std::vector<std::string> convParamList = getConvolutionalParamsList();
    for (auto& [name, desc] : registry) {
        if(desc.category == "Convolutional") {
            desc.paramsDesc.insert(desc.paramsDesc.end(), convParamList.begin(), convParamList.end());
        }
    }

    return registry;
}