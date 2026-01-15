#include <map>
#include <string>
#include "histogram.h"


HistogramRegistry getHistogramRegistry() {
    HistogramRegistry registry= {
        {
            "greyscale",
            {
                "Generates a greyscale histogram from the input image.",
                greyscaleHistogram 
            }
        },
        {
            "chroma",{
                "Generates a chroma histogram from the input image.",
                chromaHistogram
            }
        },
        {
            "intensity",
            {
                "Generates an intensity histogram from the input image.",
                intensityHistogram
            }
        },
        {
            "value",
            {
                "Generates a value histogram from the input image.",
                valueHistogram
            }
        },
        {
            "redChannel",
            {
                "Generates a red channel histogram from the input image.",
                redChannelHistogram
            }   
        },
        {
            "greenChannel",
            {
                "Generates a green channel histogram from the input image.",
                greenChannelHistogram
            }
        },
        {
            "blueChannel",
            {
                "Generates a blue channel histogram from the input image.",
                blueChannelHistogram
            }
        },
    };
    return registry;
}