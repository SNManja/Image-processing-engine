#include "filter.h"
#include "image.h"
#include "args_parser.h"




void boxblurFilter(image& img, const char* args[]) {
    // blur size
    convolutionConfig config = {};
    
    int sizeFlagIndex = getFlagIndex(args, "--size");
    int blurSize = 3;
    if(sizeFlagIndex >= 0) {
        blurSize = getIntArg(args, sizeFlagIndex + 1, 3);
    }
    if(blurSize % 2 == 0) {
        blurSize++;  // Make sure the blur size is odd
        printf("Blur size has to be odd. Increasing to %d\n", blurSize);
    }
    // stride
    int strideFlagIndex = getFlagIndex(args, "--stride");
    if(strideFlagIndex >= 0) {
        config.stride = getIntArg(args, strideFlagIndex + 1, 1);
    }


    std::vector<std::vector<float>> kernelVector(blurSize, std::vector<float>(blurSize, 1.0f / (blurSize * blurSize)));
    printf("Kernel size: %d\n", blurSize);
    Kernel k = kernel(blurSize, kernelVector);
    img = applyConvolution(img, k, config); 
}

void sharpenFilter(image& img, const char* args[]) {
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
    img = applyConvolution(img, k);
}

void enbossFilter(image& img, const char* args[]) {
    Kernel k = kernel(3, {
        {-2, -1, 0},
        {-1, 1, 1},
        {0, 1, 2}
    });
    img = applyConvolution(img, k);
}

void laplacianOfGaussianFilter(image& img, const char* args[]) {
    Kernel k = kernel(5, {
        {0, 0, -1, 0, 0},
        {0, -1, -2, -1, 0},
        {-1, -2, 16, -2, -1},
        {0, -1, -2, -1, 0},
        {0, 0, -1, 0, 0}
    });
    img = applyConvolution(img, k);
}

void motionblurFilter(image& img, const char* args[]) {
    Kernel k = kernel(5, {
        {1/5.0, 0, 0, 0, 0},
        {0, 1/5.0, 0, 0, 0},
        {0, 0, 1/5.0, 0, 0},
        {0, 0, 0, 1/5.0, 0},
        {0, 0, 0, 0, 1/5.0}
    });
    img = applyConvolution(img, k);
}
