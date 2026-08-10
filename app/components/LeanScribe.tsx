"use client";

import { ChangeEvent, DragEvent, useMemo, useRef, useState } from "react";
import {
  buildPdf,
  capitalize,
  convertLean,
  DEFAULT_SOURCE,
} from "@/lib/lean-converter";

type PreviewMode = "document" | "latex";

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

export function LeanScribe() {
  const [source, setSource] = useState(DEFAULT_SOURCE);
  const [filename, setFilename] = useState("Arithmetic.lean");
  const [previewMode, setPreviewMode] = useState<PreviewMode>("document");
  const [dragging, setDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const result = useMemo(() => convertLean(source, filename), [source, filename]);

  const loadFile = async (file?: File) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".lean")) {
      fileInput.current?.focus();
      return;
    }
    setFilename(file.name);
    setSource(await file.text());
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

  const downloadTex = () => {
    download(new Blob([result.tex], { type: "application/x-tex;charset=utf-8" }), `${safeBaseName(filename)}.tex`);
  };

  const downloadPdf = () => {
    download(buildPdf(result), `${safeBaseName(filename)}.pdf`);
  };

  const copyTex = async () => {
    await navigator.clipboard.writeText(result.tex);
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
          Local processing · your code stays here
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
        <p className="eyebrow"><span>Lean</span><i /> <span>LaTeX</span><i /> <span>PDF</span></p>
        <h1 id="page-title">From formal proof<br />to finished page.</h1>
        <p className="hero-copy">
          Drop in a <code>.lean</code> file. Get clean mathematical notation,
          a publication-ready TeX source, and a readable PDF in seconds.
        </p>
      </section>

      <section className="workspace" id="workspace" aria-label="Lean conversion workspace">
        <div className="workspace-heading">
          <div>
            <span className="step-label">01 / SOURCE</span>
            <h2>Lean input</h2>
          </div>
          <div className="file-actions">
            <button className="text-button" type="button" onClick={() => fileInput.current?.click()}>
              Open .lean
            </button>
            <button className="text-button muted" type="button" onClick={() => { setSource(""); setFilename("Main.lean"); }}>
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
            <span>{lineCount} lines · UTF-8</span>
          </div>
          <textarea
            className="source-editor"
            value={source}
            onChange={(event) => setSource(event.target.value)}
            spellCheck={false}
            aria-label="Lean source editor"
          />
          {dragging && <div className="drop-overlay">Drop your .lean file</div>}
        </div>

        <div className="conversion-rail" aria-hidden="true">
          <span />
          <b>translating syntax</b>
          <span />
        </div>

        <div className="workspace-heading output-heading">
          <div>
            <span className="step-label">02 / OUTPUT</span>
            <h2>Typeset document</h2>
          </div>
          <div className="preview-tabs" role="tablist" aria-label="Output preview">
            <button
              type="button"
              role="tab"
              aria-selected={previewMode === "document"}
              className={previewMode === "document" ? "active" : ""}
              onClick={() => setPreviewMode("document")}
            >
              Document
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
          </div>
        </div>

        <div className="output-panel">
          {previewMode === "document" ? (
            <article className="paper-preview">
              <div className="paper-kicker">FORMAL MATHEMATICS · LEAN 4</div>
              <h3>{result.title}</h3>
              {result.imports.length > 0 && (
                <p className="imports">Imports: {result.imports.join(", ")}</p>
              )}
              <div className="paper-rule" />
              {result.declarations.length ? result.declarations.map((declaration, index) => (
                <section className="declaration" key={`${declaration.name}-${declaration.line}`}>
                  <div className="declaration-meta">
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <b>{capitalize(declaration.kind)}</b>
                    <em>line {declaration.line}</em>
                  </div>
                  <h4>{declaration.name.replace(/_/g, " ")}</h4>
                  {declaration.note && <p>{declaration.note}</p>}
                  <code>{declaration.leanType}</code>
                </section>
              )) : (
                <div className="empty-output">
                  <b>No declarations yet</b>
                  <span>Add a theorem, lemma, example, definition, axiom, structure, or inductive type.</span>
                </div>
              )}
            </article>
          ) : (
            <div className="latex-preview">
              <button type="button" onClick={() => void copyTex()}>{copied ? "Copied" : "Copy TeX"}</button>
              <pre>{result.tex}</pre>
            </div>
          )}
        </div>

        <div className="export-bar">
          <div className="ready-state">
            <span aria-hidden="true">✓</span>
            <p><b>Ready to export</b><small>{result.declarations.length} declarations translated</small></p>
          </div>
          <div className="export-actions">
            <button type="button" className="export secondary" onClick={downloadTex}>
              <span className="format-icon">T<span>E</span>X</span>
              <span><b>Download .tex</b><small>Editable source</small></span>
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
          <span className="step-label">NO SERVER. NO SETUP.</span>
          <h2 id="how-title">One careful little pipeline.</h2>
        </div>
        <ol>
          <li><span>1</span><div><b>Read</b><p>LeanScribe detects declarations and document metadata.</p></div></li>
          <li><span>2</span><div><b>Translate</b><p>Lean symbols become conventional mathematical notation.</p></div></li>
          <li><span>3</span><div><b>Export</b><p>Choose editable LaTeX or an instant, portable PDF.</p></div></li>
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
