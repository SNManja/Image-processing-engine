#include <map>
#include <string>
#include <vector>
#include "filter.h"
#include "cli_helpers.h"

std::vector<std::string> getConvolutionalParamsList() {
    return {
        "stride (int): Takes an integer for the stride, which modifies the step size of the filter. Changes image size when different to 1",
        "scale (float): Takes a float for the scaling factor applied to the filter output.",
        "offset (float): Takes a float for the offset added to the filter output.",
        "border (string): Takes a string for the border strategy (clamp, wrap, mirror, constant)."
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
                    "size (int): Takes an integer for the blur size. Only odd values (kernel has to have a defined center)",   
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
                "Mirrors the image. Flips it horizontally. If we are technical about it, it's really a geometric filter. But it has the same postprocessing nuances that a point filter has",
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
                    "amount (float): Takes a float and uses it for controlling the amount of sharpness"
                }
            }
        },
        {
            "emboss", {
                embossFilter,
                "Emboss filter. Highlights edges and contours.",
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
        },
        {
            "linearAdjustment", {
                linearAdjustment,
                "Applies a linear adjustment to the image colors.",
                "Point",
                {
                    "offset (int): Takes an integer for the offset to be added to each color channel.",
                    "scale (float): Takes a float for the scaling factor applied to each color channel."
                }
            }
        },
        {
            "alphaBlending", {
                alphaBlending,
                "Blends the source image with a base image using alpha values for each color channel. Base image size has to match with source image size.",
                "Point",
                {
                    "alpha (list of 3 floats): List of three floats (between 0 and 1) representing the alpha values for R, G, and B channels."
                }
            }
        },
        {
            "sobel", {
                sobelOperatorFilter,
                "Sobel operator. Edge detection filter. Usual gradient parameters are added for the x and y convolutions",
                "Gradient",
                {
                    "greyscale (bool): A flag indicating whether to convert the image to greyscale before applying the filter. Defaults to true."
                }
            }
        }
    };
    
    
    std::vector<std::string> convParamList = getConvolutionalParamsList();
    for (auto& [name, desc] : registry) {
        if(desc.category == "Convolutional") {
            desc.paramsDesc.insert(desc.paramsDesc.end(), convParamList.begin(), convParamList.end());
        }
        if(desc.category == "Point") {
            std::vector<std::string> pointParamList = {};
            desc.paramsDesc.insert(desc.paramsDesc.end(), pointParamList.begin(), pointParamList.end());
        }
        if(desc.category == "Gradient"){
            std::vector<std::string> gradientParamList = convParamList;
            desc.paramsDesc.insert(desc.paramsDesc.end(), gradientParamList.begin(), gradientParamList.end());
        }
    }


    return registry;
}
