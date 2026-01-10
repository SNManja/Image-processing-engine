#include <stdio.h>
#include <vector>
#include <string.h>
#include <dirent.h>
#include "image.h"
#include "filter.h"
#include "args_parser.h"
#include "cli_helpers.h"




int main(const int argc, const char* argv[]) 
{
    if(argc == 1){
        // Defaults to json config
        pipelineViaJSON();
    }

    const std::string filterName = getStringArg(argv, 1, "");
    
    if(strcmp(filterName.c_str(), "--help") == 0) {
        printHelp();
        return 0;
    }

    printf("Process completed\n");
    return 0;
}