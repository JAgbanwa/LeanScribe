/**
 * LeanScribe prose engine.
 *
 * Replaces the binder-by-binder transliteration in `literalBinderProse`. Two changes:
 *
 * 1. PROSE IS PLANNED, NOT TEMPLATED. Same-type binders merge, instances fold into the
 *    carrier noun phrase, concrete types become English nouns, unary adjectival
 *    hypotheses fold into the object they constrain, unused hypothesis names are
 *    dropped, and the "the conclusion is" scaffolding is gone.
 *
 * 2. PROVENANCE IS EMITTED, NOT RECOVERED. The planner returns `ProseSpan[]`, each span
 *    carrying the binder ids it expresses. `coverageFromSpans` inverts that map. This is
 *    what lets the ledger stay complete while the prose reads idiomatically: "let $f, g$
 *    be continuous real-valued functions on $\alpha$" is ONE span with FOUR refs, so no
 *    1:1 component→clause correspondence is required.
 *
 * A component may instead be ABSORBED — deliberately not surfaced — but absorption
 * requires a written justification and is reported separately from coverage. That is the
 * difference between suppressing a component and losing one.
 *
 * LIMITATION: this operates on pretty-printed type text, not an expression tree. Fine for
 * binder types and short conclusions, wrong for deep nesting. Every string-level fallback
 * sets `approximate`, which callers must use to withhold the structural trust claim.
 */

import type { SemanticBinder } from "./semantic-ir.ts";

export type ProseRegister = "literal" | "polished" | "explanatory";

export type ProseSpan = {
  text: string;
  mode: "text" | "math";
  /** ids of the formal components this span expresses */
  refs: string[];
};

export type ProseSentence = {
  role: "setup" | "hypotheses" | "conclusion" | "statement" | "gloss" | "note";
  spans: ProseSpan[];
};

export type AbsorbedComponent = {
  id: string;
  /** why it is legitimate not to surface this in prose */
  why: string;
  /** the component that determines it, when there is one */
  by: string | null;
};

export type LexiconMiss = { kind: "typeclass" | "predicate"; symbol: string };

export type PlannedProse = {
  register: ProseRegister;
  sentences: ProseSentence[];
  absorbed: AbsorbedComponent[];
  notes: string[];
  misses: LexiconMiss[];
  /** a string-level fallback fired; the structural claim must be withheld */
  approximate: boolean;
};

/* ------------------------------------------------------------------ *
 * Symbol tables
 * ------------------------------------------------------------------ */

const UNICODE_TO_LATEX: Record<string, string> = {
  "ℝ": "\\mathbb{R}", "ℂ": "\\mathbb{C}", "ℚ": "\\mathbb{Q}", "ℤ": "\\mathbb{Z}",
  "ℕ": "\\mathbb{N}", "𝔽": "\\mathbb{F}", "𝕜": "\\Bbbk",
  "≤": "\\le", "≥": "\\ge", "≠": "\\ne", "≈": "\\approx", "≡": "\\equiv",
  "∼": "\\sim", "≃": "\\simeq", "≅": "\\cong", "∣": "\\mid", "∤": "\\nmid",
  "∈": "\\in", "∉": "\\notin", "⊆": "\\subseteq", "⊂": "\\subset", "⊇": "\\supseteq",
  "∪": "\\cup", "∩": "\\cap", "∅": "\\emptyset", "⋃": "\\bigcup", "⋂": "\\bigcap",
  "∀": "\\forall", "∃": "\\exists", "¬": "\\lnot", "∧": "\\land", "∨": "\\lor",
  "→": "\\to", "↔": "\\leftrightarrow", "⇒": "\\Rightarrow", "↦": "\\mapsto",
  "∘": "\\circ", "×": "\\times", "⁻¹": "^{-1}", "∑": "\\sum", "∏": "\\prod",
  "∫": "\\int", "√": "\\sqrt", "±": "\\pm", "·": "\\cdot", "•": "\\cdot",
  "∂": "\\partial", "∇": "\\nabla", "⊕": "\\oplus", "⊗": "\\otimes",
  "⊤": "\\top", "⊥": "\\bot", "∞": "\\infty", "≫": "\\gg", "≪": "\\ll",
  "𝓝": "\\mathcal{N}", "𝓤": "\\mathcal{U}", "𝓕": "\\mathcal{F}", "𝒫": "\\mathcal{P}",
  "α": "\\alpha", "β": "\\beta", "γ": "\\gamma", "δ": "\\delta", "ε": "\\varepsilon",
  "ζ": "\\zeta", "η": "\\eta", "θ": "\\theta", "ι": "\\iota", "κ": "\\kappa",
  "λ": "\\lambda", "μ": "\\mu", "ν": "\\nu", "ξ": "\\xi", "π": "\\pi", "ρ": "\\rho",
  "σ": "\\sigma", "τ": "\\tau", "φ": "\\varphi", "χ": "\\chi", "ψ": "\\psi", "ω": "\\omega",
  "Γ": "\\Gamma", "Δ": "\\Delta", "Θ": "\\Theta", "Λ": "\\Lambda", "Ξ": "\\Xi",
  "Π": "\\Pi", "Σ": "\\Sigma", "Φ": "\\Phi", "Ω": "\\Omega",
  "‖": "\\|", "⌊": "\\lfloor", "⌋": "\\rfloor", "⌈": "\\lceil", "⌉": "\\rceil",
  "⟨": "\\langle", "⟩": "\\rangle",
};

