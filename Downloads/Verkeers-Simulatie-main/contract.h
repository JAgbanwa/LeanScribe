//
// Created by elias on 01.05.22.
//

#ifndef VERKEERSSIMULATIE_CONTRACT_H
#define VERKEERSSIMULATIE_CONTRACT_H
#include "cassert"


#define REQUIRE(assertion, what) \
	if (!(assertion)) __assert (what, __FILE__, __LINE__)

#define ENSURE(assertion, what) \
	if (!(assertion)) __assert (what, __FILE__, __LINE__)

#endif //VERKEERSSIMULATIE_CONTRACT_H
