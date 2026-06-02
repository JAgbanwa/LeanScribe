//
// Created by elias on 10/04/2022.
//
#include "simulatieImporter.h"
#include "nullptr.h"
#include "fstream"
#include "simulatieUtils.h"
#include <algorithm>

bool SimulatieImporter::properlyInitialized() {
    return _initCheck == this;
}
SimulatieImporter::SimulatieImporter() {
    _initCheck = this;
    ENSURE(properlyInitialized(), "constructor must end in properlyInitialized state");
}

SimulatieImporter *SimulatieImporter::get_initCheck() {
    REQUIRE(this->properlyInitialized(), "VerkeersSimulatie wasn't initialized when calling get_initCheck");
    return _initCheck;
}

void SimulatieImporter::set_initCheck(SimulatieImporter *v) {
    REQUIRE(this->properlyInitialized(), "VerkeersSimulatie wasn't initialized when calling set_initCheck");
    _initCheck = v;
}

bool SimulatieImporter::isUpperCase(string &word) {
    if(word.empty())
        return true;

    for(size_t i = 0; i < word.length(); i++)
        if(!isupper(static_cast<unsigned char>(word[i])))
            return false;

    return true;
}

SuccessEnum SimulatieImporter::importSimulatie(const char *inputfilename, ostream &errStream, Simulatie *simulatie) {
    REQUIRE(simulatie->properlyInitialized(),"Simulatie wasn't initialized when calling readSimulatie");

    SuccessEnum endResult = Success;
    TiXmlDocument doc;
    if(!doc.LoadFile(inputfilename)) {
        errStream << "XML IMPORT ABORTED: " << doc.ErrorDesc() << endl;
        return ImportAborted;
    }

    TiXmlElement* root = doc.FirstChildElement();
    ostream &basicOstream = errStream;
    if(root == MyNullptr) {
        basicOstream << "XML PARTIAL IMPORT: Failed to load file: No root element." << std::endl;
        endResult = PartialImport;
        doc.Clear();
        return endResult;
    }
    for(TiXmlElement* elem = root->FirstChildElement(); elem != MyNullptr; elem = elem->NextSiblingElement()){
        string container = elem->Value();

        string testRoot = root->Value();
        if ( testRoot == "root"){
            basicOstream << "XML PARTIAL IMPORT: container naam moet in uppercase!" << std::endl;
            endResult = PartialImport;
            return endResult;
        }

        if ( testRoot != "ROOT"){
            basicOstream << "XML PARTIAL IMPORT: Een xml bestand moet een ROOT bevatten!" << std::endl;
            endResult = PartialImport;
            return endResult;
        }

        if (!isUpperCase(container)) {
            basicOstream << "XML PARTIAL IMPORT: container naam moet in uppercase!" << std::endl;
            endResult = PartialImport;
            return endResult;
        }
        string test = root->FirstChildElement()->Value();
        if (test != "BAAN"){
            basicOstream << "XML PARTIAL IMPORT: Een simulatie moet een BAAN bevatten!" << std::endl;
            endResult = PartialImport;
            return endResult;
        }
        if (container == "BAAN") {
            Baan* b = new Baan;
            bool heeftNaam = false;
            bool heeftLengte = false;
            for (TiXmlElement *j = elem->FirstChildElement(); j != MyNullptr; j = j->NextSiblingElement()) {
                string elemName = j->Value();
                if (isUpperCase(elemName)) {
                    basicOstream << "XML PARTIAL IMPORT: element naam moet in lowercase!" << std::endl;
                    endResult = PartialImport;
                    return endResult;
                }
                if (elemName == "naam") {
                    string test2 = j->GetText();
                    int size = test2.size();
                    for (int i = 0; i < size; ++i) {
                        if(isdigit(test2[i])){
                            basicOstream << "XML PARTIAL IMPORT: element naam mag geen nummer bevatten!" << std::endl;
                            endResult = PartialImport;
                            return endResult;
                        }
                    }
                    b->setNaam(j->GetText());
                    heeftNaam = true;
                }
                else if (elemName == "lengte") {
                    int i;
                    istringstream(j->GetText()) >> i;
                    if (i < 0){
                        basicOstream << "XML PARTIAL IMPORT: lengte van de baan moet positief zijn!" << std::endl;
                        endResult = PartialImport;
                        return endResult;
                    }
                    b->setLengte(i);
                    heeftLengte = true;
                }
                else {
                    basicOstream << "XML PARTIAL IMPORT: Onherkenbaar element naam" << std::endl;
                    endResult = PartialImport;
                    return endResult;
                }
            }
            if (!heeftNaam){
                basicOstream << "XML PARTIAL IMPORT: BAAN bevat geen element naam!" << std::endl;
                endResult = PartialImport;
                return endResult;
            }
            if (!heeftLengte){
                basicOstream << "XML PARTIAL IMPORT: BAAN bevat geen element lengte!" << std::endl;
                endResult = PartialImport;
                return endResult;
            }
            simulatie->addBaan(b);
        }

        else if (container == "VERKEERSLICHT") {
            Verkeerslicht *v;
            v = new Verkeerslicht;
            bool heeftBaan = false;
            bool heeftPositie = false;
            bool heeftCyclus = false;
            for (TiXmlElement *j = elem->FirstChildElement(); j != MyNullptr; j = j->NextSiblingElement()) {
                string elemName = j->Value();
                if (isUpperCase(elemName)) {
                    basicOstream << "XML PARTIAL IMPORT: element naam moet in lowercase!" << std::endl;
                    endResult = PartialImport;
                    return endResult;
                }
                if (elemName == "baan") {
                    string baan = j->GetText();
                    bool temp = false;
                    int size = simulatie->getSizeBanen();
                    for (int i = 0; i < size; ++i) {
                        if (baan == simulatie->getBanen()[i]->getNaam()) {
                            temp = true;
                            break;
                        }
                    }
                    if (!temp){
                        basicOstream << "XML PARTIAL IMPORT: De BAAN van de verkeerslicht is niet geldig!" << std::endl;
                        endResult = PartialImport;
                        return endResult;
                    }
                    v->setBaan(j->GetText(), simulatie->getBanen());
                    heeftBaan = true;
                }
                else if (elemName == "positie") {
                    double i;
                    istringstream(j->GetText()) >> i;
                    if (i < 0){
                        basicOstream << "XML PARTIAL IMPORT: De positie van de verkeerslicht moet positief zijn!" << std::endl;
                        endResult = PartialImport;
                        return endResult;
                    }
                    if(heeftBaan) {
                        int size = simulatie->getSizeBanen();
                        int lengte = 0;
                        for (int s = 0; s < size; ++s) {
                            if (v->getBaan() == simulatie->getBanen()[s]->getNaam()) {
                                lengte = simulatie->getBanen()[s]->getLengte();
                                break;
                            }
                        }
                        if (i > lengte) {
                            basicOstream << "XML PARTIAL IMPORT: De positie van de verkeerslicht moet kleiner zijn dan de baan!" << std::endl;
                            endResult = PartialImport;
                            return endResult;
                        }
                        v->setPositie(i, simulatie->getBanen());
                    }
                    heeftPositie = true;
                }
                else if (elemName == "cyclus") {
                    heeftCyclus = true;
                    int i;
                    istringstream(j->GetText()) >> i;
                    if (i < 0){
                        basicOstream << "XML PARTIAL IMPORT: Cyclus van de verkeerslicht moet positief zijn!" << std::endl;
                        endResult = PartialImport;
                        return endResult;
                    }
                    v->setCyclus(i);
                    v->berekenTijdOrangje();
                }
                else {
                    basicOstream << "XML PARTIAL IMPORT: Onherkenbaar element naam" << std::endl;
                    endResult = PartialImport;
                    return endResult;
                }
            }
            if (!heeftBaan){
                basicOstream << "XML PARTIAL IMPORT: VERKEERSLICHT bevat geen element baan!" << std::endl;
                endResult = PartialImport;
                return endResult;
            }
            if (!heeftCyclus){
                basicOstream << "XML PARTIAL IMPORT: VERKEERSLICHT bevat geen element cyclus!" << std::endl;
                endResult = PartialImport;
                return endResult;
            }
            if (!heeftPositie){
                basicOstream << "XML PARTIAL IMPORT: VERKEERSLICHT bevat geen element positie!" << std::endl;
                endResult = PartialImport;
                return endResult;
            }
            for (int i = 0; i < simulatie->getSizeBanen(); ++i) {
                if (simulatie->getBanen()[i]->getNaam() == v->getBaan()){
                    simulatie->getBanen()[i]->addVerkeerslicht(v);
                    break;
                }
            }
        }
        else if (container == "VOERTUIGGENERATOR") {
            Voertuiggenerator *vo;
            vo = new Voertuiggenerator;
            bool heeftBaan = false;
            bool heeftFrequentie = false;
            bool heeftType = false;
            for (TiXmlElement *j = elem->FirstChildElement(); j != MyNullptr; j = j->NextSiblingElement()) {
                string elemName = j->Value();
                if (isUpperCase(elemName)) {
                    basicOstream << "XML PARTIAL IMPORT: element naam moet in lowercase!" << std::endl;
                    endResult = PartialImport;
                    return endResult;
                }
                if (elemName == "baan") {
                    string baan = j->GetText();
                    bool temp = false;
                    int size = simulatie->getSizeBanen();
                    for (int i = 0; i < size; ++i) {
                        if (baan == simulatie->getBanen()[i]->getNaam()) {
                            temp = true;
                            break;
                        }
                    }
                    if (!temp){
                        basicOstream << "XML PARTIAL IMPORT: De BAAN van de verkeerslicht is niet geldig!" << std::endl;
                        endResult = PartialImport;
                        return endResult;
                    }
                    vo->setBaan(j->GetText(), simulatie->getBanen());
                    heeftBaan = true;
                }
                else if (elemName == "frequentie"){
                    double i;
                    istringstream(j->GetText()) >> i;
                    if (i < 0){
                        basicOstream << "XML PARTIAL IMPORT: frequentie van de voertuiggenerator moet positief zijn!" << std::endl;
                        endResult = PartialImport;
                        return endResult;
                    }
                    heeftFrequentie = true;
                    vo->setFrequentie(i);
                }
                else if(elemName == "type"){
                    string temp = j->GetText();
                    if (temp == "auto")
                        vo->voertuigType = vo->Auto;
                    else if(temp == "bus")
                        vo->voertuigType = vo->Bus;
                    else if(temp == "brandweerwagen")
                        vo->voertuigType = vo->Brandweerwagen;
                    else if(temp == "ziekenwagen")
                        vo->voertuigType = vo->Ziekenwagen;
                    else if(temp == "politiecombi")
                        vo->voertuigType = vo->Politiecombi;
                    else{
                        basicOstream << "XML PARTIAL IMPORT: Voertuiggenerator heeft geen geldige type!" << std::endl;
                        endResult = PartialImport;
                        return endResult;
                    }
                    heeftType = true;
                }
                else {
                    basicOstream << "XML PARTIAL IMPORT: Onherkenbaar element naam" << std::endl;
                    endResult = PartialImport;
                    return endResult;
                }
            }
            if (!heeftBaan){
                basicOstream << "XML PARTIAL IMPORT: VOERTUIGGENERATOR bevat geen element baan!" << std::endl;
                endResult = PartialImport;
                return endResult;
            }
            if (!heeftFrequentie){
                basicOstream << "XML PARTIAL IMPORT: VOERTUIGGENERATOR bevat geen element frequentie!" << std::endl;
                endResult = PartialImport;
                return endResult;
            }
            if (!heeftType){
                basicOstream << "XML PARTIAL IMPORT: VOERTUIGGENERATOR bevat geen element type!" << std::endl;
                endResult = PartialImport;
                return endResult;
            }
            for (int i = 0; i < simulatie->getSizeBanen(); ++i) {
                if (simulatie->getBanen()[i]->getNaam() == vo->getBaan()){
                    simulatie->getBanen()[i]->addVoertuiggenerator(vo);
                    break;
                }

            }
        }
        else if (container == "VOERTUIG") {
            Voertuig *vt;
            vt = new Voertuig;
            bool heeftBaan = false;
            bool heeftPositie = false;
            bool heeftType = false;
            for (TiXmlElement *j = elem->FirstChildElement(); j != MyNullptr; j = j->NextSiblingElement()) {
                string elemName = j->Value();
                if (isUpperCase(elemName)) {
                    basicOstream << "XML PARTIAL IMPORT: element naam moet in lowercase!" << std::endl;
                    endResult = PartialImport;
                    return endResult;
                }
                if (elemName == "baan") {
                    string baan = j->GetText();
                    bool temp = false;
                    int size = simulatie->getSizeBanen();
                    for (int i = 0; i < size; ++i) {
                        if (baan == simulatie->getBanen()[i]->getNaam()) {
                            temp = true;
                            break;
                        }
                    }
                    if (!temp){
                        basicOstream << "XML PARTIAL IMPORT: De BAAN van de voertuig is niet geldig!" << std::endl;
                        endResult = PartialImport;
                        return endResult;
                    }
                    vt->setBaan(j->GetText(), simulatie->getBanen());
                    heeftBaan = true;
                }
                else if (elemName == "positie") {
                    double i;
                    istringstream(j->GetText()) >> i;
                    if (i < 0){
                        basicOstream << "XML PARTIAL IMPORT: De positie van de voertuig moet positief zijn!" << std::endl;
                        endResult = PartialImport;
                        return endResult;
                    }
                    if(heeftBaan) {
                        int size = simulatie->getSizeBanen();
                        int lengte = 0;
                        for (int s = 0; s < size; ++s) {
                            if (vt->getBaan() == simulatie->getBanen()[s]->getNaam()) {
                                lengte = simulatie->getBanen()[s]->getLengte();
                                break;
                            }
                        }
                        if (i > lengte) {
                            basicOstream << "XML PARTIAL IMPORT: positie van de voertuig moet kleiner zijn dan de baan!" << std::endl;
                            endResult = PartialImport;
                            return endResult;
                        }
                        vt->setPositie(i, simulatie->getBanen());
                    }
                    heeftPositie = true;
                }
                else if(elemName == "type"){
                    string temp = j->GetText();
                    if (temp == "auto")
                         vt->voertuigType = vt->Auto;
                    else if(temp == "bus")
                        vt->voertuigType = vt->Bus;
                    else if(temp == "brandweerwagen")
                        vt->voertuigType = vt->Brandweerwagen;
                    else if(temp == "ziekenwagen")
                        vt->voertuigType = vt->Ziekenwagen;
                    else if(temp == "politiecombi")
                        vt->voertuigType = vt->Politiecombi;
                    else{
                        basicOstream << "XML PARTIAL IMPORT: Het voertuig heeft geen geldige type!" << std::endl;
                        endResult = PartialImport;
                        return endResult;
                    }
                    vt->setType();
                    heeftType = true;
                }
                else {
                    basicOstream << "XML PARTIAL IMPORT: Onherkenbaar element naam" << std::endl;
                    endResult = PartialImport;
                    return endResult;
                }
            }
            if (!heeftBaan){
                basicOstream << "XML PARTIAL IMPORT: VOERTUIG bevat geen element baan!" << std::endl;
                endResult = PartialImport;
                return endResult;
            }
            if (!heeftPositie){
                basicOstream << "XML PARTIAL IMPORT: VOERTUIG bevat geen element positie!" << std::endl;
                endResult = PartialImport;
                return endResult;
            }
            if (!heeftType){
                basicOstream << "XML PARTIAL IMPORT: VOERTUIG bevat geen element type!" << std::endl;
                endResult = PartialImport;
                return endResult;
            }
            simulatie->addAantalVoertuig();
            for (int i = 0; i < simulatie->getSizeBanen(); ++i) {
                if (simulatie->getBanen()[i]->getNaam() == vt->getBaan()){
                    for (int j = 0; j < simulatie->getBanen()[i]->getSizeVoertuigen(); ++j) {
                        if (simulatie->getBanen()[i]->getVoertuigen()[j]->getPositie() == vt->getPositie()){
                            basicOstream << "XML PARTIAL IMPORT: POSITIE van voertuigen mogen niet hetzelfde zijn!" << std::endl;
                            endResult = PartialImport;
                            return endResult;
                        }
                    }
                    simulatie->getBanen()[i]->addVoertuigen(vt);
                    break;
                }
            }
        }
        else if (container == "BUSHALTE") {
            Bushalte *b;
            b = new Bushalte;
            bool heeftBaan = false;
            bool heeftPositie = false;
            bool heeftWachttijd = false;
            for (TiXmlElement *j = elem->FirstChildElement(); j != MyNullptr; j = j->NextSiblingElement()) {
                string elemName = j->Value();
                if (isUpperCase(elemName)) {
                    basicOstream << "XML PARTIAL IMPORT: element naam moet in lowercase!" << std::endl;
                    endResult = PartialImport;
                    return endResult;
                }
                if (elemName == "baan") {
                    string baan = j->GetText();
                    bool temp = false;
                    int size = simulatie->getSizeBanen();
                    for (int i = 0; i < size; ++i) {
                        if (baan == simulatie->getBanen()[i]->getNaam()) {
                            temp = true;
                            break;
                        }
                    }
                    if (!temp){
                        basicOstream << "XML PARTIAL IMPORT: De BAAN van de bushalte is niet geldig!" << std::endl;
                        endResult = PartialImport;
                        return endResult;
                    }
                    b->setBaan(j->GetText(), simulatie->getBanen());
                    heeftBaan = true;
                }
                else if (elemName == "positie") {
                    double i;
                    istringstream(j->GetText()) >> i;
                    if (i < 0){
                        basicOstream << "XML PARTIAL IMPORT: De positie van de bushalte moet positief zijn!" << std::endl;
                        endResult = PartialImport;
                        return endResult;
                    }
                    if(heeftBaan) {
                        int size = simulatie->getSizeBanen();
                        int lengte = 0;
                        for (int s = 0; s < size; ++s) {
                            if (b->getBaan() == simulatie->getBanen()[s]->getNaam()) {
                                lengte = simulatie->getBanen()[s]->getLengte();
                                break;
                            }
                        }
                        if (i > lengte) {
                            basicOstream << "XML PARTIAL IMPORT: De positie van de bushalte moet kleiner zijn dan de baan!" << std::endl;
                            endResult = PartialImport;
                            return endResult;
                        }
                        b->setPositie(i, simulatie->getBanen());
                    }
                    heeftPositie = true;
                }
                else if (elemName == "wachttijd") {
                    int i;
                    istringstream(j->GetText()) >> i;
                    if (i < 0){
                        basicOstream << "XML PARTIAL IMPORT: Wachttijd van de bushalte moet positief zijn!" << std::endl;
                        endResult = PartialImport;
                        return endResult;
                    }
                    b->setWachttijd(i);
                    heeftWachttijd = true;
                }
                else {
                    basicOstream << "XML PARTIAL IMPORT: Onherkenbaar element naam" << std::endl;
                    endResult = PartialImport;
                    return endResult;
                }
            }
            if (!heeftBaan){
                basicOstream << "XML PARTIAL IMPORT: BUSHALTE bevat geen element baan!" << std::endl;
                endResult = PartialImport;
                return endResult;
            }
            if (!heeftPositie){
                basicOstream << "XML PARTIAL IMPORT: BUSHALTE bevat geen element positie!" << std::endl;
                endResult = PartialImport;
                return endResult;
            }
            if (!heeftWachttijd){
                basicOstream << "XML PARTIAL IMPORT: BUSHALTE bevat geen element wachttijd!" << std::endl;
                endResult = PartialImport;
                return endResult;
            }
            for (int i = 0; i < simulatie->getSizeBanen(); ++i) {
                if (simulatie->getBanen()[i]->getNaam() == b->getBaan()){
                    simulatie->getBanen()[i]->addBushalte(b);
                    break;
                }
            }
        }
        else if (container == "KRUISPUNT") {
            Kruispunt *k;
            k = new Kruispunt;
            int count = 0;
            bool heeftBaan1 = false;
            bool heeftBaan2 = false;
            for (TiXmlElement *j = elem->FirstChildElement(); j != MyNullptr; j = j->NextSiblingElement()) {
                count++;
                string elemName = j->Value();
                if (isUpperCase(elemName)) {
                    basicOstream << "XML PARTIAL IMPORT: element naam moet in lowercase!" << std::endl;
                    endResult = PartialImport;
                    return endResult;
                }
                if (j->Attribute("positie") == MyNullptr){
                    basicOstream << "XML PARTIAL IMPORT: Baan heeft geen attribute positie!" << std::endl;
                    endResult = PartialImport;
                    return endResult;
                }
                const char* positie = j->Attribute("positie");
                if (elemName == "baan" and count == 1) {
                    string baan = j->GetText();
                    bool temp = false;
                    int size2 = simulatie->getSizeBanen();
                    for (int i = 0; i < size2; ++i) {
                        if (baan == simulatie->getBanen()[i]->getNaam()) {
                            temp = true;
                            break;
                        }
                    }
                    if (!temp){
                        basicOstream << "XML PARTIAL IMPORT: De eerste BAAN van de kruispunt is niet geldig!" << std::endl;
                        endResult = PartialImport;
                        return endResult;
                    }
                    k->setBaan1(j->GetText());
                    double i;
                    istringstream(string(positie)) >> i;
                    if (i < 0){
                        basicOstream << "XML PARTIAL IMPORT: De positie van de kruispunt moet positief zijn!" << std::endl;
                        endResult = PartialImport;
                        return endResult;
                    }
                    int size = simulatie->getSizeBanen();
                    int lengte = 0;
                    for (int s = 0; s < size; ++s) {
                        if (k->getBaan1() == simulatie->getBanen()[s]->getNaam()){
                            lengte = simulatie->getBanen()[s]->getLengte();
                            break;
                        }
                    }
                    if (i > lengte){
                        basicOstream << "XML PARTIAL IMPORT: De positie van de kruispunt moet kleiner zijn dan de eerste baan!" << std::endl;
                        endResult = PartialImport;
                        return endResult;
                    }
                    k->setPositie1(i);
                    heeftBaan1 = true;
                }
                else if(elemName == "baan" and count ==2) {
                    string baan = j->GetText();
                    bool temp = false;
                    int size2 = simulatie->getSizeBanen();
                    for (int i = 0; i < size2; ++i) {
                        if (baan == simulatie->getBanen()[i]->getNaam()) {
                            temp = true;
                            break;
                        }
                    }
                    if (!temp){
                        basicOstream << "XML PARTIAL IMPORT: De 2de BAAN van de kruispunt is niet geldig!" << std::endl;
                        endResult = PartialImport;
                        return endResult;
                    }
                    k->setBaan2(j->GetText());
                    double i;
                    istringstream(string(positie)) >> i;
                    if (i < 0){
                        basicOstream << "XML PARTIAL IMPORT: De positie van de kruispunt moet positief zijn!" << std::endl;
                        endResult = PartialImport;
                        return endResult;
                    }
                    int size = simulatie->getSizeBanen();
                    int lengte = 0;
                    for (int s = 0; s < size; ++s) {
                        if (k->getBaan2() == simulatie->getBanen()[s]->getNaam()){
                            lengte = simulatie->getBanen()[s]->getLengte();
                            break;
                        }
                    }
                    if (i > lengte){
                        basicOstream << "XML PARTIAL IMPORT: De positie van de kruispunt moet kleiner zijn dan de 2de baan!" << std::endl;
                        endResult = PartialImport;
                        return endResult;
                    }
                    k->setPositie2(i);
                    heeftBaan2 = true;
                }
                else {
                    basicOstream << "XML PARTIAL IMPORT: Onherkenbaar element naam" << std::endl;
                    endResult = PartialImport;
                    return endResult;
                }
            }
            if (!heeftBaan1){
                basicOstream << "XML PARTIAL IMPORT: KRUISPUNT heeft geen element baan" << std::endl;
                endResult = PartialImport;
                return endResult;
            }
            if (!heeftBaan2){
                basicOstream << "XML PARTIAL IMPORT: KRUISPUNT heeft geen element baan" << std::endl;
                endResult = PartialImport;
                return endResult;
            }
            for (int i = 0; i < simulatie->getSizeBanen(); ++i) {
                if (simulatie->getBanen()[i]->getNaam() == k->getBaan1()){
                    simulatie->getBanen()[i]->addKruispunt(k);
                }
                else if(simulatie->getBanen()[i]->getNaam() == k->getBaan2()){
                    simulatie->getBanen()[i]->addKruispunt(k);
                }
            }
        }
        else{
            basicOstream << "XML PARTIAL IMPORT: Onherkenbaar container naam" << std::endl;
            endResult = PartialImport;
            return endResult;
        }
    }
    doc.Clear();
    return endResult;
}
void SimulatieImporter::runSimulatie(Simulatie* simulatie, bool isTest) {
    REQUIRE(simulatie->properlyInitialized(),"simulatie wasn't initialized when calling runSimulatie");
    ofstream myfile;
    myfile.open("grafischeImpresie.txt");
    while (simulatie->getAantalVoertuigen() != 0) {
        if (!isTest)
            simulatie->printSimulatie();
        simulatie->grafischeImpresie(myfile);
        myfile << endl;
        simulatie->tijdUpdate();
        // use case 3.1: snelheid, positie en versnelling van elk voertuig updaten
        for (int a = 0; a < simulatie->getSizeBanen(); ++a) {
            for (int i = 0; i < simulatie->getBanen()[a]->getSizeVoertuigen(); ++i) {
                if (i != simulatie->getBanen()[a]->getSizeVoertuigen() - 1) {
                    simulatie->getBanen()[a]->getVoertuigen()[i]->updateVoertuig();
                    double x = simulatie->getBanen()[a]->getVoertuigen()[i + 1]->getPositie();
                    double v = simulatie->getBanen()[a]->getVoertuigen()[i + 1]->getSnelheid();
                    simulatie->getBanen()[a]->getVoertuigen()[i]->updateVersnelling(x, v);
                } else {
                    simulatie->getBanen()[a]->getVoertuigen()[i]->setLaatste();
                    simulatie->getBanen()[a]->getVoertuigen()[i]->updateVoertuig();
                    simulatie->getBanen()[a]->getVoertuigen()[i]->updateVersnelling(10000, 100);
                }
            }
        }

        for (int a = 0; a < simulatie->getSizeBanen(); ++a) {
            if (simulatie->getBanen()[a]->getSizeVoertuigen() != 0) {
                bool temp = simulatie->getBanen()[a]->isOutOfBaan();
                if (temp) {
                    simulatie->deleteAantalVoertuig();
                }
            }
        }
        // use case 3.2: voor elke verkeerslicht aan de hand van de current kleur de voertuigen vertragen, vernsellen of stoppen
        for (int b = 0; b < simulatie->getSizeBanen(); ++b) {
            for (int i = 0; i < simulatie->getBanen()[b]->getSizeVerkeerslichten(); ++i) {
                simulatie->getBanen()[b]->getVerkeerslichten()[i]->updateTijd();
                simulatie->getBanen()[b]->getVerkeerslichten()[i]->checkKleur();
                if (simulatie->getBanen()[b]->getVerkeerslichten()[i]->getKleur() == "groen") {
                    int indexLast = 55555;
                    for (int k = simulatie->getBanen()[b]->getSizeVoertuigen() - 1; k >= 0; --k) {
                        if (simulatie->getBanen()[b]->getVoertuigen()[k]->getPositie() < simulatie->getBanen()[b]->getVerkeerslichten()[i]->getPositie()) {
                            if (simulatie->getBanen()[b]->getVoertuigen()[k]->voertuigType == simulatie->getBanen()[b]->getVoertuigen()[k]->Auto or simulatie->getBanen()[b]->getVoertuigen()[k]->voertuigType == simulatie->getBanen()[b]->getVoertuigen()[k]->Bus) {
                                indexLast = k;
                                break;
                            }
                        }
                    }
                    if (indexLast != 55555) {
                        double deltaX = simulatie->getBanen()[b]->getVerkeerslichten()[i]->getPositie() - simulatie->getBanen()[b]->getVoertuigen()[indexLast]->getPositie();
                        if (deltaX <= 50) {
                            simulatie->getBanen()[b]->getVoertuigen()[indexLast]->versnellen();
                        }
                    }
                }
                else if (simulatie->getBanen()[b]->getVerkeerslichten()[i]->getKleur() == "orangje"){
                    bool temp = false;
                    if (simulatie->getBanen()[b]->getVerkeerslichten()[i]->getTijdOrangje() == 0){
                        temp = true;
                    }
                    simulatie->getBanen()[b]->getVerkeerslichten()[i]->updateTijdOrangje();
                    simulatie->getBanen()[b]->getVerkeerslichten()[i]->checkKleur();
                    int indexLast = 55555;
                    for (int k = simulatie->getBanen()[b]->getSizeVoertuigen() - 1; k >= 0; --k) {
                        if (simulatie->getBanen()[b]->getVoertuigen()[k]->getPositie() < simulatie->getBanen()[b]->getVerkeerslichten()[i]->getPositie()-15) {
                            if (simulatie->getBanen()[b]->getVoertuigen()[k]->voertuigType == simulatie->getBanen()[b]->getVoertuigen()[k]->Auto or simulatie->getBanen()[b]->getVoertuigen()[k]->voertuigType == simulatie->getBanen()[b]->getVoertuigen()[k]->Bus) {
                                indexLast = k;
                                break;
                            }
                        }
                    }
                    if (temp){
                        simulatie->getBanen()[b]->getVerkeerslichten()[i]->setExtra(indexLast);
                    }
                    int extra2 = simulatie->getBanen()[b]->getVerkeerslichten()[i]->getExtra();
                    if (indexLast != 55555) {
                        double deltaX = simulatie->getBanen()[b]->getVerkeerslichten()[i]->getPositie() -
                                        simulatie->getBanen()[b]->getVoertuigen()[indexLast]->getPositie();
                        if (deltaX <= 50) {
                            simulatie->getBanen()[b]->getVoertuigen()[indexLast]->vertragen();
                        }
                        if(extra2 < simulatie->getBanen()[b]->getSizeVoertuigen()) {
                            double deltaX2 = simulatie->getBanen()[b]->getVerkeerslichten()[i]->getPositie() -
                                             simulatie->getBanen()[b]->getVoertuigen()[extra2]->getPositie();
                            if (deltaX2 <= 15) {
                                simulatie->getBanen()[b]->getVoertuigen()[extra2]->stoppen();
                            }
                            if (simulatie->getBanen()[b]->getVerkeerslichten()[i]->getExtra() != indexLast) {
                                simulatie->getBanen()[b]->getVoertuigen()[indexLast]->versnellen();
                            }
                        }
                    }

                }
                else {
                    double vertraagAfstand = 50.0;
                    double stopAfstand = 15.0;
                    int indexLast = 55565565;
                    for (int k = simulatie->getBanen()[b]->getSizeVoertuigen() - 1; k >= 0; --k) {
                        if (simulatie->getBanen()[b]->getVoertuigen()[k]->getPositie() < simulatie->getBanen()[b]->getVerkeerslichten()[i]->getPositie()) {
                            if (simulatie->getBanen()[b]->getVoertuigen()[k]->voertuigType == simulatie->getBanen()[b]->getVoertuigen()[k]->Auto or simulatie->getBanen()[b]->getVoertuigen()[k]->voertuigType == simulatie->getBanen()[b]->getVoertuigen()[k]->Bus) {
                                indexLast = k;
                                break;
                            }
                        }
                    }
                    if (indexLast != 55565565) {
                        double deltaX = simulatie->getBanen()[b]->getVerkeerslichten()[i]->getPositie() - simulatie->getBanen()[b]->getVoertuigen()[indexLast]->getPositie();
                        if (deltaX <= vertraagAfstand and deltaX > stopAfstand) {
                            simulatie->getBanen()[b]->getVoertuigen()[indexLast]->vertragen();
                        } else if (deltaX <= stopAfstand) {
                            simulatie->getBanen()[b]->getVoertuigen()[indexLast]->stoppen();
                        }
                    }
                }
            }
        }
        // use case 3.4: voertuiggenerator, om de frequentie word er een auto gegenereerd als er geen auto's tussen
        // positie 0 en 2 * l zitten
        /*
        for (int b = 0; b < simulatie->getSizeBanen(); ++b) {
            for (int i = 0; i < simulatie->getBanen()[b]->getSizeGenerator(); ++i) {
                simulatie->getBanen()[b]->getVoertuiggenerators()[i]->updateTijd();
                if (simulatie->getBanen()[b]->getVoertuiggenerators()[i]->addVoertuig()) {
                    Voertuig *v;
                    v = new Voertuig;
                    if (simulatie->getBanen()[b]->getVoertuiggenerators()[i]->voertuigType == simulatie->getBanen()[b]->getVoertuiggenerators()[i]->Auto)
                        v->voertuigType = v->Auto;
                    else if(simulatie->getBanen()[b]->getVoertuiggenerators()[i]->voertuigType == simulatie->getBanen()[b]->getVoertuiggenerators()[i]->Bus)
                        v->voertuigType = v->Bus;
                    else if(simulatie->getBanen()[b]->getVoertuiggenerators()[i]->voertuigType == simulatie->getBanen()[b]->getVoertuiggenerators()[i]->Brandweerwagen)
                        v->voertuigType = v->Brandweerwagen;
                    else if(simulatie->getBanen()[b]->getVoertuiggenerators()[i]->voertuigType == simulatie->getBanen()[b]->getVoertuiggenerators()[i]->Ziekenwagen)
                        v->voertuigType = v->Ziekenwagen;
                    else if(simulatie->getBanen()[b]->getVoertuiggenerators()[i]->voertuigType == simulatie->getBanen()[b]->getVoertuiggenerators()[i]->Politiecombi)
                        v->voertuigType = v->Politiecombi;
                    v->setType();
                    if (simulatie->getBanen()[b]->getSizeVoertuigen() == 0) {
                        v->setBaan(simulatie->getBanen()[b]->getNaam(), simulatie->getBanen());
                        v->setPositie(0, simulatie->getBanen());
                        simulatie->getBanen()[b]->addBeginVoertuig(v);
                        simulatie->addAantalVoertuig();
                        simulatie->getBanen()[b]->getVoertuiggenerators()[i]->resetTijd();
                    } else if (simulatie->getBanen()[b]->getVoertuigen()[0]->getPositie() > (2 * v->getAutoLengte())) {
                        v->setBaan(simulatie->getBanen()[b]->getNaam(),simulatie->getBanen());
                        v->setPositie(0,simulatie->getBanen());
                        simulatie->getBanen()[b]->addBeginVoertuig(v);
                        simulatie->addAantalVoertuig();
                        simulatie->getBanen()[b]->getVoertuiggenerators()[i]->resetTijd();
                    }
                }
            }
        }
        */
        // use case 3.6: simulatie van bushaltes, bussen moeten stoppen aan elke bushale, en vervolgens blijven staan tot de wachtijd verstreken is.
        for (int b = 0; b < simulatie->getSizeBanen(); ++b) {
            double vertraagAfstand = 50.0;
            double stopAfstand = 15.0;
            for (int i = 0; i < simulatie->getBanen()[b]->getSizeBushaltes(); ++i) {
                int lastIndex = 55555;
                for (int j = simulatie->getBanen()[b]->getSizeVoertuigen() - 1; j >= 0 ; --j) {
                    if (simulatie->getBanen()[b]->getVoertuigen()[j]->getPositie() < simulatie->getBanen()[b]->getBushaltes()[i]->getPositie()){
                        if (simulatie->getBanen()[b]->getVoertuigen()[j]->voertuigType == simulatie->getBanen()[b]->getVoertuigen()[j]->Bus) {
                            lastIndex = j;
                            break;
                        }
                    }
                }
                if (lastIndex != 55555){
                    double deltaX = simulatie->getBanen()[b]->getBushaltes()[i]->getPositie() - simulatie->getBanen()[b]->getVoertuigen()[lastIndex]->getPositie();
                    if (deltaX <= vertraagAfstand and deltaX > stopAfstand) {
                        simulatie->getBanen()[b]->getVoertuigen()[lastIndex]->vertragen();
                        simulatie->getBanen()[b]->getBushaltes()[i]->resetTIjd();
                    } else if (deltaX <= stopAfstand) {
                        bool temp = simulatie->getBanen()[b]->getBushaltes()[i]->checkTijd();
                        if (temp){
                            simulatie->getBanen()[b]->getVoertuigen()[lastIndex]->versnellen();
                        }
                        else {
                            simulatie->getBanen()[b]->getVoertuigen()[lastIndex]->stoppen();
                            simulatie->getBanen()[b]->getBushaltes()[i]->updateTijd();
                        }
                    }
                }

            }
        }
        // use case 3.7: Simulatie van kruispunten, voertuigen die bij een kruispunt aankomen kiezen random een baan
        // waarop ze verder gaan
        for (int b = 0; b < simulatie->getSizeBanen(); ++b) {
            for (int i = 0; i < simulatie->getBanen()[b]->getSizeKruispunten(); ++i) {
                double positie = 0;
                string naam;
                if(simulatie->getBanen()[b]->getKruispunten()[i]->getBaan1() == simulatie->getBanen()[b]->getNaam()){
                    positie = simulatie->getBanen()[b]->getKruispunten()[i]->getPositie1();
                    naam = simulatie->getBanen()[b]->getKruispunten()[i]->getBaan2();
                }
                else{
                    positie = simulatie->getBanen()[b]->getKruispunten()[i]->getPositie2();
                    naam = simulatie->getBanen()[b]->getKruispunten()[i]->getBaan1();
                }
                for (int j = 0; j < simulatie->getBanen()[b]->getSizeVoertuigen(); ++j) {
                    bool isOnKruispunt = false;
                    double temp = simulatie->getBanen()[b]->getVoertuigen()[j]->getPositie();
                    if (temp < positie) {
                        simulatie->getBanen()[b]->getVoertuigen()[j]->updateVoertuig();
                        if (simulatie
                        ->getBanen()[b]->getVoertuigen()[j]->getPositie() >= positie){
                            isOnKruispunt = true;
                        }
                        double delta = simulatie->getBanen()[b]->getVoertuigen()[j]->getPositie() - temp;
                        double newPos = simulatie->getBanen()[b]->getVoertuigen()[j]->getPositie() - delta;
                        simulatie
                        ->getBanen()[b]->getVoertuigen()[j]->setPositie(newPos, simulatie->getBanen());
                        if (isOnKruispunt){
                            int randomNum = rand() % 2 + 1;
                            if (randomNum == 1) {
                                for (int k = 0; k < simulatie->getSizeBanen(); ++k) {
                                    if (simulatie->getBanen()[k]->getNaam() == naam) {
                                        simulatie->getBanen()[b]->getVoertuigen()[j]->versnellen();
                                        simulatie->getBanen()[b]->getVoertuigen()[j]->setBaan(
                                                simulatie->getBanen()[k]->getNaam(), simulatie->getBanen());
                                        if (naam == simulatie->getBanen()[b]->getKruispunten()[i]->getBaan2()) {
                                            simulatie->getBanen()[b]->getVoertuigen()[j]->setPositie(
                                                    simulatie->getBanen()[b]->getKruispunten()[i]->getPositie2(),
                                                    simulatie->getBanen());
                                        } else {
                                            simulatie->getBanen()[b]->getVoertuigen()[j]->setPositie(
                                                    simulatie->getBanen()[b]->getKruispunten()[i]->getPositie1(),
                                                    simulatie->getBanen());
                                        }
                                        bool check = false;
                                        for (int l = 0; l < simulatie->getBanen()[k]->getSizeVoertuigen(); ++l) {
                                            if (simulatie->getBanen()[k]->getVoertuigen()[l]->getPositie() >
                                                simulatie->getBanen()[b]->getVoertuigen()[j]->getPositie()) {
                                                simulatie->getBanen()[b]->getVoertuigen()[j]->setNotLaatste();
                                                simulatie->getBanen()[k]->addInIndexVoertuigen(l,
                                                                                              simulatie->getBanen()[b]->getVoertuigen()[j]);
                                                simulatie->getBanen()[b]->delVoertuig(j);
                                                check = true;
                                                break;
                                            }
                                        }
                                        if (check == false) {
                                            simulatie->getBanen()[b]->getVoertuigen()[j]->setLaatste();
                                            if (simulatie->getBanen()[k]->getSizeVoertuigen() != 0) {
                                                int end = simulatie->getBanen()[k]->getSizeVoertuigen() - 1;
                                                simulatie->getBanen()[k]->getVoertuigen()[end]->setNotLaatste();
                                            }
                                            simulatie->getBanen()[k]->addVoertuigen(
                                                    simulatie->getBanen()[b]->getVoertuigen()[j]);
                                            simulatie->getBanen()[b]->delVoertuig(j);
                                        }
                                        break;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    myfile.close();
    bool test = FileExists("grafischeImpresie.txt");
    ENSURE(test == true, "Er werd geen grafischeImpresie aangemaakt");
}

