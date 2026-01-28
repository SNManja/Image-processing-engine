#include "filter.h"
#include "image.h"
#include "cli_helpers.h"

// TODO move this function to a better file
using betweenPixelOperation = std::function<pixel<float>(const pixel<float>&,const pixel<float>&)>;
image<float> operateBetween(image<float>& img1, image<float>& img2, betweenPixelOperation op){
    assert(img1.width == img2.width && img1.height == img2.height); // Both imgs require to be the same size
    assert((int)img1.data.size() == (img1.height * img1.width)); // Checking imgs correctness
    assert((int)img2.data.size() == (img2.height * img2.width));
    
    image<float> res = image<float>(img1.width, img1.height);
    for(size_t i = 0; i < img1.data.size(); i++){
        res.data[i] = op(img1.data[i],img2.data[i]);
    }
    return res;
}

void sobelOperatorFilter(const image<float>& src, image<float>& dst,const filterContext& cfg){
    assert((int)src.data.size() == (src.height * src.width));
    bool greyscale = getJSONParam(cfg, "greyscale", true);
    bool scharr = getJSONParam(cfg, "scharr", false);
    if(greyscale){
        image<float> prep;
        blackAndWhiteFilter(src, prep, cfg);   
        std::swap(dst, prep);
        prep.data.clear(); // Current fix for limits of browser memory. Needs a better one tbh
        prep.data.shrink_to_fit();
    } else {
        dst = src;
    }
    convolutionConfig convConfig = readConvolutionConfig(cfg.data);
    image<float> Gx, Gy;
    
    Kernel sobelKernelX, sobelKernelY;
    if (scharr){
        sobelKernelX = kernel(3,
            {{-3,0,3},
             {-10,0,10},
             {-3,0,3}}
        );
        sobelKernelY = kernel(3,
            {{-3,-10,-3},
             {0,0,0},
             {3,10,3}}
        );
    } else {
        sobelKernelX = kernel(3,
            {{-1,0,1},
             {-2,0,2},
             {-1,0,1}}
        );
        sobelKernelY = kernel(3,
            {{-1,-2,-1},
             {0,0,0},
             {1,2,1}}
        );
    }
    applyConvolution(dst, Gx, sobelKernelX, convConfig);
    applyConvolution(dst, Gy, sobelKernelY, convConfig);
    dst.data.clear(); 
    dst = operateBetween(Gx,Gy, [](const pixel<float>& p1, const pixel<float>& p2)->pixel<float>{
        return {
            (float)sqrt((p1.r*p1.r)+(p2.r*p2.r)),
            (float)sqrt((p1.g*p1.g)+(p2.g*p2.g)),
            (float)sqrt((p1.b*p1.b)+(p2.b*p2.b))
        };
    });
    return;
}


