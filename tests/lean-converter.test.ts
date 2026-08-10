import assert from "node:assert/strict";
import test from "node:test";

import { convertLean, mergeSemanticTranslation } from "../lib/lean-converter.ts";
import type { SemanticTranslation } from "../lib/semantic-schema.ts";

const SOURCE = `theorem preserved_theorem (p : Prop) : p → p := by
  intro hp
  exact hp

lemma preserved_lemma (n : Nat) : n = n := by
  rfl

corollary preserved_corollary (p : Prop) : p → p := by
  intro hp
  exact hp`;

test("parses theorem, lemma, and explicit corollary as distinct declaration types", () => {
  const result = convertLean(SOURCE, "Kinds.lean");

  assert.deepEqual(
    result.declarations.map(({ kind, name }) => ({ kind, name })),
    [
      { kind: "theorem", name: "preserved_theorem" },
      { kind: "lemma", name: "preserved_lemma" },
      { kind: "corollary", name: "preserved_corollary" },
    ],
  );
  assert.match(result.declarations[0].naturalLanguage, /^This theorem states:/);
  assert.match(result.declarations[1].naturalLanguage, /^This lemma states:/);
  assert.match(result.declarations[2].naturalLanguage, /^This corollary states:/);
  assert.match(result.tex, /Natural-language Theorem/);
  assert.match(result.tex, /Natural-language Lemma/);
  assert.match(result.tex, /Natural-language Corollary/);
  assert.match(result.csv, /"natural_language_kind"/);
});

test("source declaration type overrides an expert-model reclassification", () => {
  const local = convertLean(SOURCE, "Kinds.lean");
  const semantic: SemanticTranslation = {
    title: "Kinds",
    overview: "Three declarations.",
    prerequisites: [],
    declarations: local.declarations.map((declaration) => ({
      kind: declaration.kind === "theorem" ? "lemma" : declaration.kind,
      name: declaration.name,
      sourceSignature: declaration.leanType,
      naturalLanguage: `A precise prose statement for ${declaration.name}.`,
      mathematicalStatementLatex: declaration.latex,
      proofStrategy: "The visible proof introduces the hypothesis and returns it.",
      dependencies: [],
      confidence: "high",
      caveats: [],
    })),
    glossary: [],
    warnings: [],
  };

  const merged = mergeSemanticTranslation(local, semantic, "test-model");

  assert.deepEqual(
    merged.declarations.map(({ kind }) => kind),
    ["theorem", "lemma", "corollary"],
  );
});
