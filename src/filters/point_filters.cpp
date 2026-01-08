#include "filter.h"
#include "image.h"
#include "args_parser.h"

pointConfig readPointConfig(const char* args[]) {
    pointConfig pConfig;
    pConfig.brightness = getFlagValue(args, "--brightness", 0);
    pConfig.contrast = getFlagValue(args, "--contrast", 1.0f);
    pConfig.mixingWeight[0] = getFlagValue(args, "--red-mixing", 1.0f);
    pConfig.mixingWeight[1] = getFlagValue(args, "--green-mixing", 1.0f);
    pConfig.mixingWeight[2] = getFlagValue(args, "--blue-mixing", 1.0f);
    return pConfig;
}


void invertFilter(image& img, const char* args[]) {
    pointConfig pConfig = readPointConfig(args);
    applyPointTransform(img, [](image& img ,int x ,int y){
        pixel*p = pixel_ptr(img,x,y);
            if (p){
                p->r = 255 - p->r;
                p->g = 255 - p->g;
                p->b = 255 - p->b;
            }
        }, pConfig);
}


void blackAndWhiteFilter(image& img, const char* args[]){
    pointConfig pConfig = readPointConfig(args);
    applyPointTransform(img, [](image& img ,int x ,int y){
        pixel*p = pixel_ptr(img,x,y);
            if (p){
                float formula = 0.299 * (p->r) + 0.577 * (p->g) + 0.114* (p->b);
                p->r = formula;
                p->g = formula;
                p->b = formula;
            }
        }, pConfig);
}

void thresholdingFilter(image& img, const char* args[]){
    pointConfig pConfig = readPointConfig(args);
    applyPointTransform(img, [](image& img, int x, int y){
        pixel* p = pixel_ptr(img, x, y);
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
    },pConfig);
}

void sepiaFilter(image& img, const char* args[]){
    pointConfig pConfig = readPointConfig(args);
    applyPointTransform(img, [](image& img, int x, int y){
        pixel* p = pixel_ptr(img, x, y);
        if  (p) {
            int red = (p->r);
            int green = (p->g);
            int blue = (p->b);
            p->r = clamp((0.393*red)+(0.769*green)+(0.189*blue));
            p->g = clamp((0.349*red)+(0.686*green)+(0.168*blue));
            p->b = clamp((0.272*red)+(0.534*green)+(0.131*blue));
        }
    }, pConfig);
}

void mirrorFilter(image& img, const char* args[]){
    pointConfig pConfig = readPointConfig(args);
    int center = img.width/2;
    applyPointTransform(img, [center](image& img, int x, int y){
        if (x < center){
            int opuestoX = img.width-x-1;
            pixel mirrPix = getPixelClamped(img, opuestoX, y);
            pixel basePix = getPixelClamped(img, x, y);
            setPixel(img, x, y, mirrPix);
            setPixel(img, opuestoX, y, basePix);
        }
    },pConfig);
}

