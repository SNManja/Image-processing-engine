#include <stdio.h>
#include <vector>
#include <string.h>
#include <dirent.h>
#include "image.h"


void printToPPM(const image& img, const char* output_path) {
    FILE* f = fopen(output_path, "wb");
    if (!f) {
        perror("Error opening output file");
        return;
    }

    // Write PPM header
    int width = img.width;
    int height = img.height;
    fprintf(f, "P6\n%d %d\n255\n", width, height);
    fwrite(img.data.data(), sizeof(pixel), width * height, f);
    fclose(f);
}



image read_image(const char* path) {
    FILE* f = fopen(path, "rb");
    printf("Reading image from %s\n", path);
    if (!f) {
        perror("Error opening file");
        return {};
    }

    // Read PPM header
    char format[3];
    int width, height, maxval;
    fscanf(f, "%2s\n%d %d\n%d\n", format, &width, &height, &maxval);
    if (strcmp(format, "P6") != 0 || maxval != 255) {
        fprintf(stderr, "Unsupported PPM format\n");
        fclose(f);
        return {};
    }

    image img;
    img.width = width;
    img.height = height;
    img.data.resize(width * height);
    fread(img.data.data(), sizeof(pixel), width * height, f);
    fclose(f);
    return img;
}

image copyImage(const image& img) {
    image newImg;
    newImg.width = img.width;
    newImg.height = img.height;
    newImg.data = img.data; // Copy pixel data
    return newImg;
}
