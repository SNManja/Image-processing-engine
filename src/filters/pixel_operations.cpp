#include "image.h"

pixel* pixel_ptr(image& img, int x, int y){
    int width = img.width;
    int height = img.height;

    if (x < 0 || x >= width || y < 0 || y >= height) {
        return nullptr;
    }

    return &img.data[y * width + x];
}


pixel getPixelClamped(image& img, int x, int y){
    int width = img.width;
    int height = img.height;

    if (x < 0) x = 0;
    if (x >= width) x = width - 1;
    if (y < 0) y = 0;
    if (y >= height) y = height - 1;

    return img.data[y * width + x];
}

pixel getPixelConstant(image& img, int x, int y){
    int width = img.width;
    int height = img.height;

    if (x < 0 || x >= width || y < 0 || y >= height) {
        pixel constantPixel = {0, 0, 0};  // Black pixel
        return constantPixel;
    }

    return img.data[y * width + x];
}

pixel getPixelWrapped(image& img, int x, int y) {
    int width = img.width;
    int height = img.height;

    int wrappedX = ((x % width) + width) % width;
    int wrappedY = ((y % height) + height) % height;
    return img.data[wrappedY * width + wrappedX];
}

pixel getPixelMirrored(image& img, int x, int y){
    int width = img.width;
    int height = img.height;

    int mirroredX = x;
    int mirroredY = y;

    if (x < 0) mirroredX = -x;
    if (x >= width) mirroredX = 2 * width - x - 2;
    if (y < 0) mirroredY = -y;
    if (y >= height) mirroredY = 2 * height - y - 2;

    return img.data[mirroredY * width + mirroredX];
}

void setPixel(image& img, int x, int y, pixel p) {
    if(x < 0 || x >= img.width || y < 0 || y >= img.height) {
        perror("Coordenadas fuera de los límites");
        return;
    }
    img.data[y * img.width + x] = p;
}