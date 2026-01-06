#include "filter.h"
#include "image.h"
#include <stdio.h>
#include <dirent.h>
#include <string.h>
#include <functional>

using coordinateFunction = std::function<void(image&, int, int)>;
void mapOnPixels(image& img, coordinateFunction f){
    for (int y = 0; y < img.height; y++) {
        for (int x = 0; x < img.width; x++) {
            f(img, x, y);
        }
    }
}


void invertFilter(image& img) {
    mapOnPixels(img, [](image& img ,int x ,int y){
        pixel*p = getPixel(img,x,y);
            if (p){
                float formula = 0.299 * (p->r) + 0.577 * (p->g) + 0.114* (p->b);
                p->r = 255 - p->r;
                p->g = 255 - p->g;
                p->b = 255 - p->b;
            }
        }
    );
}


void blackAndWhiteFilter(image& img){
    mapOnPixels(img, [](image& img ,int x ,int y){
        pixel*p = getPixel(img,x,y);
            if (p){
                float formula = 0.299 * (p->r) + 0.577 * (p->g) + 0.114* (p->b);
                p->r = formula;
                p->g = formula;
                p->b = formula;
            }
        }
    );
}

void thresholdingFilter(image& img){
    mapOnPixels(img, [](image& img, int x, int y){
        pixel* p = getPixel(img, x, y);
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

void sepiaFilter(image& img){
    mapOnPixels(img, [](image& img, int x, int y){
        pixel* p = getPixel(img, x, y);
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

void mirrorFilter(image& img){
    int center = img.width/2;
    mapOnPixels(img, [center](image& img, int x, int y){
        if (x < center){
            int opuestoX = img.width-x-1;
            pixel mirrPix = copyPixel(img, opuestoX, y);
            pixel basePix = copyPixel(img, x, y);
            setPixel(img, x, y, mirrPix);
            setPixel(img, opuestoX, y, basePix);
        }
    });
}


void apply_filter(image& img, basicFilter filter, const char* output_name) {
    // Apply the filter to the image
    filter(img);

    char output_path[512];
    printf("Generando %s\n", output_name);
    snprintf(output_path, sizeof(output_path), "./output/%s", output_name);
    printToPPM(img, output_path);
}

void applyFilterOnEveryPPM(const char* dir, basicFilter filter){
    DIR* directory = opendir(dir);
    printf("Accedio primer open\n");
    struct dirent* dirEntry;
    int numberOfImages = 0;
    while ((dirEntry = readdir(directory)) != NULL) {
        if (strstr(dirEntry->d_name, ".ppm")) {
            numberOfImages++;
            char img_path[512];
            snprintf(img_path, sizeof(img_path), "%s/%s", dir, dirEntry->d_name);
            printf("Obserbando file %s\n", img_path);
            image img = read_image(img_path);
            if (!img.data.empty()) {
                // Apply filter to the image
                printf("Aplicando filtro a %s\n", dirEntry->d_name);
                const char* output_name = dirEntry->d_name ;
                apply_filter(img, filter, output_name);
            }
        }
    }
    closedir(directory);
}


image applyConvolution(image& img, const Kernel& kernel){
    image newImg;
    newImg.width = img.width; int w = newImg.width;
    newImg.height = img.height; int h = newImg.height;
    newImg.data.resize(w * h);
    const int kernelCenter = kernel.size / 2;
    for(int x = 0; x < w; x++){
        for(int y = 0; y < h; y++){
            float newValueR = 0, newValueB = 0, newValueG = 0;
            for (int i=0; i < kernel.size; i++){
                for (int j=0; j < kernel.size; j++){
                    pixel* neigh = getPixelClamped(img,x+i-kernelCenter,y+j-kernelCenter);
                    newValueR += (neigh->r) * kernel.values[i][j];
                    newValueG += (neigh->g) * kernel.values[i][j];
                    newValueB += (neigh->b) * kernel.values[i][j];
                }
            }
            pixel newPix = {clamp((int)newValueR), clamp((int)newValueG), clamp((int)newValueB)};
            setPixel(newImg,x,y,newPix);
        }
    }
    return newImg;
}

void boxblurFilter(image& img) {
    Kernel k;
    k.size = 3;
    k.values = {
        {1/9.0, 1/9.0, 1/9.0},
        {1/9.0, 1/9.0, 1/9.0},
        {1/9.0, 1/9.0, 1/9.0}
    };
    img = applyConvolution(img, k);
}

void sharpenFilter(image& img) {
    Kernel k;
    k.size = 3;
    k.values = {
        {0, -1, 0},
        {-1, 5, -1},
        {0, -1, 0}
    };
    img = applyConvolution(img, k);
}

void enbossFilter(image& img) {
    Kernel k;
    k.size = 3;
    k.values = {
        {-2, -1, 0},
        {-1, 1, 1},
        {0, 1, 2}
    };
    img = applyConvolution(img, k);
}

void laplacianOfGaussianFilter(image& img) {
    Kernel k;
    k.size = 5;
    k.values = {
        {0, 0, -1, 0, 0},
        {0, -1, -2, -1, 0},
        {-1, -2, 16, -2, -1},
        {0, -1, -2, -1, 0},
        {0, 0, -1, 0, 0}
    };
    img = applyConvolution(img, k);
}

void motionblurFilter(image& img) {
    Kernel k;
    k.size = 5;
    k.values = {
        {1/5.0, 0, 0, 0, 0},
        {0, 1/5.0, 0, 0, 0},
        {0, 0, 1/5.0, 0, 0},
        {0, 0, 0, 1/5.0, 0},
        {0, 0, 0, 0, 1/5.0}
    };
    img = applyConvolution(img, k);
}