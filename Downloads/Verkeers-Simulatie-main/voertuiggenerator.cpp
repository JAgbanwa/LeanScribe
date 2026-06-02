//
// Created by elias on 10/04/2022.
//
#include "voertuiggenerator.h"
#include "baan.h"

bool Voertuiggenerator::properlyInitialized() {
    return _initCheck == this;
}
Voertuiggenerator::Voertuiggenerator() {
    _initCheck = this;
    simulatietijd = 0.0166;
    frequentie = 0;
    tijd = 0;
    ENSURE(properlyInitialized(), "constructor must end in properlyInitialized state");
}

string Voertuiggenerator::getBaan() {
    REQUIRE(this->properlyInitialized(),"Voertuiggenerator wasn't initialized when calling getBaan");
    return baan;
}

double Voertuiggenerator::getFrequentie() {
    REQUIRE(this->properlyInitialized(),"Voertuiggenerator wasn't initialized when calling getFrequentie");
    return frequentie;
}

void Voertuiggenerator::setBaan(string b, vector<Baan*> v) {
    REQUIRE(this->properlyInitialized(),"Voertuiggenerator wasn't initialized when calling setBaan");
    REQUIRE(b.size() > 0, "setBaan: Geen naam gegeven!");
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

void Voertuiggenerator::updateTijd() {
    REQUIRE(this->properlyInitialized(),"Voertuiggenerator wasn't initialized when calling updateTijd");
    double temp = tijd;
    tijd += simulatietijd;
    ENSURE(tijd != temp, "tijd is niet omhoog gegaan");
}

bool Voertuiggenerator::addVoertuig() {
    REQUIRE(this->properlyInitialized(),"Voertuiggenerator wasn't initialized when calling addVoertuig");
    if (tijd > frequentie){
        return true;
    }
    else{
        return false;
    }
}

void Voertuiggenerator::setFrequentie(double f) {
    REQUIRE(this->properlyInitialized(),"Voertuiggenerator wasn't initialized when calling setFrequentie");
    REQUIRE(f > 0, "setFrequentie: frequentie moet positief zijn gegeven!");
    frequentie = f;
}

double Voertuiggenerator::getTijd() {
    REQUIRE(this->properlyInitialized(),"Voertuiggenerator wasn't initialized when calling getTijd");
    return tijd;
}

double Voertuiggenerator::getSimulatietijd() {
    REQUIRE(this->properlyInitialized(),"Voertuiggenerator wasn't initialized when calling getSimulatietijd");
    return simulatietijd;
}

void Voertuiggenerator::resetTijd() {
    REQUIRE(this->properlyInitialized(),"Voertuiggenerator wasn't initialized when calling resetTijd");
    tijd = 0;
}

Voertuiggenerator *Voertuiggenerator::get_initCheck() {
    REQUIRE(this->properlyInitialized(), "Voertuiggenerator wasn't initialized when calling get_initCheck");
    return _initCheck;
}

void Voertuiggenerator::set_initCheck(Voertuiggenerator* i) {
    REQUIRE(this->properlyInitialized(), "Voertuiggenerator wasn't initialized when calling set_initCheck");
    _initCheck = i;
}
