#pragma once

#include <memory>
#include <string>
#include <utility>
#include <json.hpp>

#include "filter_restrictions.hpp"
#include "restriction_traits.hpp"

class FilterParameterBase {
protected:
    std::string name_;
    std::string description_;

public:
    FilterParameterBase(std::string name, std::string description)
        : name_(std::move(name)), description_(std::move(description)) {}

    virtual ~FilterParameterBase() = default;

    const std::string& name() const noexcept { return name_; }
    const std::string& description() const noexcept { return description_; }

    virtual ParamType type() const noexcept = 0;
    virtual nlohmann::json toJson() const = 0;
    virtual std::shared_ptr<FilterParameterBase> clone() const = 0;
};

template<typename T>
class FilterParameter : public FilterParameterBase {
public:
    using RestrictionType = typename RestrictionTraits<T>::type;

private:
    T defaultValue_;
    RestrictionType restriction_;

public:
    FilterParameter(
        std::string name,
        T defaultValue,
        std::string description,
        RestrictionType restriction
    );

    ParamType type() const noexcept override;
    const T& defaultValue() const noexcept;
    const RestrictionType& restriction() const noexcept;

    bool validate(const T& value) const;
    bool inSuggestedRange(const T& value) const;

    nlohmann::json toJson() const override;
    std::shared_ptr<FilterParameterBase> clone() const override;
};

#include "registry/filter_parameter.tpp"