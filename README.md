# LeanScribe

LeanScribe reverse-formalizes Lean 4 source into rigorous natural-language documentation, polished LaTeX, readable PDF, and structured CSV. Its expert mode reads a complete `.lean` file as one mathematical artifact: imports, namespaces, binders, dependencies, theorem statements, and visible proof strategy are interpreted together.

An instant, rule-based converter remains available in the browser. Pasting, dropping, or opening a file also starts the optional AI-backed semantic reading when the server is configured.

## Features

- Paste, drag-and-drop, or open any UTF-8 `.lean` file
- Detect theorems, lemmas, examples, definitions, axioms, structures, classes, instances, and inductive types
- Interpret the file globally instead of translating one symbol or line at a time
- Produce an overview, prerequisites, per-declaration mathematical statements, proof strategies, dependencies, confidence levels, caveats, and a glossary
- Translate common Lean and Unicode symbols into conventional LaTeX notation
- Preview plain-English, LaTeX, and CSV output as the source changes
- Download `.pdf`, `.tex`, and `.csv` files directly in the browser
- Keep an always-available local fallback; expert mode clearly discloses when source is sent to OpenAI
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

To enable expert semantic translation, copy the environment template and add an OpenAI API key on the server:

```bash
cp .env.example .env.local
# Set OPENAI_API_KEY in .env.local
npm run dev
```

`OPENAI_MODEL` defaults to `gpt-5.6-sol`. Never commit `.env.local` or an API key.

## Commands

```bash
npm run dev     # Start the development server
npm run build   # Create a production build
npm test        # Build and run the rendered-page tests
npm run lint    # Run ESLint
```

## How conversion works

The local engine scans top-level declarations and translates common Lean syntax immediately. When expert mode is configured, `/api/translate` sends the complete source to the OpenAI Responses API with a strict semantic-document schema. The model is instructed to preserve quantifiers and assumptions, distinguish statements from proof methods, track dependencies, flag ambiguity, and treat Lean comments as source data rather than instructions. The structured result is merged with locally extracted signatures, then one shared document model drives the browser preview and all three exports.

This is the reverse direction of a formalization assistant: formal Lean becomes human-facing mathematical exposition. LeanScribe is independent of and is not affiliated with Aristotle or Harmonic.

LeanScribe is a documentation tool, not a Lean compiler, proof checker, or guarantee that AI prose is mathematically equivalent to the source. It preserves source signatures and reports uncertainty, but expert output still requires human review. Run the source through Lean 4 or Lake for formal verification before publishing.

## Project structure

```text
app/
  api/translate/route.ts     Server-side expert semantic translation
  components/LeanScribe.tsx  Interactive converter UI
  globals.css                Responsive visual design
  layout.tsx                 Site metadata and fonts
  page.tsx                   Home route
lib/
  lean-converter.ts          Parsing, natural language, TeX, CSV, and PDF generation
  semantic-schema.ts         Strict expert-output schema and translation instructions
tests/
  rendered-html.test.mjs     Production-render smoke tests
```

## Privacy

Local conversion and all file generation happen in the browser. Expert mode sends the complete pasted or opened Lean source to this app's server and then to OpenAI for semantic analysis; the interface discloses this beside the expert control. The API request uses `store: false`. Do not use expert mode for source you are not permitted to share with the configured provider.

## Deployment

Configure `OPENAI_API_KEY` as a server-side secret and optionally set `OPENAI_MODEL`. The key must never be exposed through a `NEXT_PUBLIC_` variable or embedded in browser JavaScript. Without a key, the app continues to provide its local conversion and the expert endpoint returns a safe `503 AI_NOT_CONFIGURED` response.

## License

MIT