const SCRIPTS: Record<string, string> = {
  "₀": "_0", "₁": "_1", "₂": "_2", "₃": "_3", "₄": "_4", "₅": "_5", "₆": "_6",
  "₇": "_7", "₈": "_8", "₉": "_9", "ₙ": "_n", "ᵢ": "_i", "ⱼ": "_j", "ₖ": "_k",
  "⁰": "^0", "¹": "^1", "²": "^2", "³": "^3", "⁴": "^4", "ⁿ": "^n",
  "✝": "", // Lean's inaccessible-name marker
};

/**
 * Namespaces a mathematician silently drops. Dropping one of these is idiomatic and does
 * NOT make the rendering approximate; anything else is a guess and costs a trust tier.
 */
const SAFE_NAMESPACES = new Set([
  "Nat", "Int", "Rat", "Real", "Complex", "Set", "Finset", "List", "Multiset",
  "Filter", "Function", "Polynomial", "Matrix", "Metric",
]);

type ClassEntry =
  | { kind: "noun"; text: string; rank: number }
  | { kind: "adj"; text: string }
  | { kind: "silent"; why: string };

/** How an instance binder reads on the carrier it is indexed by. */
const TYPECLASS_LEXICON: Record<string, ClassEntry> = {
  TopologicalSpace: { kind: "noun", text: "topological space", rank: 1 },
  MetricSpace: { kind: "noun", text: "metric space", rank: 3 },
  PseudoMetricSpace: { kind: "noun", text: "pseudometric space", rank: 2 },
  MeasurableSpace: { kind: "noun", text: "measurable space", rank: 3 },
  MeasureSpace: { kind: "noun", text: "measure space", rank: 4 },
  NormedAddCommGroup: { kind: "noun", text: "normed space", rank: 4 },
  NormedSpace: { kind: "noun", text: "normed space", rank: 4 },
  InnerProductSpace: { kind: "noun", text: "inner product space", rank: 5 },
  Module: { kind: "noun", text: "module", rank: 3 },
  AddCommGroup: { kind: "noun", text: "abelian group", rank: 2 },
  CommGroup: { kind: "noun", text: "abelian group", rank: 2 },
  Group: { kind: "noun", text: "group", rank: 1 },
  Monoid: { kind: "noun", text: "monoid", rank: 1 },
  Semiring: { kind: "noun", text: "semiring", rank: 1 },
  OrderedSemiring: { kind: "noun", text: "ordered semiring", rank: 2 },
  CommRing: { kind: "noun", text: "commutative ring", rank: 3 },
  Ring: { kind: "noun", text: "ring", rank: 2 },
  Field: { kind: "noun", text: "field", rank: 4 },
  LinearOrderedField: { kind: "noun", text: "linearly ordered field", rank: 5 },
  LinearOrder: { kind: "noun", text: "linearly ordered set", rank: 1 },
  CompactSpace: { kind: "adj", text: "compact" },
  T2Space: { kind: "adj", text: "Hausdorff" },
  CompleteSpace: { kind: "adj", text: "complete" },
  SeparableSpace: { kind: "adj", text: "separable" },
  ConnectedSpace: { kind: "adj", text: "connected" },
  Fintype: { kind: "adj", text: "finite" },
  Finite: { kind: "adj", text: "finite" },
  Nonempty: { kind: "adj", text: "nonempty" },
  Countable: { kind: "adj", text: "countable" },
  Inhabited: { kind: "adj", text: "inhabited" },
  // Structural noise: real content, but no mathematician writes it down. Recorded as
  // absorbed with a justification rather than silently dropped.
  DecidableEq: { kind: "silent", why: "decidability of equality; proof-irrelevant scaffolding" },
  Decidable: { kind: "silent", why: "decidability instance; proof-irrelevant scaffolding" },
  Inv: { kind: "silent", why: "notation class implied by the ambient structure" },
  Mul: { kind: "silent", why: "notation class implied by the ambient structure" },
  Add: { kind: "silent", why: "notation class implied by the ambient structure" },
  Zero: { kind: "silent", why: "notation class implied by the ambient structure" },
  One: { kind: "silent", why: "notation class implied by the ambient structure" },
  Neg: { kind: "silent", why: "notation class implied by the ambient structure" },
  Sub: { kind: "silent", why: "notation class implied by the ambient structure" },
  Coe: { kind: "silent", why: "coercion instance" },
  CoeFun: { kind: "silent", why: "coercion instance" },
  FunLike: { kind: "silent", why: "bundled-morphism coercion instance" },
};

