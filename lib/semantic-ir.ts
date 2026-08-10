import type {
  ConversionResult,
  DeclarationKind,
  LeanDeclaration,
} from "./lean-converter";

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
  proseText: string;
  status: CoverageStatus;
};

export type DeclarationTrace = {
  declarationId: string;
  entries: CoverageEntry[];
  covered: number;
  total: number;
  complete: boolean;
  highestTrustEligible: boolean;
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

function literalBinderProse(binder: SemanticBinder): string {
  if (binder.role === "type-class-assumption") {
    return `with the instance assumption ${binder.typeText}`;
  }
  if (binder.role === "hypothesis") {
    return `assuming ${binder.name} : ${binder.typeText}`;
  }
  const visibility = binder.binderKind === "explicit" ? "" : `${binder.binderKind} `;
  return `for every ${visibility}${binder.name} : ${binder.typeText}`;
}

function coverageFor(
  declarationId: string,
  binders: SemanticBinder[],
  conclusion: string,
  extractionStatus: ExtractionStatus,
): DeclarationTrace {
  const status: CoverageStatus = extractionStatus === "elaborated" ? "covered" : "provisional";
  const entries: CoverageEntry[] = binders.map((binder) => ({
    id: binder.id,
    semanticRole:
      binder.role === "hypothesis"
        ? "hypothesis"
        : binder.role === "type-class-assumption"
          ? "instance"
          : "binder",
    label: binder.name,
    formalText: `${binder.name} : ${binder.typeText}`,
    proseText: literalBinderProse(binder),
    status,
  }));
  entries.push({
    id: `${declarationId}:conclusion`,
    semanticRole: "conclusion",
    label: "Conclusion",
    formalText: conclusion,
    proseText: `it follows that ${conclusion}`,
    status,
  });

  const covered = entries.filter((entry) => entry.status === "covered").length;
  const complete = entries.length > 0 && covered === entries.length;
  return {
    declarationId,
    entries,
    covered,
    total: entries.length,
    complete,
    highestTrustEligible: extractionStatus === "elaborated" && complete,
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

function elaboratedTrust(bundle: SemanticIRBundle, declaration: ExtractedDeclaration): TrustRecord {
  return {
    extractionStatus: bundle.extractionStatus,
    leanVersion: bundle.leanVersion,
    sourceHash: bundle.sourceHash || "not supplied by extractor",
    proofStatus: declaration.proofStatus,
    axioms: declaration.axioms,
    usesSorry: declaration.usesSorry,
    usesNativeEvaluation: declaration.usesNativeEvaluation,
    proseCorrespondence: "structurally-checked",
    humanReviewed: false,
    statement:
      "Generated from a kernel-accepted formal statement; prose correspondence has passed LeanScribe’s structural checks.",
  };
}

export function sourceFingerprint(source: string): string {
  let hash = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  for (const byte of new TextEncoder().encode(source)) {
    hash ^= BigInt(byte);
    hash = BigInt.asUintN(64, hash * prime);
  }
  return `fnv1a64:${hash.toString(16).padStart(16, "0")}`;
}

export function buildProvisionalPublication(
  result: ConversionResult,
  source: string,
  filename: string,
): PublishedDocument {
  const hash = sourceFingerprint(source);
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
      const trace = coverageFor(semanticId, binders, conclusion, "unelaborated");
      const literalProse = [
        ...binders.map(literalBinderProse),
        `the conclusion is ${conclusion}`,
      ].join("; ");
      return {
        ...declaration,
        semanticId,
        binders,
        conclusion,
        trace,
        trust: provisionalTrust(hash),
        literalProse: `${literalProse.charAt(0).toUpperCase()}${literalProse.slice(1)}.`,
        polishedProse: declaration.naturalLanguage,
        explanatoryProse:
          declaration.note ||
          "Interpretive commentary is intentionally withheld in deterministic public mode.",
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
    const trace = coverageFor(declaration.id, binders, declaration.conclusion, "elaborated");
    const literalProse = [
      ...binders.map(literalBinderProse),
      `the conclusion is ${declaration.conclusion}`,
    ].join("; ");
    return {
      kind: (declaration.kind as DeclarationKind) || "other",
      name: declaration.name,
      leanType: declaration.typeText,
      latex: declaration.conclusion,
      naturalLanguage: `${literalProse.charAt(0).toUpperCase()}${literalProse.slice(1)}.`,
      line: declaration.sourceLocation?.startLine ?? index + 1,
      note: declaration.docString || undefined,
      dependencies: declaration.dependencies,
      caveats: trace.complete ? [] : ["The semantic coverage ledger is incomplete."],
      confidence: trace.complete ? "high" : "low",
      semanticId: declaration.id,
      binders,
      conclusion: declaration.conclusion,
      trace,
      trust: elaboratedTrust(bundle, declaration),
      literalProse: `${literalProse.charAt(0).toUpperCase()}${literalProse.slice(1)}.`,
      polishedProse:
        declaration.docString ||
        "No author-reviewed polished statement is present in this semantic bundle.",
      explanatoryProse: "Generated commentary is not part of the trusted statement layer.",
      provenance: {
        extractionStatus: bundle.extractionStatus,
        sourceHash: bundle.sourceHash || "not supplied by extractor",
        coverage: `${trace.covered}/${trace.total} structurally checked`,
        proofStatus: declaration.proofStatus,
        axioms: declaration.axioms,
        trustStatement:
          "Generated from a kernel-accepted formal statement; prose correspondence has passed LeanScribe’s structural checks.",
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
