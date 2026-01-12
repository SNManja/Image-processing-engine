#include "filter.h"
#include "image.h"
#include <stdio.h>
#include <dirent.h>
#include <string.h>
#include <functional>
#include "args_parser.h"
#include <json.hpp>


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


using GetPixelFunc = pixel (*)(const image&, int, int);
GetPixelFunc getPixelStrategyFunction(const std::string& borderStrategy) {
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
    GetPixelFunc getPixStrat = getPixelStrategyFunction(config.borderStrategy);

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
