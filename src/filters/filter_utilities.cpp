#include "filter.h"
#include "image.h"
#include <stdio.h>
#include <dirent.h>
#include <string.h>
#include <functional>

void applyPointTransform(image& img, coordinateFunction f, pointConfig pConfig){
    int brightness = pConfig.brightness;
    float contrast = pConfig.contrast;
    float channel[3] = {pConfig.mixingWeight[0], pConfig.mixingWeight[1], pConfig.mixingWeight[2]};

    for (int y = 0; y < img.height; y++) {
        for (int x = 0; x < img.width; x++) {
            pixel pIni = getPixelConstant(img, x, y);
            f(img, x, y);
            pixel* p = pixel_ptr(img, x, y);

            // Brightness and contrast
            float p_r = (p->r - 127.5)*contrast + 127.5 + brightness;
            float p_g = (p->g - 127.5)*contrast + 127.5 + brightness;
            float p_b = (p->b - 127.5)*contrast + 127.5 + brightness;

            // Channel masking
            p->r = clamp(pIni.r * (1-channel[0]) + p_r * (channel[0]));
            p->g = clamp(pIni.g * (1-channel[1]) + p_g * (channel[1]));
            p->b = clamp(pIni.b * (1-channel[2]) + p_b * (channel[2]));
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

using GetPixelFunc = pixel (*)(image&, int, int);
GetPixelFunc getPixelFunction(const std::string& borderStrategy) {
    printf("Using strategy: %s (if valid)\n", borderStrategy.c_str());
    if (borderStrategy == "clamp") {
        return getPixelClamped;
    }
    if (borderStrategy == "wrap") {
        return getPixelWrapped;
    }
    if (borderStrategy == "mirror") {
        return getPixelMirrored;
    }
    if (borderStrategy == "constant") {
        return getPixelConstant;
    }
    printf("Invalid strategy, defaulting to clamp\n");
    return getPixelClamped; // Default to clamp
}

image applyConvolution(image& img, const Kernel& kernel, const convolutionConfig& config){
    image newImg;
    float scale = config.scale;
    float offset = config.offset;
    int stride = config.stride;
    GetPixelFunc getPixStrat = getPixelFunction(config.borderStrategy);

    int inW = img.width;
    int inH = img.height;
    int k = kernel.size;
    if (k % 2 == 0){
        perror("Kernel size has to be odd");
        return img;
    }

    const int kernelCenter = k / 2;
    int padding = kernelCenter; 
    int outW = ((int)((inW-k+2*padding))/stride)+1;
    int outH = ((int)((inH-k+2*padding))/stride)+1;
    newImg.width = outW; 
    newImg.height = outH;
    newImg.data.resize(outW * outH);

    for(int y = 0; y < outH; y++){
        for(int x = 0; x < outW; x++){
            int inX = (x * stride);
            int inY = (y * stride);
            float newValueR = 0, newValueB = 0, newValueG = 0;
            for (int i=0; i < k; i++){
                for (int j=0; j < k; j++){
                    // !For this function call without inlining we will have a lot of performance loss
                    pixel neigh = getPixStrat(img,inX+i-kernelCenter,inY+j-kernelCenter); 
                    newValueR += (neigh.r) * kernel.values[i][j];
                    newValueG += (neigh.g) * kernel.values[i][j];
                    newValueB += (neigh.b) * kernel.values[i][j];
                }
            }
            pixel newPix = {clamp((int)(newValueR*scale+offset)), clamp((int)(newValueG*scale+offset)), clamp((int)(newValueB*scale+offset))};
            setPixel(newImg,x,y,newPix);
        }
        
    }
    return newImg;
}
