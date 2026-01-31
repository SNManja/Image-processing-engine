#include <map>
#include <string>
#include <vector>
#include "filter.h"
#include "cli_helpers.h"

std::vector<std::string> getConvolutionalParamsList() {
    return {
        "stride (int): Takes an integer for the stride, which modifies the step size of the filter. Changes image size when different to 1. Defaults to 1",
        "scale (float): Takes a float for the scaling factor applied to the filter output. Defaults to 1.0",
        "offset (float): Takes a float for the offset added to the filter output. Defaults to 0.0",
        "border (string): Takes a string for the border strategy (clamp, wrap, mirror, constant). Defaults to 'clamp'",
        "splitKernelEnabled (bool): Enables or disables the use of split kernels for convolution. Defaults to true"
    };
};
const std::string convolutionalCategory = "Convolutional";
const std::string pointCategory = "Point";
const std::string gradientCategory = "Gradient";
const std::string errorDiffusionCategory = "Error Diffusion";



typedef std::map<std::string, FilterDescriptor> FilterRegistry;
FilterRegistry getRegistry(){
    FilterRegistry registry = {
        {
            "blur", {
                boxblurFilter,
                "Box blur. A simple blur.",
                convolutionalCategory,
                {
                    "size (int): Takes an integer for the blur size. Only odd values (kernel has to have a defined center)",   
                }
            }
        },
        {
            "invert", {
                invertFilter,
                "Color inverter, also called negative filter.",
                pointCategory,
                {}
            }
        },
        {
            "threshold", {
                thresholdingFilter,
                "Binarize the image.",
                pointCategory,
                {
                    "maxVal (float): Output value if condition is met. Defaults to 1.0",
                    "minVal (float): Output value if condition is not met. Defaults to 0.0",
                    "threshold (float): Threshold value in normalized [0,1] space. Defaults to 0.5",
                    "mode ('absolute' | 'magnitude'): Defines which mode will be used. Defaults to 'absolute'",
                    "center (float): Only matters for 'magnitude' mode. Defines the zero reference of the signal. Defaults to 0.5f"
                }
            }
        },
        {
            "bnw", {
                blackAndWhiteFilter,
                "Classic black and white filter.",
                pointCategory,
                {}
            }
        },
        {
            "sepia", {
                sepiaFilter,
                "Sepia filter. Gives a warm, brownish tone.",
                pointCategory,
                {}
            }
        },
        {
            "mirror", {
                mirrorFilter,
                "Mirrors the image. Flips it horizontally.",
                "Geometric",
                {}
            }
        },
        {
            "sharpen", {
                sharpenFilter,
                "Sharpens the image. Makes borders more saturated",
                convolutionalCategory,
                {
                    "amount (float): Takes a float and uses it for controlling the amount of sharpness"
                }
            }
        },
        {
            "emboss", {
                embossFilter,
                "Emboss filter. Highlights edges and contours.",
                convolutionalCategory,
                {}
            }
        },
        {
            "lofg", {
                laplacianOfGaussianFilter,  
                "Laplacian of Gaussian filter. Edge detection.",
                convolutionalCategory,
                {}
            }
        },
        {
            "motionblur", {
                motionblurFilter,
                "Motion blur filter. Simulates the effect of motion blur.",
                convolutionalCategory,
                {}
            }
        },
        {
            "linearAdjustment", {
                linearAdjustment,
                "Applies a linear adjustment to the image colors.",
                pointCategory,
                {
                    "scale (float): Multiplies each color channel by this value (contrast/brightness gain). Defaults to 1.0",
                    "offset (float): Value added to each color channel after scaling (brightness shift). Defaults to 0.0"
                }
            }
        },
        {
            "alphaBlending", {
                alphaBlending,
                "Blends the source image with a base image using alpha values for each color channel. Base image size has to match with source image size.",
                pointCategory,
                {
                    "alpha (list of 3 floats): List of three floats (between 0 and 1) representing the alpha values for R, G, and B channels. 1 is the filtered image, 0 is the base image"
                }
            }
        },
        {
            "sobel", {
                sobelOperatorFilter,
                "Sobel operator. Edge detection filter. Usual gradient parameters are added for the x and y convolutions",
                gradientCategory,
                {
                    "greyscale (bool): A flag indicating whether to convert the image to greyscale before applying the filter. Defaults to true.",
                    "scharr (bool): A flag indicating whether to use the Scharr operator instead of the Sobel operator. Defaults to false."
                }
            }
        }, 
        {
            "FSDithering",{
                floydSteinbergFilter,
                "Floyd Steinberg dithering filter. Reduces color depth by passing error values to neighboring pixels. Common in retro image processing when operating with limited color palettes, generates more unpredictable patterns than other Bayer's algorithm. Really bad for video, good for static images. Highly recommend using it after black and white filter and convolutions with stride to lower image size.",
                errorDiffusionCategory,
                {
                    "depth (int): Number of levels to reduce the color depth to. Defaults to 2.",
                    "perceptual (bool): Whether to use perceptual quantization as this is a normalized pipeline. Defaults to true.",
                    "amount (float): Amount of neighbor error diffusion, operates in [0,1] range. Defaults to 1.0.",
                    "noise (float): Amount of noise to add to the error diffusion. Sometimes it improves repetitive patterns. Defaults to 0.0.",
                    "serpentine (bool): Whether to use serpentine scanning for the dithering process. Defaults to true.",
                    "domain (string): How to map HDR/intermediate values before quantization. 'clamp' maps values to [0,1] before dithering; 'raw' applies dithering on the unbounded signal (can be useful for non-display pipelines but may amplify patterns). Defaults to 'clamp'."    
                }
            }
        },
        {
            "bayerDithering",{
                bayerDitheringFilter,
                "Bayer dithering filter. Reduces color depth using ordered dithering with a Bayer matrix. Good for images with gradients and smooth color transitions. Less noisy than Floyd Steinberg dithering, but can produce noticeable patterns in some cases.",
                errorDiffusionCategory,
                {
                    "depth (int): Number of levels to reduce the color depth to. Defaults to 2.",
                    "perceptual (bool): Whether to use perceptual quantization as this is a normalized pipeline. Defaults to true.",
                    "levels (int): Size of the Bayer matrix to use (2^levels). Defaults to 4 (that's a ((2^4) * (2^4)) matrix).",
                    "domain (string): How to map HDR/intermediate values before quantization. 'clamp' maps values to [0,1] before dithering. 'raw' applies dithering on the unbounded signal (can be useful for non-display pipelines but may amplify patterns). Defaults to 'clamp'."
                }
            }
        }
    };
    
    
    std::vector<std::string> convParamList = getConvolutionalParamsList();
    for (auto& [name, desc] : registry) {
        if(desc.category == convolutionalCategory) {
            desc.paramsDesc.insert(desc.paramsDesc.end(), convParamList.begin(), convParamList.end());
        }
        if(desc.category == pointCategory) {
            std::vector<std::string> pointParamList = {};
            desc.paramsDesc.insert(desc.paramsDesc.end(), pointParamList.begin(), pointParamList.end());
        }
        if(desc.category == gradientCategory){
            std::vector<std::string> gradientParamList = convParamList;
            desc.paramsDesc.insert(desc.paramsDesc.end(), gradientParamList.begin(), gradientParamList.end());
        }
    }


    return registry;
}
