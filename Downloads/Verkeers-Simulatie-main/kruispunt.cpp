//
// Created by elias on 30.04.22.
//
#include "kruispunt.h"
Kruispunt::Kruispunt() {
    _initCheck = this;
    positie1 = 0;
    positie2 = 0;
    ENSURE(properlyInitialized(), "constructor must end in properlyInitialized state");
}

bool Kruispunt::properlyInitialized() {
    return _initCheck == this;
}

string Kruispunt::getBaan1() {
    REQUIRE(this->properlyInitialized(),"Kruispunt wasn't initialized when calling get_initCheck");
    return baan1;
}

string Kruispunt::getBaan2() {
    REQUIRE(this->properlyInitialized(),"Kruispunt wasn't initialized when calling get_initCheck");
    return baan2;
}

double Kruispunt::getPositie1() {
    REQUIRE(this->properlyInitialized(),"Kruispunt wasn't initialized when calling get_initCheck");
    return positie1;
}

double Kruispunt::getPositie2() {
    REQUIRE(this->properlyInitialized(),"Kruispunt wasn't initialized when calling get_initCheck");
    return positie2;
}

void Kruispunt::setBaan1(string b) {
    REQUIRE(this->properlyInitialized(),"Kruispunt wasn't initialized when calling get_initCheck");
    baan1 = b;
}

void Kruispunt::setBaan2(string b) {
    REQUIRE(this->properlyInitialized(),"Kruispunt wasn't initialized when calling get_initCheck");
    baan2 = b;
}

void Kruispunt::setPositie1(double p) {
    REQUIRE(this->properlyInitialized(),"Kruispunt wasn't initialized when calling get_initCheck");
    positie1 = p;
}

void Kruispunt::setPositie2(double p) {
    REQUIRE(this->properlyInitialized(),"Kruispunt wasn't initialized when calling get_initCheck");
    positie2 = p;
}

Kruispunt *Kruispunt::get_initCheck() {
    REQUIRE(this->properlyInitialized(),"Kruispunt wasn't initialized when calling get_initCheck");
    return _initCheck;
}

void Kruispunt::set_initCheck(Kruispunt* i) {
    REQUIRE(this->properlyInitialized(),"Kruispunt wasn't initialized when calling set_initCheck");
    _initCheck = i;
}
