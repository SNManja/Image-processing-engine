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
    int width;
    int height;
    std::vector<pixel> data;
};

inline pixel* getPixel(image& img, int x, int y) {
    if (x < 0 || x >= img.width || y < 0 || y >= img.height) {
        perror("Coordenadas fuera de los límites");
        return nullptr;
    }
    return &img.data[y * img.width + x];
}

inline pixel* getPixelClamped(image& img, int x, int y){
    int width = img.width;
    int height = img.height;

    // Clamp coordinates
    if (x < 0) x = 0;
    if (x >= width) x = width - 1;
    if (y < 0) y = 0;
    if (y >= height) y = height - 1;

    return &img.data[y * width + x];
}

inline pixel copyPixel(image& img, int x, int y) {
    // Falta chekceo de error, posible implementacion de clamping seria buena idea
    return img.data[y * img.width + x];
}

inline void setPixel(image& img, int x, int y, pixel p) {
    if(x < 0 || x >= img.width || y < 0 || y >= img.height) {
        perror("Coordenadas fuera de los límites");
        return;
    }
    img.data[y * img.width + x] = p;
}

void printToPPM(const image& img, const char* output_path);

image read_image(const char* path);


#endif