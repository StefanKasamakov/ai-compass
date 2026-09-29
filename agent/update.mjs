// The AI Compass agent. Runs in GitHub Actions every few hours:
//   1. GitHub stats (stars, weekly growth, latest release) for every tracked repo
//   2. Trending new repos (MCP servers, skills, Claude Code tools)
//   3. News from official blogs + Hacker News, summarized by AI (GEMINI_API_KEY or ANTHROPIC_API_KEY)
//   4. Repo explainer: plain-English "what is this repo for" for curated, trending and requested repos
//   5. Downloads: npm + PyPI installs in the last 30 days, for repos whose package verifiably points back to them
//   6. Votes (👍 on "Vote:" issues) -> tool leaderboard + people leaderboard
// Everything lands in data/*.json; the site reads those files.
import fs from "node:fs/promises";
import { z } from "zod";
import { askJSON, provider } from "./llm.mjs";

const ROOT = new URL("../", import.meta.url);
const read = (f, fallback) => fs.readFile(new URL(f, ROOT), "utf8").then(JSON.parse, () => fallback);
const write = (f, d) => fs.writeFile(new URL(f, ROOT), JSON.stringify(d, null, 1) + "\n");
const REPO = process.env.GITHUB_REPOSITORY || "StefanKasamakov/ai-compass";
const TOKEN = process.env.GITHUB_TOKEN;
const NOW = new Date();
const day = (d) => d.toISOString().slice(0, 10);
const daysAgo = (n) => new Date(NOW - n * 864e5);
const UA = { "user-agent": "ai-compass-agent (+https://github.com/" + REPO + ")" };

async function gh(path, opts = {}) {
  const r = await fetch(`https://api.github.com/${path}`, {
    ...opts,
    headers: { accept: "application/vnd.github+json", ...UA, ...(TOKEN && { authorization: `Bearer ${TOKEN}` }), ...opts.headers },
  });
  if (!r.ok) throw new Error(`GitHub ${r.status} ${path}`);
  return r.status === 204 ? null : r.json();
}
async function ghAll(path) {
  const out = [];
  for (let page = 1; page < 20; page++) {
    const batch = await gh(`${path}${path.includes("?") ? "&" : "?"}per_page=100&page=${page}`);
    out.push(...batch);
    if (batch.length < 100) break;
  }
  return out;
}
const text = (url) => fetch(url, { headers: UA, redirect: "follow" }).then((r) => (r.ok ? r.text() : Promise.reject(new Error(`${r.status} ${url}`))));
const safe = async (label, fn, fallback) => {
  try { return await fn(); } catch (e) { console.warn(`[${label}] ${e.message}`); return fallback; }
};

// ---------- 1. GitHub stats ----------
async function githubStats(repos, withReleases) {
  const history = await read("data/history.json", {});
  const prev = await read("data/github.json", { repos: {} });
  const out = {};
  for (const repo of repos) {
    const r = await safe(repo, () => gh(`repos/${repo}`));
    if (!r) { if (prev.repos[repo]) out[repo] = prev.repos[repo]; continue; }
    const rel = withReleases.has(repo) ? await gh(`repos/${repo}/releases/latest`).catch(() => null) : null;
    const h = (history[repo] ??= {});
    h[day(NOW)] = r.stargazers_count;
    for (const d of Object.keys(h)) if (d < day(daysAgo(35))) delete h[d];
    const weekAgo = Object.keys(h).filter((d) => d <= day(daysAgo(7))).sort().pop();
    out[repo] = {
      stars: r.stargazers_count,
      week: weekAgo ? r.stargazers_count - h[weekAgo] : null,
      pushed: r.pushed_at,
      desc: r.description,
      archived: r.archived,
      release: rel && { tag: rel.tag_name, date: rel.published_at, url: rel.html_url },
    };
  }
  await write("data/history.json", history);
  return out;
}

