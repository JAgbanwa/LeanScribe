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
} from "@/lib/lean-converter";
import type { SemanticTranslation } from "@/lib/semantic-schema";

type PreviewMode = "document" | "latex" | "csv";
type ExpertState = "idle" | "loading" | "ready" | "error";

function safeBaseName(filename: string): string {
  return (filename.replace(/\.lean$/i, "") || "LeanScribe").replace(/[^a-zA-Z0-9_-]/g, "-");
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
  const [dragging, setDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const [semantic, setSemantic] = useState<{
    translation: SemanticTranslation;
    model: string;
  } | null>(null);
  const [expertState, setExpertState] = useState<ExpertState>("idle");
  const [expertMessage, setExpertMessage] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const expertRequest = useRef(0);
  const localResult = useMemo(() => convertLean(source, filename), [source, filename]);
  const result = useMemo(
    () =>
      semantic
        ? mergeSemanticTranslation(localResult, semantic.translation, semantic.model)
        : localResult,
    [localResult, semantic],
  );

  const updateSource = (nextSource: string) => {
    expertRequest.current += 1;
    setSource(nextSource);
    setSemantic(null);
    setExpertState("idle");
    setExpertMessage("");
  };

  const runExpertTranslation = async (
    nextSource = source,
    nextFilename = filename,
  ) => {
    if (!expertEnabled || !nextSource.trim()) return;
    const requestId = expertRequest.current + 1;
    expertRequest.current = requestId;
    setExpertState("loading");
    setExpertMessage("Reading the complete file, its declarations, and proof structure…");

    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ source: nextSource, filename: nextFilename }),
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
        `${payload.translation.declarations.length} declarations interpreted with whole-file context.`,
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
    if (!file.name.toLowerCase().endsWith(".lean")) {
      fileInput.current?.focus();
      return;
    }
    const text = await file.text();
    setFilename(file.name);
    updateSource(text);
    if (expertEnabled) void runExpertTranslation(text, file.name);
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
    if (expertEnabled) void runExpertTranslation(nextSource, filename);
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
        <h1 id="page-title">From formal proof<br />to finished page.</h1>
        <p className="hero-copy">
          Paste or drop in a <code>.lean</code> file. LeanScribe preserves every
          theorem, lemma, and explicit corollary as natural-language prose,
          then builds PDF, TeX, and CSV documentation directly in your browser.
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
              Open .lean
            </button>
            <button className="text-button muted" type="button" onClick={() => { updateSource(""); setFilename("Main.lean"); }}>
              Clear
            </button>
            <input
              ref={fileInput}
              className="visually-hidden"
              type="file"
              accept=".lean,text/plain"
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
                Reads imports, binders, definitions, dependencies, and visible proof tactics
                together—then writes precise mathematical prose instead of replacing symbols.
              </p>
              <small>
                Expert mode sends the pasted source to OpenAI for analysis. The instant local
                translation remains available without it.
              </small>
            </div>
            <div className="expert-action">
              <button
                type="button"
                onClick={() => void runExpertTranslation()}
                disabled={!source.trim() || expertState === "loading"}
              >
                {expertState === "loading"
                  ? "Interpreting proof…"
                  : expertState === "ready"
                    ? "Re-run expert translation"
                    : "Generate expert translation"}
              </button>
              <span>{expertMessage || "Pasting or opening a file starts expert mode automatically."}</span>
            </div>
          </div>
        ) : (
          <div className="expert-panel state-idle" aria-live="polite">
            <div className="expert-copy">
              <span className="expert-badge"><i aria-hidden="true">✓</i> PUBLIC · LOCAL-ONLY</span>
              <h3>Private conversion in your browser</h3>
              <p>
                Your Lean source is parsed and converted on your device. Nothing is uploaded
                to an AI provider, and PDF, TeX, and CSV downloads remain available.
              </p>
              <small>
                Expert AI translation is disabled on the public deployment to prevent anonymous
                use of a private API key.
              </small>
            </div>
            <div className="expert-action">
              <span>Paste, drop, or open a Lean file to convert it instantly.</span>
            </div>
          </div>
        )}

        <div className="conversion-rail" aria-hidden="true">
          <span />
          <b>{result.mode === "expert" ? "semantic reading complete" : "instant local reading"}</b>
          <span />
        </div>

        <div className="workspace-heading output-heading">
          <div>
            <span className="step-label">02 / OUTPUT</span>
            <h2>Natural-language document</h2>
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

        <div className="output-panel">
          {previewMode === "document" ? (
            <article className="paper-preview">
              <div className="paper-kicker">
                {result.mode === "expert" ? "EXPERT SEMANTIC READING" : "INSTANT LOCAL READING"} · FROM LEAN 4
              </div>
              <h3>{result.title}</h3>
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
              {result.declarations.length ? result.declarations.map((declaration, index) => (
                <section className="declaration" key={`${declaration.name}-${declaration.line}`}>
                  <div className="declaration-meta">
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <b>Natural-language {capitalize(declaration.kind)}</b>
                    {declaration.line > 0 && <em>line {declaration.line}</em>}
                    {declaration.confidence && (
                      <strong className={`confidence ${declaration.confidence}`}>
                        {declaration.confidence} confidence
                      </strong>
                    )}
                  </div>
                  <h4>{declaration.name.replace(/_/g, " ")}</h4>
                  {declaration.note && <p className="declaration-note">{declaration.note}</p>}
                  <p className="natural-language">{declaration.naturalLanguage}</p>
                  {declaration.proofStrategy && (
                    <div className="proof-strategy">
                      <b>Proof strategy</b>
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
              <b>{result.mode === "expert" ? "Expert documentation ready" : "Local draft ready"}</b>
              <small>{result.declarations.length} declarations · {result.mode === "expert" ? result.model : "rule-based fallback"}</small>
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
          </div>
        </div>
      </section>

      <section className="how-it-works" aria-labelledby="how-title">
        <div>
          <span className="step-label">{expertEnabled ? "WHOLE-FILE REASONING" : "LOCAL-FIRST CONVERSION"}</span>
          <h2 id="how-title">Reverse formalization, safely.</h2>
        </div>
        <ol>
          <li><span>1</span><div><b>Read the source</b><p>Imports, notation, and supported declarations are identified in the Lean file.</p></div></li>
          <li><span>2</span><div><b>Preserve declaration types</b><p>Theorems become natural-language theorems, lemmas remain lemmas, and explicit corollaries remain corollaries.</p></div></li>
          <li><span>3</span><div><b>Publish consistently</b><p>The same semantic document drives PDF, editable TeX, and structured CSV.</p></div></li>
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
