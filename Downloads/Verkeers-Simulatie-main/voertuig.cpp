//
// Created by elias on 10/04/2022.
//
#include "voertuig.h"
#include "baan.h"


bool Voertuig::properlyInitialized() {
    return _initCheck == this;
}
Voertuig::Voertuig() {
    _initCheck = this;
    simulatietijd = 0.0166;
    positie = 0;
    snelheid = 0;
    versnelling = 0;
    l = 0;
    Vmax = 0;
    vmax = 0;
    bmax = 0;
    amax = 0;
    laatste = false;
    s = 0.4;
    ENSURE(properlyInitialized(), "constructor must end in properlyInitialized state");
}

string Voertuig::getBaan() {
    REQUIRE(this->properlyInitialized(),"Voertuig wasn't initialized when calling getBaan");
    return baan;
}

double Voertuig::getPositie() {
    REQUIRE(this->properlyInitialized(),"Voertuig wasn't initialized when calling getPositie");
    return positie;
}

double Voertuig::getSnelheid() {
    REQUIRE(this->properlyInitialized(),"Voertuig wasn't initialized when calling getSnelheid");
    return snelheid;
}

double Voertuig::getVersnelling() {
    REQUIRE(this->properlyInitialized(),"Voertuig wasn't initialized when calling getVersnelling");
    return versnelling;
}

void Voertuig::setBaan(string b, vector<Baan*> v) {
    REQUIRE(this->properlyInitialized(),"Voertuig wasn't initialized when calling setBaan");
    REQUIRE(b.size() > 0, "setBaan: de string baan is leeg");
    baan = b;
    bool temp = false;
    int size = v.size();
    for (int i = 0; i < size; ++i) {
        if (baan == v[i]->getNaam()) {
            temp = true;
            break;
        }
    }
    ENSURE(temp == true, "de gegeven baan is geen geldige baan");
}

void Voertuig::setPositie(double p, vector<Baan*> v) {
    REQUIRE(this->properlyInitialized(),"Voertuig wasn't initialized when calling setPositie");
    REQUIRE(p >= 0, "setPositie: Positie kan niet negatief zijn!");
    positie = p;
    int size = v.size();
    int lengte = 0;
    for (int i = 0; i < size; ++i) {
        if (baan == v[i]->getNaam()){
            lengte = v[i]->getLengte();
            break;
        }
    }
    ENSURE(positie < lengte, "de positie is niet kleiner dan de lengte van de baan!");
}

void Voertuig::setSnelheid(double a) {
    REQUIRE(this->properlyInitialized(),"Voertuig wasn't initialized when calling setSnelheid");
    REQUIRE(a >= 0, "setSnelheid: Snelheid kan niet negatief zijn!");
    snelheid = a;
}

void Voertuig::setLaatste() {
    REQUIRE(this->properlyInitialized(),"Voertuig wasn't initialized when calling setLaatste");
    laatste = true;
}

void Voertuig::updateVoertuig() {
    REQUIRE(this->properlyInitialized(),"Voertuig wasn't initialized when calling updateVoertuig");
    double tempPositie = positie;
    double tempSnelheid = snelheid;
    if (snelheid + (versnelling * simulatietijd) < 0){
        positie = positie - (pow(snelheid,2) / (2 * versnelling));
        snelheid = 0;
        ENSURE((positie != tempPositie and tempSnelheid != 0) or (snelheid == 0 and positie == tempPositie), "updateVoertuig: Positie is niet geupdate!");
        ENSURE(positie >= 0, "positie is negatief");
        ENSURE(snelheid >= 0, "snelheid is negatief");
    }
    else{
        snelheid = snelheid + (versnelling * simulatietijd);
        positie = positie + (snelheid * simulatietijd) + versnelling* (pow(simulatietijd,2)/2);
        ENSURE(snelheid >= 0, "snelheid is negatief");
        ENSURE(positie >= 0, "positie is negatief");
    }
}

