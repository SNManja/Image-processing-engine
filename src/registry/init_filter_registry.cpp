#include "registry/init_filter_registry.hpp"
#include "registry/filter_registry.hpp"
#include "registry/filter_descriptor.hpp"
#include "registry/filter_parameter.hpp"
#include "registry/filter_restrictions.hpp"
#include "filter.h"

#include <utility>
#include <memory>
#include <string>
#include <vector>

std::vector<std::shared_ptr<FilterParameterBase>> makeConvolutionalParams() {
    return {
        std::make_shared<FilterParameter<int>>(
            "stride", 1,
            "Step size of the filter. Changes image size when different to 1.",
            IntRestriction(RestrictionMode::Flex, 1, std::nullopt)
        ),
        std::make_shared<FilterParameter<float>>(
            "scale", 1.0f,
            "Scaling factor applied to the filter output.",
            FloatRestriction(RestrictionMode::Flex)
        ),
        std::make_shared<FilterParameter<float>>(
            "offset", 0.0f,
            "Offset added to the filter output.",
            FloatRestriction(RestrictionMode::Flex)
        ),
        std::make_shared<FilterParameter<std::string>>(
            "border", "clamp",
            "Border strategy (clamp, wrap, mirror, constant).",
            StringRestriction(RestrictionMode::Strict, {"clamp", "wrap", "mirror", "constant"})
        ),
        std::make_shared<FilterParameter<bool>>(
            "splitKernelEnabled", true,
            "Enables or disables the use of split kernels for convolution.",
            BoolRestriction()
        )
    };
}

