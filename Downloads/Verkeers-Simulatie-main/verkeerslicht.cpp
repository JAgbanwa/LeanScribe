//
// Created by elias on 10/04/2022.
//
#include "verkeerslicht.h"
#include "baan.h"

bool Verkeerslicht::properlyInitialized() {
    return _initCheck == this;
}
Verkeerslicht::Verkeerslicht() {
    _initCheck = this;
    kleur = "groen";
    simulatietijd = 0.0166;
    positie = 0;
    cyclus = 0;
    tijdVerkeerslicht = 0;
    tijdOrangje = 0;
    tijdOrangjeLimit = 0;
    extra = 0;
    ENSURE(properlyInitialized(), "constructor must end in properlyInitialized state");
}

string Verkeerslicht::getBaan() {
    REQUIRE(this->properlyInitialized(),"Verkeerslicht wasn't initialized when calling getBaan");
    return baan;
}

double Verkeerslicht::getPositie() {
    REQUIRE(this->properlyInitialized(),"Verkeerslicht wasn't initialized when calling getPositie");
    return positie;
}

int Verkeerslicht::getCyclus() {
    REQUIRE(this->properlyInitialized(),"Verkeerslicht wasn't initialized when calling getCyclus");
    return cyclus;
}

void Verkeerslicht::setBaan(string b, vector<Baan*> v) {
    REQUIRE(this->properlyInitialized(),"Verkeerslicht wasn't initialized when calling setBaan");
    REQUIRE(b.size() > 0, "setBaan: De string is leeg!");
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

string Verkeerslicht::getKleur() {
    REQUIRE(this->properlyInitialized(),"Verkeerslicht wasn't initialized when calling getKleur");
    return kleur;
}

void Verkeerslicht::setPositie(double p, vector<Baan*> v) {
    REQUIRE(this->properlyInitialized(),"Verkeerslicht wasn't initialized when calling setPositie");
    REQUIRE(p >= 0, "setPositie: De positie mag niet kleiner dan 0 zijn!");
    positie = p;
    int size = v.size();
    int lengte = 0;
    bool test = false;
    for (int i = 0; i < size; ++i) {
        if (baan == v[i]->getNaam()){
            lengte = v[i]->getLengte();
            int size2 = v[i]->getSizeVerkeerslichten();
            double voor = p - 50;
            double na = p + 50;
            for (int j = 0; j < size2; ++j) {
                if (v[i]->getVerkeerslichten()[j]->getPositie() > voor and v[i]->getVerkeerslichten()[j]->getPositie() < na){
                    if (v[i]->getNaam() != baan) {
                        test = true;
                        break;
                    }
                }
            }
            break;
        }
    }
    ENSURE(test == false, "de positie mag niet in de vertraagafstand van een andere verkeerslicht bevinden!");
    ENSURE(positie < lengte, "de positie is niet kleiner dan de lengte van de baan!");
}

void Verkeerslicht::setCyclus(int c) {
    REQUIRE(this->properlyInitialized(),"Verkeerslicht wasn't initialized when calling setCyclus");
    REQUIRE(c >= 0, "setCyclus: De cyclus mag niet kleiner dan 0 zijn!");
    cyclus = c;
}

double Verkeerslicht::getTijd() {
    REQUIRE(this->properlyInitialized(),"Verkeerslicht wasn't initialized when calling getTijd");
    return tijdVerkeerslicht;
}

void Verkeerslicht::updateTijd() {
    REQUIRE(this->properlyInitialized(),"Verkeerslicht wasn't initialized when calling updateTijd");
    double temp = tijdVerkeerslicht;
    tijdVerkeerslicht += simulatietijd;
    ENSURE(tijdVerkeerslicht != temp, "tijdVerkeerslicht is niet omhoog gegaan");
}

void Verkeerslicht::checkKleur() {
    REQUIRE(this->properlyInitialized(),"Verkeerslicht wasn't initialized when calling checkKleur");
    if (tijdVerkeerslicht > cyclus){
        if (kleur == "groen") {
            kleur = "orangje";
        }
        else if(kleur == "orangje"){
            if (tijdOrangje > tijdOrangjeLimit){
                kleur = "rood";
                tijdOrangje = 0;
                tijdVerkeerslicht = 0;
                extra = 0;
            }
        }
        else {
            kleur = "groen";
            tijdVerkeerslicht = 0;
        }
    }
    ENSURE(kleur == "groen" or kleur == "rood" or kleur == "orangje", "kleur is niet rood of groen of orangje");
}

double Verkeerslicht::getSimulatietijd() {
    REQUIRE(this->properlyInitialized(),"Verkeerslicht wasn't initialized when calling getSimulatietijd");
    return simulatietijd;
}

double Verkeerslicht::getTijdOrangjeLimit() {
    REQUIRE(this->properlyInitialized(),"Verkeerslicht wasn't initialized when calling getTijdOrangje");
    return tijdOrangjeLimit;
}

void Verkeerslicht::berekenTijdOrangje() {
    REQUIRE(this->properlyInitialized(),"Verkeerslicht wasn't initialized when calling berekenTijdOrangje");
    tijdOrangjeLimit = 0.1 * cyclus;
    ENSURE(tijdOrangjeLimit < cyclus, "tijdorangjeLimit kan niet klijner dan de cyclus zijn");
}

void Verkeerslicht::updateTijdOrangje() {
    REQUIRE(this->properlyInitialized(),"Verkeerslicht wasn't initialized when calling updateTijdOrangje");
    double temp = tijdOrangje;
    tijdOrangje += simulatietijd;
    ENSURE(tijdOrangje != temp, "tijdVerkeerslicht is niet omhoog gegaan");
}

double Verkeerslicht::getTijdOrangje() {
    REQUIRE(this->properlyInitialized(),"Verkeerslicht wasn't initialized when calling getTijdOrangje");
    return tijdOrangje;
}

void Verkeerslicht::setExtra(int e) {
    REQUIRE(this->properlyInitialized(),"Verkeerslicht wasn't initialized when calling setExtra");
    extra = e;
    REQUIRE(e >= 0, "setExtra: De argument mag niet kleiner dan 0 zijn!");
}

int Verkeerslicht::getExtra() {
    REQUIRE(this->properlyInitialized(),"Verkeerslicht wasn't initialized when calling getExtra");
    return extra;
}

Verkeerslicht *Verkeerslicht::get_initCheck() {
    REQUIRE(this->properlyInitialized(), "Verkeerslicht wasn't initialized when calling get_initCheck");
    return _initCheck;
}

void Verkeerslicht::set_initCheck(Verkeerslicht* i) {
    REQUIRE(this->properlyInitialized(), "Verkeerslicht wasn't initialized when calling set_initCheck");
    _initCheck = i;
}