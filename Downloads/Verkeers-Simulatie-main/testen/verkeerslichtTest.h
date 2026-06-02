//
// Created by Yassine on 17/04/2022.
//

#ifndef ZPSE_VERKEERSLICHTTEST_H
#define ZPSE_VERKEERSLICHTTEST_H
#include "../verkeerslicht.h"
#include "../gtest/include/gtest/gtest.h"


class VerkeerslichtTest : public ::testing::Test{};


TEST_F(VerkeerslichtTest, testVariables){
    Verkeerslicht* ve1 = new Verkeerslicht;
    ASSERT_EQ("", ve1->getBaan());
    ASSERT_EQ(0, ve1->getPositie());
    ASSERT_EQ(0,ve1->getCyclus());
    ASSERT_EQ("groen",ve1->getKleur());
    ASSERT_EQ(0, ve1->getTijd());
    ASSERT_EQ(0.0166, ve1->getSimulatietijd());
    ASSERT_EQ(0, ve1->getTijdOrangjeLimit());
    ASSERT_EQ(0, ve1->getTijdOrangje());
    ASSERT_EQ(0, ve1->getExtra());
    ASSERT_EQ(ve1, ve1->get_initCheck());
}

TEST_F(VerkeerslichtTest, testProperlyInitialized){
    Verkeerslicht* ve1 = new Verkeerslicht;
    ASSERT_EQ(true, ve1->properlyInitialized());
    Verkeerslicht* ve2 = new Verkeerslicht;
    ve1->set_initCheck(ve2);
    bool temp = false;
    ASSERT_EQ(temp, ve1->properlyInitialized());
}

TEST_F(VerkeerslichtTest, testFuncties){
    Verkeerslicht* ve1 = new Verkeerslicht;
    Baan* b1 = new Baan;
    b1->setNaam("turnhoutsebaan");
    b1->setLengte(500);
    vector<Baan*> v;
    v.push_back(b1);
    ve1->setBaan("turnhoutsebaan", v);
    ASSERT_EQ("turnhoutsebaan", ve1->getBaan());

    ve1->setPositie(200, v);
    ASSERT_EQ(200, ve1->getPositie());

    ve1->setCyclus(1);
    ASSERT_EQ(1, ve1->getCyclus());

    for (int i = 0; i < 65; ++i) {
        ve1->updateTijd();
    }
    double test = round(ve1->getTijd() * 10000)/10000.0;
    ASSERT_EQ(1.079, test);

    ve1->checkKleur();
    ASSERT_EQ("orangje", ve1->getKleur());
    for (int i = 0; i < 7; ++i) {
        ve1->updateTijdOrangje();
    }
    ve1->checkKleur();
    ASSERT_EQ("rood", ve1->getKleur());
    ASSERT_EQ(0, ve1->getTijd());
    ASSERT_EQ(0, ve1->getTijdOrangje());
    ASSERT_EQ(0, ve1->getExtra());

    ve1->setExtra(4);
    ASSERT_EQ(4, ve1->getExtra());

    ve1->setCyclus(30);
    ve1->berekenTijdOrangje();
    ASSERT_EQ(3, ve1->getTijdOrangjeLimit());

    ve1->updateTijdOrangje();
    ASSERT_EQ(0.0166, ve1->getTijdOrangje());
}
#endif //ZPSE_VERKEERSLICHTTEST_H
