#include "filter.h"
#include "image.h"

void boxblurFilter(image& img, const char* args[]) {
    Kernel k = kernel(3, {
        {1/9.0, 1/9.0, 1/9.0},
        {1/9.0, 1/9.0, 1/9.0},
        {1/9.0, 1/9.0, 1/9.0}
    });
    img = applyConvolution(img, k);
}

void sharpenFilter(image& img, const char* args[]) {
    Kernel k = kernel(3, {
        {0, -1, 0},
        {-1, 6, -1},
        {0, -1, 0}
    });
    img = applyConvolution(img, k);
}

void enbossFilter(image& img, const char* args[]) {
    Kernel k = kernel(3, {
        {-2, -1, 0},
        {-1, 1, 1},
        {0, 1, 2}
    });
    img = applyConvolution(img, k);
}

void laplacianOfGaussianFilter(image& img, const char* args[]) {
    Kernel k = kernel(5, {
        {0, 0, -1, 0, 0},
        {0, -1, -2, -1, 0},
        {-1, -2, 16, -2, -1},
        {0, -1, -2, -1, 0},
        {0, 0, -1, 0, 0}
    });
    img = applyConvolution(img, k);
}

void motionblurFilter(image& img, const char* args[]) {
    Kernel k = kernel(5, {
        {1/5.0, 0, 0, 0, 0},
        {0, 1/5.0, 0, 0, 0},
        {0, 0, 1/5.0, 0, 0},
        {0, 0, 0, 1/5.0, 0},
        {0, 0, 0, 0, 1/5.0}
    });
    img = applyConvolution(img, k);
}
