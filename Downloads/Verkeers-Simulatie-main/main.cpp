#include "simulatieImporter.h"
#include "fstream"
using namespace std;

int main() {
    SimulatieImporter* s = new SimulatieImporter;
    Simulatie* simulatie = new Simulatie;
    ofstream myfile;
    myfile.open("error.txt");
    if (s->importSimulatie("testXmlFiles/legalSimulatie1.xml", myfile, simulatie) == Success)
        s->runSimulatie(simulatie, false);
    return 0;
}