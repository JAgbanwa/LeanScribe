//
// Created by elias on 10/04/2022.
//
#include "baan.h"
#include "algorithm"
bool Baan::properlyInitialized() {
    return _initCheck == this;
}
Baan::Baan() {
    _initCheck = this;
    lengte = 0;
    ENSURE(properlyInitialized(), "constructor must end in properlyInitialized state");}

string Baan::getNaam() {
    REQUIRE(this->properlyInitialized(),"Baan wasn't initialized when calling getNaam");
    return naam;
}

int Baan::getLengte() {
    REQUIRE(this->properlyInitialized(),"Baan wasn't initialized when calling getLengte");
    return lengte;
}

void Baan::setNaam(string n) {
    REQUIRE(this->properlyInitialized(),"Baan wasn't initialized when calling setNaam");
    REQUIRE(n.size() > 0, "setNaam: Geen naam gegeven!");
    naam = n;
}

void Baan::setLengte(int l) {
    REQUIRE(this->properlyInitialized(),"Baan wasn't initialized when calling setLengte");
    REQUIRE(l > 0, "setLengte: Lengte <= 0!");
    lengte = l;
}
int Baan::getSizeVoertuigen() {
    REQUIRE(this->properlyInitialized(), "Baan wasn't initialized when calling getSizeVoertuigen");
    return voertuigen.size();
}

int Baan::getSizeVerkeerslichten() {
    REQUIRE(this->properlyInitialized(), "Baan wasn't initialized when calling getSizeVerkeerslichten");
    return verkeerslichten.size();
}

int Baan::getSizeGenerator() {
    REQUIRE(this->properlyInitialized(), "Baan wasn't initialized when calling getSizeGenerator");
    return voertuiggenerators.size();
}

void Baan::addVerkeerslicht(Verkeerslicht* v) {
    REQUIRE(this->properlyInitialized(), "Baan wasn't initialized when calling addVerkeerslicht");
    int temp = verkeerslichten.size();
    verkeerslichten.push_back(v);
    int size = verkeerslichten.size();
    ENSURE(size != temp, "er werd geen baan toegevoegd");
}

void Baan::addBeginVoertuig(Voertuig* v) {
    REQUIRE(this->properlyInitialized(), "Baan wasn't initialized when calling addBeginVoertuig");
    int temp = voertuigen.size();
    voertuigen.insert(voertuigen.begin(), v);
    int size = voertuigen.size();
    ENSURE(size != temp, "er werd geen baan toegevoegd");

}

void Baan::addVoertuiggenerator(Voertuiggenerator* v) {
    REQUIRE(this->properlyInitialized(), "Baan wasn't initialized when calling addVoertuiggenerator");
    int temp = voertuiggenerators.size();
    voertuiggenerators.push_back(v);
    int size = voertuiggenerators.size();
    ENSURE(size != temp, "er werd geen baan toegevoegd");
}

void Baan::addVoertuigen(Voertuig* v) {
    REQUIRE(this->properlyInitialized(), "Baan wasn't initialized when calling addVoertuigen");
    int temp = voertuigen.size();
    if (voertuigen.empty())
        voertuigen.push_back(v);
    else{
        int size2 = voertuigen.size();
        bool test = false;
        for (int i = 0; i < size2; ++i) {
            if (v->getPositie() < voertuigen[i]->getPositie()) {
                test = true;
                voertuigen.insert(voertuigen.begin() + i, v);
                break;
            }
        }
        if (!test){
            voertuigen.push_back(v);
        }
    }
    int size = voertuigen.size();
    ENSURE(size != temp, "er werd geen baan toegevoegd");
}

bool Baan::isOutOfBaan() {
    REQUIRE(this->properlyInitialized(), "Baan wasn't initialized when calling isOutOfBaan");
    if (voertuigen[voertuigen.size() - 1]->getPositie() > lengte){
        int temp = voertuigen.size() - 1;
        voertuigen.pop_back();
        int size = voertuigen.size();
        ENSURE(size == temp, "voertuigen werd niet verlaagd");
        return true;
    }
    else
        return false;
}
void Baan::addBushalte(Bushalte* b){
    REQUIRE(this->properlyInitialized(), "Baan wasn't initialized when calling addBushalte");
    int temp = bushaltes.size() + 1;
    bushaltes.push_back(b);
    int size = bushaltes.size();
    ENSURE(size == temp, "er werd geen bushalte ge add in de vector bushaltes");
}

int Baan::getSizeBushaltes(){
    REQUIRE(this->properlyInitialized(), "Baan wasn't initialized when calling getSizeBushaltes");
    return bushaltes.size();
}

Baan *Baan::get_initCheck() {
    REQUIRE(this->properlyInitialized(), "Baan wasn't initialized when calling get_initCheck");
    return _initCheck;
}

void Baan::set_initCheck(Baan* i) {
    REQUIRE(this->properlyInitialized(), "Baan wasn't initialized when calling set_initCheck");
    _initCheck = i;
}

int Baan::getSizeKruispunten() {
    REQUIRE(this->properlyInitialized(), "Baan wasn't initialized when calling getSizeKruispunten");
    return kruispunten.size();
}

void Baan::addKruispunt(Kruispunt *k) {
    REQUIRE(this->properlyInitialized(), "Baan wasn't initialized when calling addKruispunt");
    int temp = kruispunten.size() + 1;
    kruispunten.push_back(k);
    int size = kruispunten.size();
    ENSURE(size == temp, "er werd geen kruispunt ge add in de vector kruispunten");
}

vector<Voertuig *> Baan::getVoertuigen() {
    REQUIRE(this->properlyInitialized(), "Baan wasn't initialized when calling getVoertuigen");
    return voertuigen;
}

vector<Verkeerslicht *> Baan::getVerkeerslichten() {
    REQUIRE(this->properlyInitialized(), "Baan wasn't initialized when calling getVerkeerslichten");
    return verkeerslichten;
}

vector<Voertuiggenerator *> Baan::getVoertuiggenerators() {
    REQUIRE(this->properlyInitialized(), "Baan wasn't initialized when calling getVoertuiggenerators");
    return voertuiggenerators;
}

vector<Bushalte *> Baan::getBushaltes() {
    REQUIRE(this->properlyInitialized(), "Baan wasn't initialized when calling getBushaltes");
    return bushaltes;
}

vector<Kruispunt *> Baan::getKruispunten() {
    REQUIRE(this->properlyInitialized(), "Baan wasn't initialized when calling getKruispunten");
    return kruispunten;
}

void Baan::addInIndexVoertuigen(int i, Voertuig* v) {
    REQUIRE(this->properlyInitialized(), "Baan wasn't initialized when calling addInIndexVoertuigen");
    int temp = voertuigen.size() + 1;
    voertuigen.insert(voertuigen.begin() + i, v);
    int size = voertuigen.size();
    ENSURE(size == temp, "er werd geen kruispunt ge add in de vector kruispunten");
}

void Baan::delVoertuig(int i) {
    REQUIRE(this->properlyInitialized(), "Baan wasn't initialized when calling delVoertuig");
    int temp = voertuigen.size() - 1;
    voertuigen.erase(voertuigen.begin() + i);
    int size = voertuigen.size();
    ENSURE(size == temp, "er werd geen kruispunt ge add in de vector kruispunten");
}

