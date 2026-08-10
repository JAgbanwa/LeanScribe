import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function dispatch(path = "/", init = {}, bindings = {}) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, init),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) }, ...bindings },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the LeanScribe converter", async () => {
  const response = await dispatch("/", { headers: { accept: "text/html" } });
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>LeanScribe/);
  assert.match(html, /From formal proof/);
  assert.match(html, /Lean conversion workspace/);
  assert.match(html, /Paste Lean source/);
  assert.match(html, /Public local mode/);
  assert.match(html, /Private conversion in your browser/);
  assert.match(html, /Nothing is uploaded/);
  assert.match(html, /Natural-language(?:\s|<!--.*?-->)*Theorem/);
  assert.match(html, /Natural-language(?:\s|<!--.*?-->)*Lemma/);
  assert.match(html, /This theorem states: For every natural number n, n plus 0 equals n\./);
  assert.match(html, /Download \.tex/);
  assert.match(html, /Download \.pdf/);
  assert.match(html, /Download \.csv/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/);
});

test("expert endpoint fails safely when public mode is configured", async () => {
  const response = await dispatch("/api/translate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ source: "theorem one : 1 = 1 := rfl", filename: "One.lean" }),
  });

  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), {
    error: "Expert translation is disabled on this public deployment.",
    code: "EXPERT_MODE_DISABLED",
  });
});

test("public mode rejects expert translation even if a key exists", async () => {
  const response = await dispatch("/api/translate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ source: "theorem one : 1 = 1 := rfl", filename: "One.lean" }),
  }, { OPENAI_API_KEY: "not-a-real-key", EXPERT_MODE_ENABLED: "false" });

  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), {
    error: "Expert translation is disabled on this public deployment.",
    code: "EXPERT_MODE_DISABLED",
  });
});

test("removes the temporary starter preview", async () => {
  await assert.rejects(access(new URL("../app/_sites-preview", import.meta.url)));
  const packageJson = await readFile(new URL("../package.json", import.meta.url), "utf8");
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
});