// ---------- 2. Trending new repos ----------
// Candidates come from three places, then one AI call keeps only the AI-related ones:
//   GitHub topic search (new repos), GitHub Trending (daily + weekly), and Show HN posts that link a repo.
const TOPICS = ["mcp-server", "mcp", "claude-skills", "agent-skills", "claude-code", "codex", "ai-agents", "llm", "rag", "local-llm", "ai-coding", "llm-inference"];
const AI_WORDS = /\b(ai|llm|gpt|claude|gemini|agent|mcp|rag|model|inference|prompt|embedding|codex|copilot|diffusion|whisper|tts|ollama)\b/i;
const Relevance = z.object({ items: z.array(z.object({ repo: z.string(), relevant: z.boolean() })) });

async function trending(tracked) {
  const since = day(daysAgo(30));
  const found = new Map();
  const add = (r, source, extra = {}) => {
    if (!r || tracked.has(r.full_name) || r.fork || r.archived) return;
    const cur = found.get(r.full_name);
    found.set(r.full_name, { repo: r.full_name, stars: r.stargazers_count, desc: r.description, created: r.created_at, topics: r.topics?.slice(0, 4) ?? [], lang: r.language, sources: [...new Set([...(cur?.sources ?? []), source])], ...cur?.extra, ...extra });
  };
  for (const t of TOPICS) {
    const res = await safe(t, () => gh(`search/repositories?q=${encodeURIComponent(`topic:${t} created:>${since}`)}&sort=stars&order=desc&per_page=12`), { items: [] });
    res.items.filter((r) => r.stargazers_count >= 40).forEach((r) => add(r, "new on GitHub"));
  }
  for (const range of ["daily", "weekly"]) {
    const html = await safe(`trending ${range}`, () => text(`https://github.com/trending?since=${range}`), "");
    const names = [...new Set([...html.matchAll(/href="\/([\w.-]+\/[\w.-]+)\/stargazers"/g)].map((m) => m[1]))];
    for (const n of names.filter((n) => !found.has(n) && !tracked.has(n))) add(await gh(`repos/${n}`).catch(() => null), `GitHub Trending (${range})`);
  }
  const hn = await safe("Show HN", async () => (await fetch(`https://hn.algolia.com/api/v1/search?tags=show_hn&numericFilters=${encodeURIComponent(`points>60,created_at_i>${Math.floor(daysAgo(10) / 1000)}`)}&hitsPerPage=60`)).json(), { hits: [] });
  for (const h of hn.hits) {
    const n = repoFrom(h.url || "");
    if (!n || !/github\.com/.test(h.url || "")) continue;
    add(await gh(`repos/${n}`).catch(() => null), "Show HN", { hn: { points: h.points, url: `https://news.ycombinator.com/item?id=${h.objectID}` } });
  }

  let items = [...found.values()];
  const verdict = await safe("AI relevance", () => askJSON({
    schema: Relevance,
    system: "You filter GitHub repos for AI Compass, a guide to AI models, agents, MCP servers, skills, AI coding tools, local LLMs, RAG and AI media tools. relevant = true only if the repo's main purpose is AI/LLM tooling that such a reader would use or want to know about. General dev tools, games, dotfiles, tutorials, spam and link lists are not relevant.",
    user: JSON.stringify(items.map(({ repo, desc, topics }) => ({ repo, desc, topics }))),
  }), null);
  items = verdict ? items.filter((i) => verdict.items.find((v) => v.repo === i.repo)?.relevant) : items.filter((i) => AI_WORDS.test(`${i.desc} ${i.topics.join(" ")}`));
  const score = (i) => i.stars + (i.hn?.points ?? 0) * 5 + (i.sources.length - 1) * 500;
  return items.sort((a, b) => score(b) - score(a)).slice(0, 20);
}

