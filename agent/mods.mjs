// Builds data/mods.json: the Claude Code mods worth knowing, with what each one can reach.
// Sources:
//   - Anthropic's built-in mods and the three sample mods it publishes (hand-written below, from the official docs)
//   - the community catalogue github.com/karanb192/awesome-claude-code-mods (CC0): its README picks are the
//     "well known" list, and its scan (data/mods.json) says what Claude's own validator reports each mod can
//     read, write, run or send over the network.
// Run: node agent/mods.mjs
import fs from "node:fs/promises";

const ROOT = new URL("../", import.meta.url);
const RAW = "https://raw.githubusercontent.com/karanb192/awesome-claude-code-mods/main";
const get = async (url, as = "text") => { const r = await fetch(url, { headers: { "user-agent": "whichaimap-agent (+https://whichaimap.com)" } }); if (!r.ok) throw new Error(`${r.status} ${url}`); return r[as](); };
const readJSON = async (f, fallback) => { try { return JSON.parse(await fs.readFile(new URL(f, ROOT), "utf8")); } catch { return fallback; } };

// README section -> our category
const CATS = {
  "Dashboards and usage": ["usage", "Usage and dashboards"],
  "While you wait": ["fun", "Fun while you wait"],
  "Git, pull requests and CI": ["git", "Git, pull requests and CI"],
  "Safety and privacy": ["safety", "Safety and privacy"],
  "Memory and context": ["memory", "Memory and context"],
  "Rendering": ["rendering", "Better-looking replies"],
  "Agents and workflows": ["agents", "Agents and workflows"],
  "Building mods": ["building", "For people who build mods"],
};

// Anthropic's own: written from code.claude.com/docs/en/plugins/mods/overview
const OFFICIAL = [
  { key: "anthropic/diff", name: "diff", cat: "builtin", repo: "anthropics/claude-code", by: "Anthropic", plain: "The /diff pane: review the changes Claude made, with buttons and scrolling.", url: "https://github.com/anthropics/claude-code/tree/main/mods/diff", builtin: true, surfaces: ["Pane"], reach: 1 },
  { key: "anthropic/agents-md", name: "agents-md", cat: "builtin", repo: "anthropics/claude-code", by: "Anthropic", plain: "Loads AGENTS.md files as project instructions, the way CLAUDE.md is loaded.", url: "https://github.com/anthropics/claude-code/tree/main/mods/agents-md", builtin: true, surfaces: [], reach: 1 },
  { key: "anthropic/sec-default", name: "sec-default", cat: "builtin", repo: "anthropics/claude-code", by: "Anthropic", plain: "On Team and Enterprise plans, stops mods you install from overriding your organization's rules.", url: "https://github.com/anthropics/claude-code/tree/main/mods/sec-default", builtin: true, surfaces: [], reach: 1 },
  { key: "anthropic/you-should-know", name: "you-should-know", cat: "builtin", repo: "anthropics/claude-code", by: "Anthropic", plain: "A side agent that watches longer tasks and shows a note above the prompt when it spots something you might miss. Off by default.", builtin: true, surfaces: ["AbovePrompt"], reach: 2, enable: "/plugin enable cc-plugin-you-should-know@builtin" },
  { key: "anthropic/token-weather", name: "token-weather", cat: "sample", repo: "anthropics/claude-code-playground", by: "Anthropic", license: "Apache-2.0", plain: "A forecast of how full your context window is, drawn above the prompt.", url: "https://github.com/anthropics/claude-code-playground/tree/main/claude-code/mods/token-weather", sample: true, surfaces: ["AbovePrompt"], reach: 0 },
  { key: "anthropic/blast-radius", name: "blast-radius", cat: "sample", repo: "anthropics/claude-code-playground", by: "Anthropic", license: "Apache-2.0", plain: "Holds a risky shell command, such as rm -rf or a force push, shows what it would change, and asks you to proceed or cancel.", url: "https://github.com/anthropics/claude-code-playground/tree/main/claude-code/mods/blast-radius", sample: true, surfaces: ["Pane"], reach: 2 },
  { key: "anthropic/replay-theater", name: "replay-theater", cat: "sample", repo: "anthropics/claude-code-playground", by: "Anthropic", license: "Apache-2.0", plain: "Adds /replay, which steps through the file edits Claude made in the last turn, one diff at a time.", url: "https://github.com/anthropics/claude-code-playground/tree/main/claude-code/mods/replay-theater", sample: true, surfaces: ["Pane"], reach: 1 },
];

const norm = (u = "") => u.replace(/\/+$/, "").replace(/\/tree\/[^/]+$/, "").toLowerCase();

