import assert from "node:assert/strict";
import test from "node:test";

import { planProse, proseFor, renderProse } from "../lib/prose-engine.ts";
import { sha256, sourceFingerprint, proseFingerprint } from "../lib/provenance.ts";
import type { SemanticBinder } from "../lib/semantic-ir.ts";

const binder = (
  id: string,
  name: string,
  typeText: string,
  role: SemanticBinder["role"],
  binderKind: SemanticBinder["binderKind"] = "explicit",
): SemanticBinder => ({ id, name, typeText, role, binderKind });

test("same-type binders merge and concrete types become English nouns", () => {
  const { prose } = proseFor(
    [
      binder("b0", "a", "ℝ", "quantified-object"),
      binder("b1", "b", "ℝ", "quantified-object"),
      binder("h0", "h", "a ≤ b", "hypothesis"),
    ],
    "a + 1 ≤ b + 1",
    "c",
    "polished",
  );
  assert.equal(prose, "Let a and b be real numbers. Suppose a ≤ b. Then a + 1 ≤ b + 1.");
  // the v1 transliteration is gone
  assert.doesNotMatch(prose, /for every/i);
  assert.doesNotMatch(prose, /the conclusion is/i);
  assert.doesNotMatch(prose, /assuming h/i);
});

test("instances fold into the carrier noun phrase and adjectival hypotheses fold into their object", () => {
  const { prose } = proseFor(
    [
      binder("a0", "α", "Type u", "quantified-object", "implicit"),
      binder("i0", "inst0", "TopologicalSpace α", "type-class-assumption", "instance"),
      binder("i1", "inst1", "T2Space α", "type-class-assumption", "instance"),
      binder("b0", "s", "Set α", "quantified-object"),
      binder("h0", "hs", "IsCompact s", "hypothesis"),
      binder("h1", "hne", "Set.Nonempty s", "hypothesis"),
    ],
    "∃ x ∈ s, ∀ y ∈ s, y ≤ x",
    "c",
    "polished",
  );
  assert.match(prose, /α be a Hausdorff topological space/);
  assert.match(prose, /s be a compact nonempty subset of α/);
});

test("one span may carry several refs, so idiomatic prose still covers every component", () => {
  const binders = [
    binder("b0", "s", "Set α", "quantified-object"),
    binder("h0", "hs", "IsCompact s", "hypothesis"),
  ];
  const planned = planProse(binders, "IsClosed s", "c", "polished");
  const spans = planned.sentences.flatMap((sentence) => sentence.spans);
  const refs = new Set(spans.flatMap((span) => span.refs));
  for (const id of ["b0", "h0", "c"]) assert.ok(refs.has(id), `${id} is unaccounted for`);
  // the folded hypothesis shares a span with the binder it constrains
  assert.ok(spans.some((span) => span.refs.length > 1));
});

test("suppression carries a justification; absence of one is a different state", () => {
  const planned = planProse(
    [
      binder("a0", "α", "Type u", "quantified-object", "implicit"),
      binder("i0", "inst0", "DecidableEq α", "type-class-assumption", "instance"),
      binder("b0", "s", "Finset α", "quantified-object"),
    ],
    "s.card = s.card",
    "c",
    "polished",
  );
  const decidable = planned.absorbed.find((item) => item.id === "i0");
  assert.ok(decidable, "DecidableEq should be absorbed, not dropped");
  assert.match(decidable!.why, /proof-irrelevant/);
});

test("an unrecognised typeclass is surfaced verbatim and blocks the structural claim", () => {
  const planned = planProse(
    [
      binder("a0", "α", "Type u", "quantified-object", "implicit"),
      binder("i0", "inst0", "IsFiniteMeasureOnCompacts α", "type-class-assumption", "instance"),
    ],
    "True",
    "c",
    "polished",
  );
  assert.equal(planned.approximate, true, "unknown class must mark the render approximate");
  assert.ok(planned.misses.some((miss) => miss.symbol === "IsFiniteMeasureOnCompacts"));
  assert.match(renderProse(planned, "plain"), /IsFiniteMeasureOnCompacts/);
});

test("coercion stripping keeps ascriptions so a theorem cannot read as a tautology", () => {
  const { prose } = proseFor(
    [binder("b0", "m", "ℕ", "quantified-object"), binder("b1", "n", "ℕ", "quantified-object")],
    "(↑m : α) ≤ ↑n ↔ m ≤ n",
    "c",
    "polished",
  );
  assert.match(prose, /if and only if/);
  assert.doesNotMatch(prose, /(m ≤ n) if and only if \1$/);
  assert.match(prose, /\(m : α\)/);
});

test("a hypothesis named in the conclusion keeps its name; an unused one does not", () => {
  const used = proseFor(
    [binder("b0", "p", "ℕ", "quantified-object"), binder("h0", "hp", "Nat.Prime p", "hypothesis")],
    "factorization p hp = 1",
    "c",
    "polished",
  ).prose;
  assert.match(used, /hp/);

  const unused = proseFor(
    [binder("b0", "p", "ℕ", "quantified-object"), binder("h0", "hp", "Nat.Prime p", "hypothesis")],
    "p ≠ 0",
    "c",
    "polished",
  ).prose;
  assert.doesNotMatch(unused, /hp/);
});

test("a bound variable is chosen fresh so filter limits do not capture", () => {
  const { prose } = proseFor(
    [binder("b0", "f", "α → β", "quantified-object"), binder("b1", "x", "α", "quantified-object")],
    "Filter.Tendsto f (nhds x) (nhds (f x))",
    "c",
    "polished",
  );
  assert.doesNotMatch(prose, /as x tends to x/);
  assert.match(prose, /tends to f\(x\) as y tends to x/);
});

test("provenance is SHA-256, not a hash-table function", () => {
  // RFC 6234 test vector
  assert.equal(sha256("abc"), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  assert.equal(sha256(""), "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
  assert.match(sourceFingerprint("theorem t : True := trivial"), /^sha256:[0-9a-f]{64}$/);
  assert.doesNotMatch(sourceFingerprint("x"), /fnv/);
});

test("the prose hash changes when the provenance mapping changes, not just the wording", () => {
  const a = proseFingerprint([{ mode: "text", text: "Let a be a real number.", refs: ["b0"] }]);
  const b = proseFingerprint([{ mode: "text", text: "Let a be a real number.", refs: ["b0", "h0"] }]);
  assert.notEqual(a, b);
});
