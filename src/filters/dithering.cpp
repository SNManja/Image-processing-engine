#include "filter.h"
#include "image.h"
#include "json.hpp"
#include <stdexcept>
#include <thread>
#include <mutex>
#include <algorithm>
#include <cstdlib>

using json = nlohmann::json;


void floydSteinbergFilter(const image<float>& src, image<float>& dst, const filterContext& ctx) {
	resizeToMatchSrc(src, dst);
    dst=src;
	int h = src.height;
	int w = src.width;

	bool perceptual = lookingForParamInCtx(ctx, "perceptual", false);
	float errorAmount = lookingForParamInCtx(ctx, "amount", 1.0f);
    int levels = lookingForParamInCtx(ctx, "levels", 2);
	float noiseAmount = lookingForParamInCtx(ctx, "noise", 0.0f);

	float randFactor = 1.0f + ((float)rand() / (float)RAND_MAX * 2.0f - 1.0f) * noiseAmount;

	if (perceptual){
		normalizeGamma(dst);
	}
	for (int y = 0; y < h; y++) {
		for (int x = 0; x < w; x++) {
			pixel<float>* p = pixel_ptr(dst, x, y);
			if (!p) continue;

			float newPixelR = round(p->r * (levels - 1)) / (levels - 1);
			float newPixelG = round(p->g * (levels - 1)) / (levels - 1);
			float newPixelB = round(p->b * (levels - 1)) / (levels - 1);


			float rError = p->r - newPixelR;
			float gError = p->g - newPixelG;
			float bError = p->b - newPixelB;
			pixel<float> errorPixel = { rError, gError, bError };

			setPixel(dst, x, y, {newPixelR, newPixelG, newPixelB});

			if (x + 1 < w) {
				pixel<float>* pRight = pixel_ptr(dst, x + 1, y);
				if (pRight) *pRight += errorPixel * (errorAmount * randFactor * 7.0f / 16.0f);
			}
			if (x - 1 >= 0 && y + 1 < h) {
				pixel<float>* pBottomLeft = pixel_ptr(dst, x - 1, y + 1);
				if (pBottomLeft) *pBottomLeft += errorPixel * (errorAmount * randFactor *3.0f / 16.0f);
			}
			if (y + 1 < h) {
				pixel<float>* pBottom = pixel_ptr(dst, x, y + 1);
				if (pBottom) *pBottom += errorPixel * (errorAmount * randFactor *5.0f / 16.0f);
			}
			if (x + 1 < w && y + 1 < h) {
				pixel<float>* pBottomRight = pixel_ptr(dst, x + 1, y + 1);
				if (pBottomRight) *pBottomRight += errorPixel * (errorAmount * randFactor * 1.0f / 16.0f);
			}
		}
	}
	if(perceptual){
		linearizeGamma(dst);
	}
}
