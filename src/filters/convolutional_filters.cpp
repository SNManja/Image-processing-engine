#include "filter.h"
#include "image.h"
#include "args_parser.h"


convolutionConfig readConvolutionConfig(const char* args[]) {
    convolutionConfig config = {};
    config.stride = getFlagValue(args, "--stride", 1);
    config.scale = getFlagValue(args, "--scale", 1.0f);
    config.offset = getFlagValue(args, "--offset", 0.0f);
    config.borderStrategy = getFlagValue(args, "--border", "clamp");
    return config;
}

void boxblurFilter(image& img, const char* args[]) {
    convolutionConfig config = readConvolutionConfig(args);
    // blur size
    int sizeFlagIndex = getFlagIndex(args, "--size");
    int blurSize = 3;
    if(sizeFlagIndex >= 0) {
        blurSize = getIntArg(args, sizeFlagIndex + 1, 3);
    }
    if(blurSize % 2 == 0) {
        blurSize++;  // Make sure the blur size is odd
        printf("Blur size has to be odd. Increasing to %d\n", blurSize);
    }
    

    std::vector<std::vector<float>> kernelVector(blurSize, std::vector<float>(blurSize, 1.0f / (blurSize * blurSize)));
    printf("Kernel size: %d\n", blurSize);
    Kernel k = kernel(blurSize, kernelVector);
    img = applyConvolution(img, k, config); 
}

void sharpenFilter(image& img, const char* args[]) {
    convolutionConfig config = readConvolutionConfig(args);

    int amountFlagIndex = getFlagIndex(args, "--amount");
    float amountValue = 1.0;
    if(amountFlagIndex >= 0) {
        amountValue = getFloatArg(args, amountFlagIndex + 1, 5.0);
    }
    printf("Sharpening with amount: %f\n", amountValue);

    Kernel k = kernel(3, {
        {0, -amountValue, 0},
        {-amountValue, amountValue * 5, -amountValue},
        {0, -amountValue, 0}
    });
    img = applyConvolution(img, k, config);
}

void embossFilter(image& img, const char* args[]) {
    convolutionConfig config = readConvolutionConfig(args);
    Kernel k = kernel(3, {
        {-2, -1, 0},
        {-1, 1, 1},
        {0, 1, 2}
    });
    img = applyConvolution(img, k, config);
}

void laplacianOfGaussianFilter(image& img, const char* args[]) {
    convolutionConfig config = readConvolutionConfig(args);
    Kernel k = kernel(5, {
        {0, 0, -1, 0, 0},
        {0, -1, -2, -1, 0},
        {-1, -2, 16, -2, -1},
        {0, -1, -2, -1, 0},
        {0, 0, -1, 0, 0}
    });
    img = applyConvolution(img, k, config);
}

void motionblurFilter(image& img, const char* args[]) {
    convolutionConfig config = readConvolutionConfig(args);
    Kernel k = kernel(5, {
        {1/5.0, 0, 0, 0, 0},
        {0, 1/5.0, 0, 0, 0},
        {0, 0, 1/5.0, 0, 0},
        {0, 0, 0, 1/5.0, 0},
        {0, 0, 0, 0, 1/5.0}
    });
    img = applyConvolution(img, k, config);
}
