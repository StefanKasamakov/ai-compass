// Instagram drafts: when a new model lands, on the Monday digest and once a week for a skill, this draws a
// 1080x1350 carousel in the site's look (social/<id>/<n>.jpg, served from whichaimap.com) and writes a draft into
// Supabase social_posts. Nothing is posted here: the owner approves each draft in admin.html, then
// agent/social-publish.mjs posts it at the chosen time.
// Run: node agent/social.mjs   (without Supabase secrets it only draws the slides, for a local look)
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { askJSON, provider } from "./llm.mjs";

const ROOT = new URL("../", import.meta.url);
const SITE = "https://whichaimap.com";
const read = async (f, fb) => { try { return JSON.parse(await fs.readFile(new URL(f, ROOT), "utf8")); } catch { return fb; } };
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const day = (d = new Date()) => d.toISOString().slice(0, 10);
const DAY = 864e5;

const state = await read("data/social.json", { models: [], digests: [], skills: [] });
const [models, nl, sk] = await Promise.all([read("data/models.json", { models: [] }), read("data/newsletter.json", { issues: [] }), read("data/skills.json", { skills: [] })]);

// ---------- what to post ----------
const COLOR = { anthropic: "#d97757", openai: "#10a37f", google: "#4285f4", open: "#e0a020" };
const LOGO = { anthropic: "claude", openai: "lh-openai", google: "googlegemini" };
const openLogo = (n) => [["qwen", "qwen"], ["deepseek", "deepseek"], ["mistral", "mistralai"], ["kimi", "lh-kimi"], ["glm", "lh-zhipu"]].find(([k]) => n.toLowerCase().includes(k))?.[1] || "huggingface";
const TIER = {
  Frontier: "The smartest and slowest kind: for the hardest work, where quality beats speed and price.",
  Default: "The everyday pick: the one its maker recommends for most work.",
  Balanced: "The middle of the range: close to the top models, at a much lower price.",
  Fast: "The quick, cheap kind: for lots of small jobs, short answers and high volume.",
  Open: "Open weights: free to download and run on your own computer or server.",
};
const money = (n) => (n == null ? "-" : `$${n < 1 ? n.toFixed(2) : n}`);
const plainTitle = (t) => t.replace(/^\[[^\]]+\]\s*/, "").replace(/\s+[|\\-]\s+[^|\\-]+$/, "");
const NAMES = { pdf: "PDF", pptx: "PowerPoint", xlsx: "Excel", docx: "Word", "skill-creator": "Skill creator", "mcp-builder": "MCP builder" };
const nice = (n) => NAMES[n] || n.replace(/[-_]+/g, " ").replace(/^./, (c) => c.toUpperCase());

const drafts = [];
for (const m of models.models) {
  if (state.models.includes(m.id) || !m.released || Date.now() - new Date(m.released) > 10 * DAY || !TIER[m.tier]) continue;
  const prov = models.providers[m.p] || { name: m.p, app: "" };
  const color = COLOR[m.p] || COLOR.open, logo = LOGO[m.p] || openLogo(m.name);
  const kin = models.models.filter((x) => x.p === m.p && x.id !== m.id && TIER[x.tier]).slice(0, 3);
  drafts.push({
    id: `${day()}-model-${m.id}`, mark: ["models", m.id], logos: [logo], title: `New model: ${m.name}`, link: `${SITE}/models.html#m-${m.id}`,
    facts: { name: m.name, maker: prov.name, app: prov.app, tier: m.tier, bestFor: m.best, priceIn: m.in, priceOut: m.out, context: m.ctx, released: m.released, siblings: kin.map((x) => `${x.name} (${x.tier}, ${money(x.in)}/${money(x.out)})`) },
    slides: [
      cover({ color, logo, kicker: `New model · ${prov.name}`, title: m.name, sub: m.best }),
      point({ color, kicker: "What kind of model", title: `${m.tier}`, body: TIER[m.tier] + (prov.app ? ` You can use it in the ${prov.app} app.` : "") }),
      table({ color, kicker: "What it costs", title: `${money(m.in)} in · ${money(m.out)} out`, note: `Per 1 million tokens (about 750,000 words) through the API. In the apps you pay a monthly plan instead. Context: ${m.ctx || "-"} tokens.`,
        rows: kin.map((x) => [x.name, x.tier, `${money(x.in)} / ${money(x.out)}`]) }),
      cta({ color, title: "Which one should you use?", body: "Answer two questions and get one clear pick, with prices and test scores.", url: "whichaimap.com/models" }),
    ],
  });
}

