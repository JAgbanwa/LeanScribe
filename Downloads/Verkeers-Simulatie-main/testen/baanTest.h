//
// Created by Yassine on 17/04/2022.
//

#ifndef ZPSE_BAANTEST_H
#define ZPSE_BAANTEST_H
#include "../voertuig.h"
#include "../gtest/include/gtest/gtest.h"


class BaanTest : public ::testing::Test{};



TEST_F(BaanTest, testVariables){
    Baan* b1 = new Baan;
    ASSERT_EQ("", b1->getNaam());
    ASSERT_EQ(0, b1->getLengte());
    ASSERT_EQ(0, b1->getSizeVoertuigen());
    ASSERT_EQ(0,b1->getSizeVerkeerslichten());
    ASSERT_EQ(0,b1->getSizeGenerator());
    ASSERT_EQ(0, b1->getSizeBushaltes());
    ASSERT_EQ(b1, b1->get_initCheck());
    ASSERT_EQ(0, b1->getSizeKruispunten());
}

TEST_F(BaanTest, testProperlyInitialized){
    Baan* b1 = new Baan;
    ASSERT_EQ(true, b1->properlyInitialized());
    Baan* b2 = new Baan;
    b1->set_initCheck(b2);
    bool temp = false;
    ASSERT_EQ(temp, b1->properlyInitialized());
}

TEST_F(BaanTest, testFuncties){
    Baan* b1 = new Baan;
    b1->setNaam("turnhoutsebaan");
    ASSERT_EQ("turnhoutsebaan", b1->getNaam());

    b1->setLengte(300);
    ASSERT_EQ(300, b1->getLengte());

    Voertuig* v1 = new Voertuig;
    b1->addVoertuigen(v1);
    ASSERT_EQ(1,b1->getSizeVoertuigen());

    vector<Voertuig*> test1;
    test1.push_back(v1);
    ASSERT_EQ(test1, b1->getVoertuigen());

    Bushalte* bu1 = new Bushalte;
    b1->addBushalte(bu1);
    ASSERT_EQ(1, b1->getSizeBushaltes());

    vector<Bushalte*> test4;
    test4.push_back(bu1);
    ASSERT_EQ(test4, b1->getBushaltes());

    Verkeerslicht* ve = new Verkeerslicht;
    b1->addVerkeerslicht(ve);
    ASSERT_EQ(1, b1->getSizeVerkeerslichten());

    vector<Verkeerslicht*> test2;
    test2.push_back(ve);
    ASSERT_EQ(test2, b1->getVerkeerslichten());

    Kruispunt* k1 = new Kruispunt;
    b1->addKruispunt(k1);
    ASSERT_EQ(1, b1->getSizeKruispunten());

    vector<Kruispunt*> test5;
    test5.push_back(k1);
    ASSERT_EQ(test5, b1->getKruispunten());

    Voertuiggenerator* vo = new Voertuiggenerator;
    b1->addVoertuiggenerator(vo);
    ASSERT_EQ(1,b1->getSizeGenerator());

    vector<Voertuiggenerator*> test3;
    test3.push_back(vo);
    ASSERT_EQ(test3, b1->getVoertuiggenerators());

    Voertuig* v2 = new Voertuig;
    vector<Baan*> v;
    v.push_back(b1);
    v2->setBaan("turnhoutsebaan", v);
    b1->addBeginVoertuig(v2);
    ASSERT_EQ(2, b1->getSizeVoertuigen());
    bool begin = false;
    if (b1->getVoertuigen()[0]->getBaan() == "turnhoutsebaan"){
        begin = true;
    }
    bool temp = true;
    ASSERT_EQ(temp, begin);

    Voertuig* v3 = new Voertuig;
    v3->setBaan("turnhoutsebaan", v);
    v3->voertuigType = v3->Auto;
    v3->setType();
    v3->setPositie(299.99, v);
    b1->addVoertuigen(v3);
    b1->getVoertuigen()[2]->updateVoertuig();
    bool test = b1->isOutOfBaan();
    ASSERT_EQ(true, test);
    ASSERT_EQ(2, b1->getSizeVoertuigen());

    b1->delVoertuig(0);
    ASSERT_EQ(1, b1->getSizeVoertuigen());
}

TEST_F(BaanTest, testAddInIndexVoertuigen){
    Baan* b1 = new Baan;
    Baan* b2 = new Baan;
    b1->setNaam("turnhoutsebaan");
    b2->setNaam("test");
    Voertuig* v2 = new Voertuig;
    Voertuig* v1 = new Voertuig;
    vector<Baan*> v;
    v.push_back(b1);
    v.push_back(b2);
    v1->setBaan("turnhoutsebaan", v);
    v2->setBaan("turnhoutsebaan", v);
    b1->addVoertuigen(v2);
    b1->addVoertuigen(v1);
    Voertuig* v3 = new Voertuig;
    v3->setBaan("test", v);
    b1->addInIndexVoertuigen(1, v3);
    ASSERT_EQ(3, b1->getSizeVoertuigen());
    bool begin = false;
    if (b1->getVoertuigen()[1]->getBaan() == "test"){
        begin = true;
    }
    bool temp = true;
    ASSERT_EQ(temp, begin);
}



#endif //ZPSE_BAANTEST_H
