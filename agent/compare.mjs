// Builds one static page per "X vs Y" comparison (real HTML, so search engines and link previews see the content)
// plus compare.html, the index. Facts come from data/apps.json; only the verdict and "choose it if" lines are hand-written
// in data/compare.json. Run: node agent/compare.mjs   (the deploy job runs it too, so prices never drift from apps.json)
import fs from "node:fs";

const ROOT = new URL("../", import.meta.url);
const read = (f) => fs.readFileSync(new URL(f, ROOT), "utf8");
const json = (f) => JSON.parse(read(f));
const SITE = "https://whichaimap.com";
const esc = (s = "") => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

const apps = Object.fromEntries(json("data/apps.json").map((a) => [a.id, a]));
const pairs = json("data/compare.json").filter((p) => apps[p.a] && apps[p.b]);
const models = json("data/models.json"), bench = json("data/benchmarks.json");
const levels = Object.fromEntries(json("data/tags.json").levels.map((l) => [l.id, l.label]));
const ver = read("index.html").match(/site\.css\?v=(\d+)/)?.[1] ?? "1";
const short = (a) => a.name.replace(/\s*\(.*\)$/, ""); // "Canva (Magic Studio / Canva AI)" -> "Canva"
const slug = (p) => `${p.a}-vs-${p.b}`;

// chat assistants: the best model of that company we have an independent overall score for
const MAKER = { chatgpt: "openai", claude: "anthropic", gemini: "google" };
const byId = Object.fromEntries(models.models.map((m) => [m.id, m]));
const topModel = (appId) => {
  const p = MAKER[appId];
  if (!p) return null;
  return Object.entries(bench.scores).filter(([id, s]) => byId[id]?.p === p && s.aa).map(([id, s]) => ({ name: byId[id].name, v: Math.round(s.aa.v) })).sort((x, y) => y.v - x.v)[0] ?? null;
};

const head = (title, desc, file) => `<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} · Which AI Map</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${SITE}/${file}">
<meta name="theme-color" content="#0a0e17">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Which AI Map">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${SITE}/${file}">
<meta property="og:image" content="${SITE}/assets/og.png">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${SITE}/assets/og.png">
<link rel="icon" href="assets/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/site.css?v=${ver}">
<script>try{document.documentElement.dataset.theme=localStorage.getItem("theme")||"dark"}catch(e){}</script>
</head>
<body data-page="compare">
<main id="main">
`;
const foot = `</main>
<script src="assets/site.js?v=${ver}" defer></script>
</body>
</html>
`;

const pic = (a, size) => `<img class="avatar" src="assets/favicons/${esc(a.id)}.png" alt="" width="${size}" height="${size}" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'avatar letter',textContent:'${esc(a.name[0])}'}))">`;

const side = (a) => `<article class="card vs-card">
      <div class="vs-head">${pic(a, 52)}<div><h2>${esc(short(a))}</h2><small class="muted mono">by ${esc(a.by)}</small></div></div>
      <p class="vs-plain">${esc(a.plain)}</p>
      <h3>People use it to</h3>
      <ul class="vs-list">${a.useFor.map((u) => `<li>${esc(u)}</li>`).join("")}</ul>
      <h3>What it costs</h3>
      <p>${esc(a.price)}</p>
      ${a.caution ? `<h3>Good to know</h3><p>${esc(a.caution)}</p>` : ""}
      <div class="row vs-actions"><a class="btn primary" href="${esc(a.site)}" target="_blank" rel="noopener"><i data-i="external"></i>Open ${esc(short(a))}</a><a class="btn" href="explore.html#${esc(a.id)}">How to start</a></div>
    </article>`;

const row = (label, x, y) => `<div class="vs-row"><dt>${esc(label)}</dt><dd>${x}</dd><dd>${y}</dd></div>`;

