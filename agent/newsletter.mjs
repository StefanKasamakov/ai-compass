// Weekly newsletter: gathers the week from the data the agent already collected, lets the AI write
// a subject + intro, and publishes the issue on the site (data/newsletter/*.json + feed.xml).
// With BUTTONDOWN_API_KEY set it also creates a Buttondown DRAFT, so a human hits "send".
import fs from "node:fs/promises";
import { z } from "zod";
import { askJSON, provider } from "./llm.mjs";

const ROOT = new URL("../", import.meta.url);
const read = (f, fallback) => fs.readFile(new URL(f, ROOT), "utf8").then(JSON.parse, () => fallback);
const write = (f, d) => fs.writeFile(new URL(f, ROOT), typeof d === "string" ? d : JSON.stringify(d, null, 1) + "\n");
const REPO = process.env.GITHUB_REPOSITORY || "StefanKasamakov/ai-compass";
const SITE = `https://${REPO.split("/")[0].toLowerCase()}.github.io/${REPO.split("/")[1]}`;
const NOW = new Date();
const today = NOW.toISOString().slice(0, 10);
const since = (days) => new Date(NOW - days * 864e5).toISOString();

const [news, explain, github, trending, models, downloads] = await Promise.all(
  ["news", "explain", "github", "trending", "models", "downloads"].map((n) => read(`data/${n}.json`, {})));

// ---- gather the week ----
// candidates: this week's stories, AI-summarized ones first (older ones were only keyword-filtered)
const pool = (news.items ?? []).filter((i) => i.date > since(7)).sort((a, b) => (b.ai - a.ai) || (b.big - a.big) || b.date.localeCompare(a.date)).slice(0, 25);
let stories = pool.slice(0, 7);
const newRepos = Object.values(explain).filter((e) => e.at >= since(7).slice(0, 10) && e.source !== "curated").slice(0, 6);
const rising = Object.entries(github.repos ?? {}).filter(([, s]) => s.week > 0).sort((a, b) => b[1].week - a[1].week).slice(0, 5);
const modelMoves = (models.models ?? []).filter((m) => m.released && m.released >= since(14).slice(0, 10));
const topInstalls = Object.entries(downloads.repos ?? {}).sort((a, b) => b[1].total - a[1].total).slice(0, 3);
const fmt = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}k` : String(n));

if (!stories.length && !newRepos.length) { console.log("newsletter: quiet week, nothing to send"); process.exit(0); }

const sections = [
  { title: "Top stories", items: stories.map((s) => ({ title: s.title, url: s.url, blurb: s.summary, meta: s.source })) },
  { title: "Model moves", items: modelMoves.map((m) => ({ title: m.name, url: `${SITE}/models.html#m-${m.id}`, blurb: `${m.best}${m.note ? ` ${m.note}` : ""}`, meta: m.in != null ? `$${m.in} / $${m.out} per 1M tokens` : m.price })) },
  { title: "New repos worth a look", items: newRepos.map((e) => ({ title: e.repo, url: `${SITE}/explore.html#${e.repo}`, blurb: `${e.what}${e.caution ? ` Heads-up: ${e.caution}` : ""}`, meta: e.kind })) },
  { title: "Rising on GitHub this week", items: rising.map(([r, s]) => ({ title: r, url: `https://github.com/${r}`, blurb: explain[r]?.what ?? s.desc ?? "", meta: `+${fmt(s.week)} stars this week` })) },
  { title: "Most installed this month", items: topInstalls.map(([r, d]) => ({ title: r, url: `${SITE}/explore.html#${r}`, blurb: explain[r]?.what ?? "", meta: `${fmt(d.total)} installs (npm + PyPI, 30 days)` })) },
].filter((s) => s.items.length);

// ---- let the AI write the framing (falls back to a plain subject) ----
const Framing = z.object({ subject: z.string(), intro: z.string(), top: z.array(z.number()) });
const framing = await askJSON({
  schema: Framing,
  system: "You write the weekly AI Compass newsletter for people who use AI tools but aren't experts. " +
    "top: indexes of the 5 most important STORIES for such readers (model launches, pricing, agent/MCP/tooling changes), most important first; drop duplicates of the same event, minor corporate posts and quotes. " +
    "subject: under 70 characters, specific (name the biggest thing), no clickbait, no emoji. intro: 2-3 plain sentences on what mattered this week and why; no hype words.",
  user: JSON.stringify({
    stories: pool.map((s, i) => ({ i, title: s.title, source: s.source, summary: s.summary?.slice(0, 240) })),
    other: sections.filter((s) => s.title !== "Top stories").map((s) => ({ section: s.title, items: s.items.map((i) => i.title).slice(0, 5) })),
  }),
}).catch((e) => { console.warn(`[framing] ${e.message}`); return null; });
const topSection = sections.find((sec) => sec.title === "Top stories");
if (framing?.top?.length && topSection) topSection.items = framing.top.filter((i) => pool[i]).slice(0, 5).map((i) => pool[i]).map((s) => ({ title: s.title, url: s.url, blurb: s.summary, meta: s.source }));
const subject = framing?.subject ?? `AI Compass weekly: ${stories[0]?.title ?? newRepos[0]?.repo}`;
const intro = framing?.intro ?? "Here's what changed in AI models, agents and tools this week.";

const issue = { date: today, subject, intro, sections, by: provider };
await fs.mkdir(new URL("data/newsletter/", ROOT), { recursive: true });
await write(`data/newsletter/${today}.json`, issue);

// ---- archive index + RSS ----
const index = (await read("data/newsletter.json", { issues: [] })).issues.filter((i) => i.date !== today);
index.unshift({ date: today, subject, intro });
await write("data/newsletter.json", { issues: index.slice(0, 200) });
const x = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
await write("feed.xml", `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
<title>AI Compass weekly</title><link>${SITE}/newsletter.html</link>
<description>What changed in AI models, agents, MCP and tools, minus the hype.</description>
${index.slice(0, 30).map((i) => `<item><title>${x(i.subject)}</title><link>${SITE}/newsletter.html?issue=${i.date}</link><guid>${SITE}/newsletter.html?issue=${i.date}</guid><pubDate>${new Date(i.date).toUTCString()}</pubDate><description>${x(i.intro)}</description></item>`).join("\n")}
</channel></rss>
`);

// ---- optional: Buttondown draft (never sends by itself) ----
if (process.env.BUTTONDOWN_API_KEY) {
  const md = [intro, ...sections.map((s) => `## ${s.title}\n\n${s.items.map((i) => `- **[${i.title}](${i.url})**${i.meta ? ` · ${i.meta}` : ""}\n  ${i.blurb}`).join("\n")}`),
    `---\n[Read on the web](${SITE}/newsletter.html?issue=${today}) · [AI Compass](${SITE})`].join("\n\n");
  const r = await fetch("https://api.buttondown.com/v1/emails", {
    method: "POST",
    headers: { Authorization: `Token ${process.env.BUTTONDOWN_API_KEY.trim()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ subject, body: md, status: "draft" }),
  });
  console.log(`newsletter: Buttondown draft ${r.ok ? "created" : `failed (${r.status} ${(await r.text()).slice(0, 200)})`}`);
}
console.log(`newsletter: ${today} "${subject}" (${sections.map((s) => `${s.title} ${s.items.length}`).join(", ")})`);
