import assert from "node:assert/strict";
import test from "node:test";

import { convertLean } from "../lib/lean-converter.ts";
import {
  buildProvisionalPublication,
  publicationFromSemanticIR,
  publicationToHtml,
  publicationToMarkdown,
  isSemanticIRBundle,
  type SemanticIRBundle,
} from "../lib/semantic-ir.ts";

const elaboratedBundle: SemanticIRBundle = {
  schemaVersion: "leanscribe.semantic-ir.v1",
  extractionStatus: "elaborated",
  module: "Fixture",
  leanVersion: "4.21.0",
  leanCommit: "test-commit",
  generatedAt: "2026-08-10T00:00:00Z",
  sourceHash: "sha256:test",
  declarations: [{
    id: "Fixture.reflexive",
    name: "Fixture.reflexive",
    namespaceName: "Fixture",
    kind: "theorem",
    originalCommand: "theorem",
    classificationSource: "source keyword",
    typeText: "(n : Nat) → n = n",
    conclusion: "n = n",
    binders: [{ id: "Fixture.reflexive:binder:0", name: "n", binderKind: "explicit", typeText: "Nat" }],
    dependencies: ["Nat"],
    axioms: ["propext"],
    usesSorry: false,
    usesNativeEvaluation: false,
    proofStatus: "kernel-accepted",
    docString: "Every natural number is equal to itself.",
    sourceLocation: { module: "Fixture", startLine: 4, startColumn: 0, endLine: 5, endColumn: 5 },
  }],
  trustStatement: "Generated from kernel-accepted declarations.",
};

test("raw source is always a provisional publication and cannot receive structural trust", () => {
  const source = "theorem identity (n : Nat) (h : n = n) : n = n := by exact h";
  const publication = buildProvisionalPublication(convertLean(source, "Identity.lean"), source, "Identity.lean");
  const declaration = publication.declarations[0];

  assert.equal(publication.extractionStatus, "unelaborated");
  assert.equal(declaration.trace.highestTrustEligible, false);
  assert.equal(declaration.trace.covered, 0);
  assert.ok(declaration.trace.entries.every((entry) => entry.status === "provisional"));
  assert.match(declaration.trust.statement, /no semantic trust claim/i);
});

test("elaborated IR maps every binder and conclusion into a coverage ledger", () => {
  const publication = publicationFromSemanticIR(elaboratedBundle);
  const declaration = publication.declarations[0];

  assert.equal(declaration.trace.total, 2);
  assert.equal(declaration.trace.covered, 2);
  assert.equal(declaration.trace.complete, true);
  assert.equal(declaration.trace.highestTrustEligible, true);
  assert.deepEqual(declaration.trust.axioms, ["propext"]);
  assert.equal(declaration.trust.usesSorry, false);
  assert.match(declaration.literalProse, /n : Nat/);
  assert.match(declaration.literalProse, /n = n/);
});

test("semantic mutations change the literal publication and ledger", () => {
  const mutatedDomain = structuredClone(elaboratedBundle);
  mutatedDomain.declarations[0].binders[0].typeText = "Int";
  mutatedDomain.declarations[0].typeText = "(n : Int) → n = n";

  const mutatedConclusion = structuredClone(elaboratedBundle);
  mutatedConclusion.declarations[0].conclusion = "n ≠ n";

  const baseline = publicationFromSemanticIR(elaboratedBundle).declarations[0];
  const domain = publicationFromSemanticIR(mutatedDomain).declarations[0];
  const conclusion = publicationFromSemanticIR(mutatedConclusion).declarations[0];

  assert.notEqual(domain.literalProse, baseline.literalProse);
  assert.match(domain.literalProse, /Int/);
  assert.notEqual(conclusion.literalProse, baseline.literalProse);
  assert.match(conclusion.literalProse, /n ≠ n/);
});

test("HTML and Markdown exports retain formal trace and trust information", () => {
  const publication = publicationFromSemanticIR(elaboratedBundle);
  assert.match(publicationToHtml(publication), /Formal content/);
  assert.match(publicationToHtml(publication), /structural checks/);
  assert.match(publicationToMarkdown(publication), /\| Role \| Formal content \| Prose span \| Status \|/);
});

test("semantic bundle validation rejects a label-only spoof", () => {
  assert.equal(isSemanticIRBundle(elaboratedBundle), true);
  assert.equal(isSemanticIRBundle({
    schemaVersion: "leanscribe.semantic-ir.v1",
    extractionStatus: "elaborated",
    declarations: [{}],
  }), false);
});