void initFilterRegistry(FilterRegistry& r) {

    // ── blur ──────────────────────────────────────────────────────────────
    {
        auto d = std::make_shared<FilterDescriptor>("blur", "Box blur. A simple blur.", boxblurFilter);
        d->addCategory(FilterCategory::Convolution);
        d->addParam(std::make_shared<FilterParameter<int>>(
            "size", 3,
            "Blur kernel size. Must be odd (kernel needs a defined center).",
            IntRestriction(RestrictionMode::Strict, 1, std::nullopt, 2, true)
        ));
        for (auto& p : makeConvolutionalParams()) d->addParam(p);
        r.addDescriptor(std::move(d));
    }

    // ── invert ────────────────────────────────────────────────────────────
    {
        auto d = std::make_shared<FilterDescriptor>("invert", "Color inverter, also called negative filter.", invertFilter);
        d->addCategory(FilterCategory::Point);
        r.addDescriptor(std::move(d));
    }

    // ── threshold ─────────────────────────────────────────────────────────
    {
        auto d = std::make_shared<FilterDescriptor>("threshold", "Binarize the image.", thresholdingFilter);
        d->addCategory(FilterCategory::Point);
        d->addParam(std::make_shared<FilterParameter<float>>("maxVal",    1.0f, "Output value if threshold condition is met.",     FloatRestriction(RestrictionMode::Flex)));
        d->addParam(std::make_shared<FilterParameter<float>>("minVal",    0.0f, "Output value if threshold condition is not met.", FloatRestriction(RestrictionMode::Flex)));
        d->addParam(std::make_shared<FilterParameter<float>>("threshold", 0.5f, "Threshold value in normalized [0,1] space.",      FloatRestriction(RestrictionMode::Flex, 0.0f, 1.0f)));
        d->addParam(std::make_shared<FilterParameter<std::string>>(
            "mode", "absolute",
            "Defines which mode will be used ('absolute' or 'magnitude').",
            StringRestriction(RestrictionMode::Strict, {"absolute", "magnitude"})
        ));
        d->addParam(std::make_shared<FilterParameter<float>>("center", 0.5f, "Zero reference of the signal. Only applies in 'magnitude' mode.", FloatRestriction(RestrictionMode::Flex)));
        r.addDescriptor(std::move(d));
    }

    // ── bnw ───────────────────────────────────────────────────────────────
    {
        auto d = std::make_shared<FilterDescriptor>("bnw", "Classic black and white filter.", blackAndWhiteFilter);
        d->addCategory(FilterCategory::Point);
        r.addDescriptor(std::move(d));
    }

    // ── sepia ─────────────────────────────────────────────────────────────
    {
        auto d = std::make_shared<FilterDescriptor>("sepia", "Sepia filter. Gives a warm, brownish tone.", sepiaFilter);
        d->addCategory(FilterCategory::Point);
        r.addDescriptor(std::move(d));
    }

    // ── mirror ────────────────────────────────────────────────────────────
    {
        auto d = std::make_shared<FilterDescriptor>("mirror", "Mirrors the image. Flips it horizontally.", mirrorFilter);
        d->addCategory(FilterCategory::Geometric);
        r.addDescriptor(std::move(d));
    }

    // ── sharpen ───────────────────────────────────────────────────────────
    {
        auto d = std::make_shared<FilterDescriptor>("sharpen", "Sharpens the image. Makes borders more saturated.", sharpenFilter);
        d->addCategory(FilterCategory::Convolution);
        d->addParam(std::make_shared<FilterParameter<float>>("amount", 1.0f, "Controls the amount of sharpness.", FloatRestriction(RestrictionMode::Flex, 0.0f)));
        for (auto& p : makeConvolutionalParams()) d->addParam(p);
        r.addDescriptor(std::move(d));
    }

    // ── emboss ────────────────────────────────────────────────────────────
    {
        auto d = std::make_shared<FilterDescriptor>("emboss", "Emboss filter. Highlights edges and contours.", embossFilter);
        d->addCategory(FilterCategory::Convolution);
        for (auto& p : makeConvolutionalParams()) d->addParam(p);
        r.addDescriptor(std::move(d));
    }

    // ── lofg ──────────────────────────────────────────────────────────────
    {
        auto d = std::make_shared<FilterDescriptor>("lofg", "Laplacian of Gaussian filter. Edge detection.", laplacianOfGaussianFilter);
        d->addCategory(FilterCategory::Convolution);
        for (auto& p : makeConvolutionalParams()) d->addParam(p);
        r.addDescriptor(std::move(d));
    }

    // ── motionblur ────────────────────────────────────────────────────────
    {
        auto d = std::make_shared<FilterDescriptor>("motionblur", "Motion blur filter. Simulates the effect of motion blur.", motionblurFilter);
        d->addCategory(FilterCategory::Convolution);
        for (auto& p : makeConvolutionalParams()) d->addParam(p);
        r.addDescriptor(std::move(d));
    }

    // ── linearAdjustment ──────────────────────────────────────────────────
    {
        auto d = std::make_shared<FilterDescriptor>("linearAdjustment", "Applies a linear adjustment to the image colors.", linearAdjustment);
        d->addCategory(FilterCategory::Point);
        d->addParam(std::make_shared<FilterParameter<float>>("scale",  1.0f, "Multiplies each color channel by this value (contrast/brightness gain).", FloatRestriction(RestrictionMode::Flex)));
        d->addParam(std::make_shared<FilterParameter<float>>("offset", 0.0f, "Value added to each color channel after scaling (brightness shift).",     FloatRestriction(RestrictionMode::Flex)));
        r.addDescriptor(std::move(d));
    }

    // ── alphaBlending ─────────────────────────────────────────────────────
    {
        auto d = std::make_shared<FilterDescriptor>(
            "alphaBlending",
            "Blends the source image with a base image using alpha values per channel. Base image size must match source.",
            alphaBlending
        );
        d->addCategory(FilterCategory::Point);
        d->addParam(std::make_shared<FilterParameter<std::string>>(
            "alpha", "[1.0, 1.0, 1.0]",
            "Three floats [0,1] for R, G, B alpha. 1 = filtered image, 0 = base image.",
            StringRestriction(RestrictionMode::Flex)
        ));
        r.addDescriptor(std::move(d));
    }

    // ── sobel ─────────────────────────────────────────────────────────────
    {
        auto d = std::make_shared<FilterDescriptor>(
            "sobel",
            "Sobel operator. Edge detection filter. Convolutional parameters apply to x and y passes.",
            sobelOperatorFilter
        );
        d->addCategory(FilterCategory::Gradient);
        d->addParam(std::make_shared<FilterParameter<bool>>("greyscale", true,  "Convert image to greyscale before applying the filter.", BoolRestriction()));
        d->addParam(std::make_shared<FilterParameter<bool>>("scharr",    false, "Use the Scharr operator instead of the Sobel operator.", BoolRestriction()));
        for (auto& p : makeConvolutionalParams()) d->addParam(p);
        r.addDescriptor(std::move(d));
    }

    // ── FSDithering ───────────────────────────────────────────────────────
    {
        auto d = std::make_shared<FilterDescriptor>(
            "FSDithering",
            "Floyd-Steinberg dithering. Reduces color depth by diffusing quantization error to neighboring pixels.",
            floydSteinbergFilter
        );
        d->addCategory(FilterCategory::ErrorDiffusion);
        d->addParam(std::make_shared<FilterParameter<int>>("depth", 2, "Number of quantization levels.", IntRestriction(RestrictionMode::Strict, 2)));
        d->addParam(std::make_shared<FilterParameter<bool>>("perceptual", true, "Use perceptual quantization.", BoolRestriction()));
        d->addParam(std::make_shared<FilterParameter<float>>("amount", 1.0f, "Amount of neighbor error diffusion, in [0,1].", FloatRestriction(RestrictionMode::Strict, 0.0f, 1.0f)));
        d->addParam(std::make_shared<FilterParameter<float>>("noise",  0.0f, "Amount of noise added to the error diffusion.",  FloatRestriction(RestrictionMode::Flex, 0.0f)));
        d->addParam(std::make_shared<FilterParameter<bool>>("serpentine", true, "Use serpentine scanning for the dithering process.", BoolRestriction()));
        d->addParam(std::make_shared<FilterParameter<std::string>>(
            "domain", "clamp",
            "'clamp' maps values to [0,1] before dithering; 'raw' applies on unbounded signal.",
            StringRestriction(RestrictionMode::Strict, {"clamp", "raw"})
        ));
        r.addDescriptor(std::move(d));
    }

    // ── bayerDithering ────────────────────────────────────────────────────
    {
        auto d = std::make_shared<FilterDescriptor>(
            "bayerDithering",
            "Bayer dithering. Ordered dithering using a Bayer matrix. Good for gradients and smooth transitions.",
            bayerDitheringFilter
        );
        d->addCategory(FilterCategory::ErrorDiffusion);
        d->addParam(std::make_shared<FilterParameter<int>>("depth", 2, "Number of quantization levels.", IntRestriction(RestrictionMode::Strict, 2)));
        d->addParam(std::make_shared<FilterParameter<bool>>("perceptual", true, "Use perceptual quantization.", BoolRestriction()));
        d->addParam(std::make_shared<FilterParameter<int>>("levels", 4, "Size of the Bayer matrix (2^levels x 2^levels).", IntRestriction(RestrictionMode::Flex, 1)));
        d->addParam(std::make_shared<FilterParameter<std::string>>(
            "domain", "clamp",
            "'clamp' maps values to [0,1] before dithering; 'raw' applies on unbounded signal.",
            StringRestriction(RestrictionMode::Strict, {"clamp", "raw"})
        ));
        r.addDescriptor(std::move(d));
    }
}