import type { SemanticTranslation } from "./semantic-schema";

export type DeclarationKind =
  | "theorem"
  | "lemma"
  | "corollary"
  | "example"
  | "definition"
  | "axiom"
  | "structure"
  | "inductive"
  | "class"
  | "instance"
  | "other";

export type LeanDeclaration = {
  kind: DeclarationKind;
  name: string;
  leanType: string;
  latex: string;
  naturalLanguage: string;
  line: number;
  note?: string;
  proofStrategy?: string;
  dependencies?: string[];
  caveats?: string[];
  confidence?: "high" | "medium" | "low";
};

export type ConversionResult = {
  declarations: LeanDeclaration[];
  imports: string[];
  namespaces: string[];
  title: string;
  overview: string;
  prerequisites: string[];
  glossary: Array<{ term: string; explanation: string }>;
  warnings: string[];
  mode: "local" | "expert";
  model?: string;
  tex: string;
  csv: string;
};

const SAMPLE_SOURCE = `import Mathlib

/-!
# A tiny arithmetic note
LeanScribe turns formal statements into typeset mathematics.
-/

theorem add_zero (n : Nat) : n + 0 = n := by
  simp

lemma square_nonnegative (x : ℝ) : 0 ≤ x ^ 2 := by
  positivity

example (a b : ℝ) (h : a ≤ b) : a + 1 ≤ b + 1 := by
  linarith`;

export const DEFAULT_SOURCE = SAMPLE_SOURCE;

const kindMap: Record<string, DeclarationKind> = {
  theorem: "theorem",
  lemma: "lemma",
  corollary: "corollary",
  example: "example",
  def: "definition",
  abbrev: "definition",
  axiom: "axiom",
  structure: "structure",
  inductive: "inductive",
  class: "class",
  instance: "instance",
};

