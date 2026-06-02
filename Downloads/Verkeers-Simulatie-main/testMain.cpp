//
// Created by elias on 13.04.22.
//
#include "testen/simulatieImporterTest.h"
#include "testen/simulatieTest.h"
#include "testen/baanTest.h"
#include "testen/voertuigTest.h"
#include "testen/verkeerslichtTest.h"
#include "testen/voertuiggeneratorTest.h"
#include "testen/bushalteTest.h"
#include "testen/kruispuntTest.h"
#include "testen/inputTest.h"
#include "testen/outputTest.h"

int main(int argc, char **argv){
    testing::InitGoogleTest(&argc, argv);
    return RUN_ALL_TESTS();
}