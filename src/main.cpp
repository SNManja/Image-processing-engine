#include <stdio.h>
#include <vector>
#include <string.h>
#include <dirent.h>
#include "image.h"
#include "filter.h"


int main() 
{
    applyFilterOnEveryPPM("./pics", laplacianOfGaussianFilter);
    printf("Proceso completado\n");
    return 0;
}