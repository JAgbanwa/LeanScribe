#!/usr/bin/env node
/**
 * Prose engine eval harness.
 *
 * Point it at a JSONL dump of `leanscribe.semantic-ir.v1` bundles (one per line) and it
 * reports the numbers that decide whether the tool is real:
 *
 *   trust distribution   — how many declarations pass structural checks, and why the
 *                          rest do not
 *   unmapped components  — formal content no prose span accounts for
 *   approximation rate   — string-level fallbacks, which withhold the structural claim
 *   lexicon work queue   — which typeclasses and predicate heads block the most
 *                          declarations, ranked
 *
 * The last table is the point. "83% pass" is a vanity metric; "these twelve lexicon
 * entries unblock 340 declarations" is a plan.
 *
 *   node --experimental-strip-types scripts/prose-eval.mjs mathlib-sample.jsonl
 *   node --experimental-strip-types scripts/prose-eval.mjs sample.jsonl --json
 */

import { readFileSync } from "node:fs";

import { publicationFromSemanticIR, isSemanticIRBundle } from "../lib/semantic-ir.ts";

const args = process.argv.slice(2);
const asJson = args.includes("--json");
const path = args.find((arg) => !arg.startsWith("--"));

if (!path) {
  console.error("usage: prose-eval.mjs <semantic-ir.jsonl> [--json]");
  process.exit(2);
}

const bundles = readFileSync(path, "utf8")
  .split("\n")
  .filter(Boolean)
  .map((line, index) => {
    try {
      return JSON.parse(line);
    } catch (error) {
      console.error(`line ${index + 1}: ${error.message}`);
      return null;
    }
  })
  .filter(Boolean);

const gaps = new Map();
const failures = [];
let total = 0;
let passed = 0;
let approximate = 0;
let unmapped = 0;
let rejected = 0;

for (const bundle of bundles) {
  if (!isSemanticIRBundle(bundle)) {
    rejected += 1;
    continue;
  }
  let publication;
  try {
    publication = publicationFromSemanticIR(bundle);
  } catch (error) {
    failures.push({ name: bundle.module, error: error.message });
    continue;
  }

  for (const declaration of publication.declarations) {
    total += 1;
    const trace = declaration.trace;
    if (trace.highestTrustEligible) passed += 1;
    if (trace.approximate) approximate += 1;
    unmapped += trace.unmapped;

    for (const gap of trace.lexiconGaps) {
      if (!gaps.has(gap)) gaps.set(gap, new Set());
      gaps.get(gap).add(declaration.name);
    }
    if (trace.unmapped > 0) {
      failures.push({
        name: declaration.name,
        unmapped: trace.entries
          .filter((entry) => entry.status === "unmapped")
          .map((entry) => entry.formalText),
      });
    }
  }
}

const queue = [...gaps.entries()]
  .map(([gap, declarations]) => ({ gap, blocks: declarations.size }))
  .sort((a, b) => b.blocks - a.blocks);

const report = {
  bundles: bundles.length,
  rejectedBundles: rejected,
  declarations: total,
  structurallyChecked: passed,
  passRate: total ? Number((passed / total).toFixed(4)) : 0,
  approximateRate: total ? Number((approximate / total).toFixed(4)) : 0,
  unmappedComponents: unmapped,
  lexiconWorkQueue: queue.slice(0, 40),
  failures: failures.slice(0, 50),
};

if (asJson) {
  console.log(JSON.stringify(report, null, 2));
  process.exit(0);
}

const pct = (value) => `${(value * 100).toFixed(1)}%`;
console.log(`\nLeanScribe prose eval — ${report.declarations} declarations from ${report.bundles} bundle(s)`);
console.log("─".repeat(62));
console.log(`  structurally checked : ${passed} (${pct(report.passRate)})`);
console.log(`  approximate render   : ${approximate} (${pct(report.approximateRate)})  — claim withheld`);
console.log(`  unmapped components  : ${unmapped}`);
if (rejected) console.log(`  rejected bundles     : ${rejected} (failed schema validation)`);

if (queue.length) {
  console.log(`\nLexicon work queue — add these next`);
  console.log("─".repeat(62));
  for (const item of queue.slice(0, 20)) {
    console.log(`  ${String(item.blocks).padStart(5)}  ${item.gap}`);
  }
}
if (failures.length) {
  console.log(`\nLedger failures`);
  console.log("─".repeat(62));
  for (const failure of failures.slice(0, 15)) {
    console.log(`  ${failure.name}: ${failure.error ?? failure.unmapped.join("; ")}`);
  }
}
console.log();
