# Image-processing-engine
C++ image processing engine for PPM files. Main goal is to make scalable and readable code, rather than performance (at least at the moment).

<p align="center">
  <img src="preview.png" alt="Banner" width="100%">
</p>

## Capabilities
- Processing PPM files 
- Convolutional filters: Gaussian blur, Sharpen, Emboss, Laplacian of Gausian (LoG)
- Point filters: Black and white, Sepia, Thresholding, Mirror

## To do
- Add parameters to filters. Atm filters are non modifiable.
- Median filter
- Sobel operator
- Remove spanglish. Have to decide in which language i will do the project

## Potential goals for the future
- Applying this engine to computer vision
- Performance optimizations
- Make a simpler and better user interface or cli tool

## Why ppm?
It's a simpler format. Does not depend on compression or complex encoding. At the time it's what i will be using. The goal of the project (as any other project of mine) is to implement things and understand then thoroughly. So im interested in implementing the conversion of formats by myself in the future when the project grows in size.

## How to run
1. Clone the repo.
2. Add your ppm images on `./pics`
3. On main put the filter of your liking into the `applyFilterToPPM` function
4. Compile: `g++ main.cpp filter.cpp image.cpp -o main`
5. Run: `./main`
6. Output will be on ./output

