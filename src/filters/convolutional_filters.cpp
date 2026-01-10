#include "filter.h"
#include "image.h"
#include "args_parser.h"
#include "json.hpp"

using json = nlohmann::json;

convolutionConfig readConvolutionConfig(const json& data) {
    convolutionConfig config = {};
    if(data.contains("params")){
        const json& params = data["params"];
        config.stride = params.value("stride", config.stride);
        config.offset = params.value("offset", config.offset);
        config.scale  = params.value("scale", config.scale);
        config.borderStrategy = params.value("border", config.borderStrategy);
    }
    return config;
}

void boxblurFilter(image& src, image& dst, const json& data) {
    convolutionConfig config = readConvolutionConfig(data);
    // blur size
    int blurSize = 3;
    if(data.contains("params") && data["params"].contains("size")) {
        blurSize = data["params"]["size"];
    }
    if(blurSize % 2 == 0) {
        blurSize++;  // Make sure the blur size is odd
        printf("Blur size has to be odd. Increasing to %d\n", blurSize);
    }
    

    std::vector<std::vector<float>> kernelVector(blurSize, std::vector<float>(blurSize, 1.0f / (blurSize * blurSize)));
    printf("Kernel size: %d\n", blurSize);
    Kernel k = kernel(blurSize, kernelVector);
    applyConvolution(src, dst, k, config);
}

void sharpenFilter(image& src, image& dst, const json& data) {
    convolutionConfig config = readConvolutionConfig(data);

    float amountValue = 1.0;
    if(data.contains("params") && data["params"].contains("amount")) {
        amountValue = data["params"]["amount"];
    }
    printf("Sharpening with amount: %f\n", amountValue);

    Kernel k = kernel(3, {
        {0, -amountValue, 0},
        {-amountValue, amountValue * 5, -amountValue},
        {0, -amountValue, 0}
    });
    applyConvolution(src, dst, k, config);
}

void embossFilter(image& src, image& dst, const json& data) {
    convolutionConfig config = readConvolutionConfig(data);
    Kernel k = kernel(3, {
        {-2, -1, 0},
        {-1, 1, 1},
        {0, 1, 2}
    });
    applyConvolution(src, dst, k, config);
}

void laplacianOfGaussianFilter(image& src, image& dst, const json& data) {
    convolutionConfig config = readConvolutionConfig(data);
    Kernel k = kernel(5, {
        {0, 0, -1, 0, 0},
        {0, -1, -2, -1, 0},
        {-1, -2, 16, -2, -1},
        {0, -1, -2, -1, 0},
        {0, 0, -1, 0, 0}
    });
    applyConvolution(src, dst, k, config);
}

void motionblurFilter(image& src, image& dst, const json& data) {
    convolutionConfig config = readConvolutionConfig(data);
    Kernel k = kernel(5, {
        {1/5.0, 0, 0, 0, 0},
        {0, 1/5.0, 0, 0, 0},
        {0, 0, 1/5.0, 0, 0},
        {0, 0, 0, 1/5.0, 0},
        {0, 0, 0, 0, 1/5.0}
    });
    applyConvolution(src, dst, k, config);
}
