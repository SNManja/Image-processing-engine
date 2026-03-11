#pragma once

#include <vector>
#include <memory>
#include "registry/filter_descriptor.hpp"
#include "registry/filter_parameter.hpp"
#include "registry/filter_restrictions.hpp"

// Forward declaration — implementación en src/registry/init_filter_registry.cpp
class FilterRegistry;

std::vector<std::shared_ptr<FilterParameterBase>> makeConvolutionalParams();
void initFilterRegistry(FilterRegistry& r);
