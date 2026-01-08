# Image-processing-engine
C++ image processing engine for PPM files. Main goal is to make scalable and readable code, rather than performance (at least at the moment).

<p align="center">
  <img src="preview.png" alt="Banner" width="100%">
</p>

## Capabilities
- Processing PPM files 
- Convolutional filters: Gaussian blur, Sharpen, Emboss, Laplacian of Gausian (LoG)
- Point filters: Black and white, Sepia, Thresholding
- Geometric filters: Mirror 
- Basic CLI implementation with `--help` flag to use as documentation. There's info about each filter and it's parameters
- Supports "Same" padding strategy to mantain spacial correspondence, with configurable stride.
- Custom border strategy for convolutional filters (Clamping, Wrap, Mirror, Constant)
- Supports post-processing settings such as brightness, contrast and Dry/Wet mixing per channel in point filters


## To do
- Separate post-processing from filtering settings. So it can be universally applied to any filter. This goes hand in hand with fixing the --help documentation redundancies and impresitions
- Add dilation parameter to convolution. 
- Add custom parameters to already implemented filters
- Change return from applyConvolution to src and dst
- Documentation for each filter and its parameters (partially done)
- Median filter
- Sobel operator
- Check easy performance improvements before going into more complex filters
- Implement "Valid" padding strategy
- Evaluate if even kernels have any utility, and make them usable check how to handle them well.
- Make a template driven applyConvolution so it generates different versions of the function in compile time. The main goal of this would be performance optimization (Less function calls with inlining). For getFlagValue too.

## Potential goals for the future
- Applying this engine to computer vision
- Performance optimizations
- Make a simpler and better user interface or cli tool

## Why ppm?
It's a simpler format. Does not depend on compression or complex encoding (like jpeg or png). At the time it's what i will be using. The goal of the project (as any other project of mine) is to implement things and understand then thoroughly. So im interested in implementing the conversion of formats by myself in the future when the project grows in size.

## How to run
1. Clone the repo.
2. Compile with `make` command on your terminal
3. Add your ppm images on `./pics`
4. Use `./imgengine (name of filter)` to process your ppm images or `./imgengine --help` to ger info about each filter
5. Obtain the resulting images from `./output`
