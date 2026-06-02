//
// Created by Yassine on 17/04/2022.
//

#ifndef ZPSE_VOERTUIGTES_H
#define ZPSE_VOERTUIGTES_H
#include "../voertuig.h"
#include "../baan.h"
#include "../gtest/include/gtest/gtest.h"

class VoertuigTest : public ::testing::Test{};

TEST_F(VoertuigTest, testVariables) {
    Voertuig *v1 = new Voertuig;
    ASSERT_EQ("",v1->getBaan());
    ASSERT_EQ(0, v1->getPositie());
    ASSERT_EQ(0, v1->getSnelheid());
    ASSERT_EQ(0, v1->getVersnelling());
    ASSERT_EQ(0, v1->getAutoLengte());
    ASSERT_EQ(0.0166, v1->getSimulatieTijd());
    bool temp = false;
    ASSERT_EQ(temp, v1->getLaatste());
    ASSERT_EQ(0, v1->getVmax());
    ASSERT_EQ(0, v1->getvmax());
    ASSERT_EQ(0.4, v1->getS());
    ASSERT_EQ(0, v1->getBmax());
    ASSERT_EQ(0, v1->getAmax());
    ASSERT_EQ(v1, v1->get_initCheck());
}

TEST_F(VoertuigTest, testProperlyInitialized){
    Voertuig* v1 = new Voertuig;
    ASSERT_EQ(true, v1->properlyInitialized());
    Voertuig* v2 = new Voertuig;
    v1->set_initCheck(v2);
    bool temp = false;
    ASSERT_EQ(temp, v1->properlyInitialized());
}

TEST_F(VoertuigTest, testSetFuncties){
    Voertuig *v1 = new Voertuig;
    Baan *b1 = new Baan;
    b1->setNaam("test");
    b1->setLengte(500);
    vector<Baan*> v;
    v.push_back(b1);
    v1->setBaan("test", v);
    ASSERT_EQ("test", v1->getBaan());
    v1->setPositie(5, v);
    ASSERT_EQ(5,v1->getPositie());
    v1->setSnelheid(8.6);
    ASSERT_EQ(8.6,v1->getSnelheid());
    v1->setLaatste();
    bool temp = true;
    ASSERT_EQ(temp,v1->getLaatste());
    v1->voertuigType = v1->Auto;
    v1->setType();
    ASSERT_EQ(v1->Auto,v1->voertuigType);
    v1->setNotLaatste();
    temp = false;
    ASSERT_EQ(temp, v1->getLaatste());
}

TEST_F(VoertuigTest, testUpdateVoertuig){
    Voertuig *v1 = new Voertuig;
    v1->voertuigType = v1->Auto;
    v1->setType();
    v1->updateVoertuig();
    ASSERT_EQ(16.6,v1->getSnelheid());
    ASSERT_EQ(0.27556, v1->getPositie());
}

TEST_F(VoertuigTest, testUpdateVersnelling){
    Voertuig *v1 = new Voertuig;
    v1->voertuigType = v1->Auto;
    v1->setType();
    v1->updateVersnelling(10,12);
    double test = round(v1->getVersnelling() * 10000)/10000.0;
    ASSERT_DOUBLE_EQ(-50.1788, test);
}

TEST_F(VoertuigTest, testVertragen){
    Voertuig *v1 = new Voertuig;
    v1->voertuigType = v1->Auto;
    v1->setType();
    v1->vertragen();
    double test = round(v1->getvmax() * 10000)/10000.0;
    ASSERT_EQ(6.64,test);
}

TEST_F(VoertuigTest, testVersnellen){
    Voertuig *v1 = new Voertuig;
    v1->voertuigType = v1->Auto;
    v1->setType();
    v1->versnellen();
    ASSERT_EQ(16.6,v1->getvmax());
}

TEST_F(VoertuigTest, testStoppen){
    Voertuig *v1 = new Voertuig;
    v1->voertuigType = v1->Auto;
    v1->setType();
    v1->stoppen();
    ASSERT_EQ(-4.61, v1->getVersnelling());
}

TEST_F(VoertuigTest, testSetType){
    Voertuig *v1 = new Voertuig;
    v1->voertuigType = v1->Auto;
    v1->setType();
    ASSERT_EQ(4, v1->getAutoLengte());
    ASSERT_EQ(16.6, v1->getVmax());
    ASSERT_EQ(16.6, v1->getvmax());
    ASSERT_EQ(16.6, v1->getSnelheid());
    ASSERT_EQ(1.44, v1->getAmax());
    ASSERT_EQ(4.61, v1->getBmax());
    v1->voertuigType = v1->Bus;
    v1->setType();
    ASSERT_EQ(12, v1->getAutoLengte());
    ASSERT_EQ(11.4, v1->getVmax());
    ASSERT_EQ(11.4, v1->getvmax());
    ASSERT_EQ(11.4, v1->getSnelheid());
    ASSERT_EQ(1.22, v1->getAmax());
    ASSERT_EQ(4.29, v1->getBmax());
    v1->voertuigType = v1->Brandweerwagen;
    v1->setType();
    ASSERT_EQ(10, v1->getAutoLengte());
    ASSERT_EQ(14.6, v1->getVmax());
    ASSERT_EQ(14.6, v1->getvmax());
    ASSERT_EQ(14.6, v1->getSnelheid());
    ASSERT_EQ(1.33, v1->getAmax());
    ASSERT_EQ(4.56, v1->getBmax());
    v1->voertuigType = v1->Ziekenwagen;
    v1->setType();
    ASSERT_EQ(8, v1->getAutoLengte());
    ASSERT_EQ(15.5, v1->getVmax());
    ASSERT_EQ(15.5, v1->getvmax());
    ASSERT_EQ(15.5, v1->getSnelheid());
    ASSERT_EQ(1.44, v1->getAmax());
    ASSERT_EQ(4.47, v1->getBmax());
    v1->voertuigType = v1->Politiecombi;
    v1->setType();
    ASSERT_EQ(6, v1->getAutoLengte());
    ASSERT_EQ(17.2, v1->getVmax());
    ASSERT_EQ(17.2, v1->getvmax());
    ASSERT_EQ(17.2, v1->getSnelheid());
    ASSERT_EQ(1.55, v1->getAmax());
    ASSERT_EQ(4.92, v1->getBmax());
}
#endif //ZPSE_VOERTUIGTES_H
