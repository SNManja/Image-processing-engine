#include <string>
#include <stdlib.h>

int getIntArg(const char* args[], int index, int defaultValue) {
    // Precond: Index has to be in range
    if (args[index] != nullptr) {
        return std::stoi(args[index]);
    }
    return defaultValue;
}

int getFloatArg(const char* args[], int index, float defaultValue) {
    // Precond: Index has to be in range
    if (args[index] != nullptr) {
        return std::stof(args[index]);
    }
    return defaultValue;
}

int getFlagInt(const char* args[], std::string flagName, int defaultValue) {
    for (int i = 0; args[i] != nullptr; ++i) {
        if (std::string(args[i]) == flagName) {
            if (args[i+1] != nullptr) {
                return std::stoi(args[i+1]);
            }
        }
    }
    return defaultValue;
}

int getFlagFloat(const char* args[], std::string flagName, float defaultValue) {
    for (int i = 0; args[i] != nullptr; ++i) {
        if (std::string(args[i]) == flagName) {
            if (args[i+1] != nullptr) {
                return std::stof(args[i+1]);
            }
        }
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