// Indexes individual agent skills (one SKILL.md = one skill) from the well-known collections on GitHub.
// Facts come straight from the files: name and description from the SKILL.md front matter, "runs scripts"
// from the files that sit next to it, license/stars/last update from the repo.
// If an AI key is present, it also writes a plain-English line, example uses and an example request per skill.
// Run: node agent/skills.mjs          (SKILLS_LLM_LIMIT=0 to skip the AI step)
import fs from "node:fs/promises";

const ROOT = new URL("../", import.meta.url);
const TOKEN = process.env.GITHUB_TOKEN;
const H = { "user-agent": "whichaimap-agent (+https://whichaimap.com)", accept: "application/vnd.github+json", ...(TOKEN && { authorization: `Bearer ${TOKEN}` }) };
const readJSON = async (f, fallback) => { try { return JSON.parse(await fs.readFile(new URL(f, ROOT), "utf8")); } catch { return fallback; } };
const api = async (path) => { const r = await fetch(`https://api.github.com/${path}`, { headers: H }); if (!r.ok) throw new Error(`${r.status} ${path}`); return r.json(); };

// Collections we trust enough to list. A person adds a repo here; nothing gets in by trending alone.
const SOURCES = [
  "anthropics/skills", "obra/superpowers", "addyosmani/agent-skills", "mattpocock/skills", "openai/skills",
  "vercel-labs/agent-skills", "anthropics/claude-plugins-official", "openai/plugins", "alirezarezvani/claude-skills",
  "EveryInc/compound-engineering-plugin", "pbakaus/impeccable", "wshobson/agents",
];
const PER_REPO = 80; // a single huge collection should not drown the rest
const SCRIPT = /\.(py|sh|bash|js|mjs|cjs|ts|rb|ps1|go)$/i;
const SKIP = /(^|\/)(node_modules|\.git|test|tests|fixtures|examples?|templates?|archive|deprecated)\//i;

const GOALS = {
  docs: /\b(docx|word|excel|xlsx|spreadsheet|pptx|powerpoint|slides?|presentation|pdf|document|report|writing|write|copy|email|blog|article|translate|proofread|memo)\b/i,
  media: /\b(image|video|audio|design|logo|poster|art|animation|gif|diagram|chart|visual|brand|theme|ui|ux|frontend|css|figma|canvas|music|voice)\b/i,
  apps: /\b(website|web app|landing page|react|next\.?js|frontend|deploy|vercel|html)\b/i,
  code: /\b(code|coding|debug|test|testing|refactor|git|commit|pull request|review|ci|api|typescript|python|sql|bug|repository|codebase)\b/i,
  research: /\b(research|search|sources?|citations?|literature|analysis|analy[sz]e|market|competitor)\b/i,
  automate: /\b(automat|workflow|schedule|pipeline|scrap|crawl|browser)\b/i,
  connect: /\b(mcp|connector|integration|slack|notion|jira|github)\b/i,
  monitor: /\b(security|audit|threat|vulnerab|monitor|observab|eval)\b/i,
};

