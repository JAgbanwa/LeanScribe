//
// Created by elias on 27.04.22.
//
#include "bushalte.h"
#include "baan.h"
bool Bushalte::properlyInitialized() {
    return _initCheck == this;
}

Bushalte::Bushalte() {
    _initCheck = this;
    positie = 0;
    wachttijd = 0;
    simulatietijd = 0.0166;
    tijd = 0;
    ENSURE(properlyInitialized(), "constructor must end in properlyInitialized state");
}

double Bushalte::getPositie() {
    REQUIRE(this->properlyInitialized(),"Bushalte wasn't initialized when calling getPositie");
    return positie;
}

string Bushalte::getBaan() {
    REQUIRE(this->properlyInitialized(),"Bushalte wasn't initialized when calling getBaan");
    return baan;
}

int Bushalte::getWachttijd() {
    REQUIRE(this->properlyInitialized(),"Bushalte wasn't initialized when calling getWachttijd");
    return wachttijd;
}

void Bushalte::setPositie(double p, vector<Baan*> v) {
    REQUIRE(this->properlyInitialized(),"Bushalte wasn't initialized when calling setPositie");
    REQUIRE(p >= 0, "setPositie: De positie mag niet kleiner dan 0 zijn!");
    positie = p;
    int size = v.size();
    int lengte = 0;
    for (int i = 0; i < size; ++i) {
        if (baan == v[i]->getNaam()){
            lengte = v[i]->getLengte();
            break;
        }
    }
    ENSURE(positie <= lengte, "de positie is niet kleiner dan de lengte van de baan!");
}

void Bushalte::setWachttijd(int w) {
    REQUIRE(this->properlyInitialized(),"Bushalte wasn't initialized when calling setWachttijd");
    REQUIRE(w >= 0, "setWachttijd: De wachttijd mag niet kleiner dan 0 zijn!");
    wachttijd = w;
}

void Bushalte::setBaan(string b, vector<Baan*> v) {
    REQUIRE(this->properlyInitialized(),"Bushalte wasn't initialized when calling setBaan");
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

double Bushalte::getSimulatietijd() {
    REQUIRE(this->properlyInitialized(),"Bushalte wasn't initialized when calling getSimulatietijd");
    return simulatietijd;
}

void Bushalte::updateTijd() {
    REQUIRE(this->properlyInitialized(),"Bushalte wasn't initialized when calling updateTijd");
    double temp = tijd;
    tijd += simulatietijd;
    ENSURE(tijd != temp, "tijd is niet omhoog gegaan");
}

bool Bushalte::checkTijd() {
    REQUIRE(this->properlyInitialized(),"Bushalte wasn't initialized when calling checkTijd");
    if(tijd > wachttijd){
        return true;
    }
    else{
        return false;
    }
}

void Bushalte::resetTIjd() {
    REQUIRE(this->properlyInitialized(),"Bushalte wasn't initialized when calling resetTIjd");
    tijd = 0;
}

double Bushalte::getTIjd() {
    REQUIRE(this->properlyInitialized(),"Bushalte wasn't initialized when calling getTIjd");
    return tijd;
}

void Bushalte::setTijd(double t) {
    REQUIRE(this->properlyInitialized(),"Bushalte wasn't initialized when calling setTijd");
    tijd = t;
}

Bushalte *Bushalte::get_initCheck() {
    REQUIRE(this->properlyInitialized(),"Bushalte wasn't initialized when calling get_initCheck");
    return _initCheck;
}

void Bushalte::set_initCheck(Bushalte* i) {
    REQUIRE(this->properlyInitialized(),"Bushalte wasn't initialized when calling set_initCheck");
    _initCheck = i;
}