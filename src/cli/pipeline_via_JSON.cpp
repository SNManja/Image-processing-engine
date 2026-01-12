#include "cli_helpers.h"
#include "image.h"
#include "filter.h"
#include <json.hpp>
#include <fstream>
#include <dirent.h>

std::string PICS_DIR = "./pics";
std::string OUTPUT_DIR = "./output";
std::string JSON_PATH = "./pipeline.json";
using json = nlohmann::json;
void pipelineViaJSON() {
    std::ifstream file(JSON_PATH);
    assert(file.is_open());
    json data = json::parse(file);

    assert(data.contains("pipeline") && data["pipeline"].is_array());   


    DIR* directory = opendir(PICS_DIR.c_str());
    assert(directory); // Directory opened successfully

    struct dirent* dirEntry;
    int numberOfImages = 0;
    while ((dirEntry = readdir(directory)) != NULL) {
        if (dirEntry->d_type == DT_REG) {
            std::string fileName = dirEntry->d_name;
            if (fileName.substr(fileName.find_last_of(".") + 1) == "ppm") {
                image src = read_image((PICS_DIR + "/" + fileName).c_str());
                for(const auto& step : data["pipeline"]){
                    if (step.contains("filter")) {
                        image dst;
                        std::string filterName = step.at("filter");
                        FilterDescriptor fdesc = getFilterDescriptor(filterName);
                        if (fdesc.func == nullptr) {
                            printf("Skipping unknown filter %s\n", filterName.c_str());
                            continue;
                        }
                        apply_filter(src, dst, fdesc.func, step, fileName.c_str());
                        std::swap(src, dst);
                    }
                }

                std::string outPath = OUTPUT_DIR + "/" + fileName;
                printToPPM(src, outPath.c_str()); 
                numberOfImages++;
            }
        }
                
    }
    closedir(directory);

    

}