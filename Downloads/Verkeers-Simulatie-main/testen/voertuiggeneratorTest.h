//
// Created by Yassine on 17/04/2022.
//

#ifndef ZPSE_VOERTUIGGENERATORTEST_H
#define ZPSE_VOERTUIGGENERATORTEST_H
#include "../voertuiggenerator.h"
#include "../gtest/include/gtest/gtest.h"


class VoertuiggeneratorTest : public ::testing::Test{};


TEST_F(VoertuiggeneratorTest, testVariables){
    Voertuiggenerator* vo1 = new Voertuiggenerator;
    ASSERT_EQ("", vo1->getBaan());
    ASSERT_EQ(0, vo1->getFrequentie());
    ASSERT_EQ(0,vo1->getTijd());
    ASSERT_EQ(0.0166, vo1->getSimulatietijd());
    ASSERT_EQ(vo1, vo1->get_initCheck());
}

TEST_F(VoertuiggeneratorTest, testProperlyInitialized){
    Voertuiggenerator* vo1 = new Voertuiggenerator;
    ASSERT_EQ(true, vo1->properlyInitialized());
    Voertuiggenerator* vo2 = new Voertuiggenerator;
    vo1->set_initCheck(vo2);
    bool temp = false;
    ASSERT_EQ(temp, vo1->properlyInitialized());
}

TEST_F(VoertuiggeneratorTest, testFuncties){
    Voertuiggenerator *vo1 = new Voertuiggenerator;
    Baan* b1 = new Baan;
    b1->setNaam("turnhoutsebaan");
    vector<Baan*> v;
    v.push_back(b1);
    vo1->setBaan("turnhoutsebaan", v);
    ASSERT_EQ("turnhoutsebaan", vo1->getBaan());
    vo1->updateTijd();
    ASSERT_EQ(0.0166, vo1->getTijd());
    bool test = vo1->addVoertuig();
    bool temp = true;
    ASSERT_EQ(temp, test);
    vo1->setFrequentie(5);
    ASSERT_EQ(5, vo1->getFrequentie());
    bool test2 = vo1->addVoertuig();
    bool temp2 = false;
    ASSERT_EQ(temp2, test2);
    vo1->resetTijd();
    ASSERT_EQ(0,vo1->getTijd());
}
#endif //ZPSE_VOERTUIGGENERATORTEST_H
