import type {
  ConversionResult,
  DeclarationKind,
  LeanDeclaration,
} from "./lean-converter";
import { planProse, renderProse, type PlannedProse, type ProseSpan } from "./prose-engine.ts";
import { proseFingerprint, sourceFingerprint as hashSource } from "./provenance.ts";

export type ExtractionStatus = "elaborated" | "unelaborated" | "incomplete";
export type ProseTrustLevel = "literal" | "polished" | "explanatory";
export type BinderKind = "explicit" | "implicit" | "strict-implicit" | "instance";
export type CoverageStatus = "covered" | "suppressed" | "unmapped" | "provisional";

export type SemanticBinder = {
  id: string;
  name: string;
  binderKind: BinderKind;
  typeText: string;
  role: "quantified-object" | "hypothesis" | "type-class-assumption";
};

export type SourceLocation = {
  module?: string;
  startLine: number;
  startColumn: number;
  endLine?: number;
  endColumn?: number;
};

export type ExtractedDeclaration = {
  id: string;
  name: string;
  namespaceName: string;
  kind: DeclarationKind | string;
  originalCommand: string;
  classificationSource: string;
  typeText: string;
  conclusion: string;
  binders: Array<{
    id: string;
    name: string;
    binderKind: BinderKind;
    typeText: string;
  }>;
  dependencies: string[];
  axioms: string[];
  usesSorry: boolean;
  usesNativeEvaluation: boolean;
  proofStatus: "kernel-accepted" | "incomplete" | string;
  docString?: string | null;
  sourceLocation?: SourceLocation | null;
};

export type SemanticIRBundle = {
  schemaVersion: "leanscribe.semantic-ir.v1";
  extractionStatus: ExtractionStatus;
  module: string;
  leanVersion: string;
  leanCommit: string;
  generatedAt: string;
  sourceHash?: string;
  repository?: string;
  repositoryCommit?: string;
  declarations: ExtractedDeclaration[];
  trustStatement: string;
};

export type CoverageEntry = {
  id: string;
  semanticRole: "binder" | "hypothesis" | "instance" | "conclusion";
  label: string;
  formalText: string;
  /** the prose that expresses this component; may be one clause among several */
  proseText: string;
  status: CoverageStatus;
  /**
   * Why it is legitimate for this component not to appear in the prose. Present only
   * for `suppressed`. A component with no spans AND no justification is `unmapped`,
   * which is a hard failure — that distinction is the point of the ledger.
   */
  justification?: string;
  /** the component that determines a suppressed one, when there is one */
  determinedBy?: string | null;
};

export type DeclarationTrace = {
  declarationId: string;
  entries: CoverageEntry[];
  covered: number;
  suppressed: number;
  unmapped: number;
  total: number;
  complete: boolean;
  highestTrustEligible: boolean;
  /**
   * The published prose as a span stream. Each span carries the ids it expresses, which
   * is what lets one idiomatic clause account for several formal components without the
   * ledger degrading to a one-clause-per-binder transliteration.
   */
  spans: ProseSpan[];
  /** a string-level fallback fired; no structural claim may be made */
  approximate: boolean;
  /** lexicon gaps encountered, as a work queue rather than a silent degradation */
  lexiconGaps: string[];
  proseHash: string;
};

export type TrustRecord = {
  extractionStatus: ExtractionStatus;
  leanVersion: string | null;
  sourceHash: string;
  proofStatus: string;
  axioms: string[];
  usesSorry: boolean | null;
  usesNativeEvaluation: boolean | null;
  proseCorrespondence: "structurally-checked" | "provisional" | "unmapped";
  humanReviewed: boolean;
  statement: string;
};

export type PublishedDeclaration = LeanDeclaration & {
  semanticId: string;
  binders: SemanticBinder[];
  conclusion: string;
  trace: DeclarationTrace;
  trust: TrustRecord;
  literalProse: string;
  polishedProse: string;
  explanatoryProse: string;
};

export type PublishedDocument = {
  schemaVersion: "leanscribe.publication.v1";
  title: string;
  filename: string;
  sourceHash: string;
  extractionStatus: ExtractionStatus;
  declarations: PublishedDeclaration[];
  generatedAt: string;
};

function binderRole(name: string, typeText: string, binderKind: BinderKind): SemanticBinder["role"] {
  if (binderKind === "instance") return "type-class-assumption";
  if (/^h(?:_|\d|[A-Z])?/i.test(name) || /(?:=|≠|≤|≥|<|>|↔|→|∧|∨|\bProp\b)/.test(typeText)) {
    return "hypothesis";
  }
  return "quantified-object";
}

