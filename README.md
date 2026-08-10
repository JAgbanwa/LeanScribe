# LeanScribe

LeanScribe reverse-formalizes Lean 4 source into rigorous natural-language documentation, polished LaTeX, readable PDF, and structured CSV. Its expert mode reads a complete `.lean` file as one mathematical artifact: imports, namespaces, binders, dependencies, theorem statements, and visible proof strategy are interpreted together.

An instant, rule-based converter remains available in the browser. Pasting, dropping, or opening a file also starts the optional AI-backed semantic reading when the server is configured.

Try the current deployment at [leanscribe.agbanwajamal03.chatgpt.site](https://leanscribe.agbanwajamal03.chatgpt.site/).

## Features

- Paste, drag-and-drop, or open any UTF-8 `.lean` file
- Detect theorems, lemmas, explicit corollaries, examples, definitions, axioms, structures, classes, instances, and inductive types
- Preserve declaration types deterministically: a Lean theorem becomes a natural-language theorem, a lemma remains a lemma, and an explicit corollary remains a corollary in the preview, PDF, TeX, and CSV
- Interpret the file globally instead of translating one symbol or line at a time
- Produce an overview, prerequisites, per-declaration mathematical statements, proof strategies, dependencies, confidence levels, caveats, and a glossary
- Translate common Lean and Unicode symbols into conventional LaTeX notation
- Preview plain-English, LaTeX, and CSV output as the source changes
- Download `.pdf`, `.tex`, and `.csv` files directly in the browser
- Keep an always-available local fallback; expert mode clearly discloses when source is sent to OpenAI
- Responsive, keyboard-accessible interface

## Declaration type preservation

LeanScribe treats the declaration keyword in the source as authoritative. Expert mode can improve the mathematical explanation, but it cannot silently change the declaration category.

| Lean source | Natural-language output | Export heading |
| --- | --- | --- |
| `theorem result ...` | Theorem | `Natural-language Theorem: result` |
| `lemma helper ...` | Lemma | `Natural-language Lemma: helper` |
| `corollary consequence ...` | Corollary | `Natural-language Corollary: consequence` |

For example:

```lean
theorem identity_theorem (p : Prop) : p → p := by
  intro hp
  exact hp

lemma identity_lemma (p : Prop) : p → p := by
  intro hp
  exact hp
```

Expert mode renders both statements in mathematical prose—“For every proposition `p`, if `p` holds, then `p` holds”—while retaining the first as a theorem and the second as a lemma. Their visible proof strategy is documented separately from the statement.

An explicit `corollary` is supported for Lean projects that define that command through custom syntax. If a mathematical corollary is written using `theorem` or `lemma`, LeanScribe preserves the keyword actually present instead of guessing a different category.

## Output formats

- **PDF:** a readable document containing the overview, natural-language declarations, visible proof strategies, dependencies, caveats, and glossary
- **TeX:** editable LaTeX with a declaration-specific heading, prose statement, mathematical display, and supporting documentation
- **CSV:** one row per declaration, including `kind`, `natural_language_kind`, name, source line, prose, proof strategy, dependencies, confidence, caveats, Lean signature, and LaTeX

All three downloads are generated from the same in-browser document model, so declaration types and content stay consistent across formats.

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

The local engine scans top-level declarations and translates common Lean syntax immediately. When expert mode is configured, `/api/translate` sends the complete source to the OpenAI Responses API with a strict semantic-document schema. The schema includes theorem, lemma, and corollary as distinct declaration kinds. The model is instructed to preserve quantifiers, assumptions, and declaration categories; distinguish statements from proof methods; track dependencies; flag ambiguity; and treat Lean comments as source data rather than instructions. The structured result is merged with locally extracted signatures. The locally parsed source keyword remains authoritative for each matched declaration, so expert mode cannot silently relabel a theorem as a lemma. One shared document model then drives the browser preview and all three exports.

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
  lean-converter.test.ts     Declaration parsing and type-preservation tests
```

## Privacy

Local conversion and all file generation happen in the browser. Expert mode sends the complete pasted or opened Lean source to this app's server and then to OpenAI for semantic analysis; the interface discloses this beside the expert control. The API request uses `store: false`. Do not use expert mode for source you are not permitted to share with the configured provider.

## Deployment

Configure `OPENAI_API_KEY` as a server-side secret and optionally set `OPENAI_MODEL`. The key must never be exposed through a `NEXT_PUBLIC_` variable or embedded in browser JavaScript. Without a key, the app continues to provide its local conversion and the expert endpoint returns a safe `503 AI_NOT_CONFIGURED` response.

The production deployment uses a server-side secret; users should never paste an API key into the LeanScribe source editor or commit one to this repository.

## Validation

`npm test` creates a production build and runs coverage for server rendering, safe behavior without an API key, declaration parsing, explicit corollary support, and deterministic protection against model-driven theorem/lemma reclassification. Run `npm run lint` alongside it before publishing changes.

## License

MIT
