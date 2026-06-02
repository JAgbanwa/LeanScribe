//
// Created by elias on 03.05.22.
//

#ifndef VERKEERSSIMULATIE_NULLPTR_H
#include "string"
#define VERKEERSSIMULATIE_NULLPTR_H
using namespace std;

const                         /* this is a const object...     */
class nullptr_t
{
public:
    template<class T>          /* convertible to any type       */
    operator T*() const        /* of null non-member            */
    { return 0; }           /* pointer...                    */

    template<class C, class T> /* or any type of null           */
    operator T C::*() const /* member pointer...             */
    { return 0; }

private:
    void operator&() const;    /* Can't take address of nullptr */

} MyNullptr = {};               /* and whose name is nullptr     */

#endif //VERKEERSSIMULATIE_NULLPTR_H
