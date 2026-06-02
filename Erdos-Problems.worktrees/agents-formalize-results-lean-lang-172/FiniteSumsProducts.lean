/-
Finite Sums and Products Theorem

This file formalizes the main theorem that every finite colouring  containsof 
arbitrarily large finite sets whose distinct finite sums and distinct finite
products all have one common colour.

The proof is based on the finite sums-products theorem of Bergelson and Hindman,
which follows from the Milliken-Taylor theorem.
-/

import Mathlib.Data.Finset.Basic
import Mathlib.Data.Finset.Powerset
import Mathlib.Data.List.Sublists
import Mathlib.Combinatorics.Pigeonhole
import Mathlib.Data.Nat.Basic

namespace FiniteSumsProducts

/-!
## Definition of Finite Sums and Products

Given a finite set A of natural numbers, we define:
- FS(A): the set of all nonempty sums of distinct elements of A
- FP(A): the set of all nonempty products of distinct elements of A
-/

variable {
/-- Finite sums: the set of all nonempty sums of distinct elements of A -/
def FS (A : ) :  :=Set Finset 
 i in I, i}s = A I Nonempty Finset s | 

/-- Finite products: the set of all nonempty products of distinct elements of A -/
def FP (A : ) :  :=Set Finset 
 i in I, i}p = A I Nonempty Finset p | 

/-!
## Colourings and Monochromaticity
-/

/-- A colouring  into r colours -/of 
 Fin r

/-- A set S is monochromatic under a colouring  if all elements have the same colour -/
def Monochromatic {} ( : Colouring r) (S : ) : Prop :=Set r : 
 S,  s = cs r),   

/-- A set is monochromatic with respect to a specific colour -/
def MonochromaticWith {} ( : Colouring r) (S : ) (c : Fin r) : Prop :=Set r : 
 S,  s = cs   

/-- The colour class corresponding to colour c in colouring  -/
def ColorClass {} ( : Colouring r) (c : Fin r) :  :=Set r : 
  {n |  n = c}

/-!
## Main Theorem
-/

/-- Main Theorem: Every finite colouring  contains arbitrarily large finite setsof 
    whose distinct finite sums and products are all monochromatic.
-/
theorem main_theorem {} ( : Colouring r) () :m : r : 
 ( (c : Fin r),A. m Finset     
      FS   FP  ColorClass  c := byA c A 
  sorry -- The proof relies on the finite sums-products theorem (FSP)

/-!
## Finite Sums-Products Theorem (FSP)

This is the key theorem that underpins the main result.
-/

/-- Finite sums-products theorem:
    For every r-colouring , there exist distinct positive integersof 
    whose finite sums and products are monochromatic.
-/
theorem finite_sums_products_theorem {r } ( : Colouring r) :m : 
 (A : ), A. Nonempty m Finset     
 FS A,  c) s' r), A, s       (
 FP A,  p' = c) := byp' r), A, p       (
  sorry -- This follows from the Milliken-Taylor theorem

/-!
## Alternative Finite Bound Formulation

Theorem FSP can also be stated in terms of a finite bound.
-/

/-- For each r and m, there exists N = N(r,m) such that every r-colouring of {1,...,N}
    contains m distinct elements with monochromatic finite sums and products.
-/
theorem finite_bound_version (r ) :m : 
 Fin r),
 (A : Finset (Fin N)), A. Nonempty m       
        Monochromatic (a, ) (FS (Finset.map (Fin.val) A)) := bysorryfun () =>  a : 
  sorry

/-!
## Properties of FS and FP
-/

lemma fs_nonempty {A : } (hA : A.Nonempty) : (FS A).Nonempty := byFinset 
  a,  := hAhaobtain 
  use a
  {a}, Finset.singleton_nonempty a, Finset.singleton_subset_iff.mpr ha,exact 
           Finset.sum_singleton a

lemma fp_nonempty {A : } (hA : A.Nonempty) : (FP A).Nonempty := byFinset 
  a,  := hAhaobtain 
  use a
  {a}, Finset.singleton_nonempty a, Finset.singleton_subset_iff.mpr ha,exact 
           Finset.prod_singleton a

end FiniteSumsProducts
