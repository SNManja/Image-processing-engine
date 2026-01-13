#ifndef FILTER_H
#define FILTER_H

#include "image.h"
#include <functional>
#include <string>
#include "json.hpp"


using json = nlohmann::json;


struct filterContext {
    const json& data;
    const image& base;
};

using BasicFilter = std::function<void(image&,image&, const filterContext&)>;
using coordinateFunction = std::function<void(image& src, image& dst, int, int)>;

// point filters
void invertFilter(image& src, image& dst, const filterContext& ctx);
void blackAndWhiteFilter(image& src, image& dst, const filterContext& ctx);
void sepiaFilter(image& src, image& dst, const filterContext& ctx);
void thresholdingFilter(image& src, image& dst, const filterContext& ctx);
void mirrorFilter(image& src, image& dst, const filterContext& ctx);

void linearAdjustment(image& src, image& dst, const filterContext& ctx);
void alphaBlending(image& src, image& dst, const filterContext& ctx);

// convolutional filters
void boxblurFilter(image& src, image& dst, const filterContext& ctx);
void sharpenFilter(image& src, image& dst, const filterContext& ctx);
void laplacianOfGaussianFilter(image& src, image& dst, const filterContext& ctx);
void motionblurFilter(image& src, image& dst, const filterContext& ctx);
void embossFilter(image& src, image& dst, const filterContext& ctx);

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
void applyConvolution(const image& src, image& dst, const Kernel& kernel, const convolutionConfig& config={});
void applyPointTransform(const image& src, image& dst, coordinateFunction f);

inline unsigned char clamp(float value) {
    if (value > 255.0f) return 255;
    if (value < 0.0f) return 0;
    return (unsigned char)value;
}




#endif