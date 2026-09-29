// One helper for every AI step: ask for JSON matching a zod schema, get a parsed object back.
// Works with whichever key the repo has: GEMINI_API_KEY (tried first) or ANTHROPIC_API_KEY.
// No key -> returns null and the agent falls back to non-AI behaviour.
import { z } from "zod";

// Gemini documents anyOf but not type arrays, so turn {"type":["number","null"]} into anyOf.
const geminiSafe = (node) => {
  if (Array.isArray(node)) return node.map(geminiSafe);
  if (!node || typeof node !== "object") return node;
  const out = Object.fromEntries(Object.entries(node).map(([k, v]) => [k, geminiSafe(v)]));
  if (Array.isArray(out.type)) { const { type, ...rest } = out; return { anyOf: type.map((t) => ({ ...rest, type: t })) }; }
  return out;
};

const GEMINI_MODELS = ["gemini-3.8-flash", "gemini-3.7-flash", "gemini-3.5-flash"];

export const provider = process.env.GEMINI_API_KEY ? "gemini" : process.env.ANTHROPIC_API_KEY ? "claude" : null;

export async function askJSON({ system, user, schema, hard = false }) {
  if (provider === "gemini") {
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({}); // reads GEMINI_API_KEY
    const { $schema, ...jsonSchema } = geminiSafe(z.toJSONSchema(schema));
    // busy (503) or rate-limited (429): wait and retry, then fall back to the previous Flash models
    let lastErr;
    for (const model of GEMINI_MODELS) for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await ai.models.generateContent({
          model,
          contents: user,
          config: { systemInstruction: system, responseMimeType: "application/json", responseJsonSchema: jsonSchema },
        });
        return schema.parse(JSON.parse(res.text));
      } catch (e) {
        lastErr = e;
        if (![429, 500, 503].includes(e.status)) throw e;
        await new Promise((r) => setTimeout(r, 2000 * 2 ** attempt));
      }
    }
    throw lastErr;
  }
  if (provider === "claude") {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const { zodOutputFormat } = await import("@anthropic-ai/sdk/helpers/zod");
    const res = await new Anthropic().messages.parse({
      model: "claude-opus-5-5",
      max_tokens: 32000,
      output_config: { effort: hard ? "high" : "low", format: zodOutputFormat(schema) },
      system,
      messages: [{ role: "user", content: user }],
    });
    if (res.stop_reason === "refusal") throw new Error("Claude declined the request");
    return res.parsed_output;
  }
  return null;
}