type PredicateEntry = {
  arity: number;
  adjectival: boolean;
  subjectIndex?: number;
  render: (args: string[], m: (s: string) => string) => string;
};

/** Head symbol → English clause. */
const PREDICATE_LEXICON: Record<string, PredicateEntry> = {
  Continuous: { arity: 1, adjectival: true, render: (a, m) => `${m(a[0])} is continuous` },
  ContinuousAt: { arity: 2, adjectival: false, render: (a, m) => `${m(a[0])} is continuous at ${m(a[1])}` },
  ContinuousOn: { arity: 2, adjectival: false, render: (a, m) => `${m(a[0])} is continuous on ${m(a[1])}` },
  Differentiable: { arity: 2, adjectival: true, subjectIndex: 1, render: (a, m) => `${m(a[1])} is differentiable` },
  Measurable: { arity: 1, adjectival: true, render: (a, m) => `${m(a[0])} is measurable` },
  Integrable: { arity: 1, adjectival: true, render: (a, m) => `${m(a[0])} is integrable` },
  Monotone: { arity: 1, adjectival: true, render: (a, m) => `${m(a[0])} is monotone` },
  StrictMono: { arity: 1, adjectival: true, render: (a, m) => `${m(a[0])} is strictly increasing` },
  Antitone: { arity: 1, adjectival: true, render: (a, m) => `${m(a[0])} is antitone` },
  Summable: { arity: 1, adjectival: false, render: (a, m) => `the series ${m("\\sum " + a[0])} converges` },
  HasSum: { arity: 2, adjectival: false, render: (a, m) => `${m(a[0])} sums to ${m(a[1])}` },
  Irrational: { arity: 1, adjectival: true, render: (a, m) => `${m(a[0])} is irrational` },
  "Nat.Prime": { arity: 1, adjectival: true, render: (a, m) => `${m(a[0])} is prime` },
  Prime: { arity: 1, adjectival: true, render: (a, m) => `${m(a[0])} is prime` },
  IsCompact: { arity: 1, adjectival: true, render: (a, m) => `${m(a[0])} is compact` },
  IsOpen: { arity: 1, adjectival: true, render: (a, m) => `${m(a[0])} is open` },
  IsClosed: { arity: 1, adjectival: true, render: (a, m) => `${m(a[0])} is closed` },
  IsConnected: { arity: 1, adjectival: true, render: (a, m) => `${m(a[0])} is connected` },
  "Set.Finite": { arity: 1, adjectival: true, render: (a, m) => `${m(a[0])} is finite` },
  "Set.Nonempty": { arity: 1, adjectival: true, render: (a, m) => `${m(a[0])} is nonempty` },
  "Function.Injective": { arity: 1, adjectival: true, render: (a, m) => `${m(a[0])} is injective` },
  "Function.Surjective": { arity: 1, adjectival: true, render: (a, m) => `${m(a[0])} is surjective` },
  "Function.Bijective": { arity: 1, adjectival: true, render: (a, m) => `${m(a[0])} is bijective` },
  DenseRange: { arity: 1, adjectival: true, render: (a, m) => `${m(a[0])} has dense range` },
  Isometry: { arity: 1, adjectival: true, render: (a, m) => `${m(a[0])} is an isometry` },
};

