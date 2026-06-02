//
// Created by elias on 27.04.22.
//

#ifndef VERKEERSSIMULATIE_BUSHALTE_H
#include <string>
#include "contract.h"
#include "vector"
#define VERKEERSSIMULATIE_BUSHALTE_H
using namespace std;
class Baan;

class Bushalte{
private:
    string baan;
    double positie;
    int wachttijd;
    double simulatietijd;
    double tijd;
    Bushalte* _initCheck;
public:
    bool properlyInitialized();
    Bushalte();
    //ENSURE(properlyInitialized(), "constructor must end in properlyInitialized state");

    string getBaan();
    //REQUIRE(this->properlyInitialized(),"Bushalte wasn't initialized when calling getBaan");

    double getPositie();
    //REQUIRE(this->properlyInitialized(),"Bushalte wasn't initialized when calling getPositie");

    int getWachttijd();
    //REQUIRE(this->properlyInitialized(),"Bushalte wasn't initialized when calling getWachttijd");

    void setPositie(double p, vector<Baan*> v);
    //REQUIRE(this->properlyInitialized(),"Bushalte wasn't initialized when calling setPositie");
    //REQUIRE(positie >= 0, "setPositie: De positie mag niet kleiner dan 0 zijn!");
    //ENSURE(positie < lengte, "de positie is niet kleiner dan de lengte van de baan!");

    void setWachttijd(int w);
    //REQUIRE(this->properlyInitialized(),"Bushalte wasn't initialized when calling setWachttijd");
    //REQUIRE(wachttijd >= 0, "setWachttijd: De wachttijd mag niet kleiner dan 0 zijn!");

    void setBaan(string b, vector<Baan*> v);
    //REQUIRE(this->properlyInitialized(),"Bushalte wasn't initialized when calling setBaan");
    //REQUIRE(baan.size() > 0, "setBaan: De string is leeg!");
    //ENSURE(geldigeNaam == true, "de gegeven baan is geen geldige baan");

    double getSimulatietijd();
    //REQUIRE(this->properlyInitialized(),"Bushalte wasn't initialized when calling getSimulatietijd");

    void updateTijd();
    //REQUIRE(this->properlyInitialized(),"Bushalte wasn't initialized when calling updateTijd");
    //ENSURE(tijdNaDeUpdate != tijdVoorDeUpdate, "tijd is niet omhoog gegaan");

    bool checkTijd();
    //REQUIRE(this->properlyInitialized(),"Bushalte wasn't initialized when calling checkTijd");

    void resetTIjd();
    //REQUIRE(this->properlyInitialized(),"Bushalte wasn't initialized when calling resetTIjd");

    double getTIjd();
    //REQUIRE(this->properlyInitialized(),"Bushalte wasn't initialized when calling getTIjd");

    void setTijd(double t);
    //REQUIRE(this->properlyInitialized(),"Bushalte wasn't initialized when calling setTijd");

    Bushalte* get_initCheck();
    // REQUIRE(this->properlyInitialized(),"Bushalte wasn't initialized when calling get_initCheck");

    void set_initCheck(Bushalte* i);
    //REQUIRE(this->properlyInitialized(),"Bushalte wasn't initialized when calling set_initCheck");
};

#endif //VERKEERSSIMULATIE_BUSHALTE_H
