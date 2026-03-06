#include <emscripten.h>
#include <emscripten/bind.h> 
#include <iostream>
#include "cli_helpers.h"      
#include <fstream> 
#include <thread>


extern "C" {
    EMSCRIPTEN_KEEPALIVE
    void run_pipeline(const char* json_pipeline) {
        std::string PICS_DIR = "./pics";
        std::string OUTPUT_DIR = "./output";
        std::string JSON_PATH = "./pipeline.json";

        std::ofstream config_pipeline(JSON_PATH);
        if (!config_pipeline.is_open()) {
            MAIN_THREAD_EM_ASM({
                if (window.onEngineError) {
                    window.onEngineError("Failed to fetch ./pipeline.json into MEMFS");
                }
            });
            return;
        }

        config_pipeline << json_pipeline;
        config_pipeline.close();

        std::thread([=]() {
            try {
                batchPipelineViaJson(PICS_DIR, OUTPUT_DIR, JSON_PATH);

                MAIN_THREAD_EM_ASM({
                    if (window.onEngineFinished) {
                        window.onEngineFinished();
                    }
                });

            } catch (const std::exception& e) {
                std::string msg = e.what();

                MAIN_THREAD_EM_ASM({
                    if (window.onEngineError) {
                        window.onEngineError(UTF8ToString($0));
                    }
                }, msg.c_str());

            } catch (...) {
                MAIN_THREAD_EM_ASM({
                    if (window.onEngineError) {
                        window.onEngineError("Unknown engine error");
                    }
                });
            }
        }).detach();
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