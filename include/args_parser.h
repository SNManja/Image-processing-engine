#ifndef ARGS_PARSER_H
#define ARGS_PARSER_H

#include <vector>
#include <string>

int countArgs(const char* args[]);

int getIntArg(const char* args[], int index, int defaultValue);
float getFloatArg(const char* args[], int index, float defaultValue);
std::string getStringArg(const char* args[], int index, std::string defaultValue);

#endif