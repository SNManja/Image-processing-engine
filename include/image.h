#ifndef IMAGE_H  // "Header Guard" para evitar redefiniciones
#define IMAGE_H

#include <vector>
#include <cstdio>

struct pixel {
    unsigned char r;
    unsigned char g;
    unsigned char b;
};

struct image {
    int width = 0;
    int height = 0;
    std::vector<pixel> data = {};
};

pixel* pixel_ptr(image& img, int x, int y);

pixel getPixelClamped(const image& img, int x, int y);
pixel getPixelConstant(const image& img, int x, int y);
pixel getPixelWrapped(const image& img, int x, int y);
pixel getPixelMirrored(const image& img, int x, int y);

void setPixel(image& img, int x, int y, pixel p);

void printToPPM(const image& img, const char* output_path);

image read_image(const char* path);


#endif