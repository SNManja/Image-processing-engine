#include "filter.h"
#include "image.h"
#include "json.hpp"
#include <stdexcept>
#include <thread>
#include <mutex>
#include <algorithm>
#include <cstdlib>

using json = nlohmann::json;

void insertError(pixel<float>& p, pixel<float> errorPixel, float errorAmount, float randFactor) {
	p += errorPixel * (errorAmount * randFactor);
}


void floydSteinbergFilter(const image<float>& src, image<float>& dst, const filterContext& ctx) {
	
    dst=src;
	int h = src.height;
	int w = src.width;

	bool perceptual = lookingForParamInCtx(ctx, "perceptual", true);
	float errorAmount = lookingForParamInCtx(ctx, "amount", 1.0f);
    int depth = lookingForParamInCtx(ctx, "depth", 2);
	float noiseAmount = lookingForParamInCtx(ctx, "noise", 0.0f);
	bool serpentine = lookingForParamInCtx(ctx, "serpentine", true);
	std::string domain = lookingForParamInCtx<std::string>(ctx, "domain", "clamp");
	
	if (depth < 2){
		throw std::invalid_argument("Dither depth must be at least 2");
	}

	float randFactor = 1.0f;
	if(strcmp(domain.c_str(), "clamp") == 0){
		clampImage(dst);
	} 
	if (perceptual){
		perceptualGamma(dst);
	}
	for (int y = 0; y < h; y++) {
		bool reverse = (y % 2 != 0) && serpentine; // Filas impares van al revés
    	int dir = reverse ? -1 : 1;
		for (int i = 0; i < w; i++) {
			if (noiseAmount > 0.0f) randFactor = 1.0f + ((float)rand() / (float)RAND_MAX * 2.0f - 1.0f) * noiseAmount;
			int x = reverse ? (w - 1 - i) : i;
			pixel<float>* p = pixel_ptr(dst, x, y);
			if (!p) continue;

			float newPixelR = round(p->r * (depth - 1)) / (depth - 1);
			float newPixelG = round(p->g * (depth - 1)) / (depth - 1);
			float newPixelB = round(p->b * (depth - 1)) / (depth - 1);


			float rError = p->r - newPixelR;
			float gError = p->g - newPixelG;
			float bError = p->b - newPixelB;
			pixel<float> errorPixel = { rError, gError, bError };

			setPixel(dst, x, y, {newPixelR, newPixelG, newPixelB});

			int nx = x + dir;
			if (nx >= 0 && nx < w) {
				pixel<float>* pNext = pixel_ptr(dst, nx, y);
				if (pNext) insertError(*pNext, errorPixel, errorAmount, randFactor * 7.0f / 16.0f);
			}

			nx = x - dir;
			int ny = y + 1;
			if (nx >= 0 && nx < w && ny < h) {
				pixel<float>* pBL = pixel_ptr(dst, nx, ny);
				if (pBL) insertError(*pBL, errorPixel, errorAmount, randFactor * 3.0f / 16.0f);
			}

			if (y + 1 < h) {
				pixel<float>* pB = pixel_ptr(dst, x, y + 1);
				if (pB) insertError(*pB, errorPixel, errorAmount, randFactor * 5.0f / 16.0f);
			}

			nx = x + dir;
			if (nx >= 0 && nx < w && ny < h) {
				pixel<float>* pBR = pixel_ptr(dst, nx, ny);
				if (pBR) insertError(*pBR, errorPixel, errorAmount, randFactor * 1.0f / 16.0f);
			}
		}
	}
	if(perceptual){
		linearizeGamma(dst);
	}
	if(strcmp(domain.c_str(), "clamp") == 0){
		clampImage(dst);
	} 
}




std::vector<std::vector<float>> calcBayerMatrix(int levels){
	std::vector<std::vector<float>> matrix;
	int size = 1 << levels;

	matrix.assign(size, std::vector<float>(size, 0));

	const std::vector<std::vector<float>> off = {{0,2},{3,1}};
	if (levels == 1){
		return off;
	}

	std::vector<std::vector<float>> D_n = calcBayerMatrix(levels-1);
	for (int i = 0; i < 2; i++){
		for (int j = 0; j < 2; j++){
			for (int y = 0; y < D_n.size(); y++){
				
				for (int x = 0; x < D_n.size(); x++){
					const float val = 4 * D_n[y][x] + off[i][j];
					matrix[i * D_n.size() + y][j * D_n.size() + x] = val;
				}
				
			}
		}
	}

	return matrix;
}

std::vector<std::vector<float>> getBayerMatrix(int levels){
	int totalElems = (1 << levels) * (1 << levels);


	std::vector<std::vector<float>> matrix = calcBayerMatrix(levels);

	for (auto& row : matrix)
		for (auto& x : row)
			x = (x+0.5f) / totalElems;

	return matrix;
}


void bayerDitheringFilter(const image<float>& src, image<float>& dst, const filterContext& ctx) {
	resizeToMatchSrc(src, dst);
	image<float> original = src; // Not efficient. But this is not a filter i'll improve memory usage for the time being

	int h = src.height;
	int w = src.width;

	const int depth = lookingForParamInCtx(ctx, "depth", 2);
	const int levels = lookingForParamInCtx(ctx, "levels", 2);
	bool perceptual = lookingForParamInCtx(ctx, "perceptual", true);
	std::string domain = lookingForParamInCtx<std::string>(ctx, "domain", "clamp");

	if (depth < 2){
		throw std::invalid_argument("Dither depth must be at least 2");
	}
	
	if (strcmp(domain.c_str(), "clamp") == 0){
		clampImage(original);
	}
	
	const std::vector<std::vector<float>> bayerMatrix = getBayerMatrix(levels);
	int bayerSize = pow(2,levels);
	if (perceptual){
		perceptualGamma(original);
	}

	applyPointTransform(original, dst, [&bayerMatrix, depth, bayerSize](const image<float>& original, image<float>& dst, int x, int y){
		float threshold = bayerMatrix[y % bayerSize][x % bayerSize];
		pixel<float> p = getPixelClamped(original, x, y);
		
		auto ditherChannel = [threshold, depth](float color) {
			float scaled = color * (depth - 1);
			float base = std::floor(scaled);
			float diff = scaled - base;

			return (diff > threshold ? base + 1.0f : base) / (depth - 1);
		};

		p.r = ditherChannel(p.r);
		p.g = ditherChannel(p.g);
		p.b = ditherChannel(p.b);

		setPixel(dst, x, y, p);
	});

	if(perceptual){
		linearizeGamma(dst);
	}
	if(strcmp(domain.c_str(), "clamp") == 0){
		clampImage(dst);
	}
}