// ---------- 3. News ----------
const FEEDS = [
  { source: "OpenAI", url: "https://openai.com/news/rss.xml" },
  { source: "Google", url: "https://blog.google/technology/ai/rss/" },
  { source: "DeepMind", url: "https://deepmind.google/blog/rss.xml" },
  { source: "Simon Willison", url: "https://simonwillison.net/atom/everything/", filter: true },
  { source: "Hugging Face", url: "https://huggingface.co/blog/feed.xml" },
  { source: "GitHub", url: "https://github.blog/changelog/feed/", filter: true },
  { source: "Latent Space", url: "https://www.latent.space/feed" },
  { source: "LangChain", url: "https://blog.langchain.com/rss/", filter: true },
];
const RELEVANT = /claude|anthropic|gpt|openai|chatgpt|codex|gemini|mcp|model context protocol|agent|skill|llm|model/i;
const decode = (s) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#x?27;|&#39;|&apos;/g, "'").replace(/&#8217;/g, "’").replace(/&amp;/g, "&");
// feeds often HTML-escape their HTML, so decode and strip tags twice
const unxml = (s = "") => decode(decode(s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")).replace(/<[^>]+>/g, " ")).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const tag = (block, name) => block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`))?.[1];

const isoOr = (s) => { const d = new Date(s); return isNaN(d) ? NOW.toISOString() : d.toISOString(); };

function parseFeed(xml, source) {
  const blocks = xml.match(/<(item|entry)[\s>][\s\S]*?<\/\1>/g) ?? [];
  return blocks.map((b) => ({
    source,
    title: unxml(tag(b, "title")),
    url: unxml(tag(b, "link")) || b.match(/<link[^>]*href="([^"]+)"/)?.[1],
    date: isoOr(unxml(tag(b, "pubDate") || tag(b, "published") || tag(b, "updated"))),
    snippet: unxml(tag(b, "description") || tag(b, "summary") || tag(b, "content")).slice(0, 400),
  }));
}

async function anthropicNews(known) {
  const html = await text("https://www.anthropic.com/news");
  const slugs = [...new Set([...html.matchAll(/href="\/news\/([a-z0-9-]+)"/g)].map((m) => m[1]))].slice(0, 12);
  const items = [];
  for (const slug of slugs) {
    const url = `https://www.anthropic.com/news/${slug}`;
    if (known.has(url)) continue;
    const page = await safe(url, () => text(url));
    if (!page) continue;
    const date = page.match(/"datePublished":"([^"]+)"/)?.[1];
    if (!date) continue;
    items.push({
      source: "Anthropic", url, date,
      title: unxml(page.match(/<title>([^<]*)<\/title>/)?.[1]).replace(/\s*\\\s*Anthropic$/, ""),
      snippet: unxml(page.match(/<meta name="description" content="([^"]*)"/)?.[1]).slice(0, 400),
    });
  }
  return items;
}