const issue = nl.issues[0];
if (issue && !state.digests.includes(issue.date) && Date.now() - new Date(issue.date) < 3 * DAY) {
  const full = await read(`data/newsletter/${issue.date}.json`, null);
  const items = (full?.sections || []).flatMap((s) => s.items).slice(0, 4);
  if (items.length >= 3) drafts.push({
    id: `${issue.date}-digest`, mark: ["digests", issue.date], title: `This week in AI (${issue.date})`, link: `${SITE}/newsletter.html?issue=${issue.date}`,
    facts: { intro: issue.intro, items: items.map((i) => `${plainTitle(i.title)}: ${i.blurb}`) },
    slides: [
      cover({ color: "#22c55e", logo: "", kicker: `Week of ${new Date(issue.date).toLocaleDateString("en-GB", { day: "numeric", month: "long" })}`, title: "This week in AI", sub: issue.intro }),
      ...items.map((i, n) => point({ color: "#22c55e", kicker: `${n + 1} · ${i.meta || "News"}`, title: plainTitle(i.title), body: i.blurb })),
      cta({ color: "#22c55e", title: "Get it every Monday", body: "One short email with what changed in AI, minus the hype.", url: "whichaimap.com/newsletter" }),
    ],
  });
}

const lastSkill = state.skills.at(-1)?.date;
if (!lastSkill || Date.now() - new Date(lastSkill) >= 7 * DAY) {
  const used = new Set(state.skills.map((s) => s.key));
  const FIRST = ["pdf", "pptx", "xlsx", "docx", "skill-creator", "frontend-design", "canvas-design", "doc-coauthoring", "brand-guidelines", "internal-comms", "theme-factory", "webapp-testing"];
  const fresh = (k) => k.plain && k.useFor?.length >= 2 && !used.has(k.key);
  const pick = FIRST.map((n) => sk.skills.find((k) => k.repo === "anthropics/skills" && k.name === n && fresh(k))).find(Boolean)
    || sk.skills.find((k) => fresh(k) && !k.scripts);
  if (pick) {
    const slug = `skill-${pick.key.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}`;
    drafts.push({
      id: `${day()}-skill-${pick.name}`, mark: ["skills", { key: pick.key, date: day() }], title: `Skill of the week: ${pick.name}`, link: `${SITE}/tools/${slug}.html`,
      facts: { name: pick.name, from: pick.repo, plain: pick.plain, useFor: pick.useFor, example: pick.example, runsScripts: !!pick.scripts },
      slides: [
        cover({ color: "#7c5cff", logo: "", kicker: "Skill of the week", title: nice(pick.name), sub: pick.plain }),
        list({ color: "#7c5cff", kicker: "Use it to", title: "What you can ask for", items: [...pick.useFor.slice(0, 4), ...(pick.example ? [`Try: "${pick.example}"`] : [])] }),
        list({ color: "#7c5cff", kicker: "How to add it", title: "Three steps", items: ["Find it on whichaimap.com and open its page.", "Claude app: upload it under Settings, Capabilities, Skills. Claude Code: copy the folder into ~/.claude/skills.", "Ask for the task in plain words. Claude loads the skill by itself."] }),
        cta({ color: "#7c5cff", title: "What is a skill, anyway?", body: "A folder of instructions your AI loads when a task matches. Hundreds more explained, one by one.", url: "whichaimap.com/skills" }),
      ],
    });
  }
}
if (!drafts.length) { console.log("social: nothing new to draw"); process.exit(0); }

