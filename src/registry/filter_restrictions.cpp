#include "registry/filter_restrictions.hpp"

#include <algorithm>
#include <utility>

std::string toString(RestrictionMode mode) {
    switch (mode) {
        case RestrictionMode::Strict: return "strict";
        case RestrictionMode::Flex:   return "flex";
        case RestrictionMode::None:   return "none";
    }
    return "unknown";
}

std::string toString(ParamType type) {
    switch (type) {
        case ParamType::String: return "string";
        case ParamType::Int:    return "int";
        case ParamType::Float:  return "float";
        case ParamType::Bool:   return "bool";
    }
    return "unknown";
}

StringRestriction::StringRestriction(
    RestrictionMode mode,
    std::vector<std::string> allowedValues
)
    : mode_(mode),
      allowedValues_(std::move(allowedValues)) {}

ParamType StringRestriction::type() const {
    return ParamType::String;
}

bool StringRestriction::validate(const std::string& value) const {
    if (allowedValues_.empty()) return true;
    return std::find(allowedValues_.begin(), allowedValues_.end(), value) != allowedValues_.end();
}

bool StringRestriction::inSuggestedRange(const std::string& value) const {
    return validate(value);
}

nlohmann::json StringRestriction::toJson() const {
    nlohmann::json j;
    j["type"] = toString(type());
    j["mode"] = toString(mode_);
    if (!allowedValues_.empty()) {
        j["allowedValues"] = allowedValues_;
    }
    return j;
}

RestrictionMode StringRestriction::mode() const {
    return mode_;
}

BoolRestriction::BoolRestriction() = default;

ParamType BoolRestriction::type() const {
    return ParamType::Bool;
}

bool BoolRestriction::validate(const bool& value) const {
    (void)value;
    return true;
}

bool BoolRestriction::inSuggestedRange(const bool& value) const {
    (void)value;
    return true;
}

nlohmann::json BoolRestriction::toJson() const {
    nlohmann::json j;
    j["type"] = toString(type());
    j["mode"] = toString(RestrictionMode::None);
    return j;
}

RestrictionMode BoolRestriction::mode() const {
    return RestrictionMode::None;
}

IntRestriction::IntRestriction(
    RestrictionMode mode,
    std::optional<int> minValue,
    std::optional<int> maxValue,
    std::optional<int> step,
    bool oddOnly,
    bool evenOnly
)
    : mode_(mode),
      minValue_(minValue),
      maxValue_(maxValue),
      step_(step),
      oddOnly_(oddOnly),
      evenOnly_(evenOnly) {}

ParamType IntRestriction::type() const {
    return ParamType::Int;
}

bool IntRestriction::validate(const int& value) const {
    if (oddOnly_ && value % 2 == 0) return false;
    if (evenOnly_ && value % 2 != 0) return false;

    switch (mode_) {
        case RestrictionMode::None:
            return true;
        case RestrictionMode::Flex:
            return true;
        case RestrictionMode::Strict:
            if (minValue_ && value < *minValue_) return false;
            if (maxValue_ && value > *maxValue_) return false;
            return true;
    }

    return true;
}

bool IntRestriction::inSuggestedRange(const int& value) const {
    if (oddOnly_ && value % 2 == 0) return false;
    if (evenOnly_ && value % 2 != 0) return false;

    switch (mode_) {
        case RestrictionMode::None:
            return true;
        case RestrictionMode::Flex:
        case RestrictionMode::Strict:
            if (minValue_ && value < *minValue_) return false;
            if (maxValue_ && value > *maxValue_) return false;
            return true;
    }

    return true;
}

nlohmann::json IntRestriction::toJson() const {
    nlohmann::json j;
    j["type"] = toString(type());
    j["mode"] = toString(mode_);

    if (minValue_) j["min"] = *minValue_;
    if (maxValue_) j["max"] = *maxValue_;
    if (step_) j["step"] = *step_;
    if (oddOnly_) j["oddOnly"] = true;
    if (evenOnly_) j["evenOnly"] = true;

    return j;
}

RestrictionMode IntRestriction::mode() const {
    return mode_;
}

FloatRestriction::FloatRestriction(
    RestrictionMode mode,
    std::optional<float> minValue,
    std::optional<float> maxValue,
    std::optional<float> step
)
    : mode_(mode),
      minValue_(minValue),
      maxValue_(maxValue),
      step_(step) {}

ParamType FloatRestriction::type() const {
    return ParamType::Float;
}

bool FloatRestriction::validate(const float& value) const {
    switch (mode_) {
        case RestrictionMode::None:
            return true;
        case RestrictionMode::Flex:
            return true;
        case RestrictionMode::Strict:
            if (minValue_ && value < *minValue_) return false;
            if (maxValue_ && value > *maxValue_) return false;
            return true;
    }

    return true;
}

bool FloatRestriction::inSuggestedRange(const float& value) const {
    switch (mode_) {
        case RestrictionMode::None:
            return true;
        case RestrictionMode::Flex:
        case RestrictionMode::Strict:
            if (minValue_ && value < *minValue_) return false;
            if (maxValue_ && value > *maxValue_) return false;
            return true;
    }

    return true;
}

nlohmann::json FloatRestriction::toJson() const {
    nlohmann::json j;
    j["type"] = toString(type());
    j["mode"] = toString(mode_);

    if (minValue_) j["min"] = *minValue_;
    if (maxValue_) j["max"] = *maxValue_;
    if (step_) j["step"] = *step_;

    return j;
}

RestrictionMode FloatRestriction::mode() const {
    return mode_;
}