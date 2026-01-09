#include "filter.h"
#include "image.h"


void resizeToMatchSrc(image& src, image& dst) {
    dst.width = src.width;
    dst.height = src.height;
    dst.data.resize(src.width * src.height);
}

void invertFilter(image& src, image& dst, const char* args[]) {

    resizeToMatchSrc(src, dst);
    applyPointTransform(src, dst, [](image& src, image& dst, int x, int y){
        
        setPixel(dst, x, y, getPixelConstant(src, x, y));
        pixel* p = pixel_ptr(dst, x, y);
        p->r = 255 - p->r;
        p->g = 255 - p->g;
        p->b = 255 - p->b;

    });
}


void blackAndWhiteFilter(image& src, image& dst, const char* args[]){

    resizeToMatchSrc(src, dst);
    applyPointTransform(src, dst, [](image& src, image& dst, int x, int y){
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

void thresholdingFilter(image& src, image& dst, const char* args[]){

    resizeToMatchSrc(src, dst);
    applyPointTransform(src, dst, [](image& src, image& dst, int x, int y){
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

void sepiaFilter(image& src, image& dst, const char* args[]){

    resizeToMatchSrc(src, dst);
    applyPointTransform(src, dst, [](image& src, image& dst, int x, int y){
        
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

void mirrorFilter(image& src, image& dst, const char* args[]){

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

