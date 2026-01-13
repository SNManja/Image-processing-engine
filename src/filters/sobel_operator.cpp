#include "filter.h"
#include "image.h"

void sobelOperatorFilter(const image& src, image& dst, convolutionConfig cfg){
    image Gx, Gy;
    Kernel sobelKernelX = kernel(3,
        {{-1,0,1},
         {-2,0,2},
         {-1,0,1}}
    );
    Kernel sobelKernelY = kernel(3,
        {{-1,-2,-1},
         {0,0,0},
         {1,2,1}}
    );
    applyConvolution(src, Gx, sobelKernelX, cfg);
    applyConvolution(src, Gy, sobelKernelY, cfg);
    // TODO: sqrt(Gx**2 + Gy**2)
}