# LeanScribe

LeanScribe is a private, browser-based converter that turns Lean 4 source files into plain-English documentation, polished LaTeX, readable PDF, and structured CSV files. Paste a complete `.lean` file into the editor—or drop one in—and every output updates automatically.

## Features

- Paste, drag-and-drop, or open any UTF-8 `.lean` file
- Detect theorems, lemmas, examples, definitions, axioms, structures, and inductive types
- Turn binders, assumptions, relations, and arithmetic expressions into readable English
- Translate common Lean and Unicode symbols into conventional LaTeX notation
- Preview plain-English, LaTeX, and CSV output as the source changes
- Download `.pdf`, `.tex`, and `.csv` files directly in the browser
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

LeanScribe scans the source for top-level formal declarations and document metadata. It recognizes variables and hypotheses, then describes common Lean operators and types—such as `→`, `∀`, `≤`, `Nat`, and `ℝ`—in natural language. The same conversion powers a standalone `.tex` document, a portable PDF reading copy, and a CSV table with one declaration per row.

LeanScribe is a documentation converter, not a Lean compiler or proof checker. It preserves the original declaration text in the reading copy and does not validate whether a proof type-checks. For formal verification, run the source through Lean 4 or Lake before publishing.

## Project structure

```text
app/
  components/LeanScribe.tsx  Interactive converter UI
  globals.css                Responsive visual design
  layout.tsx                 Site metadata and fonts
  page.tsx                   Home route
lib/
  lean-converter.ts          Parsing, natural language, TeX, CSV, and PDF generation
tests/
  rendered-html.test.mjs     Production-render smoke tests
```

## Privacy

Files are read with the browser File API. Conversion and downloads happen on the device; LeanScribe does not send source code to a server.

## License

MIT
