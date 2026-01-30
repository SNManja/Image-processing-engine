#include <vector>


inline int floatCmp(float a, float b, float rel = 1e-5f, float abs = 1e-7f)
{
    float diff = std::fabs(a - b);
    float tol = std::max(abs, rel * std::max(std::fabs(a), std::fabs(b)));

    if (diff <= tol) return 0;
    if (a < b) return -1;
    return 1;
}


bool linearlyIndependentColumns(const std::vector<std::vector<float>>& m, int col_a, int col_b) {
    float baseQuotient;
	bool isColAZero = true;
	bool isColBZero = true;
    for (int i = 0; i < m.size(); i++) {
		isColAZero = isColAZero && (floatCmp(m[i][col_a], 0.0f) == 0);
		isColBZero = isColBZero && (floatCmp(m[i][col_b], 0.0f) == 0);
        if (floatCmp(m[i][col_b], 0.0f) != 0) {
            baseQuotient = m[i][col_a] / m[i][col_b];
            break;
        } 
    }

	if(isColAZero && isColBZero) return false;
	if(!isColAZero && isColBZero || isColAZero && !isColBZero) return true;

    for (int i = 1; i < m.size(); i++) {
        if (floatCmp(m[i][col_b], 0.0f) != 0) {
            float currentQuotient = m[i][col_a] / m[i][col_b];
            if (floatCmp(currentQuotient, baseQuotient) != 0) return true;
        } else {
			if (floatCmp(m[i][col_a], 0.0f) != 0) return true;
		}
    }
    return false;
}

inline bool isRank1(const std::vector<std::vector<float>>& k) {

    for(int col_a = 0; col_a < k[0].size(); col_a++) {
        for (int col_b = col_a+1; col_b < k[0].size(); col_b++) {
            if (col_a == col_b) continue;
            if (linearlyIndependentColumns(k, col_a, col_b)) {
                return false;
            }
        }
    }
    return true;
}

