#include <emscripten.h>
#include <emscripten/bind.h> 
#include <iostream>
#include "cli_helpers.h"      
#include <fstream> 


extern "C" {
    EMSCRIPTEN_KEEPALIVE
    void run_pipeline(const char* json_pipeline) {
        std::string PICS_DIR = "./pics";
        std::string OUTPUT_DIR = "./output";
        std::string JSON_PATH = "./pipeline.json";


        std::ofstream config_pipeline(JSON_PATH);
        if (config_pipeline.is_open()) {
            config_pipeline << json_pipeline;
            config_pipeline.close();
        } else {
            printf("Error: No se pudo crear %s en MEMFS\n", JSON_PATH.c_str());
            return;
        }

        try {
            pipelineViaJSON(PICS_DIR, OUTPUT_DIR, JSON_PATH);
        } catch (const std::exception& e) {
            std::cerr << "Error: " << e.what() << std::endl;
        }
    }
}