// ---------- the slides ----------
function frame(color, inner, n) {
  return `<section class="slide" style="--c:${color}">${inner}<footer><span class="brand"><img src="assets/favicon.svg" alt="">whichaimap</span><span class="n">${n}</span></footer></section>`;
}
function cover({ color, logo, kicker, title, sub }) { return (n) => frame(color, `<span class="mark" style="-webkit-mask-image:url(${MASK[logo || "compass"]})"></span><div class="body end"><p class="kick">${esc(kicker)}</p><h1>${esc(title)}</h1><p class="sub">${esc(sub)}</p></div>`, n); }
function point({ color, kicker, title, body }) { return (n) => frame(color, `<div class="body"><p class="kick">${esc(kicker)}</p><h2>${esc(title)}</h2><p class="text">${esc(body)}</p></div>`, n); }
function list({ color, kicker, title, items }) { return (n) => frame(color, `<div class="body"><p class="kick">${esc(kicker)}</p><h2>${esc(title)}</h2><ol>${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ol></div>`, n); }
function table({ color, kicker, title, note, rows }) {
  return (n) => frame(color, `<div class="body"><p class="kick">${esc(kicker)}</p><h2>${esc(title)}</h2><p class="text small">${esc(note)}</p>${rows.length ? `<p class="kick dim">Same maker</p><table>${rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</table>` : ""}</div>`, n);
}
function cta({ color, title, body, url }) { return (n) => frame(color, `<div class="body center"><h2>${esc(title)}</h2><p class="text">${esc(body)}</p><p class="url">${esc(url)}</p><p class="kick">Link in bio</p></div>`, n); }

const CSS = `
*{box-sizing:border-box;margin:0}body{background:#0a0e17}
.slide{position:relative;width:1080px;height:1350px;overflow:hidden;color:#e8ecf4;font-family:"IBM Plex Sans",sans-serif;
  background:radial-gradient(circle at 85% 0%, color-mix(in srgb,var(--c) 42%,transparent), transparent 55%),radial-gradient(circle at 0% 100%, color-mix(in srgb,var(--c) 16%,transparent), transparent 50%),#0a0e17;padding:96px 88px}
.slide::before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 1px 1px,rgba(255,255,255,.07) 1px,transparent 0) 0 0/28px 28px}
.mark{position:absolute;right:-120px;top:-90px;width:720px;height:720px;background:#fff;opacity:.13;transform:rotate(-12deg);-webkit-mask-size:contain;-webkit-mask-repeat:no-repeat;-webkit-mask-position:center}
.body{position:relative;display:flex;flex-direction:column;gap:34px;height:calc(100% - 80px);justify-content:center}
.body.end{justify-content:flex-end;padding-bottom:40px}.body.center{align-items:flex-start}
.kick{font:600 30px "JetBrains Mono",monospace;letter-spacing:.14em;text-transform:uppercase;color:var(--c);filter:brightness(1.25)}
.kick.dim{color:#9aa6bd;filter:none;font-size:24px;margin-top:20px}
h1{font-weight:700;font-size:118px;line-height:1.02;letter-spacing:-.035em;text-wrap:balance}
h2{font-weight:700;font-size:80px;line-height:1.06;letter-spacing:-.03em;text-wrap:balance}
.sub,.text{font-size:42px;line-height:1.4;color:#c4ccdb;text-wrap:pretty}.text.small{font-size:34px}
ol{display:grid;gap:30px;padding-left:0;list-style:none;counter-reset:i}
ol li{counter-increment:i;display:grid;grid-template-columns:72px 1fr;font-size:42px;line-height:1.35;color:#dfe5ef}
ol li::before{content:counter(i);font:700 40px "JetBrains Mono",monospace;color:var(--c);filter:brightness(1.25)}
table{border-collapse:collapse;width:100%;font-size:32px}td{padding:20px 0;border-top:1px solid rgba(255,255,255,.12);color:#c4ccdb}td:first-child{color:#e8ecf4;font-weight:600}td:last-child{text-align:right;font-family:"JetBrains Mono",monospace}
.url{font:700 54px "JetBrains Mono",monospace;color:#fff;padding:26px 34px;border:2px solid var(--c);border-radius:24px;margin-top:10px}
footer{position:absolute;left:88px;right:88px;bottom:64px;display:flex;justify-content:space-between;align-items:center;font:600 30px "JetBrains Mono",monospace;color:#9aa6bd}
.brand{display:flex;gap:16px;align-items:center;color:#e8ecf4}.brand img{width:44px;height:44px}`;

const svgData = async (f) => `data:image/svg+xml;base64,${(await fs.readFile(new URL(f, ROOT))).toString("base64")}`;
const COMPASS = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2"><circle cx="12" cy="12" r="8"/><polygon points="15.4 8.6 13.7 13.7 8.6 15.4 10.3 10.3 15.4 8.6" fill="#000"/></svg>`;
const MASK = { compass: `data:image/svg+xml;base64,${Buffer.from(COMPASS).toString("base64")}` };
for (const d of drafts) for (const l of d.logos || []) MASK[l] ??= await svgData(`assets/logos/${l}.svg`);
const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
const tmp = new URL("social/_render.html", ROOT);
await fs.mkdir(new URL("social/", ROOT), { recursive: true });
for (const d of drafts) {
  await fs.mkdir(new URL(`social/${d.id}/`, ROOT), { recursive: true });
  d.images = [];
  for (const [i, s] of d.slides.entries()) {
    await fs.writeFile(tmp, `<!doctype html><html><head><meta charset="utf-8"><base href="${ROOT.href}"><link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;600;700&family=JetBrains+Mono:wght@600;700&display=block" rel="stylesheet"><style>${CSS}</style></head><body>${s(`${i + 1}/${d.slides.length}`)}</body></html>`);
    await page.goto(tmp.href, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: fileURLToPath(new URL(`social/${d.id}/${i + 1}.jpg`, ROOT)), type: "jpeg", quality: 90 });
    d.images.push(`${SITE}/social/${d.id}/${i + 1}.jpg`);
  }
}
await browser.close();
await fs.rm(tmp, { force: true });