function splitBinders(signature: string, declarationId: string): {
  binders: SemanticBinder[];
  conclusion: string;
} {
  let rest = signature.trim();
  const binders: SemanticBinder[] = [];

  while (rest.startsWith("(") || rest.startsWith("{") || rest.startsWith("[")) {
    const opener = rest[0];
    const closer = opener === "(" ? ")" : opener === "{" ? "}" : "]";
    let depth = 0;
    let end = -1;
    for (let index = 0; index < rest.length; index += 1) {
      if (rest[index] === opener) depth += 1;
      if (rest[index] === closer) depth -= 1;
      if (depth === 0) {
        end = index;
        break;
      }
    }
    if (end < 0) break;

    const raw = rest.slice(1, end).trim();
    rest = rest.slice(end + 1).trim();
    const colon = raw.indexOf(":");
    if (colon < 0) continue;
    const names = raw.slice(0, colon).trim().split(/\s+/).filter(Boolean);
    const typeText = raw.slice(colon + 1).trim();
    const binderKind: BinderKind = opener === "[" ? "instance" : opener === "{" ? "implicit" : "explicit";
    names.forEach((name) => {
      binders.push({
        id: `${declarationId}:binder:${binders.length}`,
        name,
        binderKind,
        typeText,
        role: binderRole(name, typeText, binderKind),
      });
    });
  }

  return { binders, conclusion: rest.replace(/^:\s*/, "").trim() || signature };
}

/**
 * Semantic coverage over the emitted span stream.
 *
 * The old implementation mapped one binder to one hand-built clause, which made coverage
 * trivially verifiable and the prose unreadable. The planner instead emits spans that
 * already carry the ids they express, so `"compact nonempty subset of "` is a single span
 * accounting for three components. Coverage is the inversion of that map.
 *
 * Three terminal states, and the difference between the last two is the whole point:
 *   covered    — at least one span expresses it
 *   suppressed — deliberately not surfaced, with a written justification
 *   unmapped   — nothing expressed it and nothing justified its absence: hard failure
 */
function coverageFromPlan(
  declarationId: string,
  binders: SemanticBinder[],
  conclusion: string,
  planned: PlannedProse,
  extractionStatus: ExtractionStatus,
): DeclarationTrace {
  const conclusionId = `${declarationId}:conclusion`;
  const spans = planned.sentences.flatMap((sentence) => sentence.spans);

  // Index by position, not just by span: a component is usually expressed by several
  // non-adjacent spans ("n" ... "natural number"), and concatenating only the matching
  // ones yields "nnatural number". Showing the slice between the first and last match
  // reproduces the clause a reader actually sees.
  const expressedAt = new Map<string, number[]>();
  spans.forEach((span, index) => {
    for (const ref of span.refs) {
      if (!expressedAt.has(ref)) expressedAt.set(ref, []);
      expressedAt.get(ref)!.push(index);
    }
  });
  const sliceFor = (id: string): string => {
    const positions = expressedAt.get(id);
    if (!positions || positions.length === 0) return "";
    return spans
      .slice(positions[0], positions[positions.length - 1] + 1)
      .map((span) => span.text)
      .join("")
      .trim();
  };
  const absorbed = new Map(planned.absorbed.map((item) => [item.id, item]));

  const components: Array<{ id: string; role: CoverageEntry["semanticRole"]; label: string; formal: string }> = [
    ...binders.map((binder) => ({
      id: binder.id,
      role:
        binder.role === "hypothesis"
          ? ("hypothesis" as const)
          : binder.role === "type-class-assumption"
            ? ("instance" as const)
            : ("binder" as const),
      label: binder.name,
      formal: `${binder.name} : ${binder.typeText}`,
    })),
    { id: conclusionId, role: "conclusion" as const, label: "Conclusion", formal: conclusion },
  ];

  const entries: CoverageEntry[] = components.map((component) => {
    const matched = expressedAt.get(component.id) ?? [];
    const suppression = absorbed.get(component.id);

    // An unelaborated source scan cannot support a structural claim about anything, so
    // every entry stays provisional regardless of how well the prose reads.
    if (extractionStatus !== "elaborated") {
      return {
        id: component.id,
        semanticRole: component.role,
        label: component.label,
        formalText: component.formal,
        proseText: sliceFor(component.id) || "not elaborated",
        status: "provisional" as CoverageStatus,
      };
    }

    if (matched.length > 0) {
      return {
        id: component.id,
        semanticRole: component.role,
        label: component.label,
        formalText: component.formal,
        proseText: sliceFor(component.id),
        status: "covered" as CoverageStatus,
      };
    }
    if (suppression) {
      return {
        id: component.id,
        semanticRole: component.role,
        label: component.label,
        formalText: component.formal,
        proseText: "",
        status: "suppressed" as CoverageStatus,
        justification: suppression.why,
        determinedBy: suppression.by,
      };
    }
    return {
      id: component.id,
      semanticRole: component.role,
      label: component.label,
      formalText: component.formal,
      proseText: "",
      status: "unmapped" as CoverageStatus,
    };
  });

  const count = (status: CoverageStatus) => entries.filter((entry) => entry.status === status).length;
  const covered = count("covered");
  const suppressed = count("suppressed");
  const unmapped = count("unmapped");
  const complete = entries.length > 0 && unmapped === 0 && count("provisional") === 0;

  return {
    declarationId,
    entries,
    covered,
    suppressed,
    unmapped,
    total: entries.length,
    complete,
    // An unrecognised typeclass or namespace means we do not know what the statement
    // asserts, so `approximate` blocks the top badge just as an unmapped component does.
    highestTrustEligible: extractionStatus === "elaborated" && complete && !planned.approximate,
    spans,
    approximate: planned.approximate,
    lexiconGaps: [...new Set(planned.misses.map((miss) => `${miss.kind} ${miss.symbol}`))],
    proseHash: proseFingerprint(spans),
  };
}