/** Concrete types → the noun phrase a paper would use. */
const TYPE_LEXICON: Array<{ match: RegExp; phrase: (g: RegExpMatchArray, m: (s: string) => string) => string }> = [
  { match: /^(?:ℕ|Nat)$/, phrase: () => "natural number" },
  { match: /^(?:ℤ|Int)$/, phrase: () => "integer" },
  { match: /^(?:ℚ|Rat)$/, phrase: () => "rational number" },
  { match: /^ℝ$/, phrase: () => "real number" },
  { match: /^ℂ$/, phrase: () => "complex number" },
  { match: /^(?:ENNReal|ℝ≥0∞)$/, phrase: () => "extended nonnegative real" },
  { match: /^Prop$/, phrase: () => "proposition" },
  { match: /^Set\s+(.+)$/, phrase: (g, m) => `subset of ${m(g[1])}` },
  { match: /^Finset\s+(.+)$/, phrase: (g, m) => `finite subset of ${m(g[1])}` },
  { match: /^List\s+(.+)$/, phrase: (g, m) => `list of elements of ${m(g[1])}` },
  { match: /^(.+?)\s*→\s*ℝ$/, phrase: (g, m) => `real-valued function on ${m(g[1])}` },
  { match: /^(.+?)\s*→\s*ℂ$/, phrase: (g, m) => `complex-valued function on ${m(g[1])}` },
  { match: /^ℕ\s*→\s*(.+)$/, phrase: (g, m) => `sequence in ${m(g[1])}` },
  { match: /^MeasureTheory\.Measure\s+(.+)$/, phrase: (g, m) => `measure on ${m(g[1])}` },
  // generic function type — keep after the specific cases
  { match: /^([^→]+?)\s*→\s*([^→]+)$/, phrase: (g, m) => `function from ${m(g[1])} to ${m(g[2])}` },
  // a bare single token is a carrier introduced earlier in the same statement
  { match: /^([A-Za-zα-ωΑ-Ω][A-Za-z0-9_'α-ωΑ-Ω]*)$/, phrase: (g, m) => `element of ${m(g[1])}` },
];

/* ------------------------------------------------------------------ *
 * Expression rendering
 * ------------------------------------------------------------------ */

const UNI_KEYS = Object.keys(UNICODE_TO_LATEX).sort((a, b) => b.length - a.length);
const MARK = "\u0001";
const UNKNOWN = "\u0003";
/** Placeholder for the subject when extracting the adjectival form of a predicate. */
const SUBJECT = "@@subject@@";
const SUBJECT_PREFIX = new RegExp(`${SUBJECT}\\s*(is|has)\\s*`);

type Sink = { notes: string[]; misses: LexiconMiss[]; approximate: boolean };

/**
 * Strip Lean's coercion arrows but KEEP type ascriptions. Reducing
 * `(↑m : α) ≤ ↑n ↔ m ≤ n` to `m ≤ n ↔ m ≤ n` renders a real theorem as a visible
 * tautology, which is the worst failure mode this tool has.
 */
function stripCoercions(source: string): { text: string; stripped: number } {
  let stripped = 0;
  const text = source.replace(/[↑⇑↥]/g, () => {
    stripped += 1;
    return "";
  });
  return { text, stripped };
}

function mathToLatex(source: string, sink: Sink): string {
  const { text, stripped } = stripCoercions(source);
  if (stripped > 0) {
    sink.notes.push(`${stripped} coercion arrow(s) removed for readability`);
  }
  let value = text;

  value = value.replace(/\b(?:fun|λ)\s+([^=,]+?)\s*(?:=>|,|↦)\s*/g, (_m, v: string) => `${v.trim()} \\mapsto `);
  value = value.replace(/([∀∃])\s*([^,]+?),\s*/g, (_m, q: string, v: string) => `${q} ${v.trim()},\\; `);
  value = value.replace(
    /([∑∏])\s*([A-Za-z0-9_]+)\s+(?:in|∈)\s+([A-Za-z0-9_.]+)\s*,\s*/g,
    (_m, op: string, v: string, dom: string) => `${op}_{${v} \\in ${dom}} `,
  );

  for (const [key, replacement] of Object.entries(SCRIPTS)) value = value.split(key).join(replacement);
  for (const key of UNI_KEYS) {
    if (value.includes(key)) value = value.split(key).join(`${UNICODE_TO_LATEX[key]} `);
  }

  value = value.replace(/\b((?:[A-Z][A-Za-z0-9]*\.)+)([a-zA-Z][A-Za-z0-9_']*)/g, (whole, ns: string, tail: string) => {
    const root = ns.split(".")[0];
    if (!SAFE_NAMESPACES.has(root)) {
      sink.approximate = true;
      sink.notes.push(`unrecognised namespace "${root}" in "${whole}"; rendering is a guess`);
    }
    return `\\mathrm{${tail}}`;
  });

  if (/[✝†]/.test(source)) {
    sink.approximate = true;
    sink.notes.push("inaccessible (machine-generated) name present in source");
  }

  return value
    .replace(/\s+([)\]},;])/g, "$1")
    .replace(/([([{])\s+/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function splitApplication(expr: string): { head: string; args: string[] } | null {
  const source = expr.trim();
  const head = source.match(/^([A-Za-z_][A-Za-z0-9_'.]*)\s/);
  if (!head) return null;
  const args: string[] = [];
  let depth = 0;
  let current = "";
  for (const ch of source.slice(head[1].length)) {
    if ("([{⟨".includes(ch)) depth += 1;
    if (")]}⟩".includes(ch)) depth -= 1;
    if (ch === " " && depth === 0) {
      if (current.trim()) args.push(current.trim());
      current = "";
    } else current += ch;
  }
  if (current.trim()) args.push(current.trim());
  return { head: head[1], args: args.map((a) => a.replace(/^\((.*)\)$/, "$1")) };
}

function splitTopLevel(source: string, op: string): [string, string] | null {
  let depth = 0;
  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i];
    if ("([{⟨".includes(ch)) depth += 1;
    else if (")]}⟩".includes(ch)) depth -= 1;
    else if (depth === 0 && ch === op) return [source.slice(0, i).trim(), source.slice(i + 1).trim()];
  }
  return null;
}

function article(word: string): string {
  return /^[aeiou]/i.test(word.trim()) ? "an" : "a";
}

function joinList(items: string[], conjunction = "and"): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} ${conjunction} ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, ${conjunction} ${items[items.length - 1]}`;
}

function pluralise(phrase: string): string {
  const [head, ...tail] = phrase.split(/\s+(of|on|in|from|to)\s+/);
  const words = head.trim().split(" ");
  const last = words[words.length - 1];
  words[words.length - 1] = /(s|x|z|ch|sh)$/.test(last)
    ? `${last}es`
    : /[^aeiou]y$/.test(last)
      ? `${last.slice(0, -1)}ies`
      : `${last}s`;
  return [words.join(" "), ...tail].join(" ").replace(/\s+(of|on|in|from|to)\s+/g, " $1 ");
}

/** A bound variable not already free in `taken`, so `Tendsto f (𝓝 x) (𝓝 (f x))` does not
 *  render as "f(x) tends to f x as x tends to x". */
function freshVar(taken: string[], preferred = ["x", "y", "t", "u", "v", "w"]): string {
  const joined = taken.join(" ");
  return (
    preferred.find((v) => !new RegExp(`(^|[^A-Za-z0-9_'])${v}([^A-Za-z0-9_']|$)`).test(joined)) ?? "x_0"
  );
}

const text = (value: string, refs: string[] = []): ProseSpan => ({ text: value, mode: "text", refs });
const math = (value: string, refs: string[] = []): ProseSpan => ({ text: value, mode: "math", refs });

function interleave(template: string, refs: string[]): ProseSpan[] {
  return template
    .split(MARK)
    .map((chunk, i) => (chunk === "" ? null : i % 2 === 1 ? math(chunk, refs) : text(chunk, refs)))
    .filter((span): span is ProseSpan => span !== null);
}

type Clause = {
  spans: ProseSpan[];
  adjectival: string | null;
  subject: string | null;
  matched: boolean;
};

function propClause(expr: string, refs: string[], sink: Sink): Clause {
  const source = expr.trim();
  const wrap = (s: string) => `${MARK}${mathToLatex(s, sink)}${MARK}`;

  const iff = splitTopLevel(source, "↔");
  if (iff) {
    const left = propClause(iff[0], refs, sink);
    const right = propClause(iff[1], refs, sink);
    return {
      spans: [...left.spans, text(" if and only if ", refs), ...right.spans],
      adjectival: null,
      subject: null,
      matched: true,
    };
  }

  const app = splitApplication(source);
  if (app) {
    if (app.head === "Filter.Tendsto" && app.args.length === 3) {
      const [fn, from, to] = app.args;
      const strip = (s: string) => s.replace(/^(nhds|𝓝)\s*/, "").replace(/^\((.*)\)$/, "$1");
      if (/^(nhds|𝓝)/.test(from) && /^(nhds|𝓝)/.test(to)) {
        const v = freshVar(app.args);
        return {
          spans: interleave(
            `${wrap(`${fn}(${v})`)} tends to ${wrap(strip(to))} as ${wrap(v)} tends to ${wrap(strip(from))}`,
            refs,
          ),
          adjectival: null, subject: null, matched: true,
        };
      }
      if (/atTop/.test(from) && /^(nhds|𝓝)/.test(to)) {
        const v = freshVar(app.args, ["n", "k", "m", "i"]);
        return {
          spans: interleave(
            `${wrap(`${fn}(${v})`)} converges to ${wrap(strip(to))} as ${wrap(`${v} \\to \\infty`)}`,
            refs,
          ),
          adjectival: null, subject: null, matched: true,
        };
      }
      return {
        spans: interleave(`${wrap(fn)} tends to ${wrap(to)} along ${wrap(from)}`, refs),
        adjectival: null, subject: null, matched: true,
      };
    }

    const lex = PREDICATE_LEXICON[app.head];
    if (lex && app.args.length >= lex.arity) {
      const args = app.args.slice(-lex.arity);
      const subjectIndex = lex.subjectIndex ?? 0;
      return {
        spans: interleave(lex.render(args, wrap), refs),
        adjectival: lex.adjectival
          ? lex.render(args, () => SUBJECT).replace(SUBJECT_PREFIX, "").trim()
          : null,
        subject: lex.adjectival ? args[subjectIndex] : null,
        matched: true,
      };
    }

    if (!/[=≤≥<>≠∈∉⊆∣+\-*/]/.test(source.split(/\s/)[1] ?? "")) {
      sink.misses.push({ kind: "predicate", symbol: app.head });
    }
  }

  // No lexicon entry: emit the relation as inline math rather than inventing English.
  return { spans: [math(mathToLatex(source, sink), refs)], adjectival: null, subject: null, matched: false };
}

/* ------------------------------------------------------------------ *
 * Planner
 * ------------------------------------------------------------------ */

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function isTypeBinder(binder: SemanticBinder): boolean {
  return /^(Type|Sort)\b/.test(binder.typeText);
}

/**
 * @param binders   binders in declaration order
 * @param conclusion pretty-printed conclusion
 * @param conclusionId id used for the conclusion row in the coverage ledger
 */
export function planProse(
  binders: SemanticBinder[],
  conclusion: string,
  conclusionId: string,
  register: ProseRegister = "polished",
): PlannedProse {
  const sink: Sink = { notes: [], misses: [], approximate: false };
  const absorbed: AbsorbedComponent[] = [];
  const sentences: ProseSentence[] = [];

  const types = binders.filter((b) => isTypeBinder(b));
  const instances = binders.filter((b) => b.role === "type-class-assumption");
  const objects = binders.filter((b) => b.role === "quantified-object" && !isTypeBinder(b));
  const hypotheses = binders.filter((b) => b.role === "hypothesis");

  // Dependency reconstruction. A Lean extractor supplies this directly; a source scan
  // cannot, so the result is approximate and callers must not claim otherwise.
  const all = [...binders.map((b) => b.typeText), conclusion];
  const usedElsewhere = (binder: SemanticBinder): boolean => {
    const re = new RegExp(`(^|[^A-Za-z0-9_'])${escapeRe(binder.name)}([^A-Za-z0-9_']|$)`);
    return binders.some((o) => o.id !== binder.id && re.test(o.typeText)) || re.test(conclusion);
  };
  const referencedInConclusion = (binder: SemanticBinder): boolean =>
    new RegExp(`(^|[^A-Za-z0-9_'])${escapeRe(binder.name)}([^A-Za-z0-9_']|$)`).test(conclusion);
  void all;

  /* 1. instances attach to whatever binder they are indexed by */
  const carrierInstances = new Map<string, Array<{ comp: SemanticBinder; lex?: ClassEntry; head: string }>>();
  for (const instance of instances) {
    const app = splitApplication(instance.typeText) ?? { head: instance.typeText.trim(), args: [] };
    const lex = TYPECLASS_LEXICON[app.head];
    if (lex && lex.kind === "silent") {
      absorbed.push({ id: instance.id, why: lex.why, by: null });
      continue;
    }
    const carrier = app.args.find((a) => binders.some((b) => b.name === a.trim()));
    if (!carrier) {
      absorbed.push({ id: instance.id, why: `instance ${app.head} has no binder-valued carrier`, by: null });
      continue;
    }
    if (!carrierInstances.has(carrier)) carrierInstances.set(carrier, []);
    carrierInstances.get(carrier)!.push({ comp: instance, lex, head: app.head });
  }

  const carrierPhrase = (name: string, headless = false) => {
    const attached = carrierInstances.get(name) ?? [];
    const nouns = attached
      .filter((a) => a.lex?.kind === "noun")
      .sort((a, b) => ((b.lex as { rank: number }).rank ?? 0) - ((a.lex as { rank: number }).rank ?? 0));
    const adjectives = attached.filter((a) => a.lex?.kind === "adj").map((a) => (a.lex as { text: string }).text);
    const unknown = attached.filter((a) => !a.lex);
    if (unknown.length) {
      // An unrecognised class means we do not know what the statement asserts. Surface it
      // verbatim AND refuse the structural claim.
      sink.approximate = true;
      sink.notes.push(`no lexicon entry for typeclass ${unknown.map((u) => u.head).join(", ")}`);
      for (const u of unknown) sink.misses.push({ kind: "typeclass", symbol: u.head });
    }
    for (const extra of nouns.slice(1)) adjectives.push((extra.lex as { text: string }).text);
    const head = nouns.length ? (nouns[0].lex as { text: string }).text : headless ? "" : "type";
    return {
      words: [...adjectives, head].filter(Boolean).join(" "),
      tail: unknown.length ? ` satisfying ${joinList(unknown.map((u) => `${UNKNOWN}${u.head}${UNKNOWN}`))}` : "",
      refs: attached.map((a) => a.comp.id),
    };
  };

  /* 2. unary adjectival hypotheses fold into the object they constrain */
  const foldedByObject = new Map<string, Array<{ text: string; ref: string }>>();
  const freeHypotheses: Array<{ comp: SemanticBinder; clause: Clause; dependent: boolean }> = [];
  for (const hypothesis of hypotheses) {
    const clause = propClause(hypothesis.typeText, [hypothesis.id], sink);
    const target = clause.subject
      ? [...objects, ...types].find((o) => o.name === clause.subject!.trim())
      : undefined;
    const dependent = referencedInConclusion(hypothesis);
    if (register !== "literal" && clause.adjectival && target && !dependent) {
      if (!foldedByObject.has(target.id)) foldedByObject.set(target.id, []);
      foldedByObject.get(target.id)!.push({ text: clause.adjectival, ref: hypothesis.id });
    } else {
      freeHypotheses.push({ comp: hypothesis, clause, dependent });
    }
  }

  /* 3. suppress implicit type binders that carry nothing and are inferable */
  const suppressed = new Set<string>();
  if (register !== "literal") {
    for (const binder of types) {
      if (binder.binderKind === "explicit") continue;
      if ((carrierInstances.get(binder.name) ?? []).length > 0) continue;
      if (!usedElsewhere(binder)) continue;
      suppressed.add(binder.id);
      absorbed.push({
        id: binder.id,
        why: `implicit type ${binder.name}, determined by the type of a later component`,
        by: [...objects, ...hypotheses].find((o) =>
          new RegExp(`(^|[^A-Za-z0-9_'])${escapeRe(binder.name)}([^A-Za-z0-9_']|$)`).test(o.typeText),
        )?.id ?? null,
      });
    }
  }

  const liveTypes = types.filter((t) => !suppressed.has(t.id));
  const liveObjects = objects.filter((o) => !suppressed.has(o.id));

  const nameList = (names: string[], ids: string[]): ProseSpan[] => {
    const out: ProseSpan[] = [];
    names.forEach((name, i) => {
      if (i) out.push(text(i === names.length - 1 ? (names.length > 2 ? ", and " : " and ") : ", "));
      out.push(math(name, ids));
    });
    return out;
  };

  const groupConsecutive = <T,>(items: T[], eq: (a: T, b: T) => boolean): T[][] => {
    const out: T[][] = [];
    for (const item of items) {
      const last = out[out.length - 1];
      if (last && eq(last[0], item)) last.push(item);
      else out.push([item]);
    }
    return out;
  };

  const conclusionSpans = (): ProseSpan[] => {
    const clause = propClause(conclusion, [conclusionId], sink);
    if (clause.matched) return clause.spans;
    return register === "literal" ? [text("we have "), ...clause.spans] : clause.spans;
  };

  if (register === "literal") {
    // Quantifier-faithful, but merged and de-scaffolded.
    const quantifiers: ProseSpan[] = [];
    for (const group of groupConsecutive([...liveTypes, ...liveObjects], (a, b) => a.typeText === b.typeText)) {
      quantifiers.push(
        math(
          `${group.map((x) => mathToLatex(x.name, sink)).join(", ")} : ${mathToLatex(group[0].typeText, sink)}`,
          group.map((x) => x.id),
        ),
      );
    }
    for (const instance of instances) {
      if (!absorbed.some((a) => a.id === instance.id)) {
        quantifiers.push(math(`[${mathToLatex(instance.typeText, sink)}]`, [instance.id]));
      }
    }
    const spans: ProseSpan[] = [text("For all ")];
    quantifiers.forEach((q, i) => {
      if (i) spans.push(text(", "));
      spans.push(q);
    });
    if (freeHypotheses.length) {
      spans.push(text(", if "));
      freeHypotheses.forEach((h, i) => {
        if (i) spans.push(text(" and "));
        spans.push(...h.clause.spans);
      });
      spans.push(text(", then "));
    } else spans.push(text(", "));
    spans.push(...conclusionSpans(), text("."));
    sentences.push({ role: "statement", spans });
  } else {
    const lets: ProseSpan[][] = [];

    const byPhrase = new Map<string, SemanticBinder[]>();
    for (const t of liveTypes) {
      const phrase = carrierPhrase(t.name);
      const key = phrase.words + phrase.tail;
      if (!byPhrase.has(key)) byPhrase.set(key, []);
      byPhrase.get(key)!.push(t);
    }
    for (const group of byPhrase.values()) {
      const phrase = carrierPhrase(group[0].name);
      const names = group.map((x) => mathToLatex(x.name, sink));
      const refs = group.flatMap((x) => carrierPhrase(x.name).refs);
      lets.push([
        ...nameList(names, group.map((x) => x.id)),
        text(names.length > 1 ? " be " : ` be ${article(phrase.words)} `),
        ...interleave((names.length > 1 ? pluralise(phrase.words) : phrase.words) + phrase.tail, refs),
      ]);
    }

    for (const group of groupConsecutive(liveObjects, (a, b) => a.typeText === b.typeText)) {
      const names = group.map((x) => mathToLatex(x.name, sink));
      const adjectives = [
        ...new Map(
          group.flatMap((x) => foldedByObject.get(x.id) ?? []).map((a) => [a.text, a]),
        ).values(),
      ];
      const instance = carrierPhrase(group[0].name, true);
      const phrase = (() => {
        for (const entry of TYPE_LEXICON) {
          const matched = group[0].typeText.trim().match(entry.match);
          if (matched) return entry.phrase(matched, (s) => `${MARK}${mathToLatex(s, sink)}${MARK}`);
        }
        return null;
      })();
      const chunk = nameList(names, group.map((x) => x.id));
      const modifiers = [...adjectives.map((a) => a.text), ...(instance.words ? [instance.words] : [])];
      const modifierRefs = [...adjectives.map((a) => a.ref), ...instance.refs];

      if (phrase) {
        const full = [...modifiers, phrase].join(" ");
        chunk.push(text(names.length > 1 ? " be " : ` be ${article(full)} `));
        chunk.push(
          ...interleave((names.length > 1 ? pluralise(full) : full) + instance.tail, [
            ...modifierRefs,
            ...group.map((x) => x.id),
          ]),
        );
      } else {
        chunk.push(text(" : "), math(mathToLatex(group[0].typeText, sink), group.map((x) => x.id)));
        if (modifiers.length) {
          chunk.push(...interleave(` be ${joinList(modifiers)}${instance.tail}`, modifierRefs));
        }
      }
      lets.push(chunk);
    }

    if (lets.length) {
      const spans: ProseSpan[] = [text("Let ")];
      lets.forEach((chunk, i) => {
        if (i) spans.push(text(", and let "));
        spans.push(...chunk);
      });
      spans.push(text("."));
      sentences.push({ role: "setup", spans });
    }

    if (freeHypotheses.length) {
      const spans: ProseSpan[] = [text("Suppose ")];
      freeHypotheses.forEach((h, i) => {
        if (i) spans.push(text(i === freeHypotheses.length - 1 ? ", and " : ", "));
        spans.push(...h.clause.spans);
        // The name is dropped unless the proof term itself appears in the conclusion, in
        // which case it must remain nameable — parenthetically, as a paper would do it.
        if (h.dependent) {
          spans.push(
            text(" (call this assumption ", [h.comp.id]),
            math(h.comp.name, [h.comp.id]),
            text(")", [h.comp.id]),
          );
        }
      });
      spans.push(text("."));
      sentences.push({ role: "hypotheses", spans });
    }

    sentences.push({
      role: "conclusion",
      spans: [text(sentences.length ? "Then " : ""), ...conclusionSpans(), text(".")],
    });
  }

  if (register === "explanatory") {
    for (const item of absorbed) {
      sentences.push({ role: "note", spans: [text(`Suppressed: ${item.why}.`, [item.id])] });
    }
  }

  // `f x` → `f(x)` for binders whose type is a function type.
  const functionNames = objects.filter((o) => /→/.test(o.typeText)).map((o) => o.name);
  if (functionNames.length) {
    const alt = functionNames.map(escapeRe).join("|");
    const re = new RegExp(`(^|[^A-Za-z0-9_'\\\\{])(${alt})\\s+([A-Za-z0-9_']+)(?![A-Za-z0-9_'(])`, "g");
    for (const sentence of sentences) {
      for (const span of sentence.spans) {
        if (span.mode === "math") span.text = span.text.replace(re, (_m, pre, fn, arg) => `${pre}${fn}(${arg})`);
      }
    }
  }

  return {
    register,
    sentences,
    absorbed,
    notes: [...new Set(sink.notes)],
    misses: sink.misses,
    approximate: sink.approximate,
  };
}

/* ------------------------------------------------------------------ *
 * Rendering
 * ------------------------------------------------------------------ */

const PLAIN: Record<string, string> = {
  "\\le": "≤", "\\ge": "≥", "\\ne": "≠", "\\in": "∈", "\\notin": "∉", "\\to": "→",
  "\\forall": "∀", "\\exists": "∃", "\\subseteq": "⊆", "\\sum": "∑", "\\prod": "∏",
  "\\int": "∫", "\\infty": "∞", "\\alpha": "α", "\\beta": "β", "\\gamma": "γ",
  "\\delta": "δ", "\\varepsilon": "ε", "\\lambda": "λ", "\\mu": "μ", "\\sigma": "σ",
  "\\varphi": "φ", "\\mapsto": "↦", "\\cdot": "·", "\\circ": "∘",
  "\\leftrightarrow": "↔", "\\land": "∧", "\\lor": "∨", "\\lnot": "¬", "\\times": "×",
};

export type ProseFormat = "latex" | "plain" | "markdown";

function renderSpan(span: ProseSpan, format: ProseFormat): string {
  const expand = (value: string) =>
    value.replace(new RegExp(`${UNKNOWN}([^${UNKNOWN}]*)${UNKNOWN}`, "g"), (_m, s: string) =>
      format === "plain" ? s : `\\texttt{${s}}`,
    );
  if (span.mode === "text") return expand(span.text);
  const tex = expand(span.text);
  return format === "plain" ? tex : `$${tex}$`;
}

export function renderProse(planned: PlannedProse, format: ProseFormat = "latex"): string {
  const join = (sentence: ProseSentence) =>
    sentence.spans.map((span) => renderSpan(span, format)).join("");
  const body = planned.sentences.filter((s) => s.role !== "note").map(join);
  const notes = planned.sentences.filter((s) => s.role === "note").map(join);

  if (format === "plain") {
    return [...body, ...notes]
      .join(" ")
      .replace(/\\(?:mathbb|mathrm|mathcal|texttt|Bbbk)\{?([^}]*)\}?/g, "$1")
      .replace(/\\[a-zA-Z]+/g, (m) => PLAIN[m] ?? "")
      .replace(/[{}$]/g, "")
      .replace(/\s+/g, " ")
      .replace(/\s+([,.;])/g, "$1")
      .trim();
  }
  return body.join(" ") + (notes.length ? `\n\n${notes.join(" ")}` : "");
}

/**
 * Plain-text prose for a register, which is what `literalProse` / `polishedProse` /
 * `explanatoryProse` on a PublishedDeclaration hold.
 */
export function proseFor(
  binders: SemanticBinder[],
  conclusion: string,
  conclusionId: string,
  register: ProseRegister,
): { prose: string; planned: PlannedProse } {
  const planned = planProse(binders, conclusion, conclusionId, register);
  return { prose: renderProse(planned, "plain"), planned };
}
