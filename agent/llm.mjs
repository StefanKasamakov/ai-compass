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

// best first; free-tier daily quotas are per model, so falling back spreads the load
const GEMINI_MODELS = ["gemini-3.8-flash", "gemini-3.7-flash", "gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite"];
const exhausted = new Set(); // models whose daily quota ran out during this run

export const provider = process.env.GEMINI_API_KEY ? "gemini" : process.env.ANTHROPIC_API_KEY ? "claude" : null;

export async function askJSON({ system, user, schema, hard = false }) {
  if (provider === "gemini") {
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY.trim() }); // secrets pasted on Windows can carry a trailing newline
    const { $schema, ...jsonSchema } = geminiSafe(z.toJSONSchema(schema));
    // busy (503) or rate-limited (429): wait and retry, then fall back to the previous Flash models
    let lastErr;
    for (const model of GEMINI_MODELS.filter((m) => !exhausted.has(m))) for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await ai.models.generateContent({
          model,
          contents: user,
          config: { systemInstruction: system, responseMimeType: "application/json", responseJsonSchema: jsonSchema },
        });
        return schema.parse(JSON.parse(res.text));
      } catch (e) {
        lastErr = e;
        const msg = String(e.message);
        if (e.status === 429 && /PerDay/.test(msg)) { exhausted.add(model); break; } // done for today, next model
        if (![429, 500, 503].includes(e.status)) throw e;
        const wait = +msg.match(/retry in ([\d.]+)s/)?.[1] || 3 * 2 ** attempt;
        await new Promise((r) => setTimeout(r, Math.min(wait, 65) * 1000));
      }
    }
    if (exhausted.size === GEMINI_MODELS.length) lastErr = new Error("Gemini free-tier daily quota used up on every model; the rest waits for the next run");
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
