# Image-processing-engine
C++ image processing engine for PPM files. Main goal is to make scalable and readable code, rather than performance (at least at the moment). 

<p align="center">
  <img src="preview.png" alt="Banner" width="100%">
</p>

## Capabilities
- Processing PPM files with a **flexible pipeline**
- **Convolutional filters**: Gaussian blur, Sharpen, Emboss, Laplacian of Gaussian (LoG)
- **Point filters**: Black and white, Sepia, Thresholding
- **Geometric filters**: Mirror 
- Basic CLI implementation with ~~`--help` flag to use as documentation. There's info about each filter and it's parameters~~ (Help incomplete atm)
- Supports "Same" padding strategy to maintain spacial correspondence, with configurable stride.
- Custom border strategy for convolutional filters (Clamping, Wrap, Mirror, Constant)
- **Histogram support** (currently not supported via cli): greyscale, channel (r,g,b), intensity, value and chroma.
- **Image statistics**: Currently just Average Optical Density with histograms. More in the future
- **Filter chaining** with **JSON-based** pipeline specifications. This enables complex filter chaining with custom parameters and readable configuration. Plus being able to save configurations as templates. 
- **Batch processing**: Process all the files in a folder at the same time

## To do
- Fix alpha/blending and registry. Decide what to do. Adding a new filter function firm is probably the optimal way.
- Clean up previous CLI implementation. Refactor is NECESSARY 
- New --help or documentation ASAP
- ASCII histogram representation via CLI. 
- Output info, like histogram values, filters applied, settings used would be cool to implement.
- Add dilation parameter to convolution. 
- Add common postprocessing parameters (white balance, gain, gamma, normalization, clamping, etc)
- Add custom parameters to already implemented filters
- Documentation for each filter and its parameters 
- Median filter
- Sobel operator
- Check easy performance improvements before going into more complex filters
- Implement "Valid" padding strategy
- Evaluate if even kernels have any utility, and make them usable check how to handle them well.
- Make a template driven applyConvolution so it generates different versions of the function in compile time. The main goal of this would be performance optimization (Less function calls with inlining). For getFlagValue too.
- Simple pipeline support via cli using stdin stdout, supporting pipes in posix systems

## Potential goals for the future
- Applying this engine to computer vision
- Performance optimizations
- Make a simpler and better user interface or cli tool
- Add user interface

## Why ppm?
It's a simpler format. Does not depend on compression or complex encoding (like jpeg or png). At the time it's what i will be using. The goal of the project (as any other project of mine) is to implement things and understand them thoroughly. So im interested in implementing the conversion of formats by myself in the future when the project grows in size.

## How to run
1. Clone the repo.
2. Compile with `make` command on your terminal
3. Add your ppm images on `./pics`
4. Use `./imgengine` to process your ppm images in batch ~~or `./imgengine --help` to get info about each filter~~ (Help is outdated)
5. Obtain the resulting images from `./output`

# Dependencies
The whole point of this project is to make things from scratch. So i will be explicit in which external libraries i use. From the time being, the only one is **nlohmann/json** which is already **included** in the repository to ensure a zero-dependency setup and avoid installation headaches.