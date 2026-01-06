# Configuración del compilador
CXX = g++
CXXFLAGS = -Wall -Iinclude -std=c++17

# Nombre del ejecutable final
TARGET = engine

# Localización de archivos
# Buscamos todos los .cpp dentro de src y sus subcarpetas
SRCS = $(shell find src -name "*.cpp")

# Regla por defecto
all: $(TARGET)

# Compilación del ejecutable
$(TARGET): $(SRCS)
	$(CXX) $(CXXFLAGS) $(SRCS) -o $(TARGET)

# Limpieza
clean:
	rm -f $(TARGET)