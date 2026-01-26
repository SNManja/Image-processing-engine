#include "image.h"
#include "cli_helpers.h"
#include <dirent.h> // Para escanear la carpeta
#include <vector>
#include <string>

const std::string PICS_DIR = "./pics/";
const std::string OUTPUT_DIR = "./tests/test_output/";
const std::string JSON_PATH = "./tests/identity.json";

int main() {
    batchPipelineViaJson(PICS_DIR, OUTPUT_DIR, JSON_PATH);

    bool pass = true;
    
    DIR* directory = opendir(PICS_DIR.c_str());
    if (!directory) {
        perror("Error opening input directory");
        return 1;
    }

    struct dirent* dirEntry;
    while ((dirEntry = readdir(directory)) != NULL) {
        if (dirEntry->d_type == DT_REG) {
            std::string fileName = dirEntry->d_name;
            size_t dotPos = fileName.find_last_of(".");
            if (dotPos == std::string::npos) continue;

            std::string name = fileName.substr(0, dotPos);
            std::string ext = fileName.substr(dotPos + 1);

            if (ext == "ppm" ||  ext == "png") { // jpeg is not a loss format, so identity tested has to be with tolerance (to do)
                
                std::string ppmInPath = PICS_DIR + fileName;
                std::string ppmOutPath = OUTPUT_DIR + name + "_identity." + ext; 

                image<unsigned char> src = read_image(ppmInPath);
                image<unsigned char> dst = read_image(ppmOutPath);

                bool thisIdentity = (src == dst);
                if (thisIdentity) {
                    printf(" Identity worked in %s\n", fileName.c_str());
                } else {
                    printf(" !! Identity failed in %s\n", fileName.c_str());
                }
                pass = pass && thisIdentity;
            }
        }
    }
    closedir(directory);

    if (pass) {
        printf("\n>>> ! All identity tests passed\n");
    } else {
        printf("\n>>> !! At least one identity test failed\n");
    }

    return pass ? 0 : 1;
}