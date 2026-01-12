#include "filter.h"
#include "image.h"
#include "args_parser.h"
#include "json.hpp"

/*
    Convolution processing functions
*/

using json = nlohmann::json;

Kernel kernel(int n, std::vector<std::vector<float>> values) {
    Kernel k;
    k.size = n;
    k.values = values;
    return k;
}

using GetPixelFunc = pixel (*)(const image&, int, int);
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

/*
    Filters
*/


convolutionConfig readConvolutionConfig(const json& data) {
    convolutionConfig config = {};
    if(data.contains("params")){
        const json& params = data["params"];
        config.stride = params.value("stride", config.stride);
        config.offset = params.value("offset", config.offset);
        config.scale  = params.value("scale", config.scale);
        config.borderStrategy = params.value("border", config.borderStrategy);
    }
    return config;
}

void boxblurFilter(image& src, image& dst, const filterContext& ctx) {
    convolutionConfig config = readConvolutionConfig(ctx.data);
    // blur size
    int blurSize = 3;
    if(ctx.data.contains("params") && ctx.data["params"].contains("size")) {
        blurSize = ctx.data["params"]["size"];
    }
    if(blurSize % 2 == 0) {
        blurSize++;  // Make sure the blur size is odd
        printf("Blur size has to be odd. Increasing to %d\n", blurSize);
    }
    

    std::vector<std::vector<float>> kernelVector(blurSize, std::vector<float>(blurSize, 1.0f / (blurSize * blurSize)));
    printf("Kernel size: %d\n", blurSize);
    Kernel k = kernel(blurSize, kernelVector);
    applyConvolution(src, dst, k, config);
}

void sharpenFilter(image& src, image& dst, const filterContext& ctx) {
    convolutionConfig config = readConvolutionConfig(ctx.data);

    float amountValue = 1.0;
    if(ctx.data.contains("params") && ctx.data["params"].contains("amount")) {
        amountValue = ctx.data["params"]["amount"];
    }
    printf("Sharpening with amount: %f\n", amountValue);

    Kernel k = kernel(3, {
        {0, -amountValue, 0},
        {-amountValue, amountValue * 5, -amountValue},
        {0, -amountValue, 0}
    });
    applyConvolution(src, dst, k, config);
}

void embossFilter(image& src, image& dst, const filterContext& ctx) {
    convolutionConfig config = readConvolutionConfig(ctx.data);
    Kernel k = kernel(3, {
        {-2, -1, 0},
        {-1, 1, 1},
        {0, 1, 2}
    });
    applyConvolution(src, dst, k, config);
}

void laplacianOfGaussianFilter(image& src, image& dst, const filterContext& ctx) {
    convolutionConfig config = readConvolutionConfig(ctx.data);
    Kernel k = kernel(5, {
        {0, 0, -1, 0, 0},
        {0, -1, -2, -1, 0},
        {-1, -2, 16, -2, -1},
        {0, -1, -2, -1, 0},
        {0, 0, -1, 0, 0}
    });
    applyConvolution(src, dst, k, config);
}

void motionblurFilter(image& src, image& dst, const filterContext& ctx) {
    convolutionConfig config = readConvolutionConfig(ctx.data);
    Kernel k = kernel(5, {
        {1/5.0, 0, 0, 0, 0},
        {0, 1/5.0, 0, 0, 0},
        {0, 0, 1/5.0, 0, 0},
        {0, 0, 0, 1/5.0, 0},
        {0, 0, 0, 0, 1/5.0}
    });
    applyConvolution(src, dst, k, config);
}
