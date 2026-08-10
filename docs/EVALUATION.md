# Evaluation program

LeanScribe’s primary success metric is semantic fidelity, not prose fluency.

## Gold corpus

Build a 200–500 declaration Lean 4/mathlib corpus reviewed independently by at least one experienced Lean user and one working mathematician. Cover algebra, analysis, topology, number theory, combinatorics, probability/measure theory, category theory, dependent types, custom notation/macros, constructive/classical results, and incomplete/custom-axiom declarations.

ProofNet and Lean Workbook can seed examples, but they are not substitutes for this modern Lean 4 benchmark.

## Metrics

| Dimension | Release metric |
| --- | --- |
| Fidelity | Binder, hypothesis, domain, connective, quantifier-order, and conclusion preservation |
| Coverage | Semantic IR components mapped to prose; any unmapped component blocks the highest badge |
| Naturalness | Blind mathematician ratings by target voice and expertise level |
| Usefulness | Time to understand and time to produce an acceptable edited statement |
| Robustness | Stability under formatting, notation, naming, and source-order changes |
| Calibration | Error rate conditioned on confidence and trust state |
| Consistency | Terminology drift across a module/project |
| Performance | Extraction/render latency, throughput, peak memory, and optional model cost |
| Accessibility | Screen-reader comprehension and alternate-format correctness |

## Mutation testing

Every gold declaration should receive targeted semantic mutations:

- change a domain (`Nat` to `Int`, `Real` to `Complex`);
- reverse or reorder quantifiers;
- remove or add a hypothesis;
- change implication to equivalence or equality to inequality;
- remove uniqueness, finiteness, nonemptiness, measurability, or topology assumptions;
- alter a constant, coercion, instance binder, or conclusion component.

The generated literal prose and ledger must change at the corresponding span. A mutation that leaves the trusted publication unchanged is a release blocker.

## Release gates

1. No highest-trust badge for unelaborated, incomplete-coverage, or unmapped content.
2. Every visible sentence links to a declaration and every literal clause links to semantic IR.
3. Axiom, `sorryAx`, native-evaluation, Lean version, and provenance fields survive every export.
4. All semantic mutations are detected by the publication diff.
5. Expert reviewers sign off on benchmark regressions before a renderer release.
