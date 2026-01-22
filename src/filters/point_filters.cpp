#include "filter.h"
#include "image.h"
#include "json.hpp"
#include <stdexcept>
using json = nlohmann::json;


void applyPointTransform(const image<float>& src, image<float>& dst, coordinateFunction f){

    if (src.height != dst.height || src.width != dst.width) {
        throw std::invalid_argument("Source and destination images must have the same dimensions");
    }
    for (int y = 0; y < src.height; y++) {
        for (int x = 0; x < src.width; x++) {
            f(src, dst, x, y);
        }
    }
}


void resizeToMatchSrc(const image<float>& src, image<float>& dst) {
    dst.width = src.width;
    dst.height = src.height;
    dst.data.resize(src.width * src.height);
}

void invertFilter(const image<float>& src, image<float>& dst, const filterContext& ctx) {

    resizeToMatchSrc(src, dst);
    applyPointTransform(src, dst, [ctx](const image<float>& src, image<float>& dst, int x, int y){
        setPixel(dst, x, y, getPixelConstant(src, x, y));
        pixel<float>* p = pixel_ptr(dst, x, y);
        p->r = MAX_PIXEL_VALUE - p->r;
        p->g = MAX_PIXEL_VALUE - p->g;
        p->b = MAX_PIXEL_VALUE - p->b;

    });
}


void blackAndWhiteFilter(const image<float>& src, image<float>& dst, const filterContext& ctx){

    resizeToMatchSrc(src, dst);
    applyPointTransform(src, dst, [ctx](const image<float>& src, image<float>& dst, int x, int y){
        setPixel(dst, x, y, getPixelConstant(src, x, y));
        pixel<float>* p = pixel_ptr(dst, x, y);
        if (p){
            float formula = 0.299 * (p->r) + 0.587 * (p->g) + 0.114* (p->b);
            p->r = formula;
            p->g = formula;
            p->b = formula;
        }
    });
}

void thresholdingFilter(const image<float>& src, image<float>& dst, const filterContext& ctx){

    resizeToMatchSrc(src, dst);
    applyPointTransform(src, dst, [ctx](const image<float>& src, image<float>& dst, int x, int y){
        setPixel(dst, x, y, getPixelConstant(src, x, y));
        pixel<float>* p = pixel_ptr(dst, x, y);
        if (p) {
            float formula = 0.299 * (p->r) + 0.587 * (p->g) + 0.114 * (p->b);
            if (formula > (MAX_PIXEL_VALUE*0.5f)) {
                p->r = MAX_PIXEL_VALUE;
                p->g = MAX_PIXEL_VALUE;
                p->b = MAX_PIXEL_VALUE;
            } else {
                p->r = 0;
                p->g = 0;
                p->b = 0;
            }
        }
    });
}

void sepiaFilter(const image<float>& src, image<float>& dst, const filterContext& ctx){

    resizeToMatchSrc(src, dst);
    applyPointTransform(src, dst, [ctx](const image<float>& src, image<float>& dst, int x, int y){

        setPixel(dst, x, y, getPixelConstant(src, x, y));
        pixel<float>* p = pixel_ptr(dst, x, y);
        if  (p) {
            float red = (p->r);
            float green = (p->g);
            float blue = (p->b);
            p->r = clamp((0.393*red)+(0.769*green)+(0.189*blue));
            p->g = clamp((0.349*red)+(0.686*green)+(0.168*blue));
            p->b = clamp((0.272*red)+(0.534*green)+(0.131*blue));
        }
    });
}

void mirrorFilter(const image<float>& src, image<float>& dst, const filterContext& ctx){

    resizeToMatchSrc(src, dst);
    int center = src.width/2;
    applyPointTransform(src, dst, [center](const image<float>& src, image<float>& dst, int x, int y){
        if (x < center){
            int opuestoX = src.width-x-1;
            pixel<float> mirrPix = getPixelClamped(src, opuestoX, y);
            pixel<float> basePix = getPixelClamped(src, x, y);
            setPixel<float>(dst, x, y, mirrPix);
            setPixel<float>(dst, opuestoX, y, basePix);
        }
    });
}

void alphaBlending(const image<float>& src, image<float>& dst, const filterContext& ctx){

    resizeToMatchSrc(src, dst);
    std::vector<float> alpha = {1.0f, 1.0f, 1.0f}; 
    json data = ctx.data;
    const image<float>& base = ctx.base;
    if (data.contains("params") && data["params"].contains("alpha")) {
        alpha = data["params"]["alpha"].get<std::vector<float>>();
    }

    assert(alpha.size() == 3);
    assert(alpha[0] >= 0.0f && alpha[0] <= 1.0f);   
    assert(alpha[1] >= 0.0f && alpha[1] <= 1.0f);
    assert(alpha[2] >= 0.0f && alpha[2] <= 1.0f);

    if (src.width != base.width || src.height != base.height) {
        printf("Source and base images must have the same dimensions for alpha blending");
        return;
    }
    assert(src.width == base.width && src.height == base.height);

    applyPointTransform(src, dst, [&alpha, &base](const image<float>& src, image<float>& dst, int x, int y){
        pixel<float> pBase = getPixelConstant(base, x, y);
        pixel<float> pSrc = getPixelConstant(src, x, y);
        pixel<float>* pointDst = pixel_ptr(dst, x, y);
        if (pointDst){
            pointDst->r = clamp(pSrc.r * (alpha[0]) + pBase.r * (1 - alpha[0]));
            pointDst->g = clamp(pSrc.g * (alpha[1]) + pBase.g * (1 - alpha[1]));
            pointDst->b = clamp(pSrc.b * (alpha[2]) + pBase.b * (1 - alpha[2]));
        }
    });
}

void linearAdjustment(const image<float>& src, image<float>& dst, const filterContext& ctx){

    float offset = 0;
    float scale = 1.0f;
    if (ctx.data.contains("params") && ctx.data["params"].contains("offset")) {
        offset = ((float)ctx.data["params"]["offset"]);
    }
    if (ctx.data.contains("params") && ctx.data["params"].contains("scale")) {
        scale = ctx.data["params"]["scale"];
    }
    // Fix offset so it's relative to max value
    offset /= ((float)MAX_COLOR_CHAR);
    //printf("offset value %f\nscale value %f\n",offset,scale);
    resizeToMatchSrc(src, dst);
    applyPointTransform(src, dst, [offset, scale](const image<float>& src, image<float>& dst, int x, int y){

        setPixel(dst, x, y, getPixelConstant(src, x, y));
        pixel<float>* p = pixel_ptr(dst, x, y);
        if (p){
            p->r = clamp(p->r * scale + offset);
            p->g = clamp(p->g * scale + offset);
            p->b = clamp(p->b * scale + offset);
        }
    });
}