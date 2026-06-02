//
// Created by elias on 30.04.22.
//

#ifndef VERKEERSSIMULATIE_KRUISPUNT_H
#include "string"
#include "contract.h"
#define VERKEERSSIMULATIE_KRUISPUNT_H
using namespace std;

class Kruispunt{
private:
    string baan1;
    double positie1;
    string baan2;
    double positie2;
    Kruispunt* _initCheck;
public:
    bool properlyInitialized();
    Kruispunt();
    //ENSURE(properlyInitialized(), "constructor must end in properlyInitialized state");

    void setBaan1(string b);
    //REQUIRE(this->properlyInitialized(),"Kruispunt wasn't initialized when calling setBaan1");

    void setBaan2(string b);
    //REQUIRE(this->properlyInitialized(),"Kruispunt wasn't initialized when calling setBaan2");

    void setPositie1(double p);
    //REQUIRE(this->properlyInitialized(),"Kruispunt wasn't initialized when calling setPositie1");

    void setPositie2(double p);
    //REQUIRE(this->properlyInitialized(),"Kruispunt wasn't initialized when calling setPositie2");

    string getBaan1();
    //REQUIRE(this->properlyInitialized(),"Kruispunt wasn't initialized when calling getBaan1");

    string getBaan2();
    //REQUIRE(this->properlyInitialized(),"Kruispunt wasn't initialized when calling getBaan2");

    double getPositie1();
    //REQUIRE(this->properlyInitialized(),"Kruispunt wasn't initialized when calling getPositie1");

    double getPositie2();
    //REQUIRE(this->properlyInitialized(),"Kruispunt wasn't initialized when calling getPositie2");

    Kruispunt* get_initCheck();
    //REQUIRE(this->properlyInitialized(),"Kruispunt wasn't initialized when calling get_initCheck");

    void set_initCheck(Kruispunt* i);
    //REQUIRE(this->properlyInitialized(),"Kruispunt wasn't initialized when calling set_initCheck");
};

#endif //VERKEERSSIMULATIE_KRUISPUNT_H
