# Image-processing-engine
C++ image processing engine for PPM files. Main goal is to make scalable and readable code, rather than performance (at least at the moment). 

<p align="center">
  <img src="preview.png" alt="Banner" width="100%">
</p>

## Capabilities
- Processing PPM files with a **flexible pipeline** 
- **Convolutional filters**: Gaussian blur, Sharpen, Emboss, Laplacian of Gaussian (LoG)
- **Point filters**: Black and white, Sepia, Thresholding, Alpha blending, Linear Adjustment
- **Geometric filters**: Mirror 
- **Gradients**: Sobel operator
- Basic CLI implementation with `--help` flag to use as documentation (kinda dated, needs an update asap. But functional nonetheless)
- Supports "Same" padding strategy to maintain spacial correspondence, with configurable stride.
- Custom border strategy for convolutional filters (Clamping, Wrap, Mirror, Constant)
- **Histogram support**: greyscale, channel (r,g,b), intensity, value and chroma. With **Graph plotting**.
- **Filter chaining** with **JSON-based** pipeline specifications. This enables complex filter chaining with custom parameters and readable configuration. Plus being able to save configurations as templates. 
- **Batch processing**: Process all the files in a folder at the same time


## To do
- Clean up stats folder files each iteration
- Update documentation on --help.
- Float pipeline from [0,255] to [0,1] would improve float operations precision
- Check common sobel parameters and implement them
- Split rank 1 kernels so convolutions are O(2k) per pixel rather than O(k^2) 
- Improve histogram (provide some kind of guide on values). And document them better
- Add dilation parameter to convolution. 
- Add common postprocessing parameters (white balance, gain, gamma, normalization, clamping, etc)
- Add custom parameters to already implemented filters
- Median filter
- Output info, like histograms calculated, filters applied, settings used would be cool to implement.
- Check easy performance improvements
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
4. Use `./imgengine` to process your ppm images in batch 
5. Obtain the resulting images from `./output`

# Documentation
- `--help` for capabilities, commands and JSON format
- `--list` for list of filters, parameters and descriptions

# Dependencies
The whole point of this project is to make things from scratch. So i will be explicit in which external libraries i use. From the time being, the only one is **nlohmann/json** which is already **included** in the repository to ensure a zero-dependency setup and avoid installation headaches. 

To be clear. This implicates no use of ffmpeg, matplotlib or any other library. At least at the moment. Everything is made from scratch.