import {
  SEMANTIC_SYSTEM_PROMPT,
  SEMANTIC_TRANSLATION_SCHEMA,
  type SemanticTranslation,
} from "@/lib/semantic-schema";
import { isSemanticIRBundle } from "@/lib/semantic-ir";

const MAX_SEMANTIC_IR_CHARACTERS = 500_000;

type OpenAIResponse = {
  error?: { message?: string };
  output?: Array<{
    type?: string;
    content?: Array<{ type?: string; text?: string; refusal?: string }>;
  }>;
};

function json(body: unknown, status = 200): Response {
  return Response.json(body, {
    status,
    headers: { "cache-control": "no-store" },
  });
}

export async function POST(request: Request): Promise<Response> {
  if (process.env.EXPERT_MODE_ENABLED !== "true") {
    return json(
      {
        error: "Expert translation is disabled on this public deployment.",
        code: "EXPERT_MODE_DISABLED",
      },
      503,
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return json(
      {
        error: "Expert translation is not configured on this deployment.",
        code: "AI_NOT_CONFIGURED",
      },
      503,
    );
  }

  let body: { semanticIR?: unknown; filename?: unknown };
  try {
    body = (await request.json()) as { semanticIR?: unknown; filename?: unknown };
  } catch {
    return json({ error: "The request body must be valid JSON." }, 400);
  }

  if (!isSemanticIRBundle(body.semanticIR)) {
    return json(
      {
        error: "Expert prose requires elaborated LeanScribe semantic IR; raw Lean source is not accepted.",
        code: "SEMANTIC_IR_REQUIRED",
      },
      400,
    );
  }
  const semanticIR = JSON.stringify(body.semanticIR);
  const filename =
    typeof body.filename === "string" && body.filename.trim()
      ? body.filename.trim().slice(0, 180)
      : "Main.lean";

  if (semanticIR.length > MAX_SEMANTIC_IR_CHARACTERS) {
    return json(
      { error: `This semantic bundle exceeds the ${MAX_SEMANTIC_IR_CHARACTERS.toLocaleString()} character limit.` },
      413,
    );
  }

  const model = process.env.OPENAI_MODEL || "gpt-5.6-sol";
  let upstream: Response;
  try {
    upstream = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        store: false,
        reasoning: { effort: "high" },
        max_output_tokens: 32_000,
        instructions: SEMANTIC_SYSTEM_PROMPT,
        input: JSON.stringify({ filename, semanticIR: body.semanticIR }),
        text: {
          format: {
            type: "json_schema",
            name: "lean_semantic_documentation",
            strict: true,
            schema: SEMANTIC_TRANSLATION_SCHEMA,
          },
        },
      }),
    });
  } catch {
    return json({ error: "The expert translation service could not be reached." }, 502);
  }

  const payload = (await upstream.json()) as OpenAIResponse;
  if (!upstream.ok) {
    return json(
      { error: payload.error?.message || "Expert translation failed upstream." },
      upstream.status >= 400 && upstream.status < 600 ? upstream.status : 502,
    );
  }

  const content = payload.output
    ?.find((item) => item.type === "message")
    ?.content?.find((item) => item.type === "output_text");
  if (!content?.text) {
    const refusal = payload.output
      ?.flatMap((item) => item.content ?? [])
      .find((item) => item.type === "refusal")?.refusal;
    return json({ error: refusal || "The model returned no documentation." }, 502);
  }

  try {
    const translation = JSON.parse(content.text) as SemanticTranslation;
    return json({ translation, model });
  } catch {
    return json({ error: "The model returned malformed structured documentation." }, 502);
  }
}
