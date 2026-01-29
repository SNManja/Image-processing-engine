#ifndef IMAGE_H  // "Header Guard" para evitar redefiniciones
#define IMAGE_H

#include <vector>
#include <cstdio>
#include <type_traits>
#include <cmath>
#include <string>
#include <thread>

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

    friend pixel<T> operator*(T s, const pixel<T>& p) {
        return {p.r * s, p.g * s, p.b * s};
    }

    pixel<T> operator+(const pixel<T>& other) const {
        return {r + other.r, g + other.g, b + other.b};
    }

    pixel<T> operator-(const pixel<T>& other) const {
        return {r - other.r, g - other.g, b - other.b};
    }

    bool operator==(const pixel& other) const {
        return r == other.r && g == other.g && b == other.b;
    }

    bool operator!=(const pixel& other) const {
        return !(*this == other);
    }

    pixel<T> operator*(T s) const {
        return {r * s, g * s, b * s};
    }

    pixel<T>& operator+=(const pixel<T>& other) {
        r += other.r;
        g += other.g;
        b += other.b;
        return *this;
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


inline void clampPixel(pixel<float>& p) {
    // Usamos std::clamp (C++17) que es más limpio y evita valores negativos
    p.r = clamp(p.r);
    p.g = clamp(p.g);
    p.b = clamp(p.b);
}

inline void clampImage(image<float>& i) {
    for (pixel<float>& p : i.data) {
        clampPixel(p);
    }
}

inline void linearizeGamma(image<float>& img) {
    for (pixel<float>& p : img.data) {
        p.r = std::pow(p.r, 2.2f);
        p.g = std::pow(p.g, 2.2f);
        p.b = std::pow(p.b, 2.2f);
    }
}

inline void perceptualGamma(image<float>& img) {
    for (pixel<float>& p : img.data) {
        p.r = std::pow(p.r, (1.0f / 2.2f));
        p.g = std::pow(p.g, (1.0f / 2.2f));
        p.b = std::pow(p.b, (1.0f / 2.2f));
    }
}

template <typename T> pixel<T>* pixel_ptr(image<T>& img, int x, int y);
template <typename T> pixel<T> getPixelClamped(const image<T>& img, int x, int y);
template <typename T> pixel<T> getPixelConstant(const image<T>& img, int x, int y);
template <typename T> pixel<T> getPixelWrapped(const image<T>& img, int x, int y);
template <typename T> pixel<T> getPixelMirrored(const image<T>& img, int x, int y);

template <typename T> void setPixel(image<T>& img, int x, int y, pixel<T> p);


void write_image(image<float>& img, std::string output_path);
image<float> read_image(std::string input_path);



template <class Fn>
inline void parallelForRows(int height, int threadCount, Fn&& fn) {
    if (threadCount <= 0) threadCount = (int)std::thread::hardware_concurrency();
    if (threadCount <= 0) threadCount = 2;

    int chunk = (height + threadCount - 1) / threadCount;

    std::vector<std::thread> threads;
    threads.reserve(threadCount);

    for (int t = 0; t < threadCount; ++t) {
        int y0 = t * chunk;
        int y1 = std::min(height, y0 + chunk);
        if (y0 >= y1) break;

        threads.emplace_back([&, y0, y1] {
            fn(y0, y1);
        });
    }

    for (auto& th : threads) th.join();
}


#include "pixel_operations.tpp"

#endif