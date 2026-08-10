# Product roadmap

This roadmap separates implemented behavior from architectural intent. A checkbox means code and a repeatable verification exist in this repository.

## Milestone 1 — Trusted statement renderer

- [x] Lean 4 module import through the target project environment.
- [x] Elaborated declaration type, ordered binders, binder visibility, conclusion, dependency, documentation, and source-range extraction.
- [x] Transitive axiom, `sorryAx`, native-evaluation, Lean version, and Lean commit reporting.
- [x] Versioned semantic IR and browser import.
- [x] Deterministic literal renderer and per-component coverage ledger.
- [x] Explicit unelaborated/provisional versus elaborated/structural trust states.
- [x] HTML, Markdown, TeX, PDF, CSV, and JSON publication outputs.
- [x] Domain/conclusion mutation tests.
- [ ] InfoTree-based expression-to-source spans and phrase-level synchronized highlighting.
- [ ] Cryptographic source hash, repository URL/commit, import graph, toolchain lock, and extraction wall-clock provenance.
- [ ] Preserve the author’s exact `theorem`/`lemma` command and support explicit `corollary`/title overrides.
- [ ] `.leanscribe.toml` terminology, notation, pluralization, classification, and rendering rules.
- [ ] 200–500 declaration Lean 4/mathlib gold benchmark with dual expert review.
- [ ] Accessible MathML and equation descriptions.

## Milestone 2 — Polished publishing

- [ ] Constrained semantic-IR prose model with post-generation coverage validation.
- [ ] Sentence-level regeneration and accepted-terminology locks.
- [ ] Searchable project outline, module batches, stable labels, cross-references, terminology/notation indexes, and definition-before-use organization.
- [ ] Journal templates, custom preambles, bibliography hooks, Unicode/traditional TeX modes, and diff-friendly generated files.
- [ ] GitHub App with read-only repository access and documentation previews on pull requests.
- [ ] CLI/API/CI integration and doc-gen4 interoperation.

## Milestone 3 — Accessibility and reach

- [ ] Multilingual generation directly from semantic IR using language/domain glossaries.
- [ ] Project terminology dictionaries and community-reviewed lexicons.
- [ ] Pedagogical and expertise modes, interactive definition expansion, and accessible HTML/MathML.
- [ ] Public library browser, stable citations, embeddable theorem cards, and version comparison.
- [ ] “Do not retain,” deletion/retention controls, provider audit, regional processing, and self-hosted confidential mode.

## Milestone 4 — Proof explanations

- [ ] Extract proof structure without conflating tactic implementation with mathematical exposition.
- [ ] Step-level explanations grounded in formal steps.
- [ ] Recursive summarization with several proof-detail levels.
- [ ] Visible separation between kernel-backed steps and generated narrative.

Proof explanation ships only after statement rendering meets its fidelity and calibration gates.