/** Plan all three registers once; the ledger is computed against the published one. */
function proseBundle(
  declarationId: string,
  binders: SemanticBinder[],
  conclusion: string,
  extractionStatus: ExtractionStatus,
): {
  literal: string;
  polished: string;
  explanatory: string;
  trace: DeclarationTrace;
} {
  const conclusionId = `${declarationId}:conclusion`;
  const literal = planProse(binders, conclusion, conclusionId, "literal");
  const polished = planProse(binders, conclusion, conclusionId, "polished");
  const explanatory = planProse(binders, conclusion, conclusionId, "explanatory");

  // Coverage is checked against `polished`, not `literal`. The literal register restates
  // every binder and would satisfy any ledger; the polished register is the one that
  // merges, folds and suppresses, so it is the one worth checking.
  return {
    literal: renderProse(literal, "plain"),
    polished: renderProse(polished, "plain"),
    explanatory: renderProse(explanatory, "plain"),
    trace: coverageFromPlan(declarationId, binders, conclusion, polished, extractionStatus),
  };
}

function provisionalTrust(sourceHash: string): TrustRecord {
  return {
    extractionStatus: "unelaborated",
    leanVersion: null,
    sourceHash,
    proofStatus: "unelaborated",
    axioms: [],
    usesSorry: null,
    usesNativeEvaluation: null,
    proseCorrespondence: "provisional",
    humanReviewed: false,
    statement: "Source-scanned draft. Not elaborated; no semantic trust claim is made.",
  };
}

function elaboratedTrust(
  bundle: SemanticIRBundle,
  declaration: ExtractedDeclaration,
  trace: DeclarationTrace,
): TrustRecord {
  return {
    extractionStatus: bundle.extractionStatus,
    leanVersion: bundle.leanVersion,
    sourceHash: bundle.sourceHash || "not supplied by extractor",
    proofStatus: declaration.proofStatus,
    axioms: declaration.axioms,
    usesSorry: declaration.usesSorry,
    usesNativeEvaluation: declaration.usesNativeEvaluation,
    proseCorrespondence: trace.highestTrustEligible
      ? "structurally-checked"
      : trace.unmapped > 0
        ? "unmapped"
        : "provisional",
    humanReviewed: false,
    statement: trace.highestTrustEligible
      ? "Generated from a kernel-accepted formal statement; prose correspondence has passed LeanScribe’s structural checks — every formal component is expressed by a prose span or suppressed with a recorded justification."
      : trace.unmapped > 0
        ? `${trace.unmapped} formal component(s) are not expressed by any prose span; no correspondence claim is made.`
        : "Rendering fell back to string-level rewriting, so the structural correspondence claim is withheld.",
  };
}

