//
// Created by Yassine on 17/04/2022.
//

#ifndef ZPSE_SIMULATIETEST_H
#define ZPSE_SIMULATIETEST_H
#include "../simulatie.h"
#include "../gtest/include/gtest/gtest.h"


class SimulatieTest : public ::testing::Test{};


TEST_F(SimulatieTest, testVariables){
    Simulatie* s1 = new Simulatie;
    ASSERT_EQ(0, s1->getTijd());
    ASSERT_EQ(0.0166, s1->getSimulatietijd());
    ASSERT_EQ(0, s1->getAantalVoertuigen());
    ASSERT_EQ(0, s1->getSizeBanen());
    ASSERT_EQ(s1, s1->get_initCheck());
}

TEST_F(SimulatieTest, testProperlyInitialized){
    Simulatie* s1 = new Simulatie;
    ASSERT_EQ(true, s1->properlyInitialized());
    Simulatie* s2 = new Simulatie;
    s1->set_initCheck(s2);
    bool temp = false;
    ASSERT_EQ(temp, s1->properlyInitialized());
}

TEST_F(SimulatieTest, testFuncties){
    Simulatie* s1 = new Simulatie;
    s1->tijdUpdate();
    ASSERT_EQ(0.0166, s1->getTijd());
    s1->addAantalVoertuig();
    ASSERT_EQ(1, s1->getAantalVoertuigen());
    s1->deleteAantalVoertuig();
    ASSERT_EQ(0, s1->getAantalVoertuigen());
    Baan* b1 = new Baan;
    s1->addBaan(b1);
    ASSERT_EQ(1, s1->getSizeBanen());
    vector<Baan*> test;
    test.push_back(b1);
    ASSERT_EQ(test, s1->getBanen());
}




#endif //ZPSE_SIMULATIETEST_H
