#include <string>
#include <stdlib.h>
#include "filter.h"
#include "args_parser.h"


int getIntArg(const char* args[], int index, int defaultValue) {
    // Precond: Index has to be in range
    if (args[index] != nullptr) {
        return std::stoi(args[index]);
    }
    return defaultValue;
}

float getFloatArg(const char* args[], int index, float defaultValue) {
    // Precond: Index has to be in range
    if (args[index] != nullptr) {
        return std::stof(args[index]);
    }
    return defaultValue;
}

std::string getStringArg(const char* args[], int index, const std::string& defaultValue) {
    // Precond: Index has to be in range
    if (args[index] != nullptr) {
        return args[index];
    }
    return defaultValue;
}

int getFlagIndex(const char* args[], const std::string& flagName) {
    for (int i = 0; args[i] != nullptr; ++i) {
        if (std::string(args[i]) == flagName) {
            return i;
        }
    }
    return -1;
}


// This could be a template
int getFlagValue(const char* args[], const std::string& flagName, int defaultValue) {
    int index = getFlagIndex(args, flagName);
    if (index >= 0) {
        return getIntArg(args, index + 1, defaultValue);
    }
    return defaultValue;
}

float getFlagValue(const char* args[], const std::string& flagName, float defaultValue) {
    int index = getFlagIndex(args, flagName);
    if (index >= 0) {
        return getFloatArg(args, index + 1, defaultValue);
    }
    return defaultValue;
}

std::string getFlagValue(const char* args[], const std::string& flagName, const std::string& defaultValue) {
    int index = getFlagIndex(args, flagName);
    if (index >= 0) {
        return getStringArg(args, index + 1, defaultValue);
    }
    return defaultValue;
}

int countArgs(const char* args[]) {
    int count = 0;
    while (args[count] != nullptr) {
        ++count;
    }
    return count;
}

