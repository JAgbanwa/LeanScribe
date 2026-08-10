# Threat model

## Security claim today

The public LeanScribe beta does not elaborate uploaded projects on its server. Pasted `.lean` source remains in the browser. A trusted publication is produced by a local extractor run by the user in an already-built project and imported as semantic JSON.

Optional model polishing is disabled on the public deployment. In a controlled deployment it accepts validated semantic IR only, treats documentation strings and identifiers as untrusted content, and uses `store: false`.

## Why remote elaboration is high risk

Lean elaborators can use IO, start processes, and otherwise perform side effects. A repository can also contain custom macros, generated code, Lake scripts, native components, hostile archives, or malicious documentation strings. “Compile this uploaded Lean project” is therefore a remote-code-execution boundary, not a file-format conversion.

## Required controls before repository upload ships

- One ephemeral job sandbox per immutable source revision.
- Nonprivileged user, no host secrets, no network by default, and read-only source/dependency mounts.
- Allowlisted Lean/Lake and TeX toolchains with immutable digests.
- CPU, memory, process, wall-time, storage, file-count, dependency-size, and artifact-size limits.
- Controlled package caches; no writable shared cache between tenants.
- External process restrictions and syscall/container policy.
- Archive-bomb, symlink, hard-link, path-traversal, and Unicode-path defenses.
- TeX shell escape disabled and generated HTML/MathML sanitized.
- Comments, doc strings, notation, and identifiers treated as untrusted model data, never instructions.
- Rate limiting, abuse detection, auditable job records, explicit retention/deletion controls, and “do not retain” mode.
- Read-only GitHub permissions scoped to the smallest repository-content access possible.
- Provider disclosure, regional processing controls, and no training on private submissions by default.

No hosted project-import feature should be enabled until adversarial tests demonstrate these controls.
