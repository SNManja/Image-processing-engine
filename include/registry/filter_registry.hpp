#pragma once

#include <vector>
#include <memory>
#include <string>
#include "json.hpp"
#include "registry/filter_descriptor.hpp"
//#include "registry/init_filter_registry.hpp"


class FilterRegistry {
public:
    FilterRegistry() = default;

    // Añade un descriptor. Lanza std::invalid_argument si desc es nulo o ya existe un descriptor con ese nombre.
    void addDescriptor(std::shared_ptr<FilterDescriptor> desc);

    // Devuelve el descriptor por nombre o nullptr si no existe.
    std::shared_ptr<FilterDescriptor> getDescriptor(const std::string& name) const noexcept;

    // Pide la función básica asociada al filtro. Lanza std::out_of_range si no existe el filtro.
    BasicFilter getFilterFunction(const std::string& name) const;

    // Serializa todo el registry como { "FilterName": { ...descriptor json... }, ... }
    nlohmann::json toJson() const noexcept;

private:
    std::vector<std::shared_ptr<FilterDescriptor>> descriptors_;
};

// Declaración de la función de inicialización (definida en init_filter_registry.hpp)
void initFilterRegistry(FilterRegistry&);

// Getter singleton que inicializa el registry llamando a initFilterRegistry once.
inline FilterRegistry& getFilterRegistry() {
    static FilterRegistry instance = [] {
        FilterRegistry r;
        initFilterRegistry(r); // debe estar declarada y no depender de más estado global
        return r;
    }();
    return instance;
}


