#include "filter.h"
#include "image.h"
#include <stdio.h>
#include <dirent.h>
#include <string.h>
#include <functional>
#include "args_parser.h"
#include <json.hpp>


using json = nlohmann::json;

postprocessingConfig readPostprocessingConfig(const char* args[]) {
    postprocessingConfig pConfig;
    pConfig.brightness = getFlagValue(args, "--brightness", 0);
    pConfig.contrast = getFlagValue(args, "--contrast", 1.0f);
    pConfig.blending[0] = getFlagValue(args, "--red-mixing", 1.0f);
    pConfig.blending[1] = getFlagValue(args, "--green-mixing", 1.0f);
    pConfig.blending[2] = getFlagValue(args, "--blue-mixing", 1.0f);
    printf("Postprocessing values: brightness=%f, contrast=%f, red-mixing=%f, green-mixing=%f, blue-mixing=%f\n",
           pConfig.brightness, pConfig.contrast,
           pConfig.blending[0], pConfig.blending[1], pConfig.blending[2]);
    return pConfig;
}

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

void applyPostProcessing(image& baseImg, image& filteredImg, postprocessingConfig pConfig){
    int brightness = pConfig.brightness;
    float contrast = pConfig.contrast;
    float blending[3] = {pConfig.blending[0], pConfig.blending[1], pConfig.blending[2]};

    for (int y = 0; y < baseImg.height; y++) {
        for (int x = 0; x < baseImg.width; x++) {
            pixel* pBase = pixel_ptr(baseImg, x, y);
            pixel* pFiltered = pixel_ptr(filteredImg, x, y);
            if (pBase && pFiltered){
                float newR = (pFiltered->r * blending[0] + pBase->r * (1 - blending[0]));
                float newG = (pFiltered->g * blending[1] + pBase->g * (1 - blending[1]));
                float newB = (pFiltered->b * blending[2] + pBase->b * (1 - blending[2]));

                newR = (newR - 127.5f) * contrast + 127.5f + brightness;
                newG = (newG - 127.5f) * contrast + 127.5f + brightness;
                newB = (newB - 127.5f) * contrast + 127.5f + brightness;
                
                pFiltered->r = clamp(newR);
                pFiltered->g = clamp(newG);
                pFiltered->b = clamp(newB);
            }
        }
    }
}

Kernel kernel(int n, std::vector<std::vector<float>> values) {
    Kernel k;
    k.size = n;
    k.values = values;
    return k;
}


void apply_filter(image& src, image& dst, basicFilter filter, const json& data, const char* output_name) {
    // Apply the filter to the image
    filter(src, dst, data);

    char output_path[512];

    printf("Postprocessing not functional until json parsing transition is complete \n");
    // printf("Applying postprocessing...\n");
    // applyPostProcessing(src, dst, readPostprocessingConfig(data));

    printf("Generating %s\n", output_name);
    snprintf(output_path, sizeof(output_path), "./output/%s", output_name);
    printToPPM(dst, output_path);
}

void applyFilterOnEveryPPM(const char* dir, basicFilter filter, const json& data){
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
            image filtered_img;
            if (!img.data.empty()) {
                // Apply filter to the image
                printf("Applying filter to %s\n", dirEntry->d_name);
                const char* output_name = dirEntry->d_name;
                apply_filter(img, filtered_img, filter, data,  output_name);
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

void applyConvolution(image& src, image& dst, const Kernel& kernel, const convolutionConfig& config){
    
    float scale = config.scale;
    float offset = config.offset;
    int stride = config.stride;
    GetPixelFunc getPixStrat = getPixelFunction(config.borderStrategy);

    int inW = src.width;
    int inH = src.height;
    int k = kernel.size;
    if (k % 2 == 0){
        perror("Kernel size has to be odd");
        return;
    }

    const int kernelCenter = k / 2;
    int padding = kernelCenter; 
    int outW = ((int)((inW-k+2*padding))/stride)+1;
    int outH = ((int)((inH-k+2*padding))/stride)+1;
    dst.width = outW; 
    dst.height = outH;
    dst.data.resize(outW * outH);

    for(int y = 0; y < outH; y++){
        for(int x = 0; x < outW; x++){
            int inX = (x * stride);
            int inY = (y * stride);
            float newValueR = 0, newValueB = 0, newValueG = 0;
            for (int i=0; i < k; i++){
                for (int j=0; j < k; j++){
                    // !For this function call without inlining we will have a lot of performance loss
                    pixel neigh = getPixStrat(src,inX+i-kernelCenter,inY+j-kernelCenter); 
                    newValueR += (neigh.r) * kernel.values[i][j];
                    newValueG += (neigh.g) * kernel.values[i][j];
                    newValueB += (neigh.b) * kernel.values[i][j];
                }
            }
            pixel newPix = {clamp((int)(newValueR*scale+offset)), clamp((int)(newValueG*scale+offset)), clamp((int)(newValueB*scale+offset))};
            setPixel(dst,x,y,newPix);
        }
        
    }
    return;
}