function pairPage(p) {
  const a = apps[p.a], b = apps[p.b], A = short(a), B = short(b);
  const ta = topModel(a.id), tb = topModel(b.id);
  const others = pairs.filter((q) => q !== p && [q.a, q.b].some((id) => id === p.a || id === p.b));
  return head(`${A} vs ${B}: which should you use?`, p.verdict, `${slug(p)}.html`) + `  <header class="page-head"><div class="wrap">
    <div class="kicker"><a href="compare.html">Compare</a></div>
    <h1>${esc(A)} vs ${esc(B)}</h1>
    <p class="lead"><b>The short answer.</b> ${esc(p.verdict)}</p>
  </div></header>

  <section><div class="wrap">
    <div class="kicker">Which one should you pick?</div>
    <div class="vs-grid">
      <div class="card vs-pick"><h2>Choose ${esc(A)} if</h2><ul class="vs-list">${p.pickA.map((t) => `<li>${esc(t)}</li>`).join("")}</ul></div>
      <div class="card vs-pick"><h2>Choose ${esc(B)} if</h2><ul class="vs-list">${p.pickB.map((t) => `<li>${esc(t)}</li>`).join("")}</ul></div>
    </div>
    ${p.both ? `<p class="muted vs-both">${esc(p.both)}</p>` : ""}
  </div></section>

  <section><div class="wrap">
    <div class="kicker">Side by side</div>
    <dl class="vs-table">
      <div class="vs-row vs-names"><dt></dt><dd>${esc(A)}</dd><dd>${esc(B)}</dd></div>
      ${row("Free plan", a.free ? "Yes" : "No", b.free ? "Yes" : "No")}
      ${row("Price", esc(a.price), esc(b.price))}
      ${row("Skill needed", esc(levels[a.level] || "No coding"), esc(levels[b.level] || "No coding"))}
      ${ta && tb ? row("Overall test score of its best model", `<b>${ta.v}</b> · ${esc(ta.name)}`, `<b>${tb.v}</b> · ${esc(tb.name)}`) : ""}
      ${row("Made by", esc(a.by), esc(b.by))}
    </dl>
    ${ta && tb ? `<p class="muted" style="font-size:.85rem;margin-top:.8rem">Test score: Artificial Analysis Intelligence Index, out of 100, checked ${esc(bench.updated)}. Small gaps do not matter in daily use. <a href="benchmarks.html">All test scores</a></p>` : ""}
  </div></section>

  <section><div class="wrap">
    <div class="kicker">The details</div>
    <div class="vs-grid">
    ${side(a)}
    ${side(b)}
    </div>
    <p class="muted" style="font-size:.85rem;margin-top:1rem">Prices as listed by each company when we last checked; they change often and can differ by country. <a href="contribute.html?kind=fix">Spotted something wrong?</a></p>
  </div></section>

  <section><div class="wrap">
    <div class="kicker">More comparisons</div>
    <div class="chips">${others.map((q) => `<a class="chip" href="${slug(q)}.html">${esc(short(apps[q.a]))} vs ${esc(short(apps[q.b]))}</a>`).join("")}<a class="chip" href="compare.html">All comparisons</a></div>
  </div></section>
` + foot;
}

const index = head("Compare AI tools", "ChatGPT vs Claude, Lovable vs Bolt, Zapier vs Make and more: short, honest comparisons of popular AI tools in plain English.", "compare.html") + `  <header class="page-head"><div class="wrap">
    <div class="kicker">Compare</div>
    <h1>Which one should you use?</h1>
    <p class="lead">Short, honest comparisons of the tools people ask about most. Each one starts with the answer, then shows the prices and what each tool is good at.</p>
  </div></header>

  <section><div class="wrap">
    <div class="grid vs-index">
${pairs.map((p) => { const a = apps[p.a], b = apps[p.b]; return `      <a class="card link vs-link" href="${slug(p)}.html"><span class="vs-icons">${pic(a, 40)}${pic(b, 40)}</span><h2>${esc(short(a))} vs ${esc(short(b))}</h2><p>${esc(p.verdict)}</p></a>`; }).join("\n")}
    </div>
    <p class="muted" style="margin-top:1.4rem">Want a comparison that is not here? <a href="contribute.html">Tell us which one</a>.</p>
  </div></section>
` + foot;

for (const p of pairs) fs.writeFileSync(new URL(`${slug(p)}.html`, ROOT), pairPage(p));
fs.writeFileSync(new URL("compare.html", ROOT), index);

// keep the sitemap in step with the pages we generate
const files = ["compare.html", ...pairs.map((p) => `${slug(p)}.html`)];
let map = read("sitemap.xml").replace(/\s*<url><loc>[^<]*(?:-vs-[^<]*|\/compare)\.html<\/loc>.*?<\/url>/g, "");
map = map.replace("</urlset>", files.map((f) => `  <url><loc>${SITE}/${f}</loc><changefreq>weekly</changefreq></url>`).join("\n") + "\n</urlset>");
fs.writeFileSync(new URL("sitemap.xml", ROOT), map);
console.log(`compare: ${pairs.length} pages + index`);
