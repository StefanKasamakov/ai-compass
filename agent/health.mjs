// Health check after every agent run. The site depends on ~15 outside sources that change without warning
// (a blog moves, a site starts blocking, a list changes shape), and when one breaks the numbers quietly shrink.
// This compares today's numbers with the last run and opens (or updates) a GitHub issue labelled "health" when
// something drops or goes stale; it closes the issue once everything is back. GitHub emails the repo owner.
// On Mondays it also opens a "spot-check" issue: 10 random tool descriptions for a person to read.
// Run: node agent/health.mjs   (without GITHUB_TOKEN it only prints)
import fs from "node:fs/promises";

const ROOT = new URL("../", import.meta.url);
const read = async (f, fb = null) => { try { return JSON.parse(await fs.readFile(new URL(f, ROOT), "utf8")); } catch { return fb; } };
const TOKEN = process.env.GITHUB_TOKEN, REPO = process.env.GITHUB_REPOSITORY || "StefanKasamakov/ai-compass";
const SITE = "https://whichaimap.com";
const now = Date.now(), H = 3600e3, D = 24 * H;

const [news, skills, mods, models, gh, explain, dl, prev] = await Promise.all(
  ["news", "skills", "mods", "models", "github", "explain", "downloads", "health"].map((f) => read(`data/${f}.json`)));

const items = news?.items || [];
const recent = items.filter((i) => now - new Date(i.date) < 10 * D);
const metrics = {
  news: items.length,
  newsNewestHours: items.length ? Math.round((now - Math.max(...items.map((i) => +new Date(i.date)))) / H) : null,
  newsPicturePct: items.length ? Math.round((100 * items.filter((i) => i.image && !i.image.includes("opengraph.githubassets")).length) / items.length) : 0,
  skills: skills?.skills?.length || 0,
  skillCollections: (skills?.sources || []).filter((s) => s.count).length,
  mods: (mods?.mods || []).filter((m) => !m.builtin && !m.sample).length,
  models: models?.models?.length || 0,
  reposTracked: Object.keys(gh?.repos || {}).length,
  explained: Object.keys(explain || {}).length,
  downloads: Object.keys(dl?.repos || {}).length,
};
// sources we expect to hear from at least once in ten days
const CORE = ["Anthropic", "OpenAI", "Google|DeepMind", "Hugging Face", "Hacker News", "GitHub release"];
const silent = CORE.filter((s) => !recent.some((i) => new RegExp(`^(${s})$`).test(i.source)));

const problems = [];
const was = prev?.metrics || {};
for (const k of ["news", "skills", "skillCollections", "mods", "models", "reposTracked", "explained", "downloads"]) {
  if (was[k] && metrics[k] < 0.7 * was[k]) problems.push(`**${k}** dropped from ${was[k]} to ${metrics[k]} since the last run.`);
}
if (metrics.newsNewestHours == null || metrics.newsNewestHours > 72) problems.push(`The newest news story is ${metrics.newsNewestHours ?? "?"} hours old (expected under 72).`);
if (metrics.newsPicturePct < 50) problems.push(`Only ${metrics.newsPicturePct}% of news stories have a picture.`);
for (const s of silent) problems.push(`No stories from **${s.replace("|", " or ")}** in 10 days: its feed or page may have moved or started blocking us.`);

await fs.writeFile(new URL("data/health.json", ROOT), JSON.stringify({ checked: new Date().toISOString(), metrics, problems }, null, 1) + "\n");
console.log(`health: ${problems.length ? problems.length + " problem(s)" : "ok"}`, JSON.stringify(metrics));
for (const p of problems) console.log(`  - ${p.replace(/\*\*/g, "")}`);
if (!TOKEN) process.exit(0);

const api = async (path, opts = {}) => {
  const r = await fetch(`https://api.github.com/repos/${REPO}/${path}`, { ...opts, headers: { authorization: `Bearer ${TOKEN}`, accept: "application/vnd.github+json", "content-type": "application/json" } });
  if (!r.ok) throw new Error(`${r.status} ${path}`);
  return r.status === 204 ? null : r.json();
};
const table = Object.entries(metrics).map(([k, v]) => `| ${k} | ${was[k] ?? "–"} | ${v} |`).join("\n");
const open = (await api("issues?state=open&labels=health&per_page=5"))[0];
if (problems.length) {
  const body = `The agent's health check found something wrong after the run at ${new Date().toISOString().slice(0, 16)} UTC.\n\n${problems.map((p) => `- ${p}`).join("\n")}\n\n| metric | last run | now |\n|---|---|---|\n${table}\n\nThis issue closes itself when the next run is healthy.`;
  if (open) await api(`issues/${open.number}/comments`, { method: "POST", body: JSON.stringify({ body }) });
  else await api("issues", { method: "POST", body: JSON.stringify({ title: "Site health: a data source needs attention", labels: ["health"], body }) });
} else if (open) {
  await api(`issues/${open.number}/comments`, { method: "POST", body: JSON.stringify({ body: `All checks pass again.\n\n| metric | last run | now |\n|---|---|---|\n${table}` }) });
  await api(`issues/${open.number}`, { method: "PATCH", body: JSON.stringify({ state: "closed" }) });
}

// Monday: ten random descriptions for a person to read, because AI-written text slips in ways numbers do not show
const day = new Date().toISOString().slice(0, 10);
if (new Date().getUTCDay() === 1 || process.env.SPOT_CHECK) {
  const have = await api(`issues?state=all&labels=spot-check&per_page=1`);
  if (!have[0] || !have[0].title.includes(day)) {
    const pick = Object.values(explain || {}).sort(() => Math.random() - 0.5).slice(0, 7)
      .map((e) => `- [ ] **${e.repo}**: ${e.plain}\n  ${SITE}/explore.html#${e.repo} · https://github.com/${e.repo}`);
    const sk = (skills?.skills || []).filter((s) => s.plain).sort(() => Math.random() - 0.5).slice(0, 3)
      .map((s) => `- [ ] **${s.name}** (skill from ${s.repo}): ${s.plain}\n  ${SITE}/explore.html#${s.key}`);
    const big = items.filter((i) => i.big && now - new Date(i.date) < 7 * D).map((i) => `- [ ] ${i.source}: [${i.title}](${i.url})`);
    const body = `Ten random descriptions written by the AI. For each: open it, compare with the project, tick it if it is right. If not, edit the entry in \`data/explain.json\` (or tell Claude) and note it here.\n\n${[...pick, ...sk].join("\n")}\n\n**Stories marked "Big launch" this week**, are they really big?\n\n${big.join("\n") || "- none"}\n\nClose this issue when done.`;
    await api("issues", { method: "POST", body: JSON.stringify({ title: `Weekly spot-check ${day}`, labels: ["spot-check"], body }) });
  }
}