function titleFromSource(source: string, filename: string): string {
  const heading = source.match(/(?:\/-!|--!)\s*\n?\s*#\s+([^\n*]+)/);
  if (heading?.[1]) return heading[1].trim();
  const cleanName = filename.replace(/\.lean$/i, "").replace(/[_-]+/g, " ");
  return cleanName
    ? cleanName.replace(/\b\w/g, (character) => character.toUpperCase())
    : "LeanScribe Notes";
}

function declarationType(rest: string): string {
  const proofIndex = rest.search(/(?:\s:=|\swhere\b|\sby\b)/);
  const signature = (proofIndex >= 0 ? rest.slice(0, proofIndex) : rest).trim();
  return signature.replace(/\s+/g, " ");
}

function mapLeanSymbols(value: string): string {
  let output = value
    .replace(/\/\\/g, "∧")
    .replace(/\\\//g, "∨")
    .replace(/\\/g, "\\backslash ")
    .replace(/\{/g, "\\lbrace ")
    .replace(/\}/g, "\\rbrace ")
    .replace(/↔/g, "\\leftrightarrow ")
    .replace(/→/g, "\\to ")
    .replace(/←/g, "\\leftarrow ")
    .replace(/∀/g, "\\forall ")
    .replace(/∃/g, "\\exists ")
    .replace(/∧/g, "\\land ")
    .replace(/∨/g, "\\lor ")
    .replace(/¬/g, "\\neg ")
    .replace(/≤/g, "\\le ")
    .replace(/≥/g, "\\ge ")
    .replace(/≠/g, "\\ne ")
    .replace(/∈/g, "\\in ")
    .replace(/∉/g, "\\notin ")
    .replace(/⊆/g, "\\subseteq ")
    .replace(/⊂/g, "\\subset ")
    .replace(/∪/g, "\\cup ")
    .replace(/∩/g, "\\cap ")
    .replace(/∅/g, "\\varnothing ")
    .replace(/∞/g, "\\infty ")
    .replace(/ℕ/g, "\\mathbb{N}")
    .replace(/ℤ/g, "\\mathbb{Z}")
    .replace(/ℚ/g, "\\mathbb{Q}")
    .replace(/ℝ/g, "\\mathbb{R}")
    .replace(/ℂ/g, "\\mathbb{C}")
    .replace(/α/g, "\\alpha ")
    .replace(/β/g, "\\beta ")
    .replace(/γ/g, "\\gamma ")
    .replace(/δ/g, "\\delta ")
    .replace(/ε/g, "\\varepsilon ")
    .replace(/λ/g, "\\lambda ")
    .replace(/π/g, "\\pi ")
    .replace(/σ/g, "\\sigma ")
    .replace(/φ/g, "\\varphi ")
    .replace(/⊢/g, "\\vdash ")
    .replace(/⟨/g, "\\langle ")
    .replace(/⟩/g, "\\rangle ");

  output = output
    .replace(/<->/g, "\\leftrightarrow ")
    .replace(/->/g, "\\to ")
    .replace(/\bforall\b/g, "\\forall ")
    .replace(/\bexists\b/g, "\\exists ")
    .replace(/\bNat\b/g, "\\mathbb{N}")
    .replace(/\bInt\b/g, "\\mathbb{Z}")
    .replace(/\bRat\b/g, "\\mathbb{Q}")
    .replace(/\bReal\b/g, "\\mathbb{R}")
    .replace(/\bComplex\b/g, "\\mathbb{C}")
    .replace(/\bProp\b/g, "\\mathsf{Prop}")
    .replace(/\bTrue\b/g, "\\top")
    .replace(/\bFalse\b/g, "\\bot")
    .replace(/\^(\s*)(\d+)/g, "^{$2}")
    .replace(/_/g, "\\_")
    .replace(/:/g, "\\mathrel{:}")
    .replace(/\|/g, "\\mid ");

  return output.replace(/\s+/g, " ").trim();
}

function escapeTexText(value: string): string {
  return value
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/([#$%&_{}])/g, "\\$1")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}");
}

function joinNaturalList(values: string[]): string {
  if (values.length <= 1) return values[0] ?? "";
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  return `${values.slice(0, -1).join(", ")}, and ${values.at(-1)}`;
}

function humanizeIdentifier(value: string): string {
  return value.replace(/_/g, " ").replace(/\./g, " ").replace(/\s+/g, " ").trim();
}

function naturalType(value: string, plural = false): string {
  const normalized = value.trim();
  const types: Record<string, [string, string]> = {
    Nat: ["natural number", "natural numbers"],
    "ℕ": ["natural number", "natural numbers"],
    Int: ["integer", "integers"],
    "ℤ": ["integer", "integers"],
    Rat: ["rational number", "rational numbers"],
    "ℚ": ["rational number", "rational numbers"],
    Real: ["real number", "real numbers"],
    "ℝ": ["real number", "real numbers"],
    Complex: ["complex number", "complex numbers"],
    "ℂ": ["complex number", "complex numbers"],
    Bool: ["Boolean value", "Boolean values"],
    Prop: ["proposition", "propositions"],
    Type: ["type", "types"],
    "Type*": ["type", "types"],
  };
  const known = types[normalized];
  if (known) return known[plural ? 1 : 0];
  return humanizeIdentifier(normalized);
}

function naturalExpression(value: string): string {
  let output = value.trim()
    .replace(/\bNat\.succ\s+([^\s,)]+)/g, "the successor of $1")
    .replace(/\^\s*([\w.-]+)/g, " raised to the power of $1")
    .replace(/↔|<->/g, " if and only if ")
    .replace(/→|->/g, " implies ")
    .replace(/←/g, " follows from ")
    .replace(/∀/g, "for every ")
    .replace(/∃/g, "there exists ")
    .replace(/∧|\/\\/g, " and ")
    .replace(/∨|\\\//g, " or ")
    .replace(/¬/g, "not ")
    .replace(/≤|<=/g, " is less than or equal to ")
    .replace(/≥|>=/g, " is greater than or equal to ")
    .replace(/≠|!=/g, " is not equal to ")
    .replace(/∈/g, " belongs to ")
    .replace(/∉/g, " does not belong to ")
    .replace(/⊆/g, " is a subset of ")
    .replace(/⊂/g, " is a proper subset of ")
    .replace(/∪/g, " union ")
    .replace(/∩/g, " intersection ")
    .replace(/∅/g, "the empty set")
    .replace(/∞/g, "infinity")
    .replace(/\bTrue\b/g, "true")
    .replace(/\bFalse\b/g, "false")
    .replace(/\bNat\b|ℕ/g, "the natural numbers")
    .replace(/\bInt\b|ℤ/g, "the integers")
    .replace(/\bRat\b|ℚ/g, "the rational numbers")
    .replace(/\bReal\b|ℝ/g, "the real numbers")
    .replace(/\bComplex\b|ℂ/g, "the complex numbers")
    .replace(/\s=\s/g, " equals ")
    .replace(/\s\+\s/g, " plus ")
    .replace(/\s-\s/g, " minus ")
    .replace(/\s\*\s/g, " times ")
    .replace(/\s\/\s/g, " divided by ")
    .replace(/\bfun\b/g, "the function")
    .replace(/\blambda\b|λ/g, "lambda")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.)])/g, "$1")
    .trim();

  output = humanizeIdentifier(output);
  return output || "the declaration shown";
}