void Voertuig::updateVersnelling(double nextX, double nextV) {
    REQUIRE(this->properlyInitialized(),"Voertuig wasn't initialized when calling updateVersnelling");
    REQUIRE(nextX > positie, "updateVersnelling: De positie van de volgende voertuig is kleiner!");
    REQUIRE(nextV >= 0, "updateVersnelling: De snelheid van de volgende voertuig is ongeldig!");
    double deltaX;
    double deltaV;
    double delta;


    if (!laatste){
        deltaX = nextX - positie - l;
        deltaV = snelheid - nextV;
        delta = (4 + max(0.0, snelheid + ((snelheid * deltaV) /(2 * sqrt(amax * bmax))))) / deltaX;
    }
    else{
        delta = 0;

    }
    versnelling = amax * (1 - pow(snelheid / vmax, 4) - pow(delta,2));
}

void Voertuig::vertragen() {
    REQUIRE(this->properlyInitialized(),"Voertuig wasn't initialized when calling vertragen");
    vmax = s * Vmax;
    ENSURE(vmax >= 0, "vmax kan niet negatief zijn");
}

void Voertuig::versnellen() {
    REQUIRE(this->properlyInitialized(),"Voertuig wasn't initialized when calling versnellen");
    vmax = Vmax;
}

void Voertuig::stoppen() {
    REQUIRE(this->properlyInitialized(),"Voertuig wasn't initialized when calling stoppen");
    versnelling = -((bmax * snelheid) / vmax);
    ENSURE(versnelling < 0, "versnelling is niet kleiner dan 0");
}
double Voertuig::getAutoLengte() {
    REQUIRE(this->properlyInitialized(),"Simulatie wasn't initialized when calling getAutoLengte");
    return l;
}
double Voertuig::getSimulatieTijd() {
    REQUIRE(this->properlyInitialized(),"Simulatie wasn't initialized when calling getSimulatieTijd");
    return simulatietijd;
}

bool Voertuig::getLaatste() {
    REQUIRE(this->properlyInitialized(),"Simulatie wasn't initialized when calling getLaatste");
    return laatste;
}

double Voertuig::getVmax() {
    REQUIRE(this->properlyInitialized(),"Simulatie wasn't initialized when calling getVmax");
    return Vmax;
}

double Voertuig::getvmax() {
    REQUIRE(this->properlyInitialized(),"Simulatie wasn't initialized when calling getvmax");
    return vmax;
}

double Voertuig::getS() {
    REQUIRE(this->properlyInitialized(),"Simulatie wasn't initialized when calling getS");
    return s;
}

double Voertuig::getBmax() {
    REQUIRE(this->properlyInitialized(),"Simulatie wasn't initialized when calling getBmax");
    return bmax;
}

double Voertuig::getAmax() {
    REQUIRE(this->properlyInitialized(),"Simulatie wasn't initialized when calling getAmax");
    return amax;
}
void Voertuig::setType() {
    REQUIRE(this->properlyInitialized(),"Simulatie wasn't initialized when calling setType");
    if (voertuigType == Auto){
        l = 4;
        Vmax = 16.6;
        vmax = 16.6;
        snelheid = 16.6;
        amax = 1.44;
        bmax = 4.61;
    }
    else if(voertuigType == Bus){
        l = 12;
        Vmax = 11.4;
        vmax = 11.4;
        snelheid = 11.4;
        amax = 1.22;
        bmax = 4.29;
    }
    else if(voertuigType == Brandweerwagen){
        l = 10;
        Vmax = 14.6;
        vmax = 14.6;
        snelheid = 14.6;
        amax = 1.33;
        bmax = 4.56;
    }
    else if(voertuigType == Ziekenwagen){
        l = 8;
        Vmax = 15.5;
        vmax = 15.5;
        snelheid = 15.5;
        amax = 1.44;
        bmax = 4.47;
    }
    else if(voertuigType == Politiecombi){
        l = 6;
        Vmax = 17.2;
        vmax = 17.2;
        snelheid = 17.2;
        amax = 1.55;
        bmax = 4.92;
    }

}
Voertuig *Voertuig::get_initCheck() {
    REQUIRE(this->properlyInitialized(), "Voertuig wasn't initialized when calling get_initCheck");
    return _initCheck;
}

void Voertuig::set_initCheck(Voertuig* i) {
    REQUIRE(this->properlyInitialized(), "Voertuig wasn't initialized when calling set_initCheck");
    _initCheck = i;
}

void Voertuig::setNotLaatste() {
    REQUIRE(this->properlyInitialized(), "Voertuig wasn't initialized when calling set_initCheck");
    laatste = false;
}

