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
void invertFilter(image& src, image& dst, const json& args);
void blackAndWhiteFilter(image& src, image& dst, const json& args);
void sepiaFilter(image& src, image& dst, const json& args);
void thresholdingFilter(image& src, image& dst, const json& args);
void mirrorFilter(image& src, image& dst, const json& args);

// convolutional filters
void boxblurFilter(image& src, image& dst, const json& args);
void sharpenFilter(image& src, image& dst, const json& args);
void laplacianOfGaussianFilter(image& src, image& dst, const json& args);
void motionblurFilter(image& src, image& dst, const json& args);
void embossFilter(image& src, image& dst, const json& args);

struct Kernel {
    unsigned char size;
    std::vector<std::vector<float>> values;
};

struct postprocessingConfig{
    float brightness = 0.0f;
    float contrast = 1.0f;
    float blending[3] = {1.0f, 1.0f, 1.0f};
};

postprocessingConfig readPostprocessingConfig(const char* args[]);

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
void applyFilterOnEveryPPM(const char* dir, basicFilter filter, const json& data);
void applyPointTransform(image& src, image& dst, coordinateFunction f);
void applyPostProcessing(image& baseImg, image& filteredImg, postprocessingConfig pConfig);

inline unsigned char clamp(float value) {
    if (value > 255.0f) return 255;
    if (value < 0.0f) return 0;
    return (unsigned char)value;
}




#endif