namespace LeanScribe.ExtractorFixture

/-- Every natural number is equal to itself. -/
theorem reflexive_nat (n : Nat) : n = n := by
  rfl

theorem implication_identity (p : Prop) (hp : p) : p := by
  exact hp

theorem incomplete_example : True := by
  sorry

end LeanScribe.ExtractorFixture
