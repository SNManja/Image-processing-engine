#pragma once

#include <string>

#include "filter_restrictions.hpp"
/*
The restriction system is designed to be extensible.

Adding a new parameter type requires:
1. Defining a restriction type in param_restrictions that matches the IRestriction interface
2. Adding a RestrictionTraits specialization so FilterParameter can resolve the matching restriction type
*/

template<typename T>
struct RestrictionTraits;

template<>
struct RestrictionTraits<std::string> {
    using type = StringRestriction;
    static constexpr ParamType paramType = ParamType::String;
};

template<>
struct RestrictionTraits<int> {
    using type = IntRestriction;
    static constexpr ParamType paramType = ParamType::Int;
};

template<>
struct RestrictionTraits<float> {
    using type = FloatRestriction;
    static constexpr ParamType paramType = ParamType::Float;
};

template<>
struct RestrictionTraits<bool> {
    using type = BoolRestriction;
    static constexpr ParamType paramType = ParamType::Bool;
};