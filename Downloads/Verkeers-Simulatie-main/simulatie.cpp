//
// Created by elias on 10/04/2022.
//
#include "simulatie.h"
#include "fstream"

bool Simulatie::properlyInitialized() {
    return _initCheck == this;
}

Simulatie::Simulatie() {
    _initCheck = this;
    SIMULATIETIJD = 0.0166;
    tijd = 0;
    aantalVoertuigen = 0;
    ENSURE(properlyInitialized(), "constructor must end in properlyInitialized state");
}

void Simulatie::addBaan(Baan* b) {
    REQUIRE(this->properlyInitialized(), "Simulatie wasn't initialized when calling setBaan");
    int temp = banen.size();
    banen.push_back(b);
    int size = banen.size();
    ENSURE(size != temp, "er werd geen baan toegevoegd");
}

void Simulatie::tijdUpdate() {
    REQUIRE(this->properlyInitialized(), "Simulatie wasn't initialized when calling tijdUpdate");
    double temp = tijd;
    tijd += SIMULATIETIJD;
    ENSURE(tijd != temp, "tijd werd niet verhoogd");
}

double Simulatie::getTijd() {
    REQUIRE(this->properlyInitialized(), "Simulatie wasn't initialized when calling getTijd");
    REQUIRE(tijd >= 0, "getTijd: de tijd kan niet negatief zijn!");
    return tijd;
}

int Simulatie::getSizeBanen() {
    REQUIRE(this->properlyInitialized(),
            "Simulatie wasn't initialized when calling getBaan");
    return banen.size();
}

void Simulatie::printSimulatie() {
    REQUIRE(this->properlyInitialized(), "Simulatie wasn't initialized when calling printSimulatie");
    cout << "Tijd:" << tijd << endl;
    for (int j = 0; j < getSizeBanen(); ++j) {
        int counter = 1;
        for (int i = 0; i < banen[j]->getSizeVoertuigen(); i++) {
            cout << "Voertuig " << counter << endl;
            cout << " -> baan: " << banen[j]->getVoertuigen()[i]->getBaan() << endl;
            cout << " -> positie: " << banen[j]->getVoertuigen()[i]->getPositie() << endl;
            cout << " -> snelheid: " << banen[j]->getVoertuigen()[i]->getSnelheid() << endl;
            counter++;
        }
    }
}

double Simulatie::getSimulatietijd() {
    REQUIRE(this->properlyInitialized(), "Simulatie wasn't initialized when calling getSimulatietijd");
    return SIMULATIETIJD;
}

int Simulatie::getAantalVoertuigen() {
    REQUIRE(this->properlyInitialized(), "Simulatie wasn't initialized when calling getAantalVoertuigen");
    return aantalVoertuigen;
}

void Simulatie::addAantalVoertuig() {
    REQUIRE(this->properlyInitialized(), "Simulatie wasn't initialized when calling addAantalVoertuig");
    aantalVoertuigen += 1;
    ENSURE(aantalVoertuigen >=0 ,"aantalVoertuigen is negatief");
}

void Simulatie::deleteAantalVoertuig() {
    REQUIRE(this->properlyInitialized(), "Simulatie wasn't initialized when calling deleteAantalVoertuig");
    aantalVoertuigen -= 1;
    ENSURE(aantalVoertuigen >=0 ,"aantalVoertuigen is negatief");
}

Simulatie *Simulatie::get_initCheck() {
    REQUIRE(this->properlyInitialized(), "Simulatie wasn't initialized when calling get_initCheck");
    return _initCheck;
}

void Simulatie::set_initCheck(Simulatie* i) {
    REQUIRE(this->properlyInitialized(), "Simulatie wasn't initialized when calling set_initCheck");
    _initCheck = i;
}

vector<Baan *> Simulatie::getBanen() {
    REQUIRE(this->properlyInitialized(), "Simulatie wasn't initialized when calling getBanen");
    return banen;
}