function splitLeadingBinders(signature: string): {
  statement: string;
  variables: string[];
  assumptions: string[];
} {
  let rest = signature.trim();
  const variables: string[] = [];
  const assumptions: string[] = [];

  while (rest.startsWith("(") || rest.startsWith("{")) {
    const opener = rest[0];
    const closer = opener === "(" ? ")" : "}";
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

    const binder = rest.slice(1, end).trim();
    rest = rest.slice(end + 1).trim();
    const colon = binder.indexOf(":");
    if (colon < 0) continue;

    const rawNames = binder.slice(0, colon).trim().split(/\s+/).filter(Boolean);
    const rawType = binder.slice(colon + 1).trim();
    const looksLikeAssumption =
      rawNames.every((name) => /^h\w*$/i.test(name)) ||
      /[=<>≤≥≠↔→∧∨]|\bProp\b/.test(rawType);

    if (looksLikeAssumption) {
      assumptions.push(naturalExpression(rawType));
    } else if (rawNames.length) {
      const names = joinNaturalList(rawNames.map(humanizeIdentifier));
      variables.push(`${naturalType(rawType, rawNames.length > 1)} ${names}`);
    }
  }

  return {
    statement: rest.replace(/^:\s*/, "").trim(),
    variables,
    assumptions,
  };
}

function describeDeclaration(
  kind: DeclarationKind,
  name: string,
  leanType: string,
): string {
  const { statement, variables, assumptions } = splitLeadingBinders(leanType);
  const clauses: string[] = [];
  if (variables.length) {
    const quantifier = variables.some((variable) =>
      /\b(numbers|integers|types|values|propositions)\b/.test(variable),
    )
      ? "for all"
      : "for every";
    clauses.push(`${quantifier} ${joinNaturalList(variables)}`);
  }
  if (assumptions.length) clauses.push(`assuming ${joinNaturalList(assumptions)}`);

  const claim = naturalExpression(statement);
  const core = clauses.length ? `${clauses.join(", ")}, ${claim}` : claim;
  const sentence = core.charAt(0).toUpperCase() + core.slice(1).replace(/[.;:]?$/, ".");

  if (kind === "definition") {
    return `The definition “${humanizeIdentifier(name)}” is described as follows: ${sentence}`;
  }
  if (kind === "structure" || kind === "inductive") {
    return `The ${kind} type “${humanizeIdentifier(name)}” is described as follows: ${sentence}`;
  }
  if (kind === "theorem" || kind === "lemma" || kind === "corollary") {
    return `This ${kind} states: ${sentence}`;
  }
  return sentence;
}