function frontMatter(md) {
  const m = md.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return {};
  const out = {};
  const lines = m[1].split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const kv = lines[i].match(/^([A-Za-z_-]+):\s*(.*)$/);
    if (!kv) continue;
    let [, k, v] = kv;
    if (/^[>|][+-]?$/.test(v) || v === "") { // folded or literal block
      const buf = [];
      while (i + 1 < lines.length && /^\s+\S/.test(lines[i + 1])) buf.push(lines[++i].trim());
      v = buf.join(" ");
    }
    out[k.toLowerCase()] = v.replace(/^["']|["']$/g, "").trim();
  }
  return out;
}

const clean = (s = "") => s.replace(/\s+/g, " ").replace(/[\u{1F000}-\u{1FAFF}☀-➿]/gu, "").trim();

async function indexRepo(repo) {
  const [meta, tree] = await Promise.all([api(`repos/${repo}`), api(`repos/${repo}/git/trees/HEAD?recursive=1`)]);
  const paths = tree.tree.filter((t) => t.type === "blob").map((t) => t.path);
  const skillFiles = paths.filter((p) => /(^|\/)SKILL\.md$/.test(p) && !SKIP.test(p)).slice(0, PER_REPO);
  const skills = [];
  for (const file of skillFiles) {
    const dir = file.replace(/\/?SKILL\.md$/, "");
    const md = await fetch(`https://raw.githubusercontent.com/${repo}/HEAD/${file}`).then((r) => (r.ok ? r.text() : ""));
    const fm = frontMatter(md);
    const name = clean(fm.name) || dir.split("/").pop() || repo.split("/")[1];
    const desc = clean(fm.description);
    if (!desc || desc.length < 20 || /[぀-ヿ一-鿿]/.test(desc)) continue; // nothing to explain, or not in English
    const beside = paths.filter((p) => p.startsWith(dir ? `${dir}/` : "") && p !== file && (dir || !p.includes("/")));
    const text = `${name} ${desc}`;
    skills.push({
      key: `${repo}/${name}`.replace(/[^A-Za-z0-9._/-]/g, "-").slice(0, 100),
      name, repo, path: dir, desc: desc.slice(0, 600),
      scripts: beside.some((p) => SCRIPT.test(p)), files: beside.length,
      tags: Object.entries(GOALS).filter(([, re]) => re.test(text)).map(([g]) => g).slice(0, 3),
    });
  }
  return { source: { repo, stars: meta.stargazers_count, license: meta.license?.spdx_id && meta.license.spdx_id !== "NOASSERTION" ? meta.license.spdx_id : null, pushed: meta.pushed_at, by: meta.owner.login, count: skills.length }, skills };
}

const prev = await readJSON("data/skills.json", { skills: [] });
const prevBy = Object.fromEntries(prev.skills.map((s) => [s.key, s]));
const curated = (await readJSON("data/tools.json", [])).filter((t) => t.type === "skill");

const sources = [], skills = [];
for (const repo of SOURCES) {
  try {
    const r = await indexRepo(repo);
    sources.push(r.source);
    skills.push(...r.skills);
    console.log(`skills: ${repo} -> ${r.skills.length}`);
  } catch (e) { // keep what we had rather than dropping a whole collection on a network blip
    console.warn(`skills: ${repo} failed (${e.message}), keeping previous entries`);
    const kept = prev.skills.filter((s) => s.repo === repo);
    skills.push(...kept);
    const old = prev.sources?.find((s) => s.repo === repo);
    if (old) sources.push(old);
  }
}

// carry over our hand-written explanations and any AI text whose source description has not changed
const seen = new Set();
const merged = skills.filter((s) => !seen.has(s.key) && seen.add(s.key)).map((s) => {
  const c = curated.find((t) => t.repo === s.repo && (t.path === s.path || t.name === s.name));
  const p = prevBy[s.key];
  if (c) return { ...s, key: c.id, plain: c.plain || c.d, useFor: c.useFor || [], checked: true, ...(c.tags?.length && { tags: c.tags }), ...(c.level && { level: c.level }) };
  if (p?.plain && p.desc === s.desc) return { ...s, plain: p.plain, useFor: p.useFor, example: p.example };
  return s;
});

// plain-English rewrite, in batches, only for skills that do not have one yet
const LIMIT = Number(process.env.SKILLS_LLM_LIMIT ?? 120);
if (LIMIT > 0 && (process.env.GEMINI_API_KEY || process.env.ANTHROPIC_API_KEY)) {
  const { askJSON } = await import("./llm.mjs");
  const { z } = await import("zod");
  const Out = z.object({ items: z.array(z.object({ id: z.number(), plain: z.string(), useFor: z.array(z.string()), example: z.string() })) });
  const todo = merged.filter((s) => !s.plain).slice(0, LIMIT);
  for (let i = 0; i < todo.length; i += 20) {
    const batch = todo.slice(i, i + 20);
    const res = await askJSON({
      schema: Out,
      system: "You explain AI agent skills to people who are not programmers, for Which AI Map. A skill is a folder of instructions an AI assistant loads when a task matches. " +
        "For each item, using ONLY its name and description: plain = one sentence, max 22 words, starting with a verb, saying what the assistant can do once the skill is installed; no jargon, no hype, no emoji. " +
        "useFor = 2 or 3 concrete everyday tasks, each max 9 words. example = one realistic request a person could type to trigger it, max 16 words. " +
        "Never invent abilities that the description does not mention.",
      user: JSON.stringify(batch.map((s, id) => ({ id, name: s.name, description: s.desc }))),
    }).catch((e) => { console.warn(`skills: AI batch failed (${e.message})`); return null; });
    for (const it of res?.items ?? []) if (batch[it.id]) Object.assign(batch[it.id], { plain: clean(it.plain), useFor: it.useFor.map(clean).slice(0, 3), example: clean(it.example) });
  }
  console.log(`skills: AI text for ${todo.filter((s) => s.plain).length} of ${todo.length}`);
}

await fs.writeFile(new URL("data/skills.json", ROOT), JSON.stringify({ updated: new Date().toISOString(), sources, skills: merged }, null, 1) + "\n");
console.log(`skills: ${merged.length} skills from ${sources.length} collections`);
