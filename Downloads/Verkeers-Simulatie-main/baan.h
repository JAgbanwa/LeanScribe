//
// Created by student on 03.03.22.
//
#ifndef VERKEERSSIMULATIE_BAAN_H
#include <string>
#include <sstream>
#include <typeinfo>
#include "contract.h"
#include <vector>
#include "verkeerslicht.h"
#include "voertuiggenerator.h"
#include "bushalte.h"
#include "kruispunt.h"
#include "voertuig.h"
#define VERKEERSSIMULATIE_BAAN_H
using namespace std;

class Baan{
private:
    string naam;
    int lengte;
    Baan* _initCheck;
    vector<Voertuig*> voertuigen;
    vector<Verkeerslicht*> verkeerslichten;
    vector<Voertuiggenerator*> voertuiggenerators;
    vector<Bushalte*> bushaltes;
    vector<Kruispunt*> kruispunten;
public:
    bool properlyInitialized();
    Baan();
    //ENSURE(properlyInitialized(), "constructor must end in properlyInitialized state");

    string getNaam();
    //REQUIRE(this->properlyInitialized(),"Baan wasn't initialized when calling getNaam");

    int getLengte();
    //REQUIRE(this->properlyInitialized(),"Baan wasn't initialized when calling getLengte");

    void setNaam(string n);
    //REQUIRE(this->properlyInitialized(),"Baan wasn't initialized when calling setNaam");
    //REQUIRE(naam.size() > 0, "setNaam: Geen naam gegeven!");

    void setLengte(int l);
    //REQUIRE(this->properlyInitialized(),"Baan wasn't initialized when calling setLengte");
    //REQUIRE(lengte > 0, "setLengte: Lengte <= 0!");

    int getSizeVoertuigen();
    //REQUIRE(this->properlyInitialized(), "Baan wasn't initialized when calling getSizeVoertuigen");

    int getSizeVerkeerslichten();
    //REQUIRE(this->properlyInitialized(), "Baan wasn't initialized when calling getSizeVerkeerslichten");

    int getSizeKruispunten();
    //REQUIRE(this->properlyInitialized(), "Baan wasn't initialized when calling getSizeKruispunten");

    int getSizeGenerator();
    //REQUIRE(this->properlyInitialized(), "Baan wasn't initialized when calling getSizeGenerator");

    void addVerkeerslicht( Verkeerslicht* v);
    //REQUIRE(this->properlyInitialized(), "Baan wasn't initialized when calling addVerkeerslicht");
    //ENSURE(sizeNaDeAdd != sizeVoorDeAdd, "er werd geen baan toegevoegd");

    void addKruispunt( Kruispunt* k);
    //REQUIRE(this->properlyInitialized(), "Baan wasn't initialized when calling addKruispunt");
    //ENSURE(sizeNaDeAdd == size+1VoorDeAdd, "er werd geen kruispunt ge add in de vector kruispunten");

    void addBeginVoertuig(Voertuig* v);
    //REQUIRE(this->properlyInitialized(), "Baan wasn't initialized when calling addBeginVoertuig");
    //ENSURE(sizeNaDeAdd != sizeVoorDeAdd, "er werd geen baan toegevoegd");

    void addVoertuiggenerator(Voertuiggenerator* v);
    //REQUIRE(this->properlyInitialized(), "Baan wasn't initialized when calling addVoertuiggenerator");
    //ENSURE(sizeNaDeAdd != sizeVoorDeAdd, "er werd geen baan toegevoegd");

    void addVoertuigen( Voertuig* v);
    //REQUIRE(this->properlyInitialized(), "Baan wasn't initialized when calling addVoertuigen");
    //ENSURE(sizeNaDeAdd != sizeVoorDeAdd, "er werd geen baan toegevoegd");

    bool isOutOfBaan();
    //REQUIRE(this->properlyInitialized(), "Baan wasn't initialized when calling isOutOfBaan");
    //ENSURE(sizeNaDeAdd == size-1VoorDeAdd, "voertuigen werd niet verlaagd");

    void addBushalte(Bushalte* b);
    //REQUIRE(this->properlyInitialized(), "Baan wasn't initialized when calling addBushalte");
    //ENSURE(sizeNaDeAdd == size+1VoorDeAdd, "er werd geen bushalte ge add in de vector bushaltes");

    int getSizeBushaltes();
    //REQUIRE(this->properlyInitialized(), "Baan wasn't initialized when calling getSizeBushaltes");

    Baan* get_initCheck();
    //REQUIRE(this->properlyInitialized(), "Baan wasn't initialized when calling get_initCheck");

    void set_initCheck(Baan* i);
    //REQUIRE(this->properlyInitialized(), "Baan wasn't initialized when calling set_initCheck");

    vector<Voertuig*> getVoertuigen();
    //REQUIRE(this->properlyInitialized(), "Baan wasn't initialized when calling getVoertuigen");

    vector<Verkeerslicht*> getVerkeerslichten();
    //REQUIRE(this->properlyInitialized(), "Baan wasn't initialized when calling getVerkeerslichten");

    vector<Voertuiggenerator*> getVoertuiggenerators();
    //REQUIRE(this->properlyInitialized(), "Baan wasn't initialized when calling getVoertuiggenerators");

    vector<Bushalte*> getBushaltes();
    //REQUIRE(this->properlyInitialized(), "Baan wasn't initialized when calling getBushaltes");

    vector<Kruispunt*> getKruispunten();
    //REQUIRE(this->properlyInitialized(), "Baan wasn't initialized when calling getKruispunten");

    void addInIndexVoertuigen(int i, Voertuig* v);
    //REQUIRE(this->properlyInitialized(), "Baan wasn't initialized when calling addInIndexVoertuigen");
    //ENSURE(sizeNaDeAdd == size+1VoorDeAdd, "er werd geen kruispunt ge add in de vector kruispunten");

    void delVoertuig(int i);
    //REQUIRE(this->properlyInitialized(), "Baan wasn't initialized when calling delVoertuig");
    //ENSURE(sizeNaDeAdd == sizeVoorDeAdd-1, "er werd geen kruispunt ge add in de vector kruispunten");
};
#endif //VERKEERSSIMULATIE_VOERTUIG_H