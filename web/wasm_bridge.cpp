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
    EMSCRIPTEN_KEEPALIVE
    const char* get_filter_registry_json() {
        // Obtenemos tu mapa actual
        FilterRegistry registry = getRegistry();
        nlohmann::json j = nlohmann::json::object();

        for (auto const& [name, desc] : registry) {
            j[name] = {
                {"description", desc.description},
                {"category", desc.category},
                {"params", desc.paramsDesc} // Esto mapea el vector<string> a un array JSON
            };
        }

        // Variable estática para que el puntero persista al cruzar a JS
        static std::string json_cache;
        json_cache = j.dump();
        return json_cache.c_str();
    }
}