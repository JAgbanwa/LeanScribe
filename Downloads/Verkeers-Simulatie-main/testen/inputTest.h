//
// Created by elias on 15.05.22.
//

#ifndef VERKEERSSIMULATIE_INPUTTEST_H
#define VERKEERSSIMULATIE_INPUTTEST_H
#include <iostream>
#include <fstream>
#include <string>
#include <bitset>
#include "../gtest/include/gtest/gtest.h"
#include "../simulatieUtils.h"
#include "../simulatieImporter.h"
#define SSTR( x ) static_cast< std::ostringstream & >( \
        ( std::ostringstream() << std::dec << x ) ).str()
using namespace std;

class InputTest: public ::testing::Test {};

TEST_F(InputTest, InputLegalSimulaties){
    ASSERT_TRUE(DirectoryExists("testXmlFiles"));
    ASSERT_TRUE(DirectoryExists("testCorrectXml"));

    ofstream myfile;
    SuccessEnum importResult;
    int fileCounter = 1;
    string fileName = "testXmlFiles/legalSimulatie" + SSTR(fileCounter) + ".xml";
    string errorfileName;

    while (FileExists(fileName.c_str())){
        Simulatie* s = new Simulatie;
        importResult = SimulatieImporter::importSimulatie(fileName.c_str(), myfile, s);
        EXPECT_TRUE(importResult == Success);
        if (fileCounter == 1){
            ASSERT_EQ(1, s->getSizeBanen());
            ASSERT_EQ("Middelheimlaan", s->getBanen()[0]->getNaam());
            ASSERT_EQ(150, s->getBanen()[0]->getLengte());
            ASSERT_EQ(1, s->getBanen()[0]->getSizeVerkeerslichten());
            ASSERT_EQ(50, s->getBanen()[0]->getVerkeerslichten()[0]->getPositie());
            ASSERT_EQ(2, s->getBanen()[0]->getVerkeerslichten()[0]->getCyclus());
            ASSERT_EQ(1, s->getBanen()[0]->getSizeVoertuigen());
            ASSERT_EQ(0, s->getBanen()[0]->getVoertuigen()[0]->getPositie());
            ASSERT_EQ(4, s->getBanen()[0]->getVoertuigen()[0]->voertuigType);
        }
        else if (fileCounter == 2){
            ASSERT_EQ(2, s->getSizeBanen());
            ASSERT_EQ("Middelheimlaan", s->getBanen()[0]->getNaam());
            ASSERT_EQ(150, s->getBanen()[0]->getLengte());
            ASSERT_EQ("Turnhoutsebaan", s->getBanen()[1]->getNaam());
            ASSERT_EQ(200, s->getBanen()[1]->getLengte());
            ASSERT_EQ(1, s->getBanen()[0]->getSizeKruispunten());
            ASSERT_EQ(50, s->getBanen()[0]->getKruispunten()[0]->getPositie1());
            ASSERT_EQ(100, s->getBanen()[0]->getKruispunten()[0]->getPositie2());
            ASSERT_EQ(1, s->getBanen()[1]->getSizeKruispunten());
            ASSERT_EQ(50, s->getBanen()[1]->getKruispunten()[0]->getPositie1());
            ASSERT_EQ(100, s->getBanen()[1]->getKruispunten()[0]->getPositie2());
            ASSERT_EQ(1, s->getBanen()[0]->getSizeVoertuigen());
            ASSERT_EQ(0, s->getBanen()[0]->getVoertuigen()[0]->getPositie());
            ASSERT_EQ(1, s->getBanen()[0]->getVoertuigen()[0]->voertuigType);
            ASSERT_EQ(1, s->getBanen()[1]->getSizeVoertuigen());
            ASSERT_EQ(0, s->getBanen()[1]->getVoertuigen()[0]->getPositie());
            ASSERT_EQ(2, s->getBanen()[1]->getVoertuigen()[0]->voertuigType);
        }
        else if (fileCounter == 3){
            ASSERT_EQ(1, s->getSizeBanen());
            ASSERT_EQ("Middelheimlaan", s->getBanen()[0]->getNaam());
            ASSERT_EQ(300, s->getBanen()[0]->getLengte());
            ASSERT_EQ(1, s->getBanen()[0]->getSizeVerkeerslichten());
            ASSERT_EQ(200, s->getBanen()[0]->getVerkeerslichten()[0]->getPositie());
            ASSERT_EQ(10, s->getBanen()[0]->getVerkeerslichten()[0]->getCyclus());
            ASSERT_EQ(2, s->getBanen()[0]->getSizeBushaltes());
            ASSERT_EQ(100, s->getBanen()[0]->getBushaltes()[0]->getPositie());
            ASSERT_EQ(10, s->getBanen()[0]->getBushaltes()[0]->getWachttijd());
            ASSERT_EQ(250, s->getBanen()[0]->getBushaltes()[1]->getPositie());
            ASSERT_EQ(10, s->getBanen()[0]->getBushaltes()[1]->getWachttijd());
            ASSERT_EQ(2, s->getBanen()[0]->getSizeVoertuigen());
            ASSERT_EQ(0, s->getBanen()[0]->getVoertuigen()[0]->getPositie());
            ASSERT_EQ(2, s->getBanen()[0]->getVoertuigen()[0]->voertuigType);
            ASSERT_EQ(10, s->getBanen()[0]->getVoertuigen()[1]->getPositie());
            ASSERT_EQ(1, s->getBanen()[0]->getVoertuigen()[1]->voertuigType);
        }
        else if(fileCounter == 4){
            ASSERT_EQ(1, s->getSizeBanen());
            ASSERT_EQ("Turnhoutsebaan", s->getBanen()[0]->getNaam());
            ASSERT_EQ(150, s->getBanen()[0]->getLengte());
            ASSERT_EQ(2, s->getBanen()[0]->getSizeVoertuigen());
            ASSERT_EQ(0, s->getBanen()[0]->getVoertuigen()[0]->getPositie());
            ASSERT_EQ(2, s->getBanen()[0]->getVoertuigen()[0]->voertuigType);
            ASSERT_EQ(10, s->getBanen()[0]->getVoertuigen()[1]->getPositie());
            ASSERT_EQ(2, s->getBanen()[0]->getVoertuigen()[1]->voertuigType);
            ASSERT_EQ(1, s->getBanen()[0]->getSizeVerkeerslichten());
            ASSERT_EQ(100, s->getBanen()[0]->getVerkeerslichten()[0]->getPositie());
            ASSERT_EQ(5, s->getBanen()[0]->getVerkeerslichten()[0]->getCyclus());
        }
        else if (fileCounter == 5){
            ASSERT_EQ(1, s->getSizeBanen());
            ASSERT_EQ("Middelheimlaan", s->getBanen()[0]->getNaam());
            ASSERT_EQ(150, s->getBanen()[0]->getLengte());
            ASSERT_EQ(1, s->getBanen()[0]->getSizeVoertuigen());
            ASSERT_EQ(0, s->getBanen()[0]->getVoertuigen()[0]->getPositie());
            ASSERT_EQ(1, s->getBanen()[0]->getVoertuigen()[0]->voertuigType);
            ASSERT_EQ(1, s->getBanen()[0]->getSizeBushaltes());
            ASSERT_EQ(50, s->getBanen()[0]->getBushaltes()[0]->getPositie());
            ASSERT_EQ(5, s->getBanen()[0]->getBushaltes()[0]->getWachttijd());
        }
        else if (fileCounter == 6){
            ASSERT_EQ(1, s->getSizeBanen());
            ASSERT_EQ("Middelheimlaan", s->getBanen()[0]->getNaam());
            ASSERT_EQ(150, s->getBanen()[0]->getLengte());
            ASSERT_EQ(1, s->getBanen()[0]->getSizeVoertuigen());
            ASSERT_EQ(0, s->getBanen()[0]->getVoertuigen()[0]->getPositie());
            ASSERT_EQ(3, s->getBanen()[0]->getVoertuigen()[0]->voertuigType);
            ASSERT_EQ(1, s->getBanen()[0]->getSizeVerkeerslichten());
            ASSERT_EQ(100, s->getBanen()[0]->getVerkeerslichten()[0]->getPositie());
            ASSERT_EQ(5, s->getBanen()[0]->getVerkeerslichten()[0]->getCyclus());
            ASSERT_EQ(1, s->getBanen()[0]->getSizeBushaltes());
            ASSERT_EQ(50, s->getBanen()[0]->getBushaltes()[0]->getPositie());
            ASSERT_EQ(5, s->getBanen()[0]->getBushaltes()[0]->getWachttijd());
        }
        else if (fileCounter == 7){
            ASSERT_EQ(1, s->getSizeBanen());
            ASSERT_EQ("Middelheimlaan", s->getBanen()[0]->getNaam());
            ASSERT_EQ(150, s->getBanen()[0]->getLengte());
            ASSERT_EQ(1, s->getBanen()[0]->getSizeVoertuigen());
            ASSERT_EQ(0, s->getBanen()[0]->getVoertuigen()[0]->getPositie());
            ASSERT_EQ(2, s->getBanen()[0]->getVoertuigen()[0]->voertuigType);
            ASSERT_EQ(1, s->getBanen()[0]->getSizeBushaltes());
            ASSERT_EQ(50, s->getBanen()[0]->getBushaltes()[0]->getPositie());
            ASSERT_EQ(5, s->getBanen()[0]->getBushaltes()[0]->getWachttijd());
        }
        fileCounter += 1;
        fileName = "testXmlFiles/legalSimulatie" + SSTR(fileCounter) + ".xml";
    }
    EXPECT_TRUE(fileCounter == 8);
}