/**
 * Re-exported from ./provenance. The previous implementation was fnv1a64, a hash-table
 * function: trivially collidable and meaningless as an integrity claim, which is not
 * something to display inside a trust badge.
 */
export { sourceFingerprint } from "./provenance.ts";

export function buildProvisionalPublication(
  result: ConversionResult,
  source: string,
  filename: string,
): PublishedDocument {
  const hash = hashSource(source);
  return {
    schemaVersion: "leanscribe.publication.v1",
    title: result.title,
    filename,
    sourceHash: hash,
    extractionStatus: "unelaborated",
    generatedAt: new Date().toISOString(),
    declarations: result.declarations.map((declaration) => {
      const semanticId = `${filename}:${declaration.line}:${declaration.name}`;
      const { binders, conclusion } = splitBinders(declaration.leanType, semanticId);
      const prose = proseBundle(semanticId, binders, conclusion, "unelaborated");
      const trace = prose.trace;
      return {
        ...declaration,
        semanticId,
        binders,
        conclusion,
        trace,
        trust: provisionalTrust(hash),
        literalProse: prose.literal,
        polishedProse: prose.polished,
        explanatoryProse: prose.explanatory,
        provenance: {
          extractionStatus: "unelaborated",
          sourceHash: hash,
          coverage: `0/${trace.total} structurally checked`,
          proofStatus: "unelaborated",
          axioms: [],
          trustStatement: "Source-scanned draft. Not elaborated; no semantic trust claim is made.",
        },
      };
    }),
  };
}

export function isSemanticIRBundle(value: unknown): value is SemanticIRBundle {
  if (!value || typeof value !== "object") return false;
  const bundle = value as Partial<SemanticIRBundle>;
  const strings = (items: unknown): items is string[] =>
    Array.isArray(items) && items.every((item) => typeof item === "string");
  const validBinder = (item: unknown): boolean => {
    if (!item || typeof item !== "object") return false;
    const binder = item as Record<string, unknown>;
    return (
      typeof binder.id === "string" &&
      typeof binder.name === "string" &&
      typeof binder.typeText === "string" &&
      ["explicit", "implicit", "strict-implicit", "instance"].includes(String(binder.binderKind))
    );
  };
  const validDeclaration = (item: unknown): boolean => {
    if (!item || typeof item !== "object") return false;
    const declaration = item as Record<string, unknown>;
    return (
      typeof declaration.id === "string" &&
      typeof declaration.name === "string" &&
      typeof declaration.namespaceName === "string" &&
      typeof declaration.kind === "string" &&
      typeof declaration.originalCommand === "string" &&
      typeof declaration.classificationSource === "string" &&
      typeof declaration.typeText === "string" &&
      typeof declaration.conclusion === "string" &&
      Array.isArray(declaration.binders) && declaration.binders.every(validBinder) &&
      strings(declaration.dependencies) &&
      strings(declaration.axioms) &&
      typeof declaration.usesSorry === "boolean" &&
      typeof declaration.usesNativeEvaluation === "boolean" &&
      typeof declaration.proofStatus === "string"
    );
  };
  return (
    bundle.schemaVersion === "leanscribe.semantic-ir.v1" &&
    bundle.extractionStatus === "elaborated" &&
    typeof bundle.module === "string" &&
    typeof bundle.leanVersion === "string" &&
    typeof bundle.leanCommit === "string" &&
    typeof bundle.generatedAt === "string" &&
    typeof bundle.trustStatement === "string" &&
    Array.isArray(bundle.declarations) &&
    bundle.declarations.every(validDeclaration)
  );
}