function csvCell(value: string | number): string {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function buildCsv(title: string, declarations: LeanDeclaration[]): string {
  const header = [
    "document",
    "kind",
    "natural_language_kind",
    "name",
    "line",
    "natural_language",
    "proof_strategy",
    "dependencies",
    "confidence",
    "caveats",
    "lean_signature",
    "latex",
  ];
  const rows = declarations.map((declaration) => [
    title,
    declaration.kind,
    declaration.kind,
    declaration.name,
    declaration.line,
    declaration.naturalLanguage,
    declaration.proofStrategy ?? "",
    (declaration.dependencies ?? []).join("; "),
    declaration.confidence ?? "local",
    (declaration.caveats ?? []).join("; "),
    declaration.leanType,
    declaration.latex,
  ]);
  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

export function convertLean(source: string, filename = "Main.lean"): ConversionResult {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const declarations: LeanDeclaration[] = [];
  const imports: string[] = [];
  const namespaces: string[] = [];
  let pendingNote = "";
  let inDocComment = false;

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("/-!")) {
      inDocComment = true;
      pendingNote = trimmed.replace(/^\/-!\s*/, "").replace(/-\/$/, "").trim();
      if (trimmed.endsWith("-/")) inDocComment = false;
      return;
    }
    if (inDocComment) {
      if (trimmed.endsWith("-/")) {
        inDocComment = false;
        pendingNote += ` ${trimmed.replace(/-\/$/, "").trim()}`;
      } else if (!trimmed.startsWith("#")) {
        pendingNote += ` ${trimmed}`;
      }
      pendingNote = pendingNote.trim();
      return;
    }
    if (trimmed.startsWith("--!")) {
      pendingNote = trimmed.replace(/^--!\s*/, "");
      return;
    }

    const importMatch = trimmed.match(/^import\s+(.+)$/);
    if (importMatch) {
      imports.push(importMatch[1]);
      return;
    }
    const namespaceMatch = trimmed.match(/^namespace\s+([^\s]+)$/);
    if (namespaceMatch) {
      namespaces.push(namespaceMatch[1]);
      return;
    }

    const match = line.match(
      /^\s*(theorem|lemma|corollary|example|def|abbrev|axiom|structure|inductive|class|instance)\s*(?:([^\s(:]+)\s*)?(.*)$/,
    );
    if (!match) return;

    const rawKind = match[1];
    const fallbackName = `${rawKind}_${declarations.length + 1}`;
    const name = rawKind === "example" ? fallbackName : match[2] || fallbackName;
    const typePrefix = rawKind === "example" && match[2] ? `${match[2]} ${match[3]}` : match[3];
    const leanType = declarationType(typePrefix || "");

    const declarationKind = kindMap[rawKind];
    declarations.push({
      kind: declarationKind,
      name,
      leanType: leanType || "(declaration body)",
      latex: mapLeanSymbols(leanType || "declaration body"),
      naturalLanguage: describeDeclaration(
        declarationKind,
        name,
        leanType || "declaration body",
      ),
      line: index + 1,
      note: pendingNote || undefined,
    });
    pendingNote = "";
  });

  const title = titleFromSource(source, filename);
  return {
    declarations,
    imports,
    namespaces,
    title,
    overview: "",
    prerequisites: [],
    glossary: [],
    warnings: [],
    mode: "local",
    tex: buildTex(title, declarations, imports),
    csv: buildCsv(title, declarations),
  };
}

export function mergeSemanticTranslation(
  local: ConversionResult,
  semantic: SemanticTranslation,
  model: string,
): ConversionResult {
  const unusedLocal = [...local.declarations];
  const declarations: LeanDeclaration[] = semantic.declarations.map((declaration, index) => {
    const matchIndex = unusedLocal.findIndex(
      (candidate) =>
        candidate.name === declaration.name ||
        candidate.name.replace(/\.\d+$/, "") === declaration.name,
    );
    const fallbackIndex = matchIndex >= 0 ? matchIndex : Math.min(index, unusedLocal.length - 1);
    const localDeclaration = fallbackIndex >= 0 ? unusedLocal.splice(fallbackIndex, 1)[0] : undefined;

    return {
      // The parser reads the source keyword directly, so it is the authority for
      // declaration type. Expert prose may enrich a declaration, but must not
      // silently turn a theorem into a lemma (or vice versa).
      kind: localDeclaration?.kind ?? declaration.kind,
      name: declaration.name || localDeclaration?.name || `declaration_${index + 1}`,
      leanType: declaration.sourceSignature || localDeclaration?.leanType || "(signature unavailable)",
      latex: declaration.mathematicalStatementLatex || localDeclaration?.latex || "",
      naturalLanguage: declaration.naturalLanguage,
      line: localDeclaration?.line ?? 0,
      note: localDeclaration?.note,
      proofStrategy: declaration.proofStrategy,
      dependencies: declaration.dependencies,
      caveats: declaration.caveats,
      confidence: declaration.confidence,
    };
  });

  const result: ConversionResult = {
    ...local,
    title: semantic.title || local.title,
    overview: semantic.overview,
    prerequisites: semantic.prerequisites,
    glossary: semantic.glossary,
    warnings: semantic.warnings,
    declarations,
    mode: "expert",
    model,
    tex: "",
    csv: "",
  };
  result.tex = buildTex(
    result.title,
    result.declarations,
    result.imports,
    result.overview,
    result.prerequisites,
    result.glossary,
    result.warnings,
  );
  result.csv = buildCsv(result.title, result.declarations);
  return result;
}

