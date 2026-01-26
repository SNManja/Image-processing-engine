#include "filter.h"
#include "image.h"
#include "json.hpp"
#include <stdexcept>
#include <thread>
#include <mutex>
#include <algorithm>
#include "paths.h"
using json = nlohmann::json;


void ditheringFilter(const image<float>& src, image<float>& dst, const filterContext& ctx) {
	resizeToMatchSrc(src, dst);
    dst=src;
	int h = src.height;
	int w = src.width;

	for (int y = 0; y < h; y++) {
		for (int x = 0; x < w; x++) {
			pixel<float>* p = pixel_ptr(dst, x, y);
			if (!p) continue;

			float newPixelR = (p->r > 0.5f) ? 1.0f : 0.0f;
			float newPixelG = (p->g > 0.5f) ? 1.0f : 0.0f;
			float newPixelB = (p->b > 0.5f) ? 1.0f : 0.0f;


			float rError = p->r - newPixelR;
			float gError = p->g - newPixelG;
			float bError = p->b - newPixelB;
			pixel<float> errorPixel = { rError, gError, bError };

			setPixel(dst, x, y, {newPixelR, newPixelG, newPixelB});

			if (x + 1 < w) {
				pixel<float>* pRight = pixel_ptr(dst, x + 1, y);
				if (pRight) *pRight += errorPixel * (7.0f / 16.0f);
			}
			if (x - 1 >= 0 && y + 1 < h) {
				pixel<float>* pBottomLeft = pixel_ptr(dst, x - 1, y + 1);
				if (pBottomLeft) *pBottomLeft += errorPixel * (3.0f / 16.0f);
			}
			if (y + 1 < h) {
				pixel<float>* pBottom = pixel_ptr(dst, x, y + 1);
				if (pBottom) *pBottom += errorPixel * (5.0f / 16.0f);
			}
			if (x + 1 < w && y + 1 < h) {
				pixel<float>* pBottomRight = pixel_ptr(dst, x + 1, y + 1);
				if (pBottomRight) *pBottomRight += errorPixel * (1.0f / 16.0f);
			}
		}
	}
}
