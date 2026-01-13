#include "image.h"
#include <vector>
#include <functional>
#include <cassert>
#include <string>

using histogramPerPixelFunction = std::function<int(const pixel*)>; // These functions must return a number between 0 and 255.

using histogram = std::vector<int>;

using histogramRegistry = std::unordered_map<std::string, histogram(*)(const image&)>;

histogram computeHistogram(const image& img, histogramPerPixelFunction calc);
histogram greyscaleHistogram(const image& img);
histogram intensityHistogram(const image& img);
histogram valueHistogram(const image& img);
histogram chromaHistogram(const image& img);
histogram redChannelHistogram(const image& img);
histogram greenChannelHistogram(const image& img);
histogram blueChannelHistogram(const image& img);

void graphicHistogram(histogram& hist, std::string name);
histogramRegistry getHistogramRegistry();

double averageOpticalDensity(const histogram& h); // TODO