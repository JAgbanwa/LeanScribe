//
// Created by student on 03.03.22.
//
#ifndef VERKEERSSIMULATIE_VERKEERSLICHT_H
#include <string>
#include "contract.h"
#include "vector"
#define VERKEERSSIMULATIE_VERKEERSLICHT_H
using namespace std;
class Baan;

class Verkeerslicht{
private:
    string baan;
    double positie;
    int cyclus;
    string kleur;
    double tijdVerkeerslicht;
    double simulatietijd;
    double tijdOrangjeLimit;
    double tijdOrangje;
    int extra;
    Verkeerslicht* _initCheck;
public:
    bool properlyInitialized();
    Verkeerslicht();
    //ENSURE(properlyInitialized(), "constructor must end in properlyInitialized state");

    string getBaan();
    //REQUIRE(this->properlyInitialized(),"Verkeerslicht wasn't initialized when calling getBaan");

    double getPositie();
    //REQUIRE(this->properlyInitialized(),"Verkeerslicht wasn't initialized when calling getPositie");

    int getCyclus();
    //REQUIRE(this->properlyInitialized(),"Verkeerslicht wasn't initialized when calling getCyclus");

    double getSimulatietijd();
    //REQUIRE(this->properlyInitialized(),"Verkeerslicht wasn't initialized when calling getSimulatietijd");

    void setBaan(string b, vector<Baan*> v);
    //REQUIRE(this->properlyInitialized(),"Verkeerslicht wasn't initialized when calling setBaan");
    //REQUIRE(baan.size() > 0, "setBaan: De string is leeg!");
    //ENSURE(geldigeNaam == true, "de gegeven baan is geen geldige baan");

    string getKleur();
    //REQUIRE(this->properlyInitialized(),"Verkeerslicht wasn't initialized when calling getKleur");

    void setPositie(double p,vector<Baan*> v);
    //REQUIRE(this->properlyInitialized(),"Verkeerslicht wasn't initialized when calling setPositie");
    //REQUIRE(positie >= 0, "setPositie: De positie mag niet kleiner dan 0 zijn!");
    //ENSURE(geldigePositie == false, "de positie mag niet in de vertraagafstand van een andere verkeerslicht bevinden!");
    //ENSURE(positie < lengte, "de positie is niet kleiner dan de lengte van de baan!");

    void setCyclus(int c);
    //REQUIRE(this->properlyInitialized(),"Verkeerslicht wasn't initialized when calling setCyclus");
    //REQUIRE(cyclus >= 0, "setCyclus: De cyclus mag niet kleiner dan 0 zijn!");

    double getTijd();
    //REQUIRE(this->properlyInitialized(),"Verkeerslicht wasn't initialized when calling getTijd");

    void updateTijd();
    //REQUIRE(this->properlyInitialized(),"Verkeerslicht wasn't initialized when calling updateTijd");
    //ENSURE(tijdVerkeerslichtNaDeUpdate != tijdVerkeerslichtVoorDeUpdate, "tijdVerkeerslicht is niet omhoog gegaan");

    void checkKleur();
    //REQUIRE(this->properlyInitialized(),"Verkeerslicht wasn't initialized when calling checkKleur");
    //ENSURE(kleur == "groen" or kleur == "rood" or kleur == "orangje", "kleur is niet rood of groen of orangje");

    double getTijdOrangjeLimit();
    //REQUIRE(this->properlyInitialized(),"Verkeerslicht wasn't initialized when calling getTijdOrangje");

    void berekenTijdOrangje();
    //REQUIRE(this->properlyInitialized(),"Verkeerslicht wasn't initialized when calling berekenTijdOrangje");
    //ENSURE(tijdOrangjeLimit < cyclus, "tijdorangjeLimit kan niet klijner dan de cyclus zijn");

    void updateTijdOrangje();
    //REQUIRE(this->properlyInitialized(),"Verkeerslicht wasn't initialized when calling updateTijdOrangje");
    //ENSURE(tijdOrangjeNaDeUpdate != tijdOranjeVoorDeUpdate, "tijdVerkeerslicht is niet omhoog gegaan");

    double getTijdOrangje();
    //REQUIRE(this->properlyInitialized(),"Verkeerslicht wasn't initialized when calling getTijdOrangje");

    void setExtra(int e);
    //REQUIRE(this->properlyInitialized(),"Verkeerslicht wasn't initialized when calling setExtra");
    //REQUIRE(extra >= 0, "setExtra: De argument mag niet kleiner dan 0 zijn!");

    int getExtra();
    //REQUIRE(this->properlyInitialized(),"Verkeerslicht wasn't initialized when calling getExtra");

    Verkeerslicht* get_initCheck();
    //REQUIRE(this->properlyInitialized(), "Verkeerslicht wasn't initialized when calling get_initCheck");

    void set_initCheck(Verkeerslicht* i);
    //REQUIRE(this->properlyInitialized(), "Verkeerslicht wasn't initialized when calling set_initCheck");
};
#endif //VERKEERSSIMULATIE_VERKEERSLICHT_H
