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
        return 0;
    }

    const std::string flag = getStringArg(argv, 1, "");

    
    if(strcmp(flag.c_str(), "--list") == 0) {
        filterList();
        return 0;
    }


    if(strcmp(flag.c_str(), "--help") == 0) {
        printHelp();
        return 0;
    }

    if(strcmp(flag.c_str(), "--histograms") == 0) {
        printHistograms();
        return 0;
    }

    printf("Invalid parameters\n");
    return 1;
}