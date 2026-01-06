#include <stdio.h>
#include <vector>
#include <string.h>
#include <dirent.h>
#include "image.h"
#include "filter.h"


int main() 
{
    applyFilterOnEveryPPM("./pics", laplacianOfGaussianFilter, nullptr);
    printf("Process completed\n");
    return 0;
}