function buildTex(
  title: string,
  declarations: LeanDeclaration[],
  imports: string[],
  overview = "",
  prerequisites: string[] = [],
  glossary: Array<{ term: string; explanation: string }> = [],
  warnings: string[] = [],
): string {
  const content = declarations.length
    ? declarations
        .map((declaration) => {
          const note = declaration.note
            ? `\n${escapeTexText(declaration.note)}\n`
            : "";
          const strategy = declaration.proofStrategy
            ? `\n\n\\paragraph{Proof strategy.} ${escapeTexText(declaration.proofStrategy)}`
            : "";
          const dependencies = declaration.dependencies?.length
            ? `\n\n\\paragraph{Dependencies.} ${escapeTexText(declaration.dependencies.join(", "))}`
            : "";
          const caveats = declaration.caveats?.length
            ? `\n\n\\paragraph{Caveats.} ${escapeTexText(declaration.caveats.join(" "))}`
            : "";
          return `\\subsection*{Natural-language ${capitalize(declaration.kind)}: \\texttt{${escapeTexText(declaration.name)}}}${note}
\\noindent ${escapeTexText(declaration.naturalLanguage)}${strategy}${dependencies}${caveats}

\\[
  ${declaration.latex}
\\]`;
        })
        .join("\n\n")
    : "No supported declarations were found in the source.";

  return `\\documentclass[11pt]{article}
\\usepackage[margin=1in]{geometry}
\\usepackage{amsmath,amssymb,mathtools}
\\usepackage[T1]{fontenc}
\\usepackage[utf8]{inputenc}
\\usepackage{xcolor}
\\definecolor{leanscribe}{HTML}{315BFF}
\\title{${escapeTexText(title)}}
\\author{Generated by LeanScribe}
\\date{}

\\begin{document}
\\maketitle
\\noindent\\textcolor{leanscribe}{\\rule{\\linewidth}{1.5pt}}

${overview ? `\\section*{Overview}\n${escapeTexText(overview)}\n\n` : ""}${prerequisites.length ? `\\paragraph{Prerequisites.} ${escapeTexText(prerequisites.join("; "))}\n\n` : ""}${imports.length ? `\\small\\textit{Imports: ${escapeTexText(imports.join(", "))}}\\normalsize\n\n` : ""}${content}

${glossary.length ? `\\section*{Glossary}\n${glossary.map((entry) => `\\paragraph{${escapeTexText(entry.term)}} ${escapeTexText(entry.explanation)}`).join("\n\n")}\n` : ""}${warnings.length ? `\\section*{Interpretive notes}\n\\begin{itemize}\n${warnings.map((warning) => `  \\item ${escapeTexText(warning)}`).join("\n")}\n\\end{itemize}\n` : ""}

\\end{document}
`;
}

export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function asciiPdfText(value: string): string {
  return value
    .replace(/ℕ/g, "N")
    .replace(/ℤ/g, "Z")
    .replace(/ℚ/g, "Q")
    .replace(/ℝ/g, "R")
    .replace(/ℂ/g, "C")
    .replace(/≤/g, "<=")
    .replace(/≥/g, ">=")
    .replace(/≠/g, "!=")
    .replace(/→/g, "->")
    .replace(/↔/g, "<->")
    .replace(/∀/g, "forall ")
    .replace(/∃/g, "exists ")
    .replace(/∧/g, "and")
    .replace(/∨/g, "or")
    .replace(/¬/g, "not ")
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "?");
}

function wrapText(value: string, width = 84): string[] {
  const words = asciiPdfText(value).split(/\s+/);
  const lines: string[] = [];
  let line = "";
  words.forEach((word) => {
    if (!line) line = word;
    else if (`${line} ${word}`.length <= width) line += ` ${word}`;
    else {
      lines.push(line);
      line = word;
    }
  });
  if (line) lines.push(line);
  return lines;
}

function pdfEscape(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

export function buildPdf(result: ConversionResult): Blob {
  const lines: string[] = [result.title, "Generated by LeanScribe", ""];
  if (result.overview) {
    lines.push("Overview");
    wrapText(result.overview).forEach((line) => lines.push(`  ${line}`));
    lines.push("");
  }
  if (result.prerequisites.length) {
    lines.push("Prerequisites");
    result.prerequisites.forEach((item) =>
      wrapText(item, 80).forEach((line) => lines.push(`  - ${line}`)),
    );
    lines.push("");
  }
  if (result.imports.length) lines.push(`Imports: ${result.imports.join(", ")}`, "");
  result.declarations.forEach((declaration, index) => {
    lines.push(`${index + 1}. Natural-language ${capitalize(declaration.kind)}: ${declaration.name}`);
    wrapText(declaration.naturalLanguage).forEach((line) => lines.push(`   ${line}`));
    if (declaration.proofStrategy) {
      wrapText(`Proof strategy: ${declaration.proofStrategy}`, 80).forEach((line) =>
        lines.push(`   ${line}`),
      );
    }
    if (declaration.dependencies?.length) {
      wrapText(`Dependencies: ${declaration.dependencies.join(", ")}`, 80).forEach((line) =>
        lines.push(`   ${line}`),
      );
    }
    if (declaration.caveats?.length) {
      wrapText(`Caveats: ${declaration.caveats.join(" ")}`, 80).forEach((line) =>
        lines.push(`   ${line}`),
      );
    }
    lines.push("");
  });
  if (result.glossary.length) {
    lines.push("Glossary");
    result.glossary.forEach((entry) =>
      wrapText(`${entry.term}: ${entry.explanation}`, 80).forEach((line) => lines.push(`  ${line}`)),
    );
    lines.push("");
  }
  if (result.warnings.length) {
    lines.push("Interpretive notes");
    result.warnings.forEach((warning) =>
      wrapText(warning, 80).forEach((line) => lines.push(`  - ${line}`)),
    );
    lines.push("");
  }
  if (!result.declarations.length) lines.push("No supported declarations were found.");

  const linesPerPage = 45;
  const pages: string[][] = [];
  for (let index = 0; index < lines.length; index += linesPerPage) {
    pages.push(lines.slice(index, index + linesPerPage));
  }

  const objects: string[] = [];
  const pageRefs = pages.map((_, index) => `${4 + index * 2} 0 R`).join(" ");
  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[2] = `<< /Type /Pages /Kids [${pageRefs}] /Count ${pages.length} >>`;
  objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>";

  pages.forEach((pageLines, index) => {
    const pageObject = 4 + index * 2;
    const contentObject = pageObject + 1;
    const commands = pageLines
      .map((line, lineIndex) =>
        lineIndex === 0
          ? `(${pdfEscape(asciiPdfText(line))}) Tj`
          : `0 -16 Td (${pdfEscape(asciiPdfText(line))}) Tj`,
      )
      .join("\n");
    const stream = `BT\n/F1 10 Tf\n54 790 Td\n${commands}\nET`;
    objects[pageObject] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] ` +
      `/Resources << /Font << /F1 3 0 R >> >> /Contents ${contentObject} 0 R >>`;
    objects[contentObject] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
  });

  let pdf = "%PDF-1.4\n%LeanScribe\n";
  const offsets = [0];
  for (let index = 1; index < objects.length; index += 1) {
    offsets[index] = pdf.length;
    pdf += `${index} 0 obj\n${objects[index]}\nendobj\n`;
  }
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let index = 1; index < objects.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new Blob([new TextEncoder().encode(pdf)], { type: "application/pdf" });
}
