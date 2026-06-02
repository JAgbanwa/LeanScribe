cmake_minimum_required(VERSION 3.6)
project(VerkeersSimulatie)

set(CMAKE_CXX_STANDARD 98)
set(CMAKE_CXX_FLAGS "-Wall -Werror")
set(CMAKE_EXE_LINKER_FLAGS -pthread)

# Set include dir
include_directories(gtest/include)

# Set Library dir
link_directories(gtest/lib)

# Set source files for RELEASE target
set(RELEASE_SOURCE_FILES parser/tinystr.cpp parser/tinystr.h parser/tinyxml.cpp parser/tinyxmlerror.cpp parser/tinyxmlparser.cpp baan.h baan.cpp verkeerslicht.h
        verkeerslicht.cpp voertuig.h voertuig.cpp voertuiggenerator.h voertuiggenerator.cpp simulatieImporter.cpp simulatie.cpp simulatie.h bushalte.cpp kruispunt.cpp simulatieUtils.h simulatieUtils.cpp)

# Set source files for DEBUG target
set(DEBUG_SOURCE_FILES testMain.cpp ${RELEASE_SOURCE_FILES} testen/voertuigTest.h testen/verkeerslichtTest.h testen/voertuiggeneratorTest.h testen/baanTest.h testen/simulatieTest.h testen/bushalteTest.h testen/kruispuntTest.h contract.h nullptr.h testen/simulatieImporterTest.h testen/inputTest.h testen/outputTest.h)

# Create RELEASE target
add_executable(VS main.cpp ${RELEASE_SOURCE_FILES})

# Create DEBUG target
add_executable(VS_debug ${DEBUG_SOURCE_FILES})

# Link library
target_link_libraries(VS_debug gtest)