// ---------- captions: written by the AI from the same facts, with a plain fallback ----------
const Caption = z.object({ caption: z.string() });
for (const d of drafts) {
  const fallback = `${d.title}.\n\n${d.slides.length - 1} slides, in plain English. Swipe through, then find the full guide at whichaimap.com (link in bio).\n\n#ai #artificialintelligence #aitools`;
  d.caption = !provider ? fallback : (await askJSON({
    schema: Caption,
    system: "You write Instagram captions for Which AI Map, a free plain-English guide to AI for people who are not technical. " +
      "3 to 6 short lines. Start with a hook line that says the news or the benefit plainly. Use only the facts given, never invent numbers or claims. " +
      "No emoji, no hype words (game-changer, revolutionary, insane). End with the line 'Full guide: link in bio.' then a blank line and 3 to 5 relevant lowercase hashtags.",
    user: JSON.stringify({ post: d.title, facts: d.facts }),
  }).catch((e) => { console.warn(`[social] caption: ${e.message}`); return null; }))?.caption || fallback;
}

// ---------- drafts for the owner ----------
const sb = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY) : null;
for (const d of drafts) {
  if (!sb) { console.log(`social (local): ${d.title} -> social/${d.id}/\n${d.caption}\n`); continue; }
  const { error } = await sb.from("social_posts").insert({ channel: "instagram", title: d.title, body: d.caption, link: d.link, images: d.images });
  if (error) { console.warn(`[social] ${d.title}: ${error.message}`); continue; }
  const [key, val] = d.mark;
  state[key].push(val);
  console.log(`social: draft "${d.title}" (${d.images.length} slides)`);
}
if (sb) await fs.writeFile(new URL("data/social.json", ROOT), JSON.stringify(state, null, 1) + "\n");
