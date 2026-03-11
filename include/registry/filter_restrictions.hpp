#pragma once

#include <optional>
#include <string>
#include <vector>
#include <json.hpp>

enum class ParamType {
    String,
    Int,
    Float,
    Bool
};

enum class RestrictionMode {
    Strict,
    Flex,
    None
};

std::string toString(RestrictionMode mode);
std::string toString(ParamType type);

template<typename T>
class IRestriction {
public:
    virtual ~IRestriction() = default;

    virtual ParamType type() const = 0;
    virtual nlohmann::json toJson() const = 0;
    virtual bool validate(const T& value) const = 0;
    virtual bool inSuggestedRange(const T& value) const = 0;
    virtual RestrictionMode mode() const = 0;
};

class StringRestriction : public IRestriction<std::string> {
public:
    StringRestriction(
        RestrictionMode mode = RestrictionMode::None,
        std::vector<std::string> allowedValues = {}
    );

    ParamType type() const override;
    bool validate(const std::string& value) const override;
    bool inSuggestedRange(const std::string& value) const override;
    nlohmann::json toJson() const override;
    RestrictionMode mode() const override;

private:
    RestrictionMode mode_;
    std::vector<std::string> allowedValues_;
};

class BoolRestriction : public IRestriction<bool> {
public:
    BoolRestriction();

    ParamType type() const override;
    bool validate(const bool& value) const override;
    bool inSuggestedRange(const bool& value) const override;
    nlohmann::json toJson() const override;
    RestrictionMode mode() const override;
};

class IntRestriction : public IRestriction<int> {
public:
    IntRestriction(
        RestrictionMode mode = RestrictionMode::None,
        std::optional<int> minValue = std::nullopt,
        std::optional<int> maxValue = std::nullopt,
        std::optional<int> step = std::nullopt,
        bool oddOnly = false,
        bool evenOnly = false
    );

    ParamType type() const override;
    bool validate(const int& value) const override;
    bool inSuggestedRange(const int& value) const override;
    nlohmann::json toJson() const override;
    RestrictionMode mode() const override;

private:
    RestrictionMode mode_;
    std::optional<int> minValue_;
    std::optional<int> maxValue_;
    std::optional<int> step_;
    bool oddOnly_;
    bool evenOnly_;
};

class FloatRestriction : public IRestriction<float> {
public:
    FloatRestriction(
        RestrictionMode mode = RestrictionMode::None,
        std::optional<float> minValue = std::nullopt,
        std::optional<float> maxValue = std::nullopt,
        std::optional<float> step = std::nullopt
    );

    ParamType type() const override;
    bool validate(const float& value) const override;
    bool inSuggestedRange(const float& value) const override;
    nlohmann::json toJson() const override;
    RestrictionMode mode() const override;

private:
    RestrictionMode mode_;
    std::optional<float> minValue_;
    std::optional<float> maxValue_;
    std::optional<float> step_;
};