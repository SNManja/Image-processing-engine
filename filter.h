#ifndef FILTER_H
#define FILTER_H

#include "image.h"

using basicFilter = void(*)(image&);

void invertFilter(image&);
void blackAndWhiteFilter(image& img);
void sepiaFilter(image& img);
void thresholdingFilter(image& img);
void mirrorFilter(image& img);
void boxblurFilter(image& img);
void sharpenFilter(image& img);
void laplacianOfGaussianFilter(image& img);
void motionblurFilter(image& img);


struct Kernel {
    unsigned char size;
    std::vector<std::vector<float>> values;
};


Kernel kernel(int n, std::vector<std::vector<float>> values);

void apply_filter(image& img, basicFilter filter, const char* output_name);
void applyFilterOnEveryPPM(const char* dir, basicFilter filter);
image applyConvolution(const image& img, const Kernel& kernel);


inline unsigned char clamp(float value) {
    if (value > 255.0f) return 255;
    if (value < 0.0f) return 0;
    return (unsigned char)value;
}




#endif