void Simulatie::grafischeImpresie(ostream& myfile) {
    REQUIRE(this->properlyInitialized(), "Simulatie wasn't initialized when calling grafischeImpresie");
    for (int i = 0; i < this->getSizeBanen(); ++i) {
        int temp = 21 - this->getBanen()[i]->getNaam().size();
        myfile << this->getBanen()[i]->getNaam();
        for (int j = 0; j < temp; ++j) {
            myfile << " ";
        }

        myfile << "| ";
        int size = this->getBanen()[i]->getLengte() / 10;
        for (int j = 1; j < size +1; ++j) {
            double range1 = j * 10;
            double range0 = range1 - 10;
            bool hasAuto = false;
            for (int k = 0; k < this->getBanen()[i]->getSizeVoertuigen(); ++k) {
                double positie = this->getBanen()[i]->getVoertuigen()[k]->getPositie();
                if (positie > range0 and positie <= range1){
                    hasAuto = true;
                    int type =  this->getBanen()[i]->getVoertuigen()[k]->voertuigType;
                    if (type == 0)
                        myfile << "B";
                    else if (type == 1)
                        myfile << "B";
                    else if (type == 2)
                        myfile << "A";
                    else if (type == 3)
                        myfile << "Z";
                    else if (type == 4)
                        myfile << "P";
                    break;
                }
            }
            if (!hasAuto)
                myfile << "=";
        }
        myfile << endl;

        myfile << " > verkeerslichten   | ";
        for (int k = 1; k < size + 1; ++k) {
            int range1 = k * 10;
            int range0 = range1 - 10;
            bool hasVerk = false;
            for (int j = 0; j < this->getBanen()[i]->getSizeVerkeerslichten(); ++j) {
                int positie = this->getBanen()[i]->getVerkeerslichten()[j]->getPositie();
                if (positie > range0 and positie <= range1){
                    if (this->getBanen()[i]->getVerkeerslichten()[j]->getKleur() == "groen")
                        myfile << "G";
                    else if (this->getBanen()[i]->getVerkeerslichten()[j]->getKleur() == "orangje")
                        myfile << "O";
                    else
                        myfile << "R";
                    hasVerk = true;
                    break;
                }
            }
            if (!hasVerk) {
                for (int j = 0; j < this->getBanen()[i]->getSizeBushaltes(); ++j) {
                    int positie = this->getBanen()[i]->getBushaltes()[j]->getPositie();
                    if (positie > range0 and positie <= range1) {
                        myfile << "|";
                        hasVerk = true;
                        break;
                    }
                }
            }
            if (!hasVerk) {
                for (int j = 0; j < this->getBanen()[i]->getSizeKruispunten(); ++j) {
                    int positie = 0;
                    for (int l = 0; l < this->getBanen()[i]->getSizeKruispunten(); ++l) {
                        if (this->getBanen()[i]->getNaam() == this->getBanen()[i]->getKruispunten()[l]->getBaan1()){
                            positie = this->getBanen()[i]->getKruispunten()[l]->getPositie1();
                            break;
                        }
                        else if (this->getBanen()[i]->getNaam() == this->getBanen()[i]->getKruispunten()[l]->getBaan2()){
                            positie = this->getBanen()[i]->getKruispunten()[l]->getPositie2();
                            break;
                        }
                    }
                    if (positie > range0 and positie <= range1) {
                        myfile << "|";
                        hasVerk = true;
                        break;
                    }
                }
            }
            if (!hasVerk)
                myfile << " ";

        }
        myfile << endl;

        myfile << " > bushaltes         | ";
        for (int j = 1; j < size+1; ++j) {
            int range1 = j * 10;
            int range0 = range1 - 10;
            bool hasBushalte = false;
            for (int k = 0; k < this->getBanen()[i]->getSizeBushaltes(); ++k) {
                int positie = this->getBanen()[i]->getBushaltes()[k]->getPositie();
                if (positie > range0 and positie <= range1) {
                    myfile << "B";
                    hasBushalte = true;
                    break;
                }
            }
            if (!hasBushalte) {
                for (int l = 0; l < this->getBanen()[i]->getSizeKruispunten(); ++l) {
                    int positie = 0;
                    for (int k = 0; k < this->getBanen()[i]->getSizeKruispunten(); ++k) {
                        if (this->getBanen()[i]->getNaam() == this->getBanen()[i]->getKruispunten()[k]->getBaan1()){
                            positie = this->getBanen()[i]->getKruispunten()[k]->getPositie1();
                            break;
                        }
                        else if (this->getBanen()[i]->getNaam() == this->getBanen()[i]->getKruispunten()[k]->getBaan2()){
                            positie = this->getBanen()[i]->getKruispunten()[k]->getPositie2();
                            break;
                        }
                    }
                    if (positie > range0 and positie <= range1) {
                        myfile << "|";
                        hasBushalte = true;
                        break;
                    }
                }
            }
            if (!hasBushalte)
                myfile << " ";
        }
        myfile << endl;

        myfile << " > kruispunten       | ";
        for (int j = 1; j < size + 1; ++j) {
            int range1 = j * 10;
            int range0 = range1 - 10;
            bool hasKruispunt = false;
            for (int l = 0; l < this->getBanen()[i]->getSizeKruispunten(); ++l) {
                int positie = 0;
                for (int k = 0; k < this->getBanen()[i]->getSizeKruispunten(); ++k) {
                    if (this->getBanen()[i]->getNaam() == this->getBanen()[i]->getKruispunten()[k]->getBaan1()){
                        positie = this->getBanen()[i]->getKruispunten()[k]->getPositie1();
                        break;
                    }
                    else if (this->getBanen()[i]->getNaam() == this->getBanen()[i]->getKruispunten()[k]->getBaan2()){
                        positie = this->getBanen()[i]->getKruispunten()[k]->getPositie2();
                        break;
                    }
                }
                if (positie > range0 and positie <= range1) {
                    myfile << "K";
                    hasKruispunt = true;
                    break;
                }
            }
            if (!hasKruispunt){
                myfile << " ";
            }
        }
        myfile << endl;
    }
}
