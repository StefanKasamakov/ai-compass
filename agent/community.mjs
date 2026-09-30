// Community step: applies what reviewers approved in Supabase, and writes weekly social drafts.
//   tool      -> added to data/repos.json; the explainer writes it up on the next run
//   fix       -> about a repo: queued as a hint so the explainer re-checks it against the README
//                anything else: opened as a GitHub issue for the owner
//   tip       -> published in data/tips.json (shown under the tool)
//   volunteer -> nothing to apply here (the owner grants access on the review page)
// Social drafts (MAKE_SOCIAL=1): one Reddit + one LinkedIn draft from the latest newsletter issue.
import fs from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { askJSON } from "./llm.mjs";

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GITHUB_TOKEN } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) { console.log("community: no Supabase secrets, skipping"); process.exit(0); }
const sb = createClient(SUPABASE_URL.trim(), SUPABASE_SERVICE_ROLE_KEY.trim(), { auth: { persistSession: false } });

const ROOT = new URL("../", import.meta.url);
const read = (f, fallback) => fs.readFile(new URL(f, ROOT), "utf8").then(JSON.parse, () => fallback);
const write = (f, d) => fs.writeFile(new URL(f, ROOT), JSON.stringify(d, null, 1) + "\n");
const REPO = process.env.GITHUB_REPOSITORY || "StefanKasamakov/ai-compass";
const SITE = `https://${REPO.split("/")[0].toLowerCase()}.github.io/${REPO.split("/")[1]}`;
const gh = (path, opts = {}) => fetch(`https://api.github.com/${path}`, { ...opts, headers: { accept: "application/vnd.github+json", "user-agent": "ai-compass-agent", ...(GITHUB_TOKEN && { authorization: `Bearer ${GITHUB_TOKEN}` }) } })
  .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`GitHub ${r.status} ${path}`))));
const repoFrom = (t = "") => t.match(/github\.com\/([\w.-]+\/[\w.-]+)/)?.[1]?.replace(/\.git$/, "") ?? (t.match(/^\s*([\w.-]+\/[\w.-]+)\s*$/)?.[1]);
const done = (id, note) => sb.from("submissions").update({ status: "applied", review_note: note }).eq("id", id);

// ---- apply approved submissions ----
const { data: approved, error } = await sb.from("submissions").select("*").eq("status", "approved").order("created_at");
if (error) throw error;
const repos = await read("data/repos.json", { repos: [], exclude: [] });
const explain = await read("data/explain.json", {});
const hints = await read("data/hints.json", {});
let applied = 0;
for (const s of approved) {
  if (s.kind === "tool") {
    const r = repoFrom(s.url);
    const meta = r && (await gh(`repos/${r}`).catch(() => null));
    if (!meta) { await done(s.id, "Not a public GitHub repo, nothing added."); continue; }
    if ((repos.exclude || []).includes(meta.full_name)) { await done(s.id, "On the exclude list."); continue; }
    if (!repos.repos.includes(meta.full_name) && !explain[meta.full_name]) repos.repos.push(meta.full_name);
    await done(s.id, `Added ${meta.full_name}; explained on the next agent run.`);
  } else if (s.kind === "fix") {
    const r = repoFrom(s.target) || repoFrom(s.url);
    if (r && explain[r]) {
      (hints[r] ??= []).push({ text: s.body.slice(0, 1000), source: s.url || null, at: new Date().toISOString() });
      await done(s.id, `Queued: the explainer re-checks ${r} against its README on the next run.`);
    } else {
      const issue = await gh(`repos/${REPO}/issues`, { method: "POST", body: JSON.stringify({ title: `Fix: ${s.target || "site content"}`.slice(0, 120), labels: ["fix"], body: `Approved reader report:\n\n> ${s.body.replace(/\n/g, "\n> ")}\n\n${s.url ? `Source: ${s.url}\n\n` : ""}Target: ${s.target || "(not given)"}` }) }).catch(() => null);
      await done(s.id, issue ? `Opened issue #${issue.number} for the owner.` : "Needs a manual fix (could not open an issue).");
    }
  } else {
    await done(s.id, s.kind === "tip" ? "Published under the tool." : "Handled on the review page.");
  }
  applied++;
}
await write("data/repos.json", repos);
await write("data/hints.json", hints);

// ---- publish tips ----
const { data: tipRows } = await sb.from("submissions").select("target, body, name, created_at").eq("kind", "tip").in("status", ["approved", "applied"]).order("created_at", { ascending: false });
const tips = {};
for (const t of tipRows ?? []) {
  const key = repoFrom(t.target) || t.target?.trim();
  if (key) (tips[key] ??= []).push({ body: t.body, name: t.name, date: t.created_at });
}
await write("data/tips.json", tips);

// ---- weekly social drafts ----
if (process.env.MAKE_SOCIAL) {
  const since = new Date(Date.now() - 6 * 864e5).toISOString();
  const { count } = await sb.from("social_posts").select("id", { count: "exact", head: true }).gte("created_at", since);
  const idx = await read("data/newsletter.json", { issues: [] });
  const latest = idx.issues[0] && (await read(`data/newsletter/${idx.issues[0].date}.json`, null));
  if (!count && latest) {
    const Posts = z.object({
      reddit: z.object({ community: z.enum(["r/ClaudeAI", "r/ChatGPT", "r/LocalLLaMA", "r/artificial", "r/ArtificialInteligence"]), title: z.string(), body: z.string() }),
      linkedin: z.object({ body: z.string() }),
    });
    const posts = await askJSON({
      schema: Posts,
      system: "You write social posts for AI Compass, a free plain-English guide to AI models and tools. " +
        "Reddit: value first. Summarize the 3-4 most useful things from this week's issue in plain words so the post is worth reading on its own; mention the site once at the end as the source, no hype, no emoji, no hashtags, under 1500 characters. Pick the subreddit whose topic fits the top items best; title under 120 characters, not clickbait. " +
        "LinkedIn: 4-7 short lines for professionals, one concrete takeaway, no emoji, max 2 hashtags at the end, under 900 characters. Do not include any URL; it is added separately.",
      user: JSON.stringify({ subject: latest.subject, intro: latest.intro, sections: latest.sections.map((s) => ({ title: s.title, items: s.items.slice(0, 4).map((i) => `${i.title}: ${i.blurb}`) })) }),
    }).catch((e) => { console.warn(`[social] ${e.message}`); return null; });
    if (posts) {
      const link = `${SITE}/newsletter.html?issue=${latest.date}`;
      const { error: e2 } = await sb.from("social_posts").insert([
        { channel: "reddit", community: posts.reddit.community, title: posts.reddit.title, body: posts.reddit.body, link },
        { channel: "linkedin", body: posts.linkedin.body, link },
      ]);
      console.log(`community: social drafts ${e2 ? `failed (${e2.message})` : "created"}`);
    }
  }
}
console.log(`community: ${applied} approved submissions applied, ${Object.values(tips).flat().length} tips published`);
