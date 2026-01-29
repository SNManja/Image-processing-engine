#include "filter.h"
#include "image.h"
#include "args_parser.h"
#include "json.hpp"
#include <cassert>
#include <thread>

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

struct SplitKernel { // TODO implement split kernel optimization in convolutions
    int size;
    std::vector<float> rowValues;
    std::vector<float> colValues;
};

SplitKernel splitKernel(int n, std::vector<float> rowValues, std::vector<float> colValues) {
    SplitKernel k;
    k.size = n;
    k.rowValues = rowValues;
    k.colValues = colValues;
    return k;
}

using GetPixelFunc = pixel<float> (*)(const image<float>&, int, int);
GetPixelFunc getPixelFunction(const std::string& borderStrategy) {
    //printf("Using strategy: %s (if valid)\n", borderStrategy.c_str());
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



void genericConvolution(const image<float>& src, image<float>& dst, const Kernel& kernel, const convolutionConfig& config){

    float scale = config.scale;
    float offset = config.offset;
    int stride = config.stride;
    GetPixelFunc getPixStrat = getPixelFunction(config.borderStrategy);

    int inW = src.width;
    int inH = src.height;
    int k = kernel.size;
  
    const int kernelCenter = k / 2;
    int padding = kernelCenter; 
    int outW = ((int)((inW-k+2*padding))/stride)+1;
    int outH = ((int)((inH-k+2*padding))/stride)+1;
    dst.width = outW; 
    dst.height = outH;
    dst.data.resize(outW * outH);

    
     // Instance threads
    int threadCount = std::thread::hardware_concurrency();
    std::vector<std::thread> threads;
    if (threadCount == 0) threadCount = 2; // Fallback

    int chunkSize = dst.height / threadCount;

    for (int t = 0; t < threadCount; ++t){
        int ty = t * chunkSize;
        int tx = 0;
        int topChunkY = ty+chunkSize;
        int topChunkX = outW;
        if (t == threadCount - 1) {
            topChunkY = outH;
        }
        threads.emplace_back([=, &src, &dst, &kernel, &config](){
           for(int y = ty; y < topChunkY; y++){
                for(int x = tx; x < topChunkX; x++){
                    int inX = (x * stride);
                    int inY = (y * stride);
                    float newValueR = 0, newValueB = 0, newValueG = 0;
                    for (int i=0; i < k; i++){
                        for (int j=0; j < k; j++){
                            // !This function call without inlining may have performance loss
                            pixel<float> neigh = getPixStrat(src,inX+i-kernelCenter,inY+j-kernelCenter);
                            newValueR += (neigh.r) * kernel.values[i][j];
                            newValueG += (neigh.g) * kernel.values[i][j];
                            newValueB += (neigh.b) * kernel.values[i][j];
                        }
                    }
                    pixel<float> newPix = {(newValueR*scale+offset), (newValueG*scale+offset), (newValueB*scale+offset)};
                    setPixel<float>(dst,x,y,newPix);
                }
        
            } 
        });
        
    }
    for (auto& t : threads) {
        if (t.joinable()) {
            t.join();
        }
    } 
}

void applyConvolution(const image<float>& src, image<float>& dst, const Kernel& kernel, const convolutionConfig& config){
    int kSize = kernel.size;
    if (kSize % 2 == 0){
        printf("Kernel size has to be odd, skipping filter");
        dst = src;
        return;
    }
    assert((int)(kernel.values.size()*kernel.values[0].size()) == (kSize * kSize));
    genericConvolution(src, dst, kernel, config);
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

void boxblurFilter(const image<float>& src, image<float>& dst, const filterContext& ctx) {
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

void sharpenFilter(const image<float>& src, image<float>& dst, const filterContext& ctx) {
    convolutionConfig config = readConvolutionConfig(ctx.data);

    float amountValue = 1.0f;
    if(ctx.data.contains("params") && ctx.data["params"].contains("amount")) {
        amountValue = ctx.data["params"]["amount"];
    }
    //printf("Sharpening with amount: %f\n", amountValue);

    Kernel k = kernel(3, {
        {0, -amountValue, 0},
        {-amountValue, amountValue * 4.0f + 1.0f, -amountValue},
        {0, -amountValue, 0}
    });
    applyConvolution(src, dst, k, config);
}

void embossFilter(const image<float>& src, image<float>& dst, const filterContext& ctx) {
    convolutionConfig config = readConvolutionConfig(ctx.data);
    Kernel k = kernel(3, {
        {-2, -1, 0},
        {-1, 1, 1},
        {0, 1, 2}
    });
    applyConvolution(src, dst, k, config);
}

void laplacianOfGaussianFilter(const image<float>& src, image<float>& dst, const filterContext& ctx) {
    convolutionConfig config = readConvolutionConfig(ctx.data);
    Kernel k = kernel(5, {
        {0, 0, -1, 0, 0},
        {0, -1, -2, -1, 0},
        {-1, -2, 12, -2, -1},
        {0, -1, -2, -1, 0},
        {0, 0, -1, 0, 0}
    });
    applyConvolution(src, dst, k, config);
}

void motionblurFilter(const image<float>& src, image<float>& dst, const filterContext& ctx) {
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
