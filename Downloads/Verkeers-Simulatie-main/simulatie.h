//
// Created by student on 03.03.22.
//

#ifndef VERKEERSSIMULATIE_SIMULATIE_H
#include <string>
#include <iostream>
#include "cmath"
#include "contract.h"
#include <vector>
#include "baan.h"
#define VERKEERSSIMULATIE_SIMULATIE_H
using namespace std;

class Simulatie{
private:
    double tijd;
    double  SIMULATIETIJD;
    int aantalVoertuigen;
    Simulatie* _initCheck;
    vector<Baan*> banen;

public:
    bool properlyInitialized();
    Simulatie();
    //ENSURE(properlyInitialized(), "constructor must end in properlyInitialized state");

    void addBaan(Baan* b);
    //REQUIRE(this->properlyInitialized(), "Simulatie wasn't initialized when calling setBaan");
    //ENSURE(sizeNaDeAdd != sizeVoorDeAdd, "er werd geen baan toegevoegd");

    int getSizeBanen();
    //REQUIRE(this->properlyInitialized(),"Simulatie wasn't initialized when calling getBaan");

    double getTijd();
    //REQUIRE(this->properlyInitialized(), "Simulatie wasn't initialized when calling getTijd");
    //REQUIRE(tijd >= 0, "getTijd: de tijd kan niet negatief zijn!");

    double getSimulatietijd();
    //REQUIRE(this->properlyInitialized(), "Simulatie wasn't initialized when calling getSimulatietijd");

    void tijdUpdate();
    //REQUIRE(this->properlyInitialized(), "Simulatie wasn't initialized when calling tijdUpdate");
    //ENSURE(tijdNaDeUpdate != tijdVoorDeUpdate, "tijd werd niet verhoogd");

    void printSimulatie();
    //REQUIRE(this->properlyInitialized(), "Simulatie wasn't initialized when calling printSimulatie");

    void grafischeImpresie(ostream& myfile);
    //REQUIRE(this->properlyInitialized(), "Simulatie wasn't initialized when calling grafischeImpresie");

    int getAantalVoertuigen();
    //REQUIRE(this->properlyInitialized(), "Simulatie wasn't initialized when calling getAantalVoertuigen");

    void addAantalVoertuig();
    //REQUIRE(this->properlyInitialized(), "Simulatie wasn't initialized when calling getAantalVoertuigen");

    void deleteAantalVoertuig();
    //REQUIRE(this->properlyInitialized(), "Simulatie wasn't initialized when calling deleteAantalVoertuig");

    Simulatie* get_initCheck();
    //REQUIRE(this->properlyInitialized(), "Simulatie wasn't initialized when calling get_initCheck");

    void set_initCheck(Simulatie* i);
    //REQUIRE(this->properlyInitialized(), "Simulatie wasn't initialized when calling set_initCheck");

    vector<Baan*> getBanen();
    //REQUIRE(this->properlyInitialized(), "Simulatie wasn't initialized when calling getBanen");
};
#endif //VERKEERSSIMULATIE_SIMULATIE_H
