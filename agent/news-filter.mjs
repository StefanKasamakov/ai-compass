// News helpers shared by update.mjs and one-off fixes: which items are for developers, and which are the same story twice.
export const OFFICIAL = new Set(["Anthropic", "OpenAI", "Google", "DeepMind"]);

// audience "dev": release notes of developer tools, research papers and newsletters. The site hides these by default.
const DEV_TITLE = new RegExp([
  /^\[AINews\]/.source, // Latent Space newsletter
  /\brust-v\d/.source, /\bv?\d+\.\d+\.\d+\b/.source, // Codex CLI rust-v0.163.0, Python 3.15.0
  /^[\w.-]+ v?\d+(\.\d+)+([ab]\d+)?$/.source, // "llm-gemini 0.35", "web-edit 0.1a1"
  /release notes|changelog|newsletter|pretraining|pre-training|fine-tuning|polysemantic|arxiv/.source,
].join("|"), "i");
export const isDev = (i) =>
  i.source === "GitHub release" || DEV_TITLE.test(i.title) || (i.tags?.length > 0 && i.tags.every((t) => t === "research"));

// Same launch from two sources ("Gemini 4 Argon" on HN, "Gemini 4 Argon: Built to..." on Google and DeepMind):
// same headline before any colon or dash, different sources, within a week. The official post wins; Hacker News and
// developer items lose (a discussion link moves to the kept item).
const rank = (i) => (OFFICIAL.has(i.source) ? 0 : isDev(i) ? 3 : i.source === "Hacker News" ? 2 : 1);
export const storyKey = (t = "") => t.replace(/^\[AINews\]\s*/i, "").split(/[:|—–]/)[0].toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
export function dedupeStories(items) {
  const keep = [];
  for (const it of [...items].sort((a, b) => rank(a) - rank(b) || b.date.localeCompare(a.date))) {
    const k = storyKey(it.title);
    const dup = k.includes(" ") && keep.find((x) => x.source !== it.source && storyKey(x.title) === k && Math.abs(new Date(x.date) - new Date(it.date)) < 7 * 864e5);
    if (!dup) { keep.push(it); continue; }
    if (it.discuss && !dup.discuss) dup.discuss = it.discuss;
  }
  return items.filter((i) => keep.includes(i));
}
