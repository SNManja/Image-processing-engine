#include "registry/filter_descriptor.hpp"

#include <stdexcept>
#include <utility>
#include <vector>
#include <memory>
#include <string>
#include <algorithm>
#include "json.hpp"


FilterDescriptor::FilterDescriptor(std::string name, std::string description, BasicFilter filterFn)
    : name_(std::move(name)),
      description_(std::move(description)),
      filterFn_(filterFn) {
    if (name_.empty()) {
        throw std::invalid_argument("FilterDescriptor name cannot be empty");
    }

    if (filterFn_ == nullptr) {
        throw std::invalid_argument("FilterDescriptor filter function cannot be null");
    }
}

const std::string& FilterDescriptor::name() const noexcept {
    return name_;
}

const std::string& FilterDescriptor::description() const noexcept {
    return description_;
}

BasicFilter FilterDescriptor::filterFunction() const noexcept {
    return filterFn_;
}

const std::vector<std::shared_ptr<FilterParameterBase>>& FilterDescriptor::parameters() const noexcept {
    return parameters_;
}

const std::vector<FilterCategory>& FilterDescriptor::categories() const noexcept {
    return categories_;
}

void FilterDescriptor::addParam(std::shared_ptr<FilterParameterBase> param) {
    if (!param) {
        throw std::invalid_argument("Filter parameter cannot be null");
    }

    if (hasParam(param->name())) {
        throw std::invalid_argument("Duplicate parameter name: " + param->name());
    }

    parameters_.push_back(std::move(param));
}


void FilterDescriptor::addParams(std::vector<std::shared_ptr<FilterParameterBase>>&& params) {

    for (const auto& param : params) {
        if (!param) {
            throw std::invalid_argument("Filter parameter cannot be null");
        }

        if (hasParam(param->name())) {
            throw std::invalid_argument("Duplicate parameter name: " + param->name());
        }

    }
    parameters_.reserve(parameters_.size() + params.size());

    for (auto& param : params) {
        parameters_.push_back(std::move(param));
    }
}

void FilterDescriptor::addCategory(FilterCategory category) {
    categories_.push_back(category);
}

const FilterParameterBase* FilterDescriptor::findParam(const std::string& paramName) const noexcept {
    for (const auto& param : parameters_) {
        if (param->name() == paramName) {
            return param.get();
        }
    }
    return nullptr;
}

bool FilterDescriptor::hasParam(const std::string& paramName) const noexcept {
    return findParam(paramName) != nullptr;
}

// Nuevo: serializar descriptor -> { "description": "...", "params": { "pname": { ... }, ... } }
nlohmann::json FilterDescriptor::toJson() const {
    nlohmann::json out;
    out["description"] = description_;

    nlohmann::json params = nlohmann::json::object();
    for (const auto& p : parameters_) {
        if (p) {
            params[p->name()] = p->toJson();
        }
    }
    out["params"] = std::move(params);

    // If categories are provided, include the first one as a simple string for the frontend pill.
    if (!categories_.empty()) {
        auto cat = categories_.front();
        std::string catStr;
        switch (cat) {
            case FilterCategory::Point: catStr = "Point"; break;
            case FilterCategory::Convolution: catStr = "Convolution"; break;
            case FilterCategory::Gradient: catStr = "Gradient"; break;
            case FilterCategory::ErrorDiffusion: catStr = "ErrorDiffusion"; break;
            case FilterCategory::Geometric: catStr = "Geometric"; break;
            default: catStr = "Unknown"; break;
        }
        out["category"] = catStr;
    }

    return out;
}