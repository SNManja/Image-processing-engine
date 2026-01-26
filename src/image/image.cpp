#include <stdio.h>
#include <vector>
#include <string.h>
#include <dirent.h>
#include "image.h"
#include <string>
#define STB_IMAGE_IMPLEMENTATION
#include "stb_image.h"

#define STB_IMAGE_WRITE_IMPLEMENTATION
#include "stb_image_write.h"

void write_image(image<float>& img, std::string output_path) {
    FILE* f = fopen(output_path.c_str(), "wb");
    if (!f) {
        perror("Error opening output file");
        return;
    }

    size_t dotPos = output_path.find_last_of(".");
    if (dotPos == std::string::npos) return;
    std::string ext = output_path.substr(dotPos + 1);

    int width = img.width;
    int height = img.height;
    int channels = 3; 
    normalizeGamma(img);
    clampImage(img);
    image<unsigned char> ucharImg = img;
    if (ext == "ppm") {
        FILE* f = fopen(output_path.c_str(), "wb");
        if (f) {
            image<unsigned char> ucharImg = img;
            fprintf(f, "P6\n%d %d\n255\n", width, height);
            fwrite(ucharImg.data.data(), sizeof(pixel<unsigned char>), width * height, f);
            fclose(f);
        }
    } 

    else if (ext == "jpg" || ext == "jpeg") {
        stbi_write_jpg(output_path.c_str(), width, height, channels, ucharImg.data.data(), 90);
    } 
    else if (ext == "png") {
        stbi_write_png(output_path.c_str(), width, height, channels, ucharImg.data.data(), width * channels);
    } 
    else {
        fprintf(stderr, "Formato no soportado: %s\n", ext.c_str());
    }
    
}


image<float> read_image(std::string input_path) {
    int w, h, c;
    float* raw = stbi_loadf(input_path.c_str(), &w, &h, &c, 3);

    if (!raw) {
        fprintf(stderr, "Error STB: %s\n", stbi_failure_reason());
        return {};
    }

    image<float> img;
    img.width = w;
    img.height = h;
    img.data.assign((pixel<float>*)raw, (pixel<float>*)raw + (w * h));

    stbi_image_free(raw);
    return img;
}
