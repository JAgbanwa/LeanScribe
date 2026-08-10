"use client";

import {
  useMemo,
  useRef,
  useState,
} from "react";
import type { ChangeEvent, ClipboardEvent, DragEvent } from "react";
import {
  buildPdf,
  capitalize,
  convertLean,
  DEFAULT_SOURCE,
  mergeSemanticTranslation,
  refreshConversionExports,
} from "@/lib/lean-converter";
import type { SemanticTranslation } from "@/lib/semantic-schema";
import {
  buildProvisionalPublication,
  isSemanticIRBundle,
  proseForLevel,
  publicationFromSemanticIR,
  publicationToHtml,
  publicationToMarkdown,
} from "@/lib/semantic-ir";
import type { ProseTrustLevel, SemanticIRBundle } from "@/lib/semantic-ir";

type PreviewMode = "document" | "latex" | "csv";
type ExpertState = "idle" | "loading" | "ready" | "error";

function safeBaseName(filename: string): string {
  return (filename.replace(/(?:\.leanscribe\.json|\.lean|\.json)$/i, "") || "LeanScribe").replace(/[^a-zA-Z0-9_-]/g, "-");
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function LeanScribe({ expertEnabled = false }: { expertEnabled?: boolean }) {
  const [source, setSource] = useState(DEFAULT_SOURCE);
  const [filename, setFilename] = useState("Arithmetic.lean");
  const [previewMode, setPreviewMode] = useState<PreviewMode>("document");
  const [proseLevel, setProseLevel] = useState<ProseTrustLevel>("literal");
  const [dragging, setDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const [semantic, setSemantic] = useState<{
    translation: SemanticTranslation;
    model: string;
  } | null>(null);
  const [expertState, setExpertState] = useState<ExpertState>("idle");
  const [expertMessage, setExpertMessage] = useState("");
  const [semanticBundle, setSemanticBundle] = useState<SemanticIRBundle | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const sourceEditor = useRef<HTMLTextAreaElement>(null);
  const expertRequest = useRef(0);
  const localResult = useMemo(() => convertLean(source, filename), [source, filename]);
  const importedPublication = useMemo(
    () => semanticBundle ? publicationFromSemanticIR(semanticBundle) : null,
    [semanticBundle],
  );
  const importedResult = useMemo(
    () => importedPublication
      ? refreshConversionExports({
          ...localResult,
          title: importedPublication.title,
          declarations: importedPublication.declarations,
          overview: semanticBundle?.trustStatement || "Elaborated Lean semantic bundle.",
          warnings: [],
          mode: "local",
        })
      : null,
    [importedPublication, localResult, semanticBundle],
  );
  const result = useMemo(
    () =>
      semantic
        ? mergeSemanticTranslation(importedResult || localResult, semantic.translation, semantic.model)
        : importedResult || localResult,
    [importedResult, localResult, semantic],
  );
  const publication = useMemo(
    () => importedPublication || buildProvisionalPublication(result, source, filename),
    [filename, importedPublication, result, source],
  );

  const updateSource = (nextSource: string) => {
    expertRequest.current += 1;
    setSource(nextSource);
    setSemanticBundle(null);
    setSemantic(null);
    setExpertState("idle");
    setExpertMessage("");
  };

  const runExpertTranslation = async () => {
    if (!expertEnabled || !semanticBundle) {
      setExpertState("error");
      setExpertMessage("Import elaborated LeanScribe semantic IR before requesting polished prose.");
      return;
    }
    const requestId = expertRequest.current + 1;
    expertRequest.current = requestId;
    setExpertState("loading");
    setExpertMessage("Polishing elaborated declarations while preserving their semantic structure…");

    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ semanticIR: semanticBundle, filename }),
      });
      const payload = (await response.json()) as {
        translation?: SemanticTranslation;
        model?: string;
        error?: string;
      };
      if (!response.ok || !payload.translation) {
        throw new Error(payload.error || "Expert translation failed.");
      }
      if (expertRequest.current !== requestId) return;
      setSemantic({ translation: payload.translation, model: payload.model || "expert model" });
      setExpertState("ready");
      setExpertMessage(
        `${payload.translation.declarations.length} declarations polished from elaborated semantic IR.`,
      );
    } catch (error) {
      if (expertRequest.current !== requestId) return;
      setExpertState("error");
      setExpertMessage(
        error instanceof Error ? error.message : "Expert translation failed.",
      );
    }
  };

  const loadFile = async (file?: File) => {
    if (!file) return;
    const lowerName = file.name.toLowerCase();
    if (lowerName.endsWith(".json")) {
      try {
        const bundle = JSON.parse(await file.text()) as unknown;
        if (!isSemanticIRBundle(bundle)) throw new Error("Not a LeanScribe semantic bundle.");
        expertRequest.current += 1;
        setSemanticBundle(bundle);
        setSemantic(null);
        setExpertState("idle");
        setExpertMessage("");
        setFilename(file.name);
        setSource("");
        setProseLevel("literal");
      } catch {
        setExpertState("error");
        setExpertMessage("This JSON file is not a valid LeanScribe semantic IR bundle.");
      }
      return;
    }
    if (!lowerName.endsWith(".lean")) {
      fileInput.current?.focus();
      return;
    }
    const text = await file.text();
    setFilename(file.name);
    updateSource(text);
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    void loadFile(event.target.files?.[0]);
    event.target.value = "";
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    void loadFile(event.dataTransfer.files[0]);
  };

  const onPaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    const pasted = event.clipboardData.getData("text");
    if (!pasted) return;
    event.preventDefault();
    const editor = event.currentTarget;
    const nextSource =
      source.slice(0, editor.selectionStart) +
      pasted +
      source.slice(editor.selectionEnd);
    updateSource(nextSource);
  };

  const downloadTex = () => {
    download(new Blob([result.tex], { type: "application/x-tex;charset=utf-8" }), `${safeBaseName(filename)}.tex`);
  };

  const downloadPdf = () => {
    download(buildPdf(result), `${safeBaseName(filename)}.pdf`);
  };

  const downloadCsv = () => {
    download(
      new Blob([result.csv], { type: "text/csv;charset=utf-8" }),
      `${safeBaseName(filename)}.csv`,
    );
  };

  const downloadMarkdown = () => {
    download(
      new Blob([publicationToMarkdown(publication)], { type: "text/markdown;charset=utf-8" }),
      `${safeBaseName(filename)}.md`,
    );
  };

  const downloadHtml = () => {
    download(
      new Blob([publicationToHtml(publication)], { type: "text/html;charset=utf-8" }),
      `${safeBaseName(filename)}.html`,
    );
  };

  const downloadJson = () => {
    download(
      new Blob([JSON.stringify(publication, null, 2)], { type: "application/json;charset=utf-8" }),
      `${safeBaseName(filename)}.leanscribe.json`,
    );
  };

  const revealSourceLine = (line: number) => {
    const editor = sourceEditor.current;
    if (!editor || line < 1 || !source) return;
    const sourceLines = source.split("\n");
    const start = sourceLines.slice(0, line - 1).reduce((length, item) => length + item.length + 1, 0);
    const end = start + (sourceLines[line - 1]?.length ?? 0);
    editor.focus();
    editor.setSelectionRange(start, end);
  };

  const copyOutput = async () => {
    await navigator.clipboard.writeText(previewMode === "csv" ? result.csv : result.tex);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const lineCount = source ? source.split("\n").length : 0;

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#workspace" aria-label="LeanScribe home">
          <span className="brand-mark" aria-hidden="true">λ</span>
          <span>LeanScribe</span>
        </a>
        <div className="privacy-note">
          <span className="privacy-dot" aria-hidden="true" />
          {expertEnabled
            ? "Local fallback · expert analysis available"
            : "Public local mode · source stays in your browser"}
        </div>
        <a
          className="github-link"
          href="https://github.com/JAgbanwa/LeanScribe"
          target="_blank"
          rel="noreferrer"
        >
          View on GitHub <span aria-hidden="true">↗</span>
        </a>
      </header>

      <section className="hero" aria-labelledby="page-title">
        <p className="eyebrow"><span>Lean</span><i /> <span>Plain English</span><i /> <span>PDF · TeX · CSV</span></p>
        <h1 id="page-title">Formal declarations.<br />Traceable literature.</h1>
        <p className="hero-copy">
          Every generated sentence should be readable by a mathematician and
          traceable to the exact formal assumptions, objects, and conclusion from
          which it came. LeanScribe visibly separates unelaborated drafts from
          structurally checked semantic publications.
        </p>
      </section>

      <section className="workspace" id="workspace" aria-label="Lean conversion workspace">
        <div className="workspace-heading">
          <div>
            <span className="step-label">01 / SOURCE</span>
            <h2>Paste Lean source</h2>
          </div>
          <div className="file-actions">
            <button className="text-button" type="button" onClick={() => fileInput.current?.click()}>
              Open .lean or semantic IR
            </button>
            <button className="text-button muted" type="button" onClick={() => { updateSource(""); setFilename("Main.lean"); }}>
              Clear
            </button>
            <input
              ref={fileInput}
              className="visually-hidden"
              type="file"
              accept=".lean,.json,text/plain,application/json"
              onChange={onFileChange}
              aria-label="Choose a Lean file"
            />
          </div>
        </div>

        <div
          className={`editor-wrap ${dragging ? "is-dragging" : ""}`}
          onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <div className="editor-bar">
            <span className="file-badge"><b>λ</b> {filename}</span>
            <span className="live-status"><i /> Live conversion · {lineCount} lines</span>
          </div>
          <textarea
            ref={sourceEditor}
            className="source-editor"
            value={source}
            onChange={(event) => updateSource(event.target.value)}
            onPaste={onPaste}
            spellCheck={false}
            aria-label="Paste or edit Lean source; output updates automatically"
            placeholder="Paste the contents of a .lean file here…"
          />
          {dragging && <div className="drop-overlay">Drop your .lean file</div>}
        </div>

        {expertEnabled ? (
          <div className={`expert-panel state-${expertState}`} aria-live="polite">
            <div className="expert-copy">
              <span className="expert-badge"><i aria-hidden="true">✦</i> GPT-5.6 SOL · HIGH REASONING</span>
              <h3>Proof-aware semantic translation</h3>
              <p>
                Polishes declarations from elaborated binders, types, dependencies, and trust
                metadata while treating the semantic IR as the sole mathematical ground truth.
              </p>
              <small>
                Raw Lean source is never sent to the model. Import a LeanScribe semantic bundle
                first; generated commentary remains visibly lower-trust than literal rendering.
              </small>
            </div>
            <div className="expert-action">
              <button
                type="button"
                onClick={() => void runExpertTranslation()}
                disabled={!semanticBundle || expertState === "loading"}
              >
                {expertState === "loading"
                  ? "Interpreting proof…"
                  : expertState === "ready"
                    ? "Re-run expert translation"
                    : "Generate expert translation"}
              </button>
              <span>{expertMessage || "Import elaborated semantic IR, then request optional polished prose."}</span>
            </div>
          </div>
        ) : (
          <div className="expert-panel state-idle" aria-live="polite">
            <div className="expert-copy">
              <span className="expert-badge"><i aria-hidden="true">✓</i> PUBLIC · LOCAL-ONLY</span>
              <h3>Two clearly separated trust paths</h3>
              <p>
                Raw Lean source produces an explicitly unelaborated draft. For structural trust,
                import a <code>.leanscribe.json</code> bundle generated by the Lean-native extractor.
              </p>
              <small>
                Nothing is uploaded to an AI provider. Expert commentary remains disabled on the
                public deployment and can never receive the highest trust badge.
              </small>
            </div>
            <div className="expert-action">
              <span>Paste a declaration for a draft, or open semantic IR for traceable publishing.</span>
            </div>
          </div>
        )}

        <div className="conversion-rail" aria-hidden="true">
          <span />
          <b>{publication.extractionStatus === "elaborated" ? "semantic extraction loaded" : "unelaborated draft only"}</b>
          <span />
        </div>

        <div className="workspace-heading output-heading">
          <div>
            <span className="step-label">02 / OUTPUT</span>
            <h2>Natural-language document</h2>
          </div>
          <div className="output-controls">
            <div className="trust-tabs" aria-label="Prose trust level">
              {(["literal", "polished", "explanatory"] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  className={proseLevel === level ? "active" : ""}
                  aria-pressed={proseLevel === level}
                  onClick={() => setProseLevel(level)}
                >
                  {capitalize(level)}
                </button>
              ))}
            </div>
            <div className="preview-tabs" role="tablist" aria-label="Output preview">
            <button
              type="button"
              role="tab"
              aria-selected={previewMode === "document"}
              className={previewMode === "document" ? "active" : ""}
              onClick={() => setPreviewMode("document")}
            >
              Plain English
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={previewMode === "latex"}
              className={previewMode === "latex" ? "active" : ""}
              onClick={() => setPreviewMode("latex")}
            >
              LaTeX
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={previewMode === "csv"}
              className={previewMode === "csv" ? "active" : ""}
              onClick={() => setPreviewMode("csv")}
            >
              CSV
            </button>
            </div>
          </div>
        </div>

        <div className="output-panel">
          {previewMode === "document" ? (
            <article className="paper-preview">
              <div className="paper-kicker">
                {publication.extractionStatus === "elaborated"
                  ? "ELABORATED SEMANTIC IR"
                  : "UNELABORATED SOURCE DRAFT"} · {proseLevel.toUpperCase()} VIEW
              </div>
              <h3>{result.title}</h3>
              <div className={`trust-banner ${publication.extractionStatus}`}>
                <b>{publication.extractionStatus === "elaborated" ? "Structural trust available" : "No semantic trust claim"}</b>
                <span>
                  {publication.extractionStatus === "elaborated"
                    ? "Every visible formal component is represented in the coverage ledger below."
                    : "This browser-only source scan has not been elaborated by Lean. Import semantic IR for trusted statement publishing."}
                </span>
                <code>{publication.sourceHash}</code>
              </div>
              {result.overview && <p className="document-overview">{result.overview}</p>}
              {result.prerequisites.length > 0 && (
                <div className="prerequisites">
                  <b>Prerequisites</b>
                  <p>{result.prerequisites.join(" · ")}</p>
                </div>
              )}
              {result.imports.length > 0 && (
                <p className="imports">Imports: {result.imports.join(", ")}</p>
              )}
              <div className="paper-rule" />
              {publication.declarations.length ? publication.declarations.map((declaration, index) => (
                <section className="declaration" key={`${declaration.name}-${declaration.line}`}>
                  <div className="declaration-meta">
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <b>Natural-language {capitalize(declaration.kind)}</b>
                    {declaration.line > 0 && (
                      <button className="source-link" type="button" onClick={() => revealSourceLine(declaration.line)}>
                        line {declaration.line}
                      </button>
                    )}
                    {declaration.confidence && (
                      <strong className={`confidence ${declaration.confidence}`}>
                        {declaration.confidence} confidence
                      </strong>
                    )}
                  </div>
                  <h4>{declaration.name.replace(/_/g, " ")}</h4>
                  {declaration.note && <p className="declaration-note">{declaration.note}</p>}
                  <p className="natural-language">{proseForLevel(declaration, proseLevel)}</p>
                  {proseLevel !== "literal" && declaration.proofStrategy && (
                    <div className="proof-strategy">
                      <b>Generated proof commentary · lower trust</b>
                      <p>{declaration.proofStrategy}</p>
                    </div>
                  )}
                  {declaration.dependencies && declaration.dependencies.length > 0 && (
                    <p className="dependency-line">
                      <b>Uses:</b> {declaration.dependencies.join(", ")}
                    </p>
                  )}
                  {declaration.caveats && declaration.caveats.length > 0 && (
                    <div className="caveats">
                      {declaration.caveats.map((caveat) => <p key={caveat}>{caveat}</p>)}
                    </div>
                  )}
                  <details>
                    <summary>Lean signature</summary>
                    <code>{declaration.leanType}</code>
                  </details>
                  <details className="coverage-ledger" open={index === 0}>
                    <summary>Semantic coverage ledger · {declaration.trace.covered}/{declaration.trace.total} structurally checked</summary>
                    <div className="ledger-table" role="table" aria-label={`Coverage ledger for ${declaration.name}`}>
                      {declaration.trace.entries.map((entry) => (
                        <div className="ledger-row" role="row" key={entry.id}>
                          <span role="cell">{entry.semanticRole}</span>
                          <code role="cell">{entry.formalText}</code>
                          <p role="cell">{entry.proseText}</p>
                          <b role="cell" className={`coverage-${entry.status}`}>{entry.status}</b>
                        </div>
                      ))}
                    </div>
                  </details>
                  <div className="formal-trust">
                    <b>{declaration.trace.highestTrustEligible ? "STRUCTURAL CHECKS PASSED" : "DRAFT · TRUST BLOCKED"}</b>
                    <p>{declaration.trust.statement}</p>
                    <dl>
                      <div><dt>Proof</dt><dd>{declaration.trust.proofStatus}</dd></div>
                      <div><dt>Lean</dt><dd>{declaration.trust.leanVersion || "not elaborated"}</dd></div>
                      <div><dt>Axioms</dt><dd>{declaration.trust.axioms.join(", ") || (declaration.trust.usesSorry === null ? "not audited" : "none")}</dd></div>
                      <div><dt>Human review</dt><dd>{declaration.trust.humanReviewed ? "recorded" : "not recorded"}</dd></div>
                    </dl>
                  </div>
                </section>
              )) : (
                <div className="empty-output">
                  <b>No declarations yet</b>
                  <span>Add a theorem, lemma, corollary, example, definition, axiom, structure, or inductive type.</span>
                </div>
              )}
              {result.glossary.length > 0 && (
                <section className="glossary">
                  <h4>Glossary</h4>
                  <dl>
                    {result.glossary.map((entry) => (
                      <div key={entry.term}><dt>{entry.term}</dt><dd>{entry.explanation}</dd></div>
                    ))}
                  </dl>
                </section>
              )}
              {result.warnings.length > 0 && (
                <section className="document-warnings">
                  <b>Interpretive notes</b>
                  {result.warnings.map((warning) => <p key={warning}>{warning}</p>)}
                </section>
              )}
            </article>
          ) : previewMode === "latex" ? (
            <div className="latex-preview">
              <button type="button" onClick={() => void copyOutput()}>{copied ? "Copied" : "Copy TeX"}</button>
              <pre>{result.tex}</pre>
            </div>
          ) : (
            <div className="latex-preview csv-preview">
              <button type="button" onClick={() => void copyOutput()}>{copied ? "Copied" : "Copy CSV"}</button>
              <pre>{result.csv}</pre>
            </div>
          )}
        </div>

        <div className="export-bar">
          <div className="ready-state">
            <span aria-hidden="true">{result.mode === "expert" ? "✦" : "✓"}</span>
            <p>
              <b>{publication.extractionStatus === "elaborated" ? "Traceable statement document ready" : "Unelaborated draft ready"}</b>
              <small>{publication.declarations.length} declarations · {publication.extractionStatus === "elaborated" ? "Lean-native semantic IR" : "source scan only"}</small>
            </p>
          </div>
          <div className="export-actions">
            <button type="button" className="export secondary" onClick={downloadTex}>
              <span className="format-icon">T<span>E</span>X</span>
              <span><b>Download .tex</b><small>Editable source</small></span>
            </button>
            <button type="button" className="export secondary" onClick={downloadCsv}>
              <span className="format-icon">CSV</span>
              <span><b>Download .csv</b><small>Structured data</small></span>
            </button>
            <button type="button" className="export primary" onClick={downloadPdf}>
              <span className="format-icon">PDF</span>
              <span><b>Download .pdf</b><small>Ready to share</small></span>
            </button>
            <button type="button" className="export secondary" onClick={downloadMarkdown}>
              <span className="format-icon">MD</span>
              <span><b>Download .md</b><small>Traceable Markdown</small></span>
            </button>
            <button type="button" className="export secondary" onClick={downloadHtml}>
              <span className="format-icon">HTML</span>
              <span><b>Download .html</b><small>Accessible publication</small></span>
            </button>
            <button type="button" className="export secondary" onClick={downloadJson}>
              <span className="format-icon">JSON</span>
              <span><b>Download .json</b><small>Structured trace data</small></span>
            </button>
          </div>
        </div>
      </section>

      <section className="how-it-works" aria-labelledby="how-title">
        <div>
          <span className="step-label">TRUSTED STATEMENT PUBLISHING</span>
          <h2 id="how-title">Fidelity before fluency.</h2>
        </div>
        <ol>
          <li><span>1</span><div><b>Extract semantics</b><p>The Lean-native extractor reads elaborated types, binders, source ranges, dependencies, and transitive axioms.</p></div></li>
          <li><span>2</span><div><b>Account for every component</b><p>A coverage ledger maps each quantified object, assumption, instance, and conclusion to prose.</p></div></li>
          <li><span>3</span><div><b>Publish with provenance</b><p>One traceable document drives HTML, Markdown, TeX, PDF, CSV, and structured JSON.</p></div></li>
        </ol>
      </section>

      <footer>
        <a className="brand footer-brand" href="#workspace"><span className="brand-mark">λ</span><span>LeanScribe</span></a>
        <p>Formal ideas, beautifully stated.</p>
        <span>Open source · MIT</span>
      </footer>
    </main>
  );
}
