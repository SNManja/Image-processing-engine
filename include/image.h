#ifndef IMAGE_H  // "Header Guard" para evitar redefiniciones
#define IMAGE_H

#include <vector>
#include <cstdio>

inline unsigned char clamp(float value) {
    if (value > 255.0f) return 255;
    if (value < 0.0f) return 0;
    return (unsigned char)value;
}


template <typename T> struct pixel {
    T r;
    T g;
    T b;

    pixel() : r(0), g(0), b(0) {}

    pixel(T r, T g, T b) : r(r), g(g), b(b) {}

    template <typename U>
    pixel(const pixel<U>& orig) {
        if constexpr (std::is_same_v<T, unsigned char> && std::is_floating_point_v<U>) {
            r = static_cast<T>(clamp(orig.r + 0.5f));
            g = static_cast<T>(clamp(orig.g + 0.5f));
            b = static_cast<T>(clamp(orig.b + 0.5f));
        } else {
            r = static_cast<T>(orig.r);
            g = static_cast<T>(orig.g);
            b = static_cast<T>(orig.b);
        }
    }
};

template <typename T> struct image {
    int width = 0;
    int height = 0;
    std::vector<pixel<T>> data = {};

    image() = default; 
    image(int w, int h, std::vector<pixel<T>> d) 
        : width(w), height(h), data(std::move(d)) {}
    image(int w, int h) 
        : width(w), height(h), data(w * h) {}

    template <typename U>
    image(const image<U>& other) : width(other.width), height(other.height) {
        data.reserve(other.data.size());
        for (const auto& p : other.data) {
            data.push_back(p); 
        }
    }
};


template <typename T> pixel<T>* pixel_ptr(image<T>& img, int x, int y);
template <typename T> pixel<T> getPixelClamped(const image<T>& img, int x, int y);
template <typename T> pixel<T> getPixelConstant(const image<T>& img, int x, int y);
template <typename T> pixel<T> getPixelWrapped(const image<T>& img, int x, int y);
template <typename T> pixel<T> getPixelMirrored(const image<T>& img, int x, int y);

template <typename T> void setPixel(image<T>& img, int x, int y, pixel<T> p);

void printToPPM(const image<unsigned char>& img, const char* output_path);

image<unsigned char> read_image(const char* path);

#include "pixel_operations.tpp"

#endif