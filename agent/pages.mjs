// One static page per tool, skill, mod and connector: tools/<slug>.html, plus tools/sitemap.xml.
// Find tools draws its list in the browser, so search engines saw one page instead of ~600; these pages give each
// tool its own address. They are built from the same catalog code the site runs (the "catalog" block of
// assets/site.js, run here in a sandbox), so the two can never disagree.
// The deploy job runs this; the output is not committed. Run locally: node agent/pages.mjs
import fs from "node:fs/promises";
import vm from "node:vm";

const ROOT = new URL("../", import.meta.url);
const read = (f) => fs.readFile(new URL(f, ROOT), "utf8");
const SITE = "https://whichaimap.com";

// ---------- the site's own catalog code ----------
const src = await read("assets/site.js");
const start = src.indexOf("// ===== catalog: start"), end = src.indexOf("// ===== catalog: end");
if (start < 0 || end < 0) throw new Error("catalog markers not found in assets/site.js");
const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/gu;
const esc = (s) => String(s ?? "").replace(EMOJI, "").replace(/ {2,}/g, " ").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const md = (s) => esc(s).replace(/`([^`]+)`/g, "<code>$1</code>");
const sandbox = {
  esc, icon: () => "", avatar: () => "", console,
  load: async (n) => { try { return JSON.parse(await read(`data/${n}.json`)); } catch { return null; } },
};
vm.createContext(sandbox);
const api = vm.runInContext(`${src.slice(start, end)}\n;({ catalog, slugOf, KIND, LEVEL, MOD_CAT, REACH, SURFACE })`, sandbox);
const { all, tags, pairs } = await api.catalog();
const { slugOf, KIND, LEVEL, MOD_CAT, REACH } = api;
const goals = Object.fromEntries((tags?.goals || []).map((g) => [g.id, g.label]));

// ---------- the page shell: the same head as every page, with <base> so the site's relative links work ----------
const about = await read("about.html");
const HEAD = about.slice(0, about.indexOf('<body data-page="about">'));
const TAIL = about.slice(about.indexOf("</main>"));
const head = (x, title, desc, url) => HEAD
  .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)} · Which AI Map</title>`)
  .replace(/(<meta (?:name|property)="(?:description|og:description|twitter:description)" content=")[^"]*"/g, `$1${esc(desc)}"`)
  .replace(/(<meta (?:property|name)="(?:og:title|twitter:title)" content=")[^"]*"/g, `$1${esc(title)}"`)
  .replace(/https:\/\/whichaimap\.com\/about\.html/g, url)
  .replace('<meta charset="utf-8">', '<meta charset="utf-8">\n<base href="/">');

const PLURAL = { app: "Apps", repo: "Open-source projects", skill: "Skills", mod: "Claude Code mods", mcp: "Connectors", collection: "Skill packs" };
const plainText = (s = "") => String(s).replace(/`/g, "");
const year = new Date().getUTCFullYear();
const pairOf = new Map();
for (const p of pairs || []) for (const id of [p.a, p.b]) (pairOf.get(id) || pairOf.set(id, []).get(id)).push(p);

function similar(x) {
  const named = (x.alts || []).filter((k) => k !== x.key).map((k) => all.find((y) => y.key === k)).filter(Boolean);
  const same = all.filter((y) => y !== x && y.kind === x.kind && y.tags[0] && y.tags[0] === x.tags[0] && !named.includes(y))
    .sort((a, b) => (b.kind === "app") - (a.kind === "app") || b.stars - a.stars);
  return [...named, ...same].slice(0, 6);
}

function trust(x) {
  if (x.kind === "app") return "";
  const rows = [];
  if (x.kind === "mod") {
    const r = REACH[x.reach] || REACH[2];
    rows.push([r[0], `Access: ${r[1]}`, r[2]]);
    if (x.validated && !x.official) rows.push([x.validated === "passed" ? "ok" : "warn", x.validated === "passed" ? "Passes Claude's own check" : "Check gave warnings", "From claude plugin validate, which reads the code without running it."]);
  } else if (x.scripts === true) rows.push(["warn", "Includes scripts", "It can run programs on your computer. Skim the scripts folder first."]);
  else if (x.scripts === false) rows.push(["ok", "Instructions only", "A text file the assistant reads. Nothing runs on your computer."]);
  rows.push(x.checked ? ["ok", x.official ? "Made by Anthropic" : "Checked by a person", "We read what it does before listing it."]
    : x.kind === "mod" ? ["ok", "On the community's well-known list", "Picked for the awesome-claude-code-mods catalogue; we did not test it ourselves."]
    : x.fromPack ? ["ok", "From a collection we chose by hand", "The collection is well known; this skill's own text was indexed automatically."]
    : ["warn", "Found automatically", "Not reviewed by a person yet. Check it before installing."]);
  if (x.license) rows.push(["ok", `License: ${x.license}`, "You are allowed to use it under these terms."]);
  if (x.updated) rows.push(["ok", `Last updated ${String(x.updated).slice(0, 10)}`, ""]);
  return `<h2>Before you install</h2><ul class="trust">${rows.map(([c, t, d]) => `<li class="${c}"><span><b>${esc(t)}</b>${d ? `<small>${esc(d)}</small>` : ""}</span></li>`).join("")}</ul>`;
}

function page(x) {
  const slug = slugOf(x), url = `${SITE}/tools/${slug}.html`;
  const kindName = KIND[x.kind] || "Tool";
  const cat = x.kind === "mod" ? MOD_CAT[x.cat] : goals[x.tags[0]];
  const what = plainText(x.plain || x.what || "");
  const title = x.kind === "app" ? `${x.name}: what it is, what it costs and how to start`
    : x.kind === "skill" ? `${x.name} skill: what it does and how to add it`
    : x.kind === "mod" ? `${x.name}: a Claude Code mod, what it does and how to install it`
    : `${x.name}: what it does and how to use it`;
  const desc = `${what} ${x.kind === "app" && x.price ? `Price: ${plainText(x.price)}` : "How to start, step by step, in plain English."}`.slice(0, 300);
  const link = x.link || (x.repo ? (x.path ? `https://github.com/${x.repo}/tree/HEAD/${x.path}` : `https://github.com/${x.repo}`) : null);
  const sim = similar(x), vs = pairOf.get(x.key) || [];
  const ld = {
    "@context": "https://schema.org", "@graph": [
      { "@type": "SoftwareApplication", name: x.name, description: what, url, applicationCategory: x.kind === "app" ? "AI application" : `AI ${kindName.toLowerCase()}`,
        ...(x.owner && { author: { "@type": "Organization", name: x.owner } }), ...(x.site && { sameAs: x.site }), ...(link && !x.site && { codeRepository: link }),
        ...(x.kind !== "app" && { offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } }) },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Find tools", item: `${SITE}/explore.html` },
        { "@type": "ListItem", position: 2, name: x.name, item: url }] },
    ],
  };
  return head(x, `${title}`, desc, url) + `<body data-page="tool" data-key="${esc(x.key)}">
<main id="main">
  <header class="page-head"><div class="wrap tool-page">
    <p class="crumbs"><a href="explore.html">Find tools</a> › <a href="explore.html?type=${esc(x.kind === "collection" ? "skill" : x.kind)}">${esc(PLURAL[x.kind] || "Tools")}</a>${cat ? ` › ${esc(cat)}` : ""}</p>
    <div class="hub-title" style="margin-top:0">${x.kind === "app" ? `<img class="avatar tool-logo" src="assets/favicons/${esc(x.key)}.png" alt="" width="64" height="64">` : x.repo ? `<img class="avatar tool-logo" src="https://github.com/${esc(x.repo.split("/")[0])}.png?size=128" alt="" width="64" height="64">` : ""}<h1>${esc(x.name)}</h1></div>
    <p class="muted mono" style="margin:.3rem 0 0">${esc(kindName)}${x.owner ? ` · by ${esc(x.owner)}` : ""}${x.official ? " · official" : ""}</p>
    <p class="lead" style="margin-top:1rem">${md(x.plain || x.what || "")}</p>
    <div class="row" style="margin-top:1.2rem">
      ${x.site ? `<a class="btn primary" href="${esc(x.site)}" target="_blank" rel="noopener">Open ${esc(x.name)}</a>` : ""}
      ${link ? `<a class="btn${x.site ? "" : " primary"}" href="${esc(link)}" target="_blank" rel="noopener">${x.kind === "app" ? "Source" : "Get it"}</a>` : ""}
      <span id="toolVote"></span>
    </div>
    <p class="tool-facts">${x.level && LEVEL[x.level] ? `<span>${esc(LEVEL[x.level][0])}</span>` : ""}${x.stars >= 1000 ? `<span>${x.stars >= 50000 ? "Very popular" : x.stars >= 10000 ? "Popular" : "Well known"}</span>` : ""}${x.installs ? `<span>${x.kind === "skill" ? `Installed ${x.installs.toLocaleString("en")} times` : `${x.installs.toLocaleString("en")} installs a month`}</span>` : ""}${x.price ? `<span>${x.free ? "Free plan" : "Paid"}</span>` : ""}</p>
  </div></header>

  <section><div class="wrap article">
    ${x.price ? `<h2>What it costs</h2><p>${esc(x.price)}</p>` : x.kind !== "app" ? `<h2>What it costs</h2><p>Free and open source${x.kind === "repo" ? "; you may pay for the AI model it uses" : ""}.</p>` : ""}
    ${x.useFor?.length ? `<h2>Use it to</h2><ul class="vs-list">${x.useFor.map((u) => `<li>${md(u)}</li>`).join("")}</ul>` : ""}
    ${x.steps?.length ? `<h2>How to start</h2><ol class="steps">${x.steps.map((s) => `<li><p>${md(s)}</p></li>`).join("")}</ol>` : ""}
    ${x.caution ? `<div class="callout" style="margin-top:1.6rem"><div><b>Good to know.</b> ${md(x.caution)}</div></div>` : ""}
    ${trust(x)}
    ${x.why ? `<h2>More detail</h2><p>${md(x.what || "")}</p><p>${md(x.why)}</p>` : ""}
    ${vs.length ? `<h2>Compare</h2><div class="chips">${vs.map((p) => `<a class="chip" href="${p.a}-vs-${p.b}.html">${esc((all.find((y) => y.key === p.a)?.name || p.a).replace(/\s*\(.*\)$/, ""))} vs ${esc((all.find((y) => y.key === p.b)?.name || p.b).replace(/\s*\(.*\)$/, ""))}</a>`).join("")}</div>` : ""}
    ${sim.length ? `<h2>Similar tools</h2><div class="chips">${sim.map((y) => `<a class="chip" href="tools/${slugOf(y)}.html">${esc(y.name)}</a>`).join("")}</div>` : ""}
    <p class="muted" style="margin-top:2.4rem;font-size:.86rem">Descriptions are written in plain English from each project's own documentation and refreshed by our agent${x.checkedAt ? `; this one was last checked ${x.checkedAt}` : ""}. <a href="contribute.html?kind=fix&target=${encodeURIComponent(x.key)}">Spotted a mistake?</a> · <a href="explore.html#${esc(x.key)}">Open in Find tools</a> · © ${year} Which AI Map</p>
  </div></section>
  <script type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>
` + TAIL;
}

