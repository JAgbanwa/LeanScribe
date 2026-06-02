//
// Created by elias on 20.05.22.
//

#ifndef VERKEERSSIMULATIE_OUTPUTTEST_H
#define VERKEERSSIMULATIE_OUTPUTTEST_H
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

class OutputTest: public ::testing::Test {};

TEST_F(OutputTest, FileCompare) {
    ASSERT_TRUE(DirectoryExists("testOutput"));

    ofstream myfile;
    myfile.open("testOutput/file1.txt");
    myfile.close();
    myfile.open("testOutput/file2.txt");
    myfile.close();

    EXPECT_TRUE(FileExists("testOutput/file1.txt"));
    EXPECT_TRUE(FileExists("testOutput/file2.txt"));
    EXPECT_TRUE(FileIsEmpty("testOutput/file1.txt"));
    EXPECT_TRUE(FileIsEmpty("testOutput/file2.txt"));

    //compare an empty and a non-empty files
    myfile.open("testOutput/file1.txt");
    myfile << "xxx" << endl << "yyy";
    myfile.close();
    EXPECT_TRUE(FileExists("testOutput/file1.txt"));
    EXPECT_FALSE(FileIsEmpty("testOutput/file1.txt"));
    EXPECT_FALSE(FileCompare("testOutput/file1.txt", "testOutput/file2.txt"));
    EXPECT_FALSE(FileCompare("testOutput/file2.txt", "testOutput/file1.txt"));

    //compare two equal files
    myfile.open("testOutput/file2.txt");
    myfile << "xxx" << endl << "yyy";
    myfile.close();
    EXPECT_TRUE(FileExists("testOutput/file2.txt"));
    EXPECT_FALSE(FileIsEmpty("testOutput/file2.txt"));
    EXPECT_TRUE(FileCompare("testOutput/file1.txt", "testOutput/file2.txt"));
    EXPECT_TRUE(FileCompare("testOutput/file2.txt", "testOutput/file1.txt"));

    //compare 2 non-empty files which are off by a character in the middle
    myfile.open("testOutput/file2.txt");
    myfile << "xxx" << endl << "xyy";
    myfile.close();
    EXPECT_FALSE(FileCompare("testOutput/file1.txt", "testOutput/file2.txt"));
    EXPECT_FALSE(FileCompare("testOutput/file2.txt", "testOutput/file1.txt"));

    //compare 2 non-empty files where one is one character shorter than the other
    myfile.open("testOutput/file2.txt");
    myfile << "xxx" << endl << "yy";
    myfile.close();
    EXPECT_FALSE(FileCompare("testOutput/file1.txt", "testOutput/file2.txt"));
    EXPECT_FALSE(FileCompare("testOutput/file2.txt", "testOutput/file1.txt"));

    //compare existing against non existing file
    EXPECT_FALSE(
            FileCompare("testOutput/file1.txt", "testOutput/nonexisting.txt"));
    EXPECT_FALSE(
            FileCompare("testOutput/nonexisting.txt", "testOutput/file1.txt"));
}

TEST_F(OutputTest, OutputLegalSimulaties){
    ASSERT_TRUE(DirectoryExists("testOutput"));
    ASSERT_TRUE(DirectoryExists("testXmlFiles"));
    ASSERT_TRUE(FileExists("grafischeImpresie.txt"));

    ofstream myfile;
    SuccessEnum importResult;
    int fileCounter = 1;
    string fileName = "testXmlFiles/legalSimulatie" + SSTR(fileCounter) + ".xml";
    string outputFileName;

    while (FileExists(fileName.c_str())) {
        Simulatie *s = new Simulatie;
        myfile.open("error.txt");
        importResult = SimulatieImporter::importSimulatie(fileName.c_str(), myfile, s);
        myfile.close();
        EXPECT_TRUE(importResult == Success);
        SimulatieImporter::runSimulatie(s, true);
        outputFileName = "testOutput/legalSimulatie" + SSTR(fileCounter) + ".txt";


        EXPECT_TRUE(FileCompare("grafischeImpresie.txt", outputFileName));

        fileCounter += 1;
        fileName = "testXmlFiles/legalSimulatie" + SSTR(fileCounter) + ".xml";
    }
    EXPECT_TRUE(fileCounter == 8);
}


#endif //VERKEERSSIMULATIE_OUTPUTTEST_H
