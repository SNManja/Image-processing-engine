#pragma once

#include <memory>
#include <string>
#include <vector>
#include <string>
#include <algorithm>
#include <memory>
#include <string>
#include "json.hpp"

#include "filter_parameter.hpp"
#include "filter.h"

enum class FilterCategory {
    Point,
    Convolution,
    Gradient,
    ErrorDiffusion,
    Geometric
};

class FilterDescriptor {
private:
    std::string name_;
    std::string description_;
    BasicFilter filterFn_;
    std::vector<std::shared_ptr<FilterParameterBase>> parameters_;
    std::vector<FilterCategory> categories_;

public:
    FilterDescriptor(std::string name, std::string description, BasicFilter filterFn);

    const std::string& name() const noexcept;
    const std::string& description() const noexcept;
    BasicFilter filterFunction() const noexcept;

    // Nuevo: devuelve un objeto JSON con { "description": ..., "params": { name: paramJson, ... } }
    nlohmann::json toJson() const;

    const std::vector<std::shared_ptr<FilterParameterBase>>& parameters() const noexcept;
    const std::vector<FilterCategory>& categories() const noexcept;

    void addParam(std::shared_ptr<FilterParameterBase> param);
    void addParams(std::vector<std::shared_ptr<FilterParameterBase>>&& params);
    void addCategory(FilterCategory category);

    const FilterParameterBase* findParam(const std::string& paramName) const noexcept;
    bool hasParam(const std::string& paramName) const noexcept;

    FilterDescriptor(const FilterDescriptor&) = delete;
    FilterDescriptor& operator=(const FilterDescriptor&) = delete;
    FilterDescriptor(FilterDescriptor&&) noexcept = default;
    FilterDescriptor& operator=(FilterDescriptor&&) noexcept = default;
};