
#include "histogram.h"

histogram computeHistogram(const image& img, histogramPerPixelFunction calc){
    assert((img.width * img.height) > 0);
    assert(img.data.size() > 0);
    histogram h((255 + 1), 0); // 255 is max pixel value. Includes 0
    for (const pixel& p : img.data){
        int pValue = calc(&p);
        assert(pValue >= 0 && pValue <= 255);
        h[pValue] += 1;
    }
    return h;
}   


histogram greyscaleHistogram(const image& img){ // also called luminance
    return computeHistogram(img, [](const pixel* p){
        return (int)((0.2126 * p->r)+(0.7152 * p->g)+(0.0722 * p->b));
    });
}


histogram intensityHistogram(const image& img){
    return computeHistogram(img, [](const pixel* p){
        return (int)((p->r+p->g+p->b)/3);
    });
}

histogram valueHistogram(const image& img){
    return computeHistogram(img, [](const pixel* p){
        return std::max({p->r, p->g, p->b});
    });
}

histogram chromaHistogram(const image& img){ // Also called saturation
    return computeHistogram(img, [](const pixel* p){
        return std::max({p->r, p->g, p->b})-std::min({p->r, p->g, p->b});
    });
}

histogram redChannelHistogram(const image& img){
    return computeHistogram(img, [](const pixel* p){
        return p->r;
    });
}

histogram greenChannelHistogram(const image& img){
    return computeHistogram(img, [](const pixel* p){
        return p->g;
    });
}

histogram blueChannelHistogram(const image& img){
    return computeHistogram(img, [](const pixel* p){
        return p->b;
    });
}



double histogramMean(const histogram& h){
    assert(h.size() > 0);
    int totalPixels = 0;
    int sum = 0;
    for (size_t i = 0; i < h.size(); i++){
        sum += h[i] * i;
        totalPixels += h[i];
    }
    return (((double)sum)/((double)totalPixels));
}

double averageOpticalDensity(const histogram& h){
    return histogramMean(h);
}   

histogramRegistry getHistogramRegistry() {
    histogramRegistry histograms;
    histograms["red"] = redChannelHistogram;
    histograms["green"] = greenChannelHistogram;
    histograms["blue"] = blueChannelHistogram;
    histograms["greyscale"] = greyscaleHistogram;
    histograms["intensity"] = intensityHistogram;
    histograms["value"] = valueHistogram;
    histograms["chroma"] = chromaHistogram;
    return histograms;
}