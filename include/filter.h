#ifndef FILTER_H
#define FILTER_H

#include "image.h"
#include <functional>
#include <string>


using basicFilter = void(*)(image&, const char*[]);
using coordinateFunction = std::function<void(image&, int, int)>;

// point filters
void invertFilter(image& img, const char* args[]);
void blackAndWhiteFilter(image& img, const char* args[]);
void sepiaFilter(image& img, const char* args[]);
void thresholdingFilter(image& img, const char* args[]);
void mirrorFilter(image& img, const char* args[]);

// convolutional filters
void boxblurFilter(image& img, const char* args[]);
void sharpenFilter(image& img, const char* args[]);
void laplacianOfGaussianFilter(image& img, const char* args[]);
void motionblurFilter(image& img, const char* args[]);
void enbossFilter(image& img, const char* args[]);

struct Kernel {
    unsigned char size;
    std::vector<std::vector<float>> values;
};


Kernel kernel(int n, std::vector<std::vector<float>> values);
image applyConvolution(image& img, const Kernel& kernel, float scale=1.0f, float offset=0.0f, int stride = 1.0f);

void apply_filter(image& img, basicFilter filter, const char* args[], const char* output_name);
void applyFilterOnEveryPPM(const char* dir, basicFilter filter, const char* args[]);
void mapOnPixels(image& img, coordinateFunction f);

inline unsigned char clamp(float value) {
    if (value > 255.0f) return 255;
    if (value < 0.0f) return 0;
    return (unsigned char)value;
}


struct FilterDescriptor { // This will be used in the filter registry
    basicFilter func;
    std::string description;
    std::string usage;
};



#endif