// The README's layout changes (on 10 Oct 2026 the category sections became one "Featured" list), so a section we
// do not know is sorted into a category by its words instead of being skipped.
const GUESS = [
  ["rendering", /\b(render|markdown|mermaid|table|diagram|chart|image|thumbnail|file tree|preview|browser)/i],
  ["usage", /\b(cost|token|cache|context|usage|limit|quota|dashboard|meter|spend)/i],
  ["safety", /\b(secret|redact|guard|risky|danger|block|permission|confirm|safe)/i],
  ["git", /\b(git|pull request|\bpr\b|ci\b|deploy|github|merge|commit)/i],
  ["memory", /\b(memory|remember|compact|handoff|notes?|knowledge)/i],
  ["fun", /\b(game|pet|music|play|arcade|fun)/i],
  ["agents", /\b(agent|subagent|workflow|task|prompts?)/i],
];
const guessCat = (t) => GUESS.find(([, re]) => re.test(t))?.[0] || "agents";

function curatedFromReadme(md) {
  const cut = md.indexOf("## Every mod the scanner found");
  const lines = (cut > 0 ? md.slice(0, cut) : md).split(/\r?\n/);
  const out = [];
  let section = null;
  for (const line of lines) {
    const h = line.match(/^## (.+)$/);
    if (h) { section = h[1].trim(); continue; }
    if (!section || /^(contents|use mods|building mods|contribut|related|how the scan)/i.test(section)) continue;
    const m = line.match(/^- \[([^\]]+)\]\((https:\/\/github\.com\/[^)]+)\) - (.+)$/);
    if (!m) continue;
    const plain = m[3].replace(/\s*\[(Demo|Recording|Screenshot)\]\([^)]*\)\.?/g, "").trim();
    const demo = m[3].match(/\[(?:Demo|Recording|Screenshot)\]\(([^)\s]+)\)/)?.[1];
    out.push({ name: m[1], url: m[2], plain, demo, cat: CATS[section]?.[0] || guessCat(`${m[1]} ${plain}`), featured: section === "Featured" });
  }
  return out;
}

const prev = await readJSON("data/mods.json", null);
let scan, readme;
try {
  [scan, readme] = await Promise.all([get(`${RAW}/data/mods.json`, "json"), get(`${RAW}/README.md`)]);
} catch (e) {
  console.warn(`mods: catalogue unavailable (${e.message}), keeping the previous file`);
  process.exit(0);
}

const byUrl = new Map();
for (const m of scan.mods) if (m.kind === "mod" && m.url) byUrl.set(norm(m.url), m);
const byRepo = new Map();
for (const m of scan.mods) if (m.kind === "mod") { const k = m.repo.toLowerCase(); if (!byRepo.has(k)) byRepo.set(k, []); byRepo.get(k).push(m); }

const plainLabel = (l) => l.replace(/^other: /, "");
const mods = [];
const seen = new Set();
const fromReadme = curatedFromReadme(readme);
const known = (prev?.mods || []).filter((x) => !x.builtin && !x.sample && x.url && !fromReadme.some((c) => norm(c.url) === norm(x.url)))
  .map((x) => ({ name: x.name, url: x.url, plain: x.plain, cat: x.cat, featured: false }));
for (const c of [...fromReadme, ...known]) {
  let m = byUrl.get(norm(c.url));
  if (!m) { // a README link to a repo root that holds one mod
    const repo = c.url.replace("https://github.com/", "").split("/").slice(0, 2).join("/").toLowerCase();
    const list = byRepo.get(repo) || [];
    m = list.find((x) => x.name.toLowerCase() === c.name.toLowerCase()) || (list.length === 1 ? list[0] : null);
  }
  if (!m || m.archived || m.validate?.status === "failed") continue;
  const key = `${m.repo}/${m.name}`.replace(/[^A-Za-z0-9._/-]/g, "-").slice(0, 100);
  if (seen.has(key)) continue;
  seen.add(key);
  const mk = (m.marketplaces || []).find((x) => x.status !== "failed" && x.path === ".claude-plugin/marketplace.json");
  mods.push({
    key, name: c.name, repo: m.repo, path: m.path || "", url: c.url, plain: c.plain, cat: c.cat,
    by: m.author || m.repo.split("/")[0],
    reach: m.reach?.level ?? 2, reachLabels: (m.reach?.labels || []).filter((l) => !l.startsWith("other:")).map(plainLabel),
    sees: (m.sees || []).slice(0, 6), surfaces: m.draws || [],
    validated: m.validate?.status || "unknown", stars: m.stars || 0, license: m.license || null, pushed: m.pushedAt || null,
    marketplace: mk?.name || null, plugin: m.name, ...(c.featured && { featured: true }), ...(c.demo && { demo: c.demo }),
  });
}