async function hackerNews() {
  const since = Math.floor(daysAgo(10) / 1000);
  const out = [];
  for (const q of ["MCP", "Claude", "Claude Code", "Codex", "Gemini", "agent skills", "GPT-6"]) {
    const res = await safe(`HN ${q}`, async () => (await fetch(`https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(q)}&tags=story&numericFilters=created_at_i>${since},points>150`)).json(), { hits: [] });
    for (const h of res.hits) out.push({ source: "Hacker News", title: h.title, url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`, date: h.created_at, snippet: `${h.points} points, ${h.num_comments} comments`, discuss: `https://news.ycombinator.com/item?id=${h.objectID}` });
  }
  return out;
}

function releaseNews(stats, tools) {
  return tools.filter((t) => t.type === "client").flatMap((t) => {
    const rel = stats[t.repo]?.release;
    if (!rel || new Date(rel.date) < daysAgo(14)) return [];
    return [{ source: "GitHub release", title: `${t.name} ${rel.tag}`, url: rel.url, date: rel.date, snippet: `New release of ${t.name}.` }];
  });
}

const NewsNotes = z.object({
  items: z.array(z.object({
    id: z.number(),
    relevant: z.boolean(),
    summary: z.string(),
    tags: z.array(z.enum(["models", "mcp", "skills", "agents", "coding", "research", "product", "safety", "business"])),
    big: z.boolean(),
  })),
});

async function summarize(items) {
  if (!items.length) return null;
  const list = items.map((it, id) => ({ id, source: it.source, title: it.title, snippet: it.snippet }));
  const res = await askJSON({
    schema: NewsNotes,
    system:
      "You curate news for AI Compass, a site that helps non-experts understand AI models, MCP servers, agent skills and AI coding tools. " +
      "For each item: relevant = true only if it matters to people choosing or using AI models/tools (new models, pricing, MCP, skills, agents, coding tools, major product changes). " +
      "summary = one or two plain-English sentences saying what happened and why a regular user should care; no hype, no marketing words. " +
      "big = true only for major launches (new frontier model, big price change, protocol release).",
    user: JSON.stringify(list),
  });
  return res?.items ?? null;
}

async function news(stats, tools) {
  const prev = await read("data/news.json", { items: [] });
  const known = new Set(prev.items.map((i) => i.url));
  const fresh = [
    ...(await Promise.all(FEEDS.map((f) => safe(f.source, async () => parseFeed(await text(f.url), f.source).filter((i) => !f.filter || RELEVANT.test(i.title + " " + i.snippet)), [])))).flat(),
    ...(await safe("Anthropic", () => anthropicNews(known), [])),
    ...(await hackerNews()),
    ...releaseNews(stats, tools),
  ].filter((i) => i.url && i.title && !known.has(i.url) && new Date(i.date) > daysAgo(21));
  const unique = [...new Map(fresh.map((i) => [i.url, i])).values()];

  const notes = await safe("AI summaries", () => summarize(unique), null);
  const added = unique.flatMap((it, i) => {
    const n = notes?.find((x) => x.id === i);
    if (n && !n.relevant) return [];
    if (!n && !RELEVANT.test(it.title + " " + it.snippet)) return [];
    const { snippet, ...rest } = it;
    return [{ ...rest, summary: n?.summary ?? snippet, tags: n?.tags ?? [], big: n?.big ?? false, ai: !!n }];
  });
  const items = [...added, ...prev.items].filter((i) => new Date(i.date) > daysAgo(45)).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 80);
  console.log(`news: +${added.length} (${notes ? `summarized by ${provider}` : "no AI summaries"})`);
  return items;
}

// ---------- 4. Repo explainer ----------
const LEVELS = ["beginner", "intermediate", "advanced"];
const MAX_EXPLAIN_PER_RUN = +process.env.EXPLAIN_LIMIT || 12; // raise for a one-off backfill
const SITE = `https://${REPO.split("/")[0].toLowerCase()}.github.io/${REPO.split("/")[1]}`;
const repoFrom = (text = "") => text.match(/github\.com\/([\w.-]+\/[\w.-]+)/)?.[1]?.replace(/\.git$/, "") ?? text.match(/\b([\w.-]+\/[\w.-]+)\b/)?.[1];

async function explainRepos(trendingItems) {
  const { categories, repos: seeds } = await read("data/repos.json", { categories: [], repos: [] });
  const known = await read("data/explain.json", {});
  const Explanation = z.object({
    cat: z.enum(categories.map((c) => c.id)), kind: z.string(), what: z.string(), why: z.string(),
    level: z.enum(LEVELS), start: z.string(), caution: z.string(), alts: z.array(z.string()),
    packages: z.array(z.string()),
  });

  // what needs explaining: reader requests first, then curated seeds, then this month's trending repos
  const requests = TOKEN ? await safe("explain requests", () => ghAll(`repos/${REPO}/issues?labels=explain&state=open`), []) : [];
  const queue = [
    ...requests.map((i) => ({ repo: repoFrom(`${i.title} ${i.body}`), issue: i.number, by: i.user?.login })),
    ...seeds.map((repo) => ({ repo, source: "curated" })),
    ...trendingItems.map((t) => ({ repo: t.repo, source: "trending" })),
  ].filter((q) => q.repo && (q.issue || !known[q.repo]));
  const reply = (n, body) => gh(`repos/${REPO}/issues/${n}/comments`, { method: "POST", body: JSON.stringify({ body }) })
    .then(() => gh(`repos/${REPO}/issues/${n}`, { method: "PATCH", body: JSON.stringify({ state: "closed" }) }));

  let done = 0;
  for (const q of queue) {
    if (done >= MAX_EXPLAIN_PER_RUN || !provider) break;
    if (q.issue && known[q.repo]) { await safe("reply", () => reply(q.issue, `Already explained: ${SITE}/explore.html#${q.repo}`)); continue; }
    const meta = await gh(`repos/${q.repo}`).catch(() => null);
    if (!meta) { if (q.issue) await safe("reply", () => reply(q.issue, `Couldn't find \`${q.repo}\` on GitHub. Check the link and open a new request.`)); continue; }
    const readme = await gh(`repos/${meta.full_name}/readme`).then((r) => Buffer.from(r.content, "base64").toString("utf8").slice(0, 9000)).catch(() => "");
    const ex = await safe(`explain ${meta.full_name}`, () => askJSON({
      schema: Explanation,
      system:
        "You explain GitHub repositories to non-experts for AI Compass. Base every claim on the README and metadata given; never invent features. " +
        "No marketing words. If the README makes big claims, present them as the project's claims and add an honest caution. " +
        "kind: 2-4 word label. what: one sentence. why: the problem it solves and when to reach for it (1-2 sentences). " +
        "start: the first command or step from the README, or empty. caution: privacy, maturity, complexity, license or maintenance caveat (pushed_at over 4 months ago = say so), or empty. " +
        "Always add a caution when the tool reuses consumer subscription logins (Claude, ChatGPT, Gemini, Copilot apps) as an API or pools free tiers: that may break the provider's terms and risk the account. Mention affiliate links if present. " +
        "packages: npm or PyPI package names the README tells people to install (e.g. from npx, npm i, pip install, uvx), or empty. " +
        "alts: up to 3 related repos as owner/name, preferring ones in this list: " + [...new Set([...seeds, ...Object.keys(known)])].join(" ") +
        "\nCategories: " + categories.map((c) => `${c.id} = ${c.name}: ${c.what}`).join(" | "),
      user: JSON.stringify({ repo: meta.full_name, description: meta.description, topics: meta.topics, license: meta.license?.spdx_id, pushed_at: meta.pushed_at, stars: meta.stargazers_count, readme }),
    }), null);
    if (!ex) continue;
    done++;
    known[meta.full_name] = { ...ex, repo: meta.full_name, at: day(NOW), source: q.issue ? "request" : q.source, ...(q.by && { by: q.by }) };
    if (q.issue) await safe("reply", () => reply(q.issue, `**${meta.full_name}**: ${ex.kind}\n\n${ex.what}\n\n**Why:** ${ex.why}${ex.caution ? `\n\n**Heads-up:** ${ex.caution}` : ""}\n\nAdded to the [Repo Explainer](${SITE}/explore.html#${meta.full_name}). +2 points for @${q.by} on the leaderboard. Thanks!`));
  }
  console.log(`explain: +${done} (${provider ?? "no AI key"}), ${Math.max(0, queue.length - done)} waiting`);
  await write("data/explain.json", known);
  return known;
}

// ---------- 5. Downloads ----------
// A package only counts if its registry entry links back to the same GitHub repo (stops look-alike names).
const ghRepoOf = (u) => String(u ?? "").match(/github\.com[/:]([\w.-]+\/[\w.-]+?)(?:\.git)?(?:[/#?]|$)/i)?.[1];
const renamed = new Map();
// true if any URL names this exact repo, following GitHub renames (e.g. ruvnet/claude-flow -> ruvnet/ruflo)
async function pointsTo(repo, ...urls) {
  for (const r of [...new Set(urls.flat().map(ghRepoOf).filter(Boolean))]) {
    if (r.toLowerCase() === repo.toLowerCase()) return true;
    if (!renamed.has(r)) renamed.set(r, await gh(`repos/${r}`).then((x) => x.full_name, () => r));
    if (renamed.get(r).toLowerCase() === repo.toLowerCase()) return true;
  }
  return false;
}
const json = (url) => fetch(url, { headers: UA }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

async function findPackages(repo, hints = []) {
  const file = (path) => gh(`repos/${repo}/contents/${path}`).then((r) => Buffer.from(r.content, "base64").toString("utf8")).catch(() => "");
  const [pkg, pyproject, setup] = await Promise.all([file("package.json"), file("pyproject.toml"), file("setup.py")]);
  const npmName = (() => { try { const j = JSON.parse(pkg); return j.private ? null : j.name; } catch { return null; } })();
  const pyName = pyproject.match(/^\[project\][\s\S]*?^name\s*=\s*["']([^"']+)/m)?.[1] ?? setup.match(/name\s*=\s*["']([^"']+)/)?.[1];
  const base = repo.split("/")[1].toLowerCase();
  const clean = (n) => n?.trim().replace(/@latest$|\[.*\]$/g, "");
  const npmCands = [...new Set([npmName, ...hints, base].map(clean).filter(Boolean))];
  const pyCands = [...new Set([pyName, ...hints, base].map(clean).filter((n) => n && !n.startsWith("@")))];
  const out = { npm: [], pypi: [] };
  for (const n of npmCands) {
    const j = await json(`https://registry.npmjs.org/${n.replace("/", "%2F")}`);
    if (j && (await pointsTo(repo, j.repository?.url, j.homepage, j.bugs?.url))) out.npm.push(n);
  }
  for (const n of pyCands) {
    const j = await json(`https://pypi.org/pypi/${n}/json`);
    if (j && (await pointsTo(repo, j.info?.home_page, Object.values(j.info?.project_urls ?? {})))) out.pypi.push(n);
  }
  return out;
}

// pypistats.org rate-limits hard: retry with backoff, return null (not 0) when it still refuses
async function pypiMonth(pkg) {
  for (let i = 0; i < 4; i++) {
    const r = await fetch(`https://pypistats.org/api/packages/${pkg.toLowerCase()}/recent`, { headers: UA }).catch(() => null);
    if (r?.ok) return (await r.json())?.data?.last_month ?? 0;
    if (r && r.status === 404) return 0;
    await pause(4000 * 2 ** i);
  }
  return null;
}

async function downloads(repos, explained) {
  const known = await read("data/packages.json", {});
  const prev = (await read("data/downloads.json", { repos: {} })).repos;
  const out = {};
  for (const repo of repos) {
    if (!known[repo] || known[repo].at < day(daysAgo(30))) {
      const e = explained[repo];
      const fromStart = [...(e?.start ?? "").matchAll(/(?:npx(?: -y)?|npm (?:i|install)(?: -g)?|pnpm add|bun add|pip install(?: -U)?|uvx|pipx install)\s+([@\w./-]+)/g)].map((m) => m[1]);
      known[repo] = { ...(await safe(`packages ${repo}`, () => findPackages(repo, [...(e?.packages ?? []), ...fromStart]), { npm: [], pypi: [] })), at: day(NOW) };
    }
    const { npm, pypi } = known[repo];
    if (!npm.length && !pypi.length) continue;
    // one package per registry (the biggest), so sub-packages of the same project aren't double-counted
    const n = Math.max(0, ...(await Promise.all(npm.map((p) => json(`https://api.npmjs.org/downloads/point/last-month/${p}`).then((j) => j?.downloads ?? 0)))));
    let py = 0;
    for (const p of pypi) {
      const m = await pypiMonth(p);
      py = Math.max(py, m ?? prev[repo]?.pypi ?? 0); // keep last known value if the API refused
      await pause(1200);
    }
    if (n + py > 0) out[repo] = { npm: n, pypi: py, total: n + py, packages: [...npm.map((p) => `npm:${p}`), ...pypi.map((p) => `pypi:${p}`)] };
  }
  await write("data/packages.json", known);
  console.log(`downloads: ${Object.keys(out).length} repos with npm/PyPI packages`);
  return out;
}

// ---------- 6. Votes & leaderboard ----------
async function ensureLabels() {
  const have = new Set((await ghAll(`repos/${REPO}/labels`)).map((l) => l.name));
  for (const [name, color, description] of [["vote", "22c55e", "One issue per tool. React 👍 to vote."], ["submission", "3b82f6", "Suggest a tool for AI Compass"], ["accepted", "a855f7", "Submission accepted: +10 points"], ["explain", "f59e0b", "Ask the agent to explain a repo: +2 points"]])
    if (!have.has(name)) await gh(`repos/${REPO}/labels`, { method: "POST", body: JSON.stringify({ name, color, description }) });
}

async function leaderboard(tools, explained) {
  const votable = tools.filter((t) => t.type !== "client");
  const issues = await read("data/votes.json", {});
  if (process.env.CREATE_VOTE_ISSUES && TOKEN) {
    await ensureLabels();
    for (const t of votable.filter((t) => !issues[t.id])) {
      const link = t.path ? `https://github.com/${t.repo}/tree/main/${t.path}` : `https://github.com/${t.repo}`;
      const issue = await gh(`repos/${REPO}/issues`, {
        method: "POST",
        body: JSON.stringify({ title: `Vote: ${t.name}`, labels: ["vote"], body: `**${t.name}** (${t.type}) by ${t.by}\n\n${t.d}\n\n${link}\n\n👍 **React with a thumbs-up to vote** if you use it. Votes show up on the [AI Compass leaderboard](https://${REPO.split("/")[0].toLowerCase()}.github.io/${REPO.split("/")[1]}/leaderboard.html) within a few hours.` }),
      });
      issues[t.id] = issue.number;
    }
    await write("data/votes.json", issues);
  }

  const people = new Map();
  const person = (u) => {
    if (!u || u.type === "Bot" || u.login.endsWith("[bot]")) return null;
    if (!people.has(u.login)) people.set(u.login, { login: u.login, avatar: u.avatar_url ?? `https://github.com/${u.login}.png?`, votes: 0, submissions: 0, prs: 0, requests: 0 });
    return people.get(u.login);
  };
  const toolVotes = [];
  for (const t of votable) {
    const n = issues[t.id];
    if (!n) continue;
    const reactions = await safe(`votes ${t.id}`, () => ghAll(`repos/${REPO}/issues/${n}/reactions?content=%2B1`), []);
    reactions.forEach((r) => { const p = person(r.user); if (p) p.votes++; });
    toolVotes.push({ id: t.id, votes: reactions.length, issue: n });
  }
  const accepted = await safe("submissions", () => ghAll(`repos/${REPO}/issues?labels=submission,accepted&state=all`), []);
  accepted.forEach((i) => { const p = person(i.user); if (p) p.submissions++; });
  const prs = await safe("prs", () => gh(`search/issues?q=${encodeURIComponent(`repo:${REPO} is:pr is:merged`)}&per_page=100`), { items: [] });
  prs.items.forEach((i) => { const p = person(i.user); if (p) p.prs++; });
  Object.values(explained).forEach((e) => { const p = e.by && person({ login: e.by }); if (p) p.requests++; });

  const ranked = [...people.values()].map((p) => ({ ...p, points: p.votes + p.submissions * 10 + p.prs * 5 + p.requests * 2 })).sort((a, b) => b.points - a.points).slice(0, 100);
  return { tools: toolVotes.sort((a, b) => b.votes - a.votes), people: ranked, rules: { vote: 1, submission: 10, pr: 5, request: 2 } };
}

// ---------- run ----------
const tools = await read("data/tools.json", []);
const { repos: seeds } = await read("data/repos.json", { repos: [] });
const explainedBefore = await read("data/explain.json", {});
const tracked = [...new Set([...tools.map((t) => t.repo), ...seeds, ...Object.keys(explainedBefore)].filter(Boolean))];
const stats = await githubStats(tracked, new Set(tools.filter((t) => t.type === "client").map((t) => t.repo)));
const updated = NOW.toISOString();
await write("data/github.json", { updated, repos: stats });
const trend = await trending(new Set(Object.keys(stats)));
await write("data/trending.json", { updated, items: trend });
await write("data/news.json", { updated, items: await news(stats, tools) });
const explained = await explainRepos(trend);
await write("data/downloads.json", { updated, window: "last 30 days", repos: await downloads([...new Set([...seeds, ...Object.keys(explained)])], explained) });
await write("data/leaderboard.json", { updated, ...(await leaderboard(tools, explained)) });
console.log(`done: ${Object.keys(stats).length} repos`);
