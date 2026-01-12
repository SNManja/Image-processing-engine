#include "filter.h"
#include "image.h"
#include "json.hpp"
using json = nlohmann::json;




void applyPointTransform(image& src, image& dst, coordinateFunction f){

    if (src.height != dst.height || src.width != dst.width){
        perror("Source and destination images must have the same dimensions");
        return;
    }
    for (int y = 0; y < src.height; y++) {
        for (int x = 0; x < src.width; x++) {
            f(src, dst, x, y);
        }
    }
}


void resizeToMatchSrc(image& src, image& dst) {
    dst.width = src.width;
    dst.height = src.height;
    dst.data.resize(src.width * src.height);
}

void invertFilter(image& src, image& dst, const filterContext& ctx) {

    resizeToMatchSrc(src, dst);
    applyPointTransform(src, dst, [ctx](image& src, image& dst, int x, int y){
        setPixel(dst, x, y, getPixelConstant(src, x, y));
        pixel* p = pixel_ptr(dst, x, y);
        p->r = 255 - p->r;
        p->g = 255 - p->g;
        p->b = 255 - p->b;

    });
}


void blackAndWhiteFilter(image& src, image& dst, const filterContext& ctx){

    resizeToMatchSrc(src, dst);
    applyPointTransform(src, dst, [ctx](image& src, image& dst, int x, int y){
        setPixel(dst, x, y, getPixelConstant(src, x, y));
        pixel* p = pixel_ptr(dst, x, y);
        if (p){
            float formula = 0.299 * (p->r) + 0.577 * (p->g) + 0.114* (p->b);
            p->r = formula;
            p->g = formula;
            p->b = formula;
        }
    });
}

void thresholdingFilter(image& src, image& dst, const filterContext& ctx){

    resizeToMatchSrc(src, dst);
    applyPointTransform(src, dst, [ctx](image& src, image& dst, int x, int y){
        setPixel(dst, x, y, getPixelConstant(src, x, y));
        pixel* p = pixel_ptr(dst, x, y);
        if (p) {
            float formula = 0.299 * (p->r) + 0.577 * (p->g) + 0.114 * (p->b);
            if (formula > 128) {
                p->r = 255;
                p->g = 255;
                p->b = 255;
            } else {
                p->r = 0;
                p->g = 0;
                p->b = 0;
            }
        }
    });
}

void sepiaFilter(image& src, image& dst, const filterContext& ctx){

    resizeToMatchSrc(src, dst);
    applyPointTransform(src, dst, [ctx](image& src, image& dst, int x, int y){

        setPixel(dst, x, y, getPixelConstant(src, x, y));
        pixel* p = pixel_ptr(dst, x, y);
        if  (p) {
            int red = (p->r);
            int green = (p->g);
            int blue = (p->b);
            p->r = clamp((0.393*red)+(0.769*green)+(0.189*blue));
            p->g = clamp((0.349*red)+(0.686*green)+(0.168*blue));
            p->b = clamp((0.272*red)+(0.534*green)+(0.131*blue));
        }
    });
}

void mirrorFilter(image& src, image& dst, const filterContext& ctx){

    resizeToMatchSrc(src, dst);
    int center = src.width/2;
    applyPointTransform(src, dst, [center](image& src, image& dst, int x, int y){
        if (x < center){
            int opuestoX = src.width-x-1;
            pixel mirrPix = getPixelClamped(src, opuestoX, y);
            pixel basePix = getPixelClamped(src, x, y);
            setPixel(dst, x, y, mirrPix);
            setPixel(dst, opuestoX, y, basePix);
        }
    });
}

void alphaBlending(image& src, image& dst, const filterContext& ctx){

    resizeToMatchSrc(src, dst);
    std::vector<float> alpha = {1.0f, 1.0f, 1.0f}; 
    json data = ctx.data;
    const image& base = ctx.base;
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

    applyPointTransform(src, dst, [&alpha, &base](image& src, image& dst, int x, int y){
        pixel pBase = getPixelConstant(base, x, y);
        pixel pSrc = getPixelConstant(src, x, y);
        pixel* pointDst = pixel_ptr(dst, x, y);
        if (pointDst){
            pointDst->r = clamp((int)(pSrc.r * (1 - alpha[0]) + pBase.r * alpha[0]));
            pointDst->g = clamp((int)(pSrc.g * (1 - alpha[1]) + pBase.g * alpha[1]));
            pointDst->b = clamp((int)(pSrc.b * (1 - alpha[2]) + pBase.b * alpha[2]));
        }
    });
}

void linearAdjustment(image& src, image& dst, const filterContext& ctx){

    int offset = 0;
    float scale = 1.0f;
    if (ctx.data.contains("params") && ctx.data["params"].contains("offset")) {
        offset = ctx.data["params"]["offset"];
    }
    if (ctx.data.contains("params") && ctx.data["params"].contains("scale")) {
        scale = ctx.data["params"]["scale"];
    }

    resizeToMatchSrc(src, dst);
    applyPointTransform(src, dst, [offset, scale](image& src, image& dst, int x, int y){

        setPixel(dst, x, y, getPixelConstant(src, x, y));
        pixel* p = pixel_ptr(dst, x, y);
        if (p){
            p->r = clamp((int)(p->r * scale + offset));
            p->g = clamp((int)(p->g * scale + offset));
            p->b = clamp((int)(p->b * scale + offset));
        }
    });
}