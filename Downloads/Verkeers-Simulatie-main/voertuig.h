//
// Created by student on 03.03.22.
//

#ifndef VERKEERSSIMULATIE_VOERTUIG_H
#include <string>
#include <utility>
#include "cmath"
#include "contract.h"
#include "vector"
#define VERKEERSSIMULATIE_VOERTUIG_H

class Baan;

using namespace std;

class Voertuig{
private:
    string baan;
    double positie;
    double snelheid;
    double versnelling;
    double l;
    double simulatietijd;
    bool laatste;
    double Vmax;
    double vmax;
    double s;
    double bmax;
    double amax;
    Voertuig* _initCheck;
public:
    enum type{Brandweerwagen, Bus, Auto, Ziekenwagen, Politiecombi};
    type voertuigType;
    bool properlyInitialized();
    Voertuig();
    //ENSURE(properlyInitialized(), "constructor must end in properlyInitialized state");

    string getBaan();
    //REQUIRE(this->properlyInitialized(),"Voertuig wasn't initialized when calling getBaan");

    double getPositie();
    //REQUIRE(this->properlyInitialized(),"Voertuig wasn't initialized when calling getPositie");

    double getSnelheid();
    //REQUIRE(this->properlyInitialized(),"Voertuig wasn't initialized when calling getSnelheid");

    double getVersnelling();
    //REQUIRE(this->properlyInitialized(),"Voertuig wasn't initialized when calling getVersnelling");

    bool getLaatste();
    //REQUIRE(this->properlyInitialized(),"Simulatie wasn't initialized when calling getLaatste");

    double getAutoLengte();
    //REQUIRE(this->properlyInitialized(),"Simulatie wasn't initialized when calling getAutoLengte");

    double getSimulatieTijd();
    //REQUIRE(this->properlyInitialized(),"Simulatie wasn't initialized when calling getSimulatieTijd");

    double getVmax();
    //REQUIRE(this->properlyInitialized(),"Simulatie wasn't initialized when calling getVmax");

    double getvmax();
    //REQUIRE(this->properlyInitialized(),"Simulatie wasn't initialized when calling getvmax");

    double getS();
    //REQUIRE(this->properlyInitialized(),"Simulatie wasn't initialized when calling getS");

    double getBmax();
    //REQUIRE(this->properlyInitialized(),"Simulatie wasn't initialized when calling getBmax");

    double getAmax();
    //REQUIRE(this->properlyInitialized(),"Simulatie wasn't initialized when calling getAmax");

    void setBaan(string b, vector<Baan*> v);
    //REQUIRE(this->properlyInitialized(),"Voertuig wasn't initialized when calling setBaan");
    //REQUIRE(baan.size() > 0, "setBaan: de string baan is leeg");
    //ENSURE(geldigeBaan == true, "de gegeven baan is geen geldige baan");

    void setPositie(double p, vector<Baan*> v);
    //REQUIRE(this->properlyInitialized(),"Voertuig wasn't initialized when calling setPositie");
    //REQUIRE(positie >= 0, "setPositie: Positie kan niet negatief zijn!");
    //ENSURE(positie < lengte, "de positie is niet kleiner dan de lengte van de baan!");

    void setSnelheid(double a);
    //REQUIRE(this->properlyInitialized(),"Voertuig wasn't initialized when calling setSnelheid");
    //REQUIRE(snelheid >= 0, "setSnelheid: Snelheid kan niet negatief zijn!");

    void setLaatste();
    //REQUIRE(this->properlyInitialized(),"Voertuig wasn't initialized when calling setLaatste");

    void updateVoertuig();
    //REQUIRE(this->properlyInitialized(),"Voertuig wasn't initialized when calling updateVoertuig");
    //ENSURE((positieNaDeUpdate != positieVoorDeUpdate and snelheidVoorDeUpdate != 0) or (snelheidNaDeUpdate == 0 and positieNaDeUpdate == positieVoorDeUpdate), "updateVoertuig: Positie is niet geupdate!");
    //ENSURE(positie >= 0, "positie is negatief");
    //ENSURE(snelheid >= 0, "snelheid is negatief");
    //ENSURE(snelheid >= 0, "snelheid is negatief");
    //ENSURE(positie >= 0, "positie is negatief");

    void updateVersnelling(double nextX, double nextV);
    //REQUIRE(this->properlyInitialized(),"Voertuig wasn't initialized when calling updateVersnelling");
    //REQUIRE(nextX > positie, "updateVersnelling: De positie van de volgende voertuig is ongeldig!");
    //REQUIRE(nextV >= 0, "updateVersnelling: De snelheid van de volgende voertuig is ongeldig!");

    void vertragen();
    //REQUIRE(this->properlyInitialized(),"Voertuig wasn't initialized when calling vertragen");
    //ENSURE(vmax >= 0, "vmax kan niet negatief zijn");

    void versnellen();
    //REQUIRE(this->properlyInitialized(),"Voertuig wasn't initialized when calling versnellen");

    void stoppen();
    //REQUIRE(this->properlyInitialized(),"Voertuig wasn't initialized when calling stoppen");
    //ENSURE(versnelling < 0, "versnelling is niet kleiner dan 0");

    void setType();
    //REQUIRE(this->properlyInitialized(),"Simulatie wasn't initialized when calling setType");

    Voertuig* get_initCheck();
    //REQUIRE(this->properlyInitialized(), "Voertuig wasn't initialized when calling get_initCheck");

    void set_initCheck(Voertuig* i);
    //REQUIRE(this->properlyInitialized(), "Voertuig wasn't initialized when calling set_initCheck");

    void setNotLaatste();
    //REQUIRE(this->properlyInitialized(), "Voertuig wasn't initialized when calling set_initCheck");
};
#endif //VERKEERSSIMULATIE_VOERTUIG_H