// a picture or short clip of each mod, so people can see it before installing: the catalogue's Demo link first,
// then the first real image in the mod's own README (badges, logos and icons skipped). Checked to load before listing.
const TOKEN = process.env.GITHUB_TOKEN;
const GH = { "user-agent": "whichaimap-agent (+https://whichaimap.com)", accept: "application/vnd.github.raw+json", ...(TOKEN && { authorization: `Bearer ${TOKEN}` }) };
const PIC = /!\[[^\]]*\]\(\s*<?([^)\s>]+)|<img[^>]+src=["']([^"']+)|<video[^>]+src=["']([^"']+)|<source[^>]+src=["']([^"']+)|^\s*(https:\/\/github\.com\/user-attachments\/assets\/[\w-]+)\s*$/gim;
const NOT_DEMO = /shields\.io|badge|badgen|\/workflows\/|codecov|star-history|contrib\.rocks|\.svg(\?|#|$)|icon|logo|brand|banner|avatar|sponsor|buymeacoffee|ko-fi/i;
const toRaw = (u, repo, dir) => {
  u = u.replace(/[?#].*$/, (q) => (/raw=true/.test(q) ? "" : q));
  const gh = u.match(/^https:\/\/github\.com\/([^/]+\/[^/]+)\/(?:blob|raw)\/(.+)$/);
  if (gh) return `https://raw.githubusercontent.com/${gh[1]}/${gh[2]}`;
  if (/^https?:\/\//.test(u)) return u;
  const base = `https://raw.githubusercontent.com/${repo}/HEAD/`;
  return u.startsWith("/") ? base + u.slice(1) : new URL(u.replace(/^\.\//, ""), base + (dir ? `${dir}/` : "")).href;
};
const pics = (md) => [...md.matchAll(PIC)].map((m) => m.slice(1).find(Boolean)).filter((u) => u && !NOT_DEMO.test(u));
async function check(src) { // must really be an image or a video, and not something huge
  try {
    const r = await fetch(src, { method: "HEAD", redirect: "follow", headers: { "user-agent": GH["user-agent"] } });
    const type = r.headers.get("content-type") || "", kb = Math.round(+(r.headers.get("content-length") || 0) / 1024);
    if (!r.ok || /svg/.test(type) || !/^(image|video)\//.test(type) || kb > 15000) return null;
    return { src, type: type.startsWith("video") ? "video" : "image", ...(kb && { kb }) };
  } catch { return null; }
}
const prevMedia = new Map((prev?.mods || []).filter((x) => x.media).map((x) => [x.key, x.media]));
for (const x of mods) {
  const tries = [];
  let reached = false; // false = GitHub did not answer, so keep the picture we had
  if (x.demo) tries.push(toRaw(x.demo, x.repo, ""));
  for (const dir of [...new Set([x.path && x.path !== "." ? x.path : null, ""])].filter((d) => d !== null)) {
    const r = await fetch(`https://api.github.com/repos/${x.repo}/readme${dir ? `/${dir}` : ""}`, { headers: GH }).catch(() => null);
    if (r?.ok || r?.status === 404) reached = true;
    // a repo holding several mods: its front-page picture shows one of them (or none), so take only a picture named after this mod
    const shared = !dir && mods.filter((y) => y.repo === x.repo).length > 1, own = x.name.toLowerCase().replace(/\s+/g, "-");
    if (r?.ok) tries.push(...pics(await r.text()).filter((u) => !shared || u.toLowerCase().includes(own)).map((u) => toRaw(u, x.repo, dir)));
    if (tries.length) break;
  }
  let media = null;
  for (const src of tries.slice(0, 4)) if ((media = await check(src))) break;
  delete x.demo;
  if (media) x.media = media;
  else if (!reached && prevMedia.has(x.key)) x.media = prevMedia.get(x.key);
}
console.log(`mods: a picture or clip for ${mods.filter((x) => x.media).length} of ${mods.length}`);

// a sudden drop means the source changed shape again: keep the old list rather than publish a broken one
if (prev && mods.length < 0.7 * prev.mods.filter((x) => !x.builtin && !x.sample).length) {
  console.warn(`mods: only ${mods.length} matched (was ${prev.mods.length - OFFICIAL.length}), keeping the previous file`);
  process.exit(0);
}

const out = {
  updated: new Date().toISOString(),
  scanned: scan.generated, claudeVersion: scan.claudeVersion,
  total: scan.mods.filter((m) => m.kind === "mod").length,
  categories: [["builtin", "Built into Claude Code"], ["sample", "Anthropic's samples"], ...Object.values(CATS)],
  mods: [...OFFICIAL, ...mods],
};
await fs.writeFile(new URL("data/mods.json", ROOT), JSON.stringify(out, null, 1) + "\n");
console.log(`mods: ${out.mods.length} listed (${OFFICIAL.length} by Anthropic), ${out.total} in the scan${prev ? `, was ${prev.mods.length}` : ""}`);