export function publicationFromSemanticIR(bundle: SemanticIRBundle): PublishedDocument {
  const declarations: PublishedDeclaration[] = bundle.declarations.map((declaration, index) => {
    const binders: SemanticBinder[] = declaration.binders.map((binder) => ({
      ...binder,
      role: binderRole(binder.name, binder.typeText, binder.binderKind),
    }));
    const prose = proseBundle(declaration.id, binders, declaration.conclusion, "elaborated");
    const trace = prose.trace;
    return {
      kind: (declaration.kind as DeclarationKind) || "other",
      name: declaration.name,
      leanType: declaration.typeText,
      latex: declaration.conclusion,
      naturalLanguage: prose.polished,
      line: declaration.sourceLocation?.startLine ?? index + 1,
      note: declaration.docString || undefined,
      dependencies: declaration.dependencies,
      caveats: [
        ...(trace.unmapped > 0
          ? [`${trace.unmapped} formal component(s) are not expressed by any prose span.`]
          : []),
        ...(trace.approximate
          ? [
              `Rendering used a string-level fallback${
                trace.lexiconGaps.length ? ` (${trace.lexiconGaps.join(", ")})` : ""
              }; no structural claim is made.`,
            ]
          : []),
      ],
      confidence: trace.highestTrustEligible ? "high" : trace.complete ? "medium" : "low",
      semanticId: declaration.id,
      binders,
      conclusion: declaration.conclusion,
      trace,
      trust: elaboratedTrust(bundle, declaration, trace),
      literalProse: prose.literal,
      polishedProse: prose.polished,
      explanatoryProse: declaration.docString
        ? `${declaration.docString.trim()} ${prose.explanatory}`
        : prose.explanatory,
      provenance: {
        extractionStatus: bundle.extractionStatus,
        sourceHash: bundle.sourceHash || "not supplied by extractor",
        coverage: `${trace.covered}/${trace.total} structurally checked`,
        proofStatus: declaration.proofStatus,
        axioms: declaration.axioms,
        trustStatement: elaboratedTrust(bundle, declaration, trace).statement,
      },
    };
  });

  return {
    schemaVersion: "leanscribe.publication.v1",
    title: bundle.module,
    filename: `${bundle.module}.leanscribe.json`,
    sourceHash: bundle.sourceHash || "not supplied by extractor",
    extractionStatus: bundle.extractionStatus,
    declarations,
    generatedAt: bundle.generatedAt,
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function publicationToMarkdown(document: PublishedDocument): string {
  const declarations = document.declarations.map((declaration, index) => {
    const ledger = declaration.trace.entries
      .map((entry) => `| ${entry.semanticRole} | \`${entry.formalText}\` | ${entry.proseText} | ${entry.status} |`)
      .join("\n");
    return `## ${index + 1}. ${declaration.kind} ${declaration.name}\n\n${declaration.literalProse}\n\n**Formal signature:** \`${declaration.leanType}\`\n\n**Trust:** ${declaration.trust.statement}\n\n| Role | Formal content | Prose span | Status |\n| --- | --- | --- | --- |\n${ledger}`;
  }).join("\n\n");
  return `# ${document.title}\n\nSource fingerprint: \`${document.sourceHash}\`  \nExtraction: **${document.extractionStatus}**\n\n${declarations}\n`;
}

export function publicationToHtml(document: PublishedDocument): string {
  const declarations = document.declarations.map((declaration, index) => {
    const ledger = declaration.trace.entries.map((entry) =>
      `<tr><td>${escapeHtml(entry.semanticRole)}</td><td><code>${escapeHtml(entry.formalText)}</code></td><td>${escapeHtml(entry.proseText)}</td><td>${escapeHtml(entry.status)}</td></tr>`,
    ).join("");
    return `<section id="${escapeHtml(declaration.semanticId)}"><h2>${index + 1}. ${escapeHtml(declaration.kind)} ${escapeHtml(declaration.name)}</h2><p>${escapeHtml(declaration.literalProse)}</p><p><strong>Formal signature:</strong> <code>${escapeHtml(declaration.leanType)}</code></p><p><strong>Trust:</strong> ${escapeHtml(declaration.trust.statement)}</p><table><thead><tr><th>Role</th><th>Formal content</th><th>Prose span</th><th>Status</th></tr></thead><tbody>${ledger}</tbody></table></section>`;
  }).join("\n");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(document.title)}</title><style>body{max-width:900px;margin:3rem auto;padding:0 1rem;font:17px/1.6 system-ui;color:#171713}code{overflow-wrap:anywhere}table{width:100%;border-collapse:collapse}th,td{padding:.55rem;text-align:left;vertical-align:top;border:1px solid #ccc}section{margin:3rem 0}</style></head><body><h1>${escapeHtml(document.title)}</h1><p>Source fingerprint: <code>${escapeHtml(document.sourceHash)}</code><br>Extraction: <strong>${escapeHtml(document.extractionStatus)}</strong></p>${declarations}</body></html>`;
}

export function proseForLevel(
  declaration: PublishedDeclaration,
  level: ProseTrustLevel,
): string {
  if (level === "literal") return declaration.literalProse;
  if (level === "polished") return declaration.polishedProse;
  return declaration.explanatoryProse;
}
