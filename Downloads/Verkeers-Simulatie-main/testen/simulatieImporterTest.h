//
// Created by elias on 03.05.22.
//

#ifndef VERKEERSSIMULATIE_VERKEERSSIMULATIETEST_H
#define VERKEERSSIMULATIE_VERKEERSSIMULATIETEST_H
#include "../simulatieImporter.h"
#include "../gtest/include/gtest/gtest.h"

class SimulatieImporterTest : public ::testing::Test{};

TEST_F(SimulatieImporterTest, testVariables){
    SimulatieImporter* v1 = new SimulatieImporter;
    ASSERT_EQ(v1, v1->get_initCheck());
}

TEST_F(SimulatieImporterTest, testProperlyInitialized){
    SimulatieImporter* ve1 = new SimulatieImporter;
    ASSERT_EQ(true, ve1->properlyInitialized());
    SimulatieImporter* ve2 = new SimulatieImporter;
    ve1->set_initCheck(ve2);
    bool temp = false;
    ASSERT_EQ(temp, ve1->properlyInitialized());
}
#endif //VERKEERSSIMULATIE_VERKEERSSIMULATIETEST_H