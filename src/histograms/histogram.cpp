
#include "histogram.h"

histogram computeHistogram(const image<unsigned char>& img, histogramPerPixelFunction calc){
    assert((img.width * img.height) > 0);
    assert(img.data.size() > 0);
    histogram h((255 + 1), 0); // 255 is max pixel value. Includes 0
    for (const pixel<unsigned char>& p : img.data){
        int pValue = calc(&p);
        pValue = std::clamp(pValue, 0, 255);
        h[pValue] ++;
    }
    return h;
}   


histogram greyscaleHistogram(const image<unsigned char>& img){ // also called luminance
    return computeHistogram(img, [](const pixel<unsigned char>* p){
        int v = int(std::lround(0.2126*p->r + 0.7152*p->g + 0.0722*p->b));
        return std::clamp(v, 0, 255);
    });
}


histogram intensityHistogram(const image<unsigned char>& img){
    return computeHistogram(img, [](const pixel<unsigned char>* p){
        int v = (int(p->r) + int(p->g) + int(p->b)) / 3;
        return (unsigned char)v;
    });
}

histogram valueHistogram(const image<unsigned char>& img){
    return computeHistogram(img, [](const pixel<unsigned char>* p){
        return std::max({p->r, p->g, p->b});
    });
}

histogram chromaHistogram(const image<unsigned char>& img){ // Also called saturation
    return computeHistogram(img, [](const pixel<unsigned char>* p){
        return std::max({p->r, p->g, p->b})-std::min({p->r, p->g, p->b});
    });
}

histogram redChannelHistogram(const image<unsigned char>& img){
    return computeHistogram(img, [](const pixel<unsigned char>* p){
        return p->r;
    });
}

histogram greenChannelHistogram(const image<unsigned char>& img){
    return computeHistogram(img, [](const pixel<unsigned char>* p){
        return p->g;
    });
}

histogram blueChannelHistogram(const image<unsigned char>& img){
    return computeHistogram(img, [](const pixel<unsigned char>* p){
        return p->b;
    });
}



double histogramMean(const histogram& h){
    assert(!h.empty());
    uint64_t totalPixels = 0;
    uint64_t sum = 0;
    for (size_t i = 0; i < h.size(); i++){
        sum += (uint64_t)h[i] * (uint64_t)i;
        totalPixels += (uint64_t)h[i];
    }
    return (((double)sum)/((double)totalPixels));
}


