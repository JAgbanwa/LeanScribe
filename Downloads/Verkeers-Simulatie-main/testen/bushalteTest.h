//
// Created by elias on 27.04.22.
//

#ifndef VERKEERSSIMULATIE_BUSHALTETEST_H
#define VERKEERSSIMULATIE_BUSHALTETEST_H
#include    "../bushalte.h"
#include "../gtest/include/gtest/gtest.h"

class BushalteTest : public :: testing::Test{};

TEST_F(BushalteTest, testVariables){
    Bushalte* b1 = new Bushalte;
    ASSERT_EQ("", b1->getBaan());
    ASSERT_EQ(0, b1->getPositie());
    ASSERT_EQ(0, b1->getWachttijd());
    ASSERT_EQ(0.0166,b1->getSimulatietijd());
    ASSERT_EQ(0, b1->getTIjd());
    ASSERT_EQ(b1,b1->get_initCheck());
}

TEST_F(BushalteTest, testProperlyInitialized){
    Bushalte* b1 = new Bushalte;
    ASSERT_EQ(true, b1->properlyInitialized());
    Bushalte* b2 = new Bushalte;
    b1->set_initCheck(b2);
    bool temp = false;
    ASSERT_EQ(temp, b1->properlyInitialized());
}

TEST_F(BushalteTest, testFuncties){
    Bushalte* b1 = new Bushalte;
    Baan* b = new Baan;
    b->setNaam("turnhoutsebaan");
    b->setLengte(500);
    vector<Baan*> v;
    v.push_back(b);

    b1->setWachttijd(20);
    ASSERT_EQ(20, b1->getWachttijd());

    b1->setBaan("turnhoutsebaan", v);
    ASSERT_EQ("turnhoutsebaan", b1->getBaan());

    b1->setPositie(200, v);
    ASSERT_EQ(200, b1->getPositie());

    b1->updateTijd();
    ASSERT_EQ(0.0166, b1->getTIjd());

    bool test = false;
    ASSERT_EQ(test, b1->checkTijd());

    b1->setTijd(21);
    ASSERT_EQ(21, b1->getTIjd());

    bool test2 = true;
    ASSERT_EQ(test2, b1->checkTijd());

    b1->resetTIjd();
    ASSERT_EQ(0, b1->getTIjd());
}

#endif //VERKEERSSIMULATIE_BUSHALTETEST_H