TEST_F(InputTest, InputXMLSyntaxErrors){
    ASSERT_TRUE(DirectoryExists("testXmlFiles"));
    ASSERT_TRUE(DirectoryExists("testCorrectXml"));

    ofstream myfile;
    SuccessEnum importResult;
    int fileCounter = 1;
    string fileName = "testXmlFiles/xmlSyntaxError" + SSTR(fileCounter) + ".xml";
    string errorfileName;
    Simulatie* s = new Simulatie;
    while (FileExists(fileName.c_str())){
        myfile.open("error.txt");
        importResult = SimulatieImporter::importSimulatie(fileName.c_str(), myfile, s);
        myfile.close();
        EXPECT_TRUE(importResult == ImportAborted);
        errorfileName = "testCorrectXml/xmlSyntaxError" + SSTR(fileCounter) + ".txt";
        EXPECT_TRUE(FileCompare("error.txt", errorfileName));
        fileCounter += 1;
        fileName = "testXmlFiles/xmlSyntaxError" + SSTR(fileCounter) + ".xml";
    }
    EXPECT_TRUE(fileCounter == 10);
}

TEST_F(InputTest, InputIllegalSimulaties){
    ASSERT_TRUE(DirectoryExists("testXmlFiles"));
    ASSERT_TRUE(DirectoryExists("testCorrectXml"));
    ofstream myfile;
    SuccessEnum importResult;
    int fileCounter = 1;
    string fileName = "testXmlFiles/illegalSimulatie" + SSTR(fileCounter) + ".xml";
    string errorfileName;
    Simulatie* s = new Simulatie;

    while (FileExists(fileName.c_str())){
        myfile.open("error.txt");
        importResult = SimulatieImporter::importSimulatie(fileName.c_str(), myfile, s);
        myfile.close();
        EXPECT_TRUE(importResult == PartialImport);
        errorfileName = "testCorrectXml/illegalSimulatie" + SSTR(fileCounter) + ".txt";
        bool test = FileCompare("error.txt", errorfileName);
        if (test == false){
            cout << fileCounter << endl;
        }
        EXPECT_TRUE(FileCompare("error.txt", errorfileName));

        fileCounter += 1;
        fileName = "testXmlFiles/illegalSimulatie" + SSTR(fileCounter) + ".xml";
    }
    EXPECT_TRUE(fileCounter == 26);
}
#endif //VERKEERSSIMULATIE_INPUTTEST_H
