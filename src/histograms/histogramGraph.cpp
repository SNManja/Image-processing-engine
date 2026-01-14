#include "image.h"
#include "histogram.h"
#include <string>

void graphicHistogram(histogram& hist, std::string name){
    const int imgHeight = 768;
    const int imgWidth = 768;

    pixel<unsigned char> graphBorders = {0, 0, 0};
    pixel<unsigned char> graphBackground = {235, 235, 235};
    pixel<unsigned char> graphForeground = {125, 125, 125}; // TODO: Find a cool color

    image<unsigned char> img = {
        imgWidth,
        imgHeight,
        std::vector<pixel<unsigned char>>(imgWidth * imgHeight, graphBackground)
    };

    const int histWidth = 512;
    const int histHeight = 512;

    const int graphLowerRightHeight = (imgHeight/2)+(histHeight/2);
    const int graphLowerRightWidth = (imgWidth/2)-(histWidth/2);

    int maxValue = *std::max_element(hist.begin(), hist.end());


    for (int i = graphLowerRightWidth-4; i < graphLowerRightWidth+histWidth; i+=1) {
        setPixel(img, i, graphLowerRightHeight+1, graphBorders);
        setPixel(img, i, graphLowerRightHeight+2, graphBorders);
        setPixel(img, i, graphLowerRightHeight+3, graphBorders);
        setPixel(img, i, graphLowerRightHeight+4, graphBorders);
    }
    for (int i = graphLowerRightHeight+1; i >= graphLowerRightHeight-histHeight; i-=1) {
        setPixel(img, graphLowerRightWidth-1, i, graphBorders);
        setPixel(img, graphLowerRightWidth-2, i, graphBorders);
        setPixel(img, graphLowerRightWidth-3, i, graphBorders);
        setPixel(img, graphLowerRightWidth-4, i, graphBorders);
    }

    for (int i = 0; i < 256; i++) {
        int histX = graphLowerRightWidth + (i * histWidth / 256);
        int histY = graphLowerRightHeight - (hist[i] * histHeight / maxValue);
        for (int y = graphLowerRightHeight; y >= histY; y--) {
            for(int x = histX; x < histX + (histWidth / 256); x++) {
                setPixel(img, x, y, graphForeground);
            }
        }
    }
    std::string histPath = "./output/stats/" + name + ".ppm";
    printToPPM(img, histPath.c_str());
}
