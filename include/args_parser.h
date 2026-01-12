#ifndef ARGS_PARSER_H
#define ARGS_PARSER_H

#include <vector>
#include <string>
#include <map>  

int countArgs(const char* args[]);

int getIntArg(const char* args[], int index, int defaultValue);
float getFloatArg(const char* args[], int index, float defaultValue);
std::string getStringArg(const char* args[], int index, const std::string& defaultValue);

int getFlagIndex(const char* args[], const std::string& flagName);
int getFlagValue(const char* args[], const std::string& flagName, int defaultValue);
float getFlagValue(const char* args[], const std::string& flagName, float defaultValue);
std::string getFlagValue(const char* args[], const std::string& flagName, const std::string& defaultValue);
#endif
