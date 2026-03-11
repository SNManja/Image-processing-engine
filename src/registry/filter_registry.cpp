#include "registry/filter_registry.hpp"

#include <stdexcept>
#include <algorithm>

void FilterRegistry::addDescriptor(std::shared_ptr<FilterDescriptor> desc) {
    if (!desc) {
        throw std::invalid_argument("FilterRegistry::addDescriptor: desc is null");
    }
    // evitar duplicados por nombre
    auto it = std::find_if(descriptors_.begin(), descriptors_.end(),
        [&](const std::shared_ptr<FilterDescriptor>& d) {
            return d && d->name() == desc->name();
        });
    if (it != descriptors_.end()) {
        throw std::invalid_argument("FilterRegistry::addDescriptor: descriptor with name '" + desc->name() + "' already exists");
    }
    descriptors_.push_back(std::move(desc));
}

std::shared_ptr<FilterDescriptor> FilterRegistry::getDescriptor(const std::string& name) const noexcept {
    for (const auto& d : descriptors_) {
        if (d && d->name() == name) return d;
    }
    return nullptr;
}

BasicFilter FilterRegistry::getFilterFunction(const std::string& name) const {
    auto d = getDescriptor(name);
    if (!d) {
        throw std::out_of_range("FilterRegistry::getFilterFunction: no descriptor with name '" + name + "'");
    }
    return d->filterFunction();
}

nlohmann::json FilterRegistry::toJson() const noexcept {
    nlohmann::json out = nlohmann::json::object();
    for (const auto& d : descriptors_) {
        if (!d) continue;
        // descriptor ya provee toJson() -> toJson() debe devolver descripción + params
        out[d->name()] = d->toJson();
    }
    return out;
}