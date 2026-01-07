# Image-processing-engine
C++ image processing engine for PPM files. Main goal is to make scalable and readable code, rather than performance (at least at the moment).

<p align="center">
  <img src="preview.png" alt="Banner" width="100%">
</p>

## Capabilities
- Processing PPM files 
- Convolutional filters: Gaussian blur, Sharpen, Emboss, Laplacian of Gausian (LoG)
- Point filters: Black and white, Sepia, Thresholding, Mirror
- Basic CLI implementation with `--help` flag to use as a guide

## To do
- Add parameters to already implemented filters
- Documentation for each filter and its parameters (partially done)
- Median filter
- Sobel operator


## Potential goals for the future
- Applying this engine to computer vision
- Performance optimizations
- Make a simpler and better user interface or cli tool

## Why ppm?
It's a simpler format. Does not depend on compression or complex encoding. At the time it's what i will be using. The goal of the project (as any other project of mine) is to implement things and understand then thoroughly. So im interested in implementing the conversion of formats by myself in the future when the project grows in size.

## How to run
1. Clone the repo.
2. Compile with `make` command on your terminal
3. Add your ppm images on `./pics`
4. Use `./imgengine (name of filter)` to process your ppm images or `./imgengine --help` to ger info about each filter
5. Obtain the resulting images from `./output`
