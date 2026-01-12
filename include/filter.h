#ifndef FILTER_H
#define FILTER_H

#include "image.h"
#include <functional>
#include <string>
#include "json.hpp"


using json = nlohmann::json;

using basicFilter = void(*)(image&, image&, const json&);
using coordinateFunction = std::function<void(image& src, image& dst, int, int)>;

// point filters
void invertFilter(image& src, image& dst, const json& data);
void blackAndWhiteFilter(image& src, image& dst, const json& data);
void sepiaFilter(image& src, image& dst, const json& data);
void thresholdingFilter(image& src, image& dst, const json& data);
void mirrorFilter(image& src, image& dst, const json& data);

void linearAdjustment(image& src, image& dst, const json& data);
void alphaBlending(image& src, image& dst, const image& base, const json& data);

// convolutional filters
void boxblurFilter(image& src, image& dst, const json& data);
void sharpenFilter(image& src, image& dst, const json& data);
void laplacianOfGaussianFilter(image& src, image& dst, const json& data);
void motionblurFilter(image& src, image& dst, const json& data);
void embossFilter(image& src, image& dst, const json& data);

struct Kernel {
    unsigned char size;
    std::vector<std::vector<float>> values;
};

struct convolutionConfig 
{
    float scale = 1.0f;
    float offset = 0.0f;
    int stride = 1;
    std::string borderStrategy = "clamp";
};

Kernel kernel(int n, std::vector<std::vector<float>> values);
void applyConvolution(image& src, image& dst, const Kernel& kernel, const convolutionConfig& config={});

void apply_filter(image& src, image& dst, basicFilter filter, const json& data, const char* output_name);
void applyPointTransform(image& src, image& dst, coordinateFunction f);

inline unsigned char clamp(float value) {
    if (value > 255.0f) return 255;
    if (value < 0.0f) return 0;
    return (unsigned char)value;
}




#endif