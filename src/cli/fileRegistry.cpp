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