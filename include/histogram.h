#include "image.h"
#include <vector>
#include <functional>
#include <cassert>
#include <string>

using histogramPerPixelFunction = std::function<int(const pixel<unsigned char>*)>; // These functions must return a number between 0 and 255.

using histogram = std::vector<int>;

using histogramRegistry = std::unordered_map<std::string, histogram(*)(const image<unsigned char>&)>;

histogram computeHistogram(const image<unsigned char>& img, histogramPerPixelFunction calc);
histogram greyscaleHistogram(const image<unsigned char>& img);
histogram intensityHistogram(const image<unsigned char>& img);
histogram valueHistogram(const image<unsigned char>& img);
histogram chromaHistogram(const image<unsigned char>& img);
histogram redChannelHistogram(const image<unsigned char>& img);
histogram greenChannelHistogram(const image<unsigned char>& img);
histogram blueChannelHistogram(const image<unsigned char>& img);

void graphicHistogram(histogram& hist, std::string name);
histogramRegistry getHistogramRegistry();

double averageOpticalDensity(const histogram& h); // TODO