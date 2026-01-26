#ifndef FILTER_H
#define FILTER_H

#include "image.h"
#include <functional>
#include <string>
#include "json.hpp"




using json = nlohmann::json;


struct filterContext {
    const json& data;
    const image<float>& base;
};

using BasicFilter = std::function<void(const image<float>&,image<float>&, const filterContext&)>;
using coordinateFunction = std::function<void(const image<float>& src, image<float>& dst, int, int)>;

// point filters
void invertFilter(const image<float>& src, image<float>& dst, const filterContext& ctx);
void blackAndWhiteFilter(const image<float>& src, image<float>& dst, const filterContext& ctx);
void sepiaFilter(const image<float>& src, image<float>& dst, const filterContext& ctx);
void thresholdingFilter(const image<float>& src, image<float>& dst, const filterContext& ctx);
void mirrorFilter(const image<float>& src, image<float>& dst, const filterContext& ctx);

void linearAdjustment(const image<float>& src, image<float>& dst, const filterContext& ctx);
void alphaBlending(const image<float>& src, image<float>& dst, const filterContext& ctx);

// convolutional filters
void boxblurFilter(const image<float>& src, image<float>& dst, const filterContext& ctx);
void sharpenFilter(const image<float>& src, image<float>& dst, const filterContext& ctx);
void laplacianOfGaussianFilter(const image<float>& src, image<float>& dst, const filterContext& ctx);
void motionblurFilter(const image<float>& src, image<float>& dst, const filterContext& ctx);
void embossFilter(const image<float>& src, image<float>& dst, const filterContext& ctx);

// Gradient
void sobelOperatorFilter(const image<float>& src, image<float>& dst,const filterContext& cfg);


//
void ditheringFilter(const image<float>& src, image<float>& dst, const filterContext& ctx);


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
void applyConvolution(const image<float>& src, image<float>& dst, const Kernel& kernel, const convolutionConfig& config={});
void applyPointTransform(const image<float>& src, image<float>& dst, coordinateFunction f);
convolutionConfig readConvolutionConfig(const json& data);

template <typename T> T lookingForParamInCtx(const filterContext& ctx, std::string paramName, T defaultValue){
    nlohmann::json data = ctx.data;
    if (data.contains("params") && data["params"].contains(paramName)) {
        return data["params"][paramName].get<T>();
    }
    return defaultValue;
}


inline void resizeToMatchSrc(const image<float>& src, image<float>& dst) {
    dst.width = src.width;
    dst.height = src.height;
    dst.data.resize(src.width * src.height);
}


#endif