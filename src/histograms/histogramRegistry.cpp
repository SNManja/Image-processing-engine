#include <map>
#include <string>
#include "histogram.h"


HistogramRegistry getHistogramRegistry() {
    HistogramRegistry registry= {
        {
            "greyscale",
            {
                "Greyscale histogram. Useful for analyzing global luminance distribution and contrast.",
                greyscaleHistogram 
            }
        },
        {
            "chroma",
            {
                "Chroma histogram. Measures color saturation distribution, useful for detecting color richness or washout.",
                chromaHistogram
            }
        },
        {
            "intensity",
            {
                "Intensity histogram. Represents average RGB brightness per pixel, commonly used for exposure analysis.",
                intensityHistogram
            }
        },
        {
            "value",
            {
                "Value histogram (HSV V channel). Reflects perceived brightness, useful for tone mapping and dynamic range.",
                valueHistogram
            }
        },
        {
            "redChannel",
            {
                "Red channel histogram. Useful for detecting red clipping or color imbalance.",
                redChannelHistogram
            }   
        },
        {
            "greenChannel",
            {
                "Green channel histogram. Often used for exposure analysis due to human eye sensitivity.",
                greenChannelHistogram
            }
        },
        {
            "blueChannel",
            {
                "Blue channel histogram. Useful for detecting blue noise and color cast.",
                blueChannelHistogram
            }
        },
    };
    return registry;
}