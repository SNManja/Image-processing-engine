#include <map>
#include <string>
#include "filter.h"
#include "cli_helpers.h"

typedef std::map<std::string, FilterDescriptor> FilterRegistry;
FilterRegistry getRegistry(){
    return  {
        {
            "blur", {
                boxblurFilter, 
                "Box blur. A simple blur.",
                {
                    "--size (int): Takes an integer for the blur size. Only odd values (kernel has to have a defined center)",
                    "--stride (int): Takes an integer for the stride, which modifies the step size of the filter. Changes image size when different to 1"
                }
            }
        },
        {
            "invert", {
                invertFilter,
                "Color inverter, also called negative filter.",
                {""}
            }
        },
        {
            "threshold", {
                thresholdingFilter,
                "Binarize the image.",
                {""}
            }
        },
        {
            "bnw", {
                blackAndWhiteFilter,
                "Classic black and white filter.",
                {""}
            }
        },
        {
            "sepia", {
                sepiaFilter,
                "Sepia filter. Gives a warm, brownish tone.",
                {""}
            }
        },
        {
            "mirror", {
                mirrorFilter,
                "Mirrors the image.",
                {""}
            }
        },
        {
            "sharpen", {
                sharpenFilter,
                "Sharpens the image. Makes borders more saturated",
                {"--amount (float): Takes a float and uses it for controlling the amount of sharpness"}
            }
        },
        {
            "enboss", {
                enbossFilter,
                "Enboss filter. Highlights edges and contours.",
                {""}
            }
        },
        {
            "lof", {
                laplacianOfGaussianFilter,
                "Laplacian of Gaussian filter. Edge detection.",
                {""}
            }
        },
        {
            "motionblur", {
                motionblurFilter,
                "Motion blur filter. Simulates the effect of motion blur.",
                {""}
            }
        }
    };
}