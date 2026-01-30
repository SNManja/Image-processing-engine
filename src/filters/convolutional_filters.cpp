#include "filter.h"
#include "image.h"
#include "args_parser.h"
#include "json.hpp"
#include <cassert>
#include "linear_algebra_operations.h"

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


SplitKernel splitKernel(const Kernel& k) {
    SplitKernel sk;
    sk.size = k.size;

    sk.rowValues.assign(1, std::vector<float>(k.size));   // 1×k
    sk.colValues.assign(k.size, std::vector<float>(1));   // k×1

    float pivot = k.values[0][0];
    int pivotRow = 0;
    int pivotCol = 0;
    for(int i = 0; i < k.size; i++){
        for(int j = 0; j < k.size; j++) {
            if (abs(k.values[i][j]) > abs(pivot)) {
                pivot = k.values[i][j];
                pivotRow = i;
                pivotCol = j;
            }
        }
    }
    if (floatCmp(pivot, 0) == 0) {
        throw std::runtime_error("Max kernel absolute value is 0");
    }

    for (int j = 0; j < k.size; j++) sk.rowValues[0][j] = k.values[pivotRow][j] / pivot;

    for (int i = 0; i < k.size; i++) sk.colValues[i][0] = k.values[i][pivotCol];

    // sanity check
    std::vector<std::pair<int,int>> probes = {
        {0, 0},
        {0, k.size-1},
        {k.size-1, 0},
        {k.size-1, k.size-1},
        {k.size/2, k.size/2}
    };

    for (auto [i, j] : probes) {
        float reconstructed = sk.colValues[i][0] * sk.rowValues[0][j];
        float original = k.values[i][j];
        if (!(floatCmp(reconstructed, original) == 0)) {
            throw std::runtime_error("Sanity check failed: kernel is not truly rank-1");
        }
    }
    return sk;
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
    bool splitKernelEnabled = config.splitKernelEnabled;
    GetPixelFunc getPixStrat = getPixelFunction(config.borderStrategy);

    int k = kernel.size;
  
    const int kernelCenter = k / 2;
    int padding = kernelCenter;
    int outW = ((int)((src.width-k+2*padding))/stride)+1;
    int outH = ((int)((src.height-k+2*padding))/stride)+1;
    dst.width = outW; 
    dst.height = outH;
    dst.data.resize(outW * outH);

    auto convolutionOperation = [&](const image<float>& src, image<float>& dst,const std::vector<std::vector<float>>& kernelVector, const float opScale, const float opOffset, const int opStride) {
        int kernelWidth = kernelVector[0].size();
        int kernelHeight = kernelVector.size();
        int cy = kernelHeight/2; // Kernel center y
        int cx = kernelWidth/2; // Kernel center x

        return [&, opScale, opOffset, opStride, kernelWidth, kernelHeight, cy,cx](int y0, int y1) {
            for (int y = y0; y < y1; y++) {
                for (int x = 0; x < dst.width; x++) {
                    int inX = (x * opStride);
                    int inY = (y * opStride);
                    float newValueR = 0, newValueB = 0, newValueG = 0;
                        for (int i=0; i < kernelHeight; i++){
                            for (int j=0; j < kernelWidth; j++){
                                // !This function call without inlining may have performance loss
                                pixel<float> neigh = getPixStrat(src,inX+j-cx,inY+i-cy);
                                newValueR += (neigh.r) * kernelVector[i][j];
                                newValueG += (neigh.g) * kernelVector[i][j];
                                newValueB += (neigh.b) * kernelVector[i][j];
                            }
                        }
                        pixel<float> newPix = {(newValueR*opScale+opOffset), (newValueG*opScale+opOffset), (newValueB*opScale+opOffset)};
                        setPixel<float>(dst,x,y,newPix);
                    }
                } 
            };
    };



    if(!splitKernelEnabled || k <= 5 || !isRank1(kernel.values)){ // General case
        parallelForRows(dst.height, 0, convolutionOperation(src, dst, kernel.values, scale, offset,stride));
    } else{ // Split kernel
        SplitKernel split_kernel = splitKernel(kernel);
        image<float> temp;
        temp.width = src.width;
        temp.height = src.height;
        temp.data.resize(temp.width * temp.height);

        parallelForRows(temp.height, 0, convolutionOperation(src, temp, split_kernel.rowValues, 1.0f, 0.0f, 1));
        parallelForRows(dst.height, 0, convolutionOperation(temp, dst, split_kernel.colValues, scale, offset, stride));
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
        config.splitKernelEnabled = params.value("splitKernelEnabled", config.splitKernelEnabled); // For debugging and testing
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
