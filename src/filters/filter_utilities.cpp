#include "filter.h"
#include "image.h"
#include <stdio.h>
#include <dirent.h>
#include <string.h>
#include <functional>

void mapOnPixels(image& img, coordinateFunction f){
    for (int y = 0; y < img.height; y++) {
        for (int x = 0; x < img.width; x++) {
            f(img, x, y);
        }
    }
}
Kernel kernel(int n, std::vector<std::vector<float>> values) {
    Kernel k;
    k.size = n;
    k.values = values;
    return k;
}


void apply_filter(image& img, basicFilter filter, const char* args[], const char* output_name) {
    // Apply the filter to the image
    filter(img, args);

    char output_path[512];
    printf("Generating %s\n", output_name);
    snprintf(output_path, sizeof(output_path), "./output/%s", output_name);
    printToPPM(img, output_path);
}

void applyFilterOnEveryPPM(const char* dir, basicFilter filter, const char* args[]){
    DIR* directory = opendir(dir);
    struct dirent* dirEntry;
    int numberOfImages = 0;
    while ((dirEntry = readdir(directory)) != NULL) {
        if (strstr(dirEntry->d_name, ".ppm")) {
            numberOfImages++;
            char img_path[512];
            snprintf(img_path, sizeof(img_path), "%s/%s", dir, dirEntry->d_name);
            printf("Looking at %s\n", img_path);
            image img = read_image(img_path);
            if (!img.data.empty()) {
                // Apply filter to the image
                printf("Applying filter to %s\n", dirEntry->d_name);
                const char* output_name = dirEntry->d_name ;
                apply_filter(img, filter, args,output_name);
            }
        }
    }
    closedir(directory);
}


image applyConvolution(image& img, const Kernel& kernel, float scale=1.0f, float offset=0.0f){
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
            pixel newPix = {clamp((int)(newValueR*scale+offset)), clamp((int)(newValueG*scale+offset)), clamp((int)(newValueB*scale+offset))};
            setPixel(newImg,x,y,newPix);
        }
    }
    return newImg;
}
