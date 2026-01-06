#include <stdio.h>
#include <vector>
#include <string.h>
#include <dirent.h>
#include "image.h"
#include "filter.h"


int main(const int argc, const char* argv[]) 
{
    applyFilterOnEveryPPM("./pics", sharpenFilter, argv);
    printf("Process completed\n");
    return 0;
}