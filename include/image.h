#ifndef IMAGE_H  // "Header Guard" para evitar redefiniciones
#define IMAGE_H

#include <vector>
#include <cstdio>
#include <type_traits>


constexpr float MAX_PIXEL_VALUE = 1.0f;
constexpr float MIN_PIXEL_VALUE = 0.0f;
constexpr unsigned char MAX_COLOR_VALUE = 255;
constexpr float MAX_COLOR_VALUE_FLOAT = 255.0f;

inline float clamp(float value) {
    if (value > MAX_PIXEL_VALUE) return MAX_PIXEL_VALUE;
    if (value < 0.0f) return 0;
    return value;
}

template <typename T> struct pixel {
    T r;
    T g;
    T b;

    pixel() : r(0), g(0), b(0) {}

    pixel(T r, T g, T b) : r(r), g(g), b(b) {}

    template <typename U>
        pixel(const pixel<U>& orig) {
            if constexpr (std::is_same_v<T, U>) {
            r = orig.r; g = orig.g; b = orig.b;
        }
        else if constexpr (std::is_floating_point_v<T> && std::is_integral_v<U>) {
            r = static_cast<T>(orig.r) / MAX_COLOR_VALUE_FLOAT;
            g = static_cast<T>(orig.g) / MAX_COLOR_VALUE_FLOAT;
            b = static_cast<T>(orig.b) / MAX_COLOR_VALUE_FLOAT;
        }
        else if constexpr (std::is_integral_v<T> && std::is_floating_point_v<U>) {
            r = static_cast<T>(clamp(static_cast<float>(orig.r)) * MAX_COLOR_VALUE_FLOAT);
            g = static_cast<T>(clamp(static_cast<float>(orig.g)) * MAX_COLOR_VALUE_FLOAT);
            b = static_cast<T>(clamp(static_cast<float>(orig.b)) * MAX_COLOR_VALUE_FLOAT);
        }
        else { // integral -> integral, float -> float (distintos), etc.
            r = static_cast<T>(orig.r);
            g = static_cast<T>(orig.g);
            b = static_cast<T>(orig.b);
        }
    }

    bool operator==(const pixel& other) const {
        return r == other.r && g == other.g && b == other.b;
    }

    bool operator!=(const pixel& other) const {
        return !(*this == other);
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

    bool operator==(const image& other) const {
        if (width != other.width || height != other.height) {
            return false;
        }
        return data == other.data; 
    }

    bool operator!=(const image& other) const {
        return !(*this == other);
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