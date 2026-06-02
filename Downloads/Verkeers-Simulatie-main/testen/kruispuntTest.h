//
// Created by elias on 30.04.22.
//

#ifndef VERKEERSSIMULATIE_KRUISPUNTTEST_H
#define VERKEERSSIMULATIE_KRUISPUNTTEST_H
#include "../kruispunt.h"
#include "../gtest/include/gtest/gtest.h"

class KruispuntTest : public :: testing::Test{};

TEST_F(KruispuntTest, testVariables){
    Kruispunt* k1 = new Kruispunt;
    ASSERT_EQ("", k1->getBaan1());
    ASSERT_EQ("", k1->getBaan2());
    ASSERT_EQ(0, k1->getPositie1());
    ASSERT_EQ(0, k1->getPositie2());
    ASSERT_EQ(k1, k1->get_initCheck());
}

TEST_F(KruispuntTest, testProperlyInitialized){
    Kruispunt* k1 = new Kruispunt;
    ASSERT_EQ(true, k1->properlyInitialized());
    Kruispunt* k2 = new Kruispunt;
    k1->set_initCheck(k2);
    bool temp = false;
    ASSERT_EQ(temp, k1->properlyInitialized());
}

TEST_F(KruispuntTest, testFuncties){
    Kruispunt* k1 = new Kruispunt;
    k1->setBaan1("Middelheimlaan");
    ASSERT_EQ("Middelheimlaan", k1->getBaan1());
    k1->setBaan2("Turnhoutsebaan");
    ASSERT_EQ("Turnhoutsebaan", k1->getBaan2());
    k1->setPositie1(12);
    ASSERT_EQ(12, k1->getPositie1());
    k1->setPositie2(20);
    ASSERT_EQ(20, k1->getPositie2());
}
#endif //VERKEERSSIMULATIE_KRUISPUNTTEST_H
