#include "image.h"
#include "cli_helpers.h"


const std::string PICS_DIR = "./pics/";
const std::string OUTPUT_DIR = "./tests/test_output/";
const std::string JSON_PATH = "./tests/identity.json";
const std::vector<std::string> PPM_TO_TEST = {"cave", "paisaje", "miles", "gato", "mountains"};

int main(){
    bool pass = true;
    for (const std::string& ppmname : PPM_TO_TEST){
        std::string ppmInPath = PICS_DIR + ppmname + ".ppm";
        image<unsigned char> src = read_image(ppmInPath);
        pipelineViaJSON(PICS_DIR, OUTPUT_DIR, JSON_PATH);
        std::string ppmOutPath = OUTPUT_DIR + ppmname + "_identity.ppm";
        image<unsigned char> dst = read_image(ppmOutPath);

        bool thisIdentity = (src == dst);
        if (thisIdentity){
            printf(" ! Indentity worked in %s\n", ppmname.c_str());
        } else {
            printf(" !! Identity failed in %s\n", ppmname.c_str());
        }
        pass = pass && thisIdentity;

    };

    if(pass){
        printf("All identity test passed\n");
    } else {
        printf("At least one identity test failed\n");
    }
    


    return pass ? 0 : 1;
}