await fs.mkdir(new URL("tools/", ROOT), { recursive: true });
const seen = new Set();
let n = 0;
for (const x of all) {
  const slug = slugOf(x);
  if (seen.has(slug)) continue;
  seen.add(slug);
  await fs.writeFile(new URL(`tools/${slug}.html`, ROOT), page(x));
  n++;
}
const urls = [...seen].map((s) => `  <url><loc>${SITE}/tools/${s}.html</loc><changefreq>weekly</changefreq></url>`).join("\n");
await fs.writeFile(new URL("tools/sitemap.xml", ROOT), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
console.log(`pages: ${n} tool pages and tools/sitemap.xml`);

// ---------- one RSS feed per news hub (feed-claude.xml ...), with the same story filter the hub pages use ----------
const h0 = src.indexOf("const HUBS = {"), h1 = src.indexOf("\n", src.indexOf("const hubOf ="));
const { HUBS, hubOf } = vm.runInContext(`${src.slice(h0, h1)}\n;({ HUBS, hubOf })`, vm.createContext({}));
const news = JSON.parse(await read("data/news.json")).items || [];
for (const [id, h] of Object.entries(HUBS)) {
  const seenT = new Set(), items = news.filter((x) => x.audience !== "dev" && hubOf(x).includes(id) && !seenT.has(x.title.toLowerCase()) && seenT.add(x.title.toLowerCase())).slice(0, 40);
  await fs.writeFile(new URL(`feed-${id}.xml`, ROOT), `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
<title>${esc(h.name)} news · Which AI Map</title><link>${SITE}/${h.file}</link>
<description>What changed in ${esc(h.name)}, in plain English.</description>
${items.map((x) => `<item><title>${esc(x.title)}</title><link>${esc(x.url)}</link><guid>${esc(x.url)}</guid><pubDate>${new Date(x.date).toUTCString()}</pubDate><source url="${SITE}/${h.file}">${esc(x.source)}</source><description>${esc(x.summary || "")}</description></item>`).join("\n")}
</channel></rss>
`);
}
console.log(`feeds: ${Object.keys(HUBS).map((k) => `feed-${k}.xml`).join(", ")}`);