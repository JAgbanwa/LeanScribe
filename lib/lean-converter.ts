export type DeclarationKind =
  | "theorem"
  | "lemma"
  | "example"
  | "definition"
  | "axiom"
  | "structure"
  | "inductive";

export type LeanDeclaration = {
  kind: DeclarationKind;
  name: string;
  leanType: string;
  latex: string;
  line: number;
  note?: string;
};

export type ConversionResult = {
  declarations: LeanDeclaration[];
  imports: string[];
  namespaces: string[];
  title: string;
  tex: string;
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
  example: "example",
  def: "definition",
  abbrev: "definition",
  axiom: "axiom",
  structure: "structure",
  inductive: "inductive",
};

function titleFromSource(source: string, filename: string): string {
  const heading = source.match(/(?:\/\-!|--!)\s*\n?\s*#\s+([^\n*]+)/);
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
      pendingNote = trimmed.replace(/^\/\-!\s*/, "").replace(/-\/$/, "").trim();
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
      /^\s*(theorem|lemma|example|def|abbrev|axiom|structure|inductive)\s*(?:([^\s(:]+)\s*)?(.*)$/,
    );
    if (!match) return;

    const rawKind = match[1];
    const fallbackName = `${rawKind}_${declarations.length + 1}`;
    const name = rawKind === "example" ? fallbackName : match[2] || fallbackName;
    const typePrefix = rawKind === "example" && match[2] ? `${match[2]} ${match[3]}` : match[3];
    const leanType = declarationType(typePrefix || "");

    declarations.push({
      kind: kindMap[rawKind],
      name,
      leanType: leanType || "(declaration body)",
      latex: mapLeanSymbols(leanType || "declaration body"),
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
    tex: buildTex(title, declarations, imports),
  };
}

function buildTex(
  title: string,
  declarations: LeanDeclaration[],
  imports: string[],
): string {
  const content = declarations.length
    ? declarations
        .map((declaration) => {
          const note = declaration.note
            ? `\n${escapeTexText(declaration.note)}\n`
            : "";
          return `\\subsection*{${capitalize(declaration.kind)}: \\texttt{${escapeTexText(declaration.name)}}}${note}
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

${imports.length ? `\\small\\textit{Imports: ${escapeTexText(imports.join(", "))}}\\normalsize\n\n` : ""}${content}

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
  if (result.imports.length) lines.push(`Imports: ${result.imports.join(", ")}`, "");
  result.declarations.forEach((declaration, index) => {
    lines.push(`${index + 1}. ${capitalize(declaration.kind)}: ${declaration.name}`);
    wrapText(declaration.leanType).forEach((line) => lines.push(`   ${line}`));
    lines.push("");
  });
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
