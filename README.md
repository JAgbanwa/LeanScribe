# LeanScribe

LeanScribe is a private, browser-based converter that turns Lean 4 source files into polished LaTeX and readable PDF documents. Drop in a `.lean` file—or edit the sample in place—preview the extracted declarations, then download either format.

## Features

- Drag-and-drop or open any UTF-8 `.lean` file
- Detect theorems, lemmas, examples, definitions, axioms, structures, and inductive types
- Translate common Lean and Unicode symbols into conventional LaTeX notation
- Preview the generated document and its editable TeX source
- Download `.tex` and `.pdf` files directly in the browser
- Keep source code private: conversion is local and no file is uploaded
- Responsive, keyboard-accessible interface

## Getting started

Requirements: Node.js `>=22.13.0` and npm.

```bash
git clone https://github.com/JAgbanwa/LeanScribe.git
cd LeanScribe
npm install
npm run dev
```

Open the local URL shown in the terminal.

## Commands

```bash
npm run dev     # Start the development server
npm run build   # Create a production build
npm test        # Build and run the rendered-page tests
npm run lint    # Run ESLint
```

## How conversion works

LeanScribe scans the source for top-level formal declarations and document metadata. It maps common Lean operators and types—such as `→`, `∀`, `≤`, `Nat`, and `ℝ`—to LaTeX equivalents, then assembles a standalone `.tex` document. The PDF export is generated locally as a portable reading copy.

LeanScribe is a documentation converter, not a Lean compiler or proof checker. It preserves the original declaration text in the reading copy and does not validate whether a proof type-checks. For formal verification, run the source through Lean 4 or Lake before publishing.

## Project structure

```text
app/
  components/LeanScribe.tsx  Interactive converter UI
  globals.css                Responsive visual design
  layout.tsx                 Site metadata and fonts
  page.tsx                   Home route
lib/
  lean-converter.ts          Lean parsing, TeX translation, and PDF generation
tests/
  rendered-html.test.mjs     Production-render smoke tests
```

## Privacy

Files are read with the browser File API. Conversion and downloads happen on the device; LeanScribe does not send source code to a server.

## License

MIT
