// Model watch: an AI (Gemini or Claude, see llm.mjs) compares data/models.json with the live OpenRouter catalog and,
// if something changed (new model, new price, retired model), rewrites models.json.
// The workflow then opens a pull request, so a human approves every change.
import fs from "node:fs/promises";
import { z } from "zod";
import { askJSON, provider } from "./llm.mjs";

const FILE = new URL("../data/models.json", import.meta.url);
const current = JSON.parse(await fs.readFile(FILE, "utf8"));

const catalog = (await (await fetch("https://openrouter.ai/api/v1/models")).json()).data
  .filter((m) => /^(anthropic|openai|google|qwen|z-ai|deepseek|moonshotai|mistralai)\//.test(m.id) && !m.id.includes(":"))
  .sort((a, b) => b.created - a.created)
  .slice(0, 150)
  .map((m) => ({
    id: m.id, name: m.name, released: new Date(m.created * 1000).toISOString().slice(0, 10),
    in: +(m.pricing.prompt * 1e6).toFixed(2), out: +(m.pricing.completion * 1e6).toFixed(2), ctx: m.context_length,
  }));

const Model = z.object({
  id: z.string(), p: z.enum(["anthropic", "openai", "google", "open"]), name: z.string(), tier: z.string(), best: z.string(),
  in: z.number().nullable(), out: z.number().nullable(), price: z.string().nullable(), ctx: z.string().nullable(),
  released: z.string().nullable(), note: z.string().nullable(),
});
const Result = z.object({ changed: z.boolean(), summary: z.string(), models: z.array(Model) });

if (!provider) { console.log("models: no AI key, skipping"); process.exit(0); }
const res = await askJSON({
  schema: Result,
  hard: true,
  system:
    "You maintain the model list of AI Compass, a beginner-friendly guide to which AI model to use for what. " +
    "Compare the curated list with the live OpenRouter catalog (prices in USD per 1M tokens). " +
    "Set changed=true only for real, data-backed changes: a new frontier/balanced/fast text model from Anthropic, OpenAI or Google; a leading new open-weight model; a price or context change; a curated model that is clearly superseded (replace it and keep its id if it is the same line, e.g. a new Sonnet replaces the old Sonnet under id 'sonnet'). " +
    "Keep ids stable (tasks reference them), keep media models (image/video/voice/music) untouched unless the catalog proves otherwise, and write 'best' in the same plain, hype-free tone. " +
    "released: YYYY-MM-DD from the catalog for new models, keep existing values otherwise. note: optional one-line tip (e.g. 'Pro' variants, plan availability, upcoming successor); keep existing notes unless outdated. " +
    "Aim for the same size list (about 20-25 models); this is a curated guide, not a catalog. " +
    "summary: a short markdown bullet list of every change and the catalog evidence for it; empty string if nothing changed.",
  user: `CURATED LIST:
${JSON.stringify(current.models)}

OPENROUTER CATALOG (newest first):
${JSON.stringify(catalog)}`,
});
const { changed, summary, models } = res;
if (!changed) { console.log("models: no changes"); process.exit(0); }

const clean = models.map((m) => Object.fromEntries(Object.entries(m).filter(([, v]) => v !== null)));
await fs.writeFile(FILE, JSON.stringify({ ...current, updated: new Date().toISOString().slice(0, 10), models: clean }, null, 1) + "\n");
await fs.writeFile(process.env.PR_BODY || "pr-body.md",
  `The model-watch agent (${provider}) found changes against the live OpenRouter catalog:\n\n${summary}\n\n` +
  "Check before merging: prices, and that `data/tasks.json` still points at the right model ids.");
console.log("models: changes proposed");
