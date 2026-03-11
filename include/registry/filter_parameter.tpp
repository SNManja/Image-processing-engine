#pragma once

#include <stdexcept>
#include <utility>
#include <memory>

template<typename T>
FilterParameter<T>::FilterParameter(
    std::string name,
    T defaultValue,
    std::string description,
    typename FilterParameter<T>::RestrictionType restriction
)
    : FilterParameterBase(std::move(name), std::move(description)),
      defaultValue_(std::move(defaultValue)),
      restriction_(std::move(restriction))
{
    if (name_.empty()) {
        throw std::invalid_argument("Parameter name cannot be empty");
    }

    if (!restriction_.validate(defaultValue_)) {
        throw std::invalid_argument("Default value does not satisfy restriction");
    }
}

template<typename T>
ParamType FilterParameter<T>::type() const noexcept {
    return RestrictionTraits<T>::paramType;
}

template<typename T>
const T& FilterParameter<T>::defaultValue() const noexcept {
    return defaultValue_;
}

template<typename T>
const typename FilterParameter<T>::RestrictionType& FilterParameter<T>::restriction() const noexcept {
    return restriction_;
}

template<typename T>
bool FilterParameter<T>::validate(const T& value) const {
    return restriction_.validate(value);
}

template<typename T>
bool FilterParameter<T>::inSuggestedRange(const T& value) const {
    return restriction_.inSuggestedRange(value);
}

template<typename T>
nlohmann::json FilterParameter<T>::toJson() const {
    nlohmann::json j;
    j["name"] = name_;
    j["type"] = toString(type());
    j["description"] = description_;
    j["defaultValue"] = defaultValue_;
    j["restriction"] = restriction_.toJson();
    return j;
}

template<typename T>
std::shared_ptr<FilterParameterBase> FilterParameter<T>::clone() const {
    return std::make_shared<FilterParameter<T>>(*this);
}
