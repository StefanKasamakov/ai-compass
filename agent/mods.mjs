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

function curatedFromReadme(md) {
  const cut = md.indexOf("## Every mod the scanner found");
  const lines = (cut > 0 ? md.slice(0, cut) : md).split(/\r?\n/);
  const out = [];
  let cat = null;
  for (const line of lines) {
    const h = line.match(/^## (.+)$/);
    if (h) { cat = CATS[h[1].trim()] || null; continue; }
    const m = line.match(/^- \[([^\]]+)\]\((https:\/\/github\.com\/[^)]+)\) - (.+)$/);
    if (m && cat) out.push({ name: m[1], url: m[2], plain: m[3].trim(), cat: cat[0] });
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
for (const c of curatedFromReadme(readme)) {
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
    marketplace: mk?.name || null, plugin: m.name,
  });
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
