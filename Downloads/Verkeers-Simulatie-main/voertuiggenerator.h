//
// Created by student on 03.03.22.
//

#ifndef VERKEERSSIMULATIE_VOERTUIGGENERATOR_H
#include <string>
#include "sstream"
#include "contract.h"
#include "vector"
#define VERKEERSSIMULATIE_VOERTUIGGENERATOR_H
using namespace std;
class Baan;

class Voertuiggenerator{
private:
    string baan;
    double frequentie;
    double tijd;
    double simulatietijd;
    Voertuiggenerator* _initCheck;
public:
    enum type{Brandweerwagen, Bus, Auto, Ziekenwagen, Politiecombi};
    type voertuigType;
    bool properlyInitialized();
    Voertuiggenerator();
    //ENSURE(properlyInitialized(), "constructor must end in properlyInitialized state");

    string getBaan();
    //REQUIRE(this->properlyInitialized(),"Voertuiggenerator wasn't initialized when calling getBaan");

    double getFrequentie();
    //REQUIRE(this->properlyInitialized(),"Voertuiggenerator wasn't initialized when calling getFrequentie");

    double getTijd();
    //REQUIRE(this->properlyInitialized(),"Voertuiggenerator wasn't initialized when calling getTijd");

    double getSimulatietijd();
    //REQUIRE(this->properlyInitialized(),"Voertuiggenerator wasn't initialized when calling getSimulatietijd");

    void setBaan(string b, vector<Baan*> v);
    //REQUIRE(this->properlyInitialized(),"Voertuiggenerator wasn't initialized when calling setBaan");
    //REQUIRE(baan.size() > 0, "setBaan: Geen naam gegeven!");
    //ENSURE(geldigeBaan == true, "de gegeven baan is geen geldige baan");

    void updateTijd();
    //REQUIRE(this->properlyInitialized(),"Voertuiggenerator wasn't initialized when calling updateTijd");
    //ENSURE(tijdNaDeUpdate != tijdVoorDeUpdate, "tijd is niet omhoog gegaan");

    bool addVoertuig();
    //REQUIRE(this->properlyInitialized(),"Voertuiggenerator wasn't initialized when calling addVoertuig");

    void setFrequentie(double f);
    //REQUIRE(this->properlyInitialized(),"Voertuiggenerator wasn't initialized when calling setFrequentie");
    //REQUIRE(frequentie > 0, "setFrequentie: frequentie moet positief zijn gegeven!");

    void resetTijd();
    //REQUIRE(this->properlyInitialized(),"Voertuiggenerator wasn't initialized when calling resetTijd");

    Voertuiggenerator* get_initCheck();
    //REQUIRE(this->properlyInitialized(), "Voertuiggenerator wasn't initialized when calling get_initCheck");

    void set_initCheck(Voertuiggenerator* i);
    //REQUIRE(this->properlyInitialized(), "Voertuiggenerator wasn't initialized when calling set_initCheck");
};
#endif //VERKEERSSIMULATIE_VOERTUIGGENERATOR_H
