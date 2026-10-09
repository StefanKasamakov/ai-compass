// Model watch: an AI (Gemini or Claude, see llm.mjs) compares data/models.json with the live OpenRouter catalog and,
// if something changed (new model, new price, retired model), rewrites models.json.
// The change is applied straight away only when code (not the AI) can confirm it: every price matches the catalog,
// every model the site's task picks use still exists, and the change is small. Anything else becomes a pull request
// for a human. The workflow reads the decision from MODEL_RESULT ("auto" or "pr").
import fs from "node:fs/promises";
import { z } from "zod";
import { askJSON, provider } from "./llm.mjs";
import { checkChanges } from "./models-check.mjs";

const FILE = new URL("../data/models.json", import.meta.url);
const BENCH = new URL("../data/benchmarks.json", import.meta.url);
const TASKS = new URL("../data/tasks.json", import.meta.url);
const current = JSON.parse(await fs.readFile(FILE, "utf8"));

const raw = (await (await fetch("https://openrouter.ai/api/v1/models")).json()).data;
const catalog = raw
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

const write = (f, data) => fs.writeFile(f, JSON.stringify(data, null, 1) + "\n");
const decide = (how) => fs.writeFile(process.env.MODEL_RESULT || "model-result.txt", how);

if (!provider) { console.log("models: no AI key, skipping"); process.exit(0); }
const res = await askJSON({
  schema: Result,
  hard: true,
  system:
    "You maintain the model list of Which AI Map, a beginner-friendly guide to which AI model to use for what. " +
    "Compare the curated list with the live OpenRouter catalog (prices in USD per 1M tokens). " +
    "Set changed=true only for real, data-backed changes: a new frontier/balanced/fast text model from Anthropic, OpenAI or Google; a leading new open-weight model; a price or context change; a curated model that is clearly superseded (replace it and keep its id if it is the same line, e.g. a new Sonnet replaces the old Sonnet under id 'sonnet'). " +
    "Keep ids stable (tasks reference them), keep media models (image/video/voice/music) untouched unless the catalog proves otherwise, and write 'best' in the same plain, hype-free tone. " +
    "Use the model's exact catalog name without the 'Company: ' prefix, and copy prices exactly from the catalog. " +
    "The group p='open' is only for open-weight models people can download (the catalog lists a hugging_face_id); a successor must be the same size line (a new Small replaces Small, never Large). " +
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

// ---------- the checks that decide whether this goes live without a human ----------
const tasks = JSON.parse(await fs.readFile(TASKS, "utf8"));
const usedIds = new Set(tasks.tasks.flatMap((t) => Object.values(t.picks).flat().map(([id]) => id)));
const { problems, touched, removed, renamed } = checkChanges(current.models, clean, raw, usedIds);

await write(FILE, { ...current, updated: new Date().toISOString().slice(0, 10), models: clean });

// a model renamed under the same id is a different model: its old test scores must not carry over
if (renamed.length) {
  const b = JSON.parse(await fs.readFile(BENCH, "utf8"));
  for (const m of renamed) { delete b.scores[m.id]; delete b.hosted?.[m.id]; }
  await write(BENCH, b);
}

const changes = `${summary}${renamed.length ? `\n- Removed the old test scores of ${renamed.map((m) => m.name).join(", ")}: they belonged to the previous model under the same id.` : ""}`;
if (problems.length) {
  await fs.writeFile(process.env.PR_BODY || "pr-body.md",
    `The model-watch agent (${provider}) found changes against the live OpenRouter catalog:\n\n${changes}\n\n` +
    `**Not applied automatically, because:**\n${problems.map((p) => `- ${p}`).join("\n")}\n\nCheck these, then merge or close.`);
  await decide("pr");
  console.log(`models: changes proposed for review (${problems.length} check(s) failed)`);
} else {
  await fs.writeFile(process.env.PR_BODY || "pr-body.md", `agent: model lineup changes (auto, checked against OpenRouter)\n\n${changes}\n`);
  await decide("auto");
  console.log(`models: ${touched.length + removed.length} change(s) applied automatically`);
}
