//
// Created by elias on 10/04/2022.
//

#ifndef PROJECT_XML_PARSER_VLIEGTUIGSIMULATIE_H
#include <iostream>
#include "parser/tinyxml.h"
#include "simulatie.h"
#include "contract.h"
#include <string>
#include <sstream>
#define PROJECT_XML_PARSER_VLIEGTUIGSIMULATIE_H
using namespace std;

enum SuccessEnum {ImportAborted, PartialImport, Success};

class SimulatieImporter{
private:
    SimulatieImporter* _initCheck;
public:
    bool properlyInitialized();
    SimulatieImporter();
    //ENSURE(properlyInitialized(), "constructor must end in properlyInitialized state");

    static SuccessEnum importSimulatie(const char * inputfilename , ostream& errStream, Simulatie* simulatie);
    //REQUIRE(this->properlyInitialized(),"VerkeersSimulatie wasn't initialized when calling readSimulatie");

    static void runSimulatie(Simulatie* simulatie, bool isTest);
    //REQUIRE(this->properlyInitialized(),"VerkeersSimulatie wasn't initialized when calling runSimulatie");

    SimulatieImporter* get_initCheck();
    //REQUIRE(this->properlyInitialized(), "VerkeersSimulatie wasn't initialized when calling get_initCheck");

    void set_initCheck(SimulatieImporter* v);
    //REQUIRE(this->properlyInitialized(), "VerkeersSimulatie wasn't initialized when calling set_initCheck");

    static bool isUpperCase(string& word);
    //REQUIRE(this->properlyInitialized(), "VerkeersSimulatie wasn't initialized when calling isUpperCase");
};
#endif //PROJECT_XML_PARSER_VLIEGTUIGSIMULATIE_H
