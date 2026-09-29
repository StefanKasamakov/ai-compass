// AI Compass — shared shell + page renderers. No framework, no build.
const REPO = "StefanKasamakov/ai-compass";
const GH = `https://github.com/${REPO}`;
const page = document.body.dataset.page;

// ---------- icons (Lucide, ISC license) ----------
const P = {
  compass: '<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  code: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
  pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/>',
  image: '<rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21"/>',
  video: '<path d="m16 13 5.22 3.48a.5.5 0 0 0 .78-.42V7.87a.5.5 0 0 0-.75-.43L16 10.5"/><rect x="2" y="6" width="14" height="12" rx="2"/>',
  mic: '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><path d="M12 19v3"/>',
  coins: '<circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/>',
  lock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  bot: '<path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>',
  chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  arrow: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  external: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  copy: '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
  news: '<path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/>',
  plug: '<path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"/>',
  puzzle: '<path d="M19.439 7.85c-.049.322.059.648.289.878l1.568 1.568c.47.47.706 1.087.706 1.704s-.235 1.233-.706 1.704l-1.611 1.611a.98.98 0 0 1-.837.276c-.47-.07-.802-.48-.968-.925a2.501 2.501 0 1 0-3.214 3.214c.446.166.855.497.925.968a.979.979 0 0 1-.276.837l-1.61 1.61a2.404 2.404 0 0 1-1.705.707 2.402 2.402 0 0 1-1.704-.706l-1.568-1.568a1.026 1.026 0 0 0-.877-.29c-.493.074-.84.504-1.02.968a2.5 2.5 0 1 1-3.237-3.237c.464-.18.894-.527.967-1.02a1.026 1.026 0 0 0-.289-.877l-1.568-1.568A2.402 2.402 0 0 1 1.998 12c0-.617.236-1.234.706-1.704L4.23 8.77c.24-.24.581-.353.917-.303.515.077.877.528 1.073 1.01a2.5 2.5 0 1 0 3.259-3.259c-.482-.196-.933-.558-1.01-1.073-.05-.336.062-.676.303-.917l1.525-1.525A2.402 2.402 0 0 1 12 1.998c.617 0 1.234.236 1.704.706l1.568 1.568c.23.23.556.338.877.29.493-.074.84-.504 1.02-.968a2.5 2.5 0 1 1 3.237 3.237c-.464.18-.894.527-.967 1.02Z"/>',
  github: '<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/>',
  trend: '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
  cpu: '<rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/>',
  thumb: '<path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/>',
  menu: '<line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>',
  alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
  terminal: '<polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  book: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  fork: '<circle cx="12" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><path d="M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9"/><path d="M12 12v3"/>',
  folder: '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
  zap: '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
  layout: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/>',
  music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  tag: '<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5"/>',
};
const icon = (n, label) => `<svg class="i" viewBox="0 0 24 24" ${label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"'}>${P[n] || ""}</svg>`;

// ---------- helpers ----------
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const md = (s) => esc(s).replace(/`([^`]+)`/g, "<code>$1</code>"); // inline `code` only
// external text (repo descriptions, headlines) can carry emoji; the site shows none
const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/gu;
const esc = (s) => String(s ?? "").replace(EMOJI, "").replace(/ {2,}/g, " ").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const num = (n) => (n >= 1e6 ? (n / 1e6).toFixed(1) + "M" : n >= 1e3 ? (n / 1e3).toFixed(n >= 1e4 ? 0 : 1) + "k" : String(n ?? 0));
const ago = (d) => {
  const s = (Date.now() - new Date(d)) / 1000;
  for (const [u, n] of [["y", 31536e3], ["mo", 2592e3], ["d", 86400], ["h", 3600], ["m", 60]]) if (s >= n) return `${Math.floor(s / n)}${u} ago`;
  return "just now";
};
const cache = {};
const load = (n) => (cache[n] ??= fetch(`data/${n}.json`, { cache: "no-cache" }).then((r) => (r.ok ? r.json() : null)).catch(() => null));
const store = { get: (k) => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch {} } };
const repoUrl = (t) => (t.path ? `https://github.com/${t.repo}/tree/main/${t.path}` : `https://github.com/${t.repo}`);
const price = (m) => (m.in != null ? `$${m.in} / $${m.out}` : m.price || "—");
// provider marks (assets/logos, see README there) and where a normal person uses each model
const LOGOS = { anthropic: "claude", openai: "lh-openai", google: "googlegemini", qwen: "qwen", glm: "lh-zhipu", deepseek: "deepseek", kimi: "lh-kimi", mistral: "mistralai" };
// the url goes straight into mask-image: inside a custom property it would resolve relative to site.css, not the page
const logo = (name) => (name ? `<span class="logo" style="-webkit-mask-image:url(assets/logos/${name}.svg);mask-image:url(assets/logos/${name}.svg)" aria-hidden="true"></span>` : "");
const modelLogo = (m) => `<span class="logo-badge p-${m.p}">${logo(LOGOS[m.p] || LOGOS[m.id]) || esc(m.name[0])}</span>`;
const APPS = {
  anthropic: { name: "Claude", url: "https://claude.ai", plan: "Free plan to try. Claude Pro is about $20/month for regular use." },
  openai: { name: "ChatGPT", url: "https://chatgpt.com", plan: "Free plan to try. ChatGPT Plus is about $20/month." },
  google: { name: "Gemini", url: "https://gemini.google.com", plan: "Free plan. Google AI Pro is about $20/month." },
  open: { name: "Ollama", url: "https://ollama.com", plan: "Free to download. Runs on your own computer; big models need a strong one." },
};
const API_ONLY = new Set(["haiku", "glite", "lyria", "omni"]);
const TOP_TIER = new Set(["fable", "astra"]);
const avatar = (repo, size = 40) => `<img class="avatar" src="https://github.com/${esc(repo.split("/")[0])}.png?size=${size * 2}" alt="" width="${size}" height="${size}" loading="lazy">`;
const isNew = (m) => m.released && Date.now() - new Date(m.released) < 14 * 864e5;
const newTag = (m) => (isNew(m) ? `<span class="tag ok">new</span>` : "");

// ---------- shell ----------
const NAV = [
  ["index", "Home", "./"], ["models", "Choose AI", "models.html"], ["explore", "Find tools", "explore.html"],
  ["guides", "Guides", [["mcp", "Connect apps (MCP)", "mcp.html"], ["skills", "Skills", "skills.html"], ["github", "GitHub 101", "github.html"]]],
  ["news", "News", "news.html"], ["leaderboard", "Rankings", "leaderboard.html"], ["newsletter", "Newsletter", "newsletter.html"],
];
const navLinks = () => NAV.map(([id, label, href]) => Array.isArray(href)
  ? `<details class="nav-group"${href.some(([sid]) => sid === page) ? " data-current" : ""}><summary>${label}${icon("chevron")}</summary><div class="nav-menu">${href.map(([sid, sl, sh]) => `<a href="${sh}"${sid === page ? ' aria-current="page"' : ""}>${sl}</a>`).join("")}</div></details>`
  : `<a href="${href}"${id === page ? ' aria-current="page"' : ""}>${label}</a>`).join("");
function shell() {
  document.body.insertAdjacentHTML("afterbegin", `
  <a class="sr" href="#main">Skip to content</a>
  <header class="top"><div class="wrap">
    <a class="brand" href="./">${icon("compass")}ai-compass</a>
    <nav class="nav" id="nav" aria-label="Main">${navLinks()}</nav>
    <div class="top-actions">
      <button class="icon-btn search-btn" data-open-search aria-label="Search">${icon("search")}<span>Search…</span><kbd>Ctrl K</kbd></button>
      <button class="icon-btn" id="themeBtn" aria-label="Toggle light or dark theme"></button>
      <a class="icon-btn" href="${GH}" aria-label="AI Compass on GitHub">${icon("github")}</a>
      <button class="icon-btn" id="menuBtn" aria-label="Menu" aria-expanded="false" aria-controls="nav">${icon("menu")}</button>
    </div>
  </div></header>`);
  document.body.insertAdjacentHTML("beforeend", `
  <footer class="foot"><div class="wrap">
    <div><div class="brand" style="margin-bottom:.6rem">${icon("compass")}ai-compass</div>
      <p style="max-width:44ch">A plain-English guide to AI models and tools, for people who just want to get things done. Kept fresh by an agent that checks GitHub and the official blogs every few hours.</p></div>
    <div class="row" style="align-items:start;gap:2.5rem">
      <div><div class="field-label">Contribute</div>
        <p><a href="newsletter.html">Weekly newsletter</a> · <a href="feed.xml">RSS</a><br><a href="${GH}/issues/new?template=submit-tool.yml">Suggest a tool</a><br><a href="${GH}/blob/main/data">Edit the data</a></p></div>
      <div><div class="field-label">Project</div>
        <p><a href="${GH}">Source on GitHub</a><br><a href="${GH}/actions">Agent runs</a><br><span id="footUpdated"></span></p></div>
    </div>
  </div></footer>
  <dialog class="palette" id="palette" aria-label="Search">
    <div class="in">${icon("search")}<input id="pq" placeholder="What do you want to do? Try: excel, images, private…" autocomplete="off" aria-label="Search" aria-controls="pres"><kbd>Esc</kbd></div>
    <ul id="pres" role="listbox"></ul>
  </dialog>`);

  // theme
  const setTheme = (t) => { document.documentElement.dataset.theme = t; $("#themeBtn").innerHTML = icon(t === "dark" ? "sun" : "moon"); store.set("theme", t); };
  setTheme(store.get("theme") || "dark");
  $("#themeBtn").onclick = () => setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
  document.addEventListener("click", (e) => $$(".nav-group[open]").forEach((d) => !d.contains(e.target) && d.removeAttribute("open")));
  $("#menuBtn").onclick = (e) => { const open = $("#nav").classList.toggle("open"); e.currentTarget.setAttribute("aria-expanded", open); };

  // command palette
  const dlg = $("#palette"), q = $("#pq");
  const open = () => { dlg.showModal(); q.value = ""; runSearch(""); q.focus(); };
  $$("[data-open-search]").forEach((b) => (b.onclick = open));
  document.addEventListener("keydown", (e) => {
    if ((e.key === "k" && (e.ctrlKey || e.metaKey)) || (e.key === "/" && !/INPUT|TEXTAREA/.test(document.activeElement.tagName))) { e.preventDefault(); open(); }
  });
  dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
  q.addEventListener("input", () => runSearch(q.value));
  q.addEventListener("keydown", (e) => {
    const items = $$("#pres li"); let i = items.findIndex((li) => li.getAttribute("aria-selected") === "true");
    if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); i = (i + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length; items.forEach((li, j) => li.setAttribute("aria-selected", j === i)); items[i]?.scrollIntoView({ block: "nearest" }); }
    if (e.key === "Enter") items[Math.max(i, 0)]?.querySelector("a")?.click();
  });

  load("github").then((g) => g && ($("#footUpdated").textContent = `Data refreshed ${ago(g.updated)}`));
}

async function searchIndex() {
  const [m, tools, tasks, n, ex, tags] = await Promise.all([load("models"), load("tools"), load("tasks"), load("news"), load("explain"), load("tags")]);
  const pagesList = NAV.flatMap(([id, label, href]) => (Array.isArray(href) ? href.map(([, l, h]) => [l, h]) : [[label, href]]));
  return [
    ...pagesList.map(([label, href]) => ({ t: label, sub: "Page", href, k: "page", ic: "arrow" })),
    ...(tags?.goals || []).map((g) => ({ t: `I want to: ${g.label}`, sub: g.hint, href: `explore.html?goal=${g.id}`, k: "tools", ic: g.icon })),
    ...(tasks?.tasks || []).map((t) => ({ t: `Which AI to ${t.label.toLowerCase()}`, sub: "Choose AI", href: `models.html#task=${t.id}`, k: "model", ic: t.icon })),
    { t: "What is MCP?", sub: "Guide", href: "mcp.html#what", k: "guide", ic: "book" },
    { t: "Connect an app to Claude or ChatGPT", sub: "MCP setup", href: "mcp.html#setup", k: "guide", ic: "plug" },
    { t: "What is a skill?", sub: "Guide", href: "skills.html#what", k: "guide", ic: "book" },
    { t: "Benchmarks: what each model is good at", sub: "Charts", href: "models.html#bench", k: "guide", ic: "trend" },
    { t: "Is this GitHub project safe?", sub: "Guide", href: "github.html#judge", k: "guide", ic: "shield" },
    ...(m?.models || []).map((x) => ({ t: x.name, sub: `${m.providers[x.p].name} · ${x.tier}`, href: `models.html#m-${x.id}`, k: "model", ic: "cpu" })),
    ...(tools || []).filter((x) => x.type !== "client").map((x) => ({ t: x.name, sub: x.plain || x.d, href: `explore.html#${x.id}`, k: x.type, ic: x.type === "mcp" ? "plug" : "puzzle", extra: x.d })),
    ...Object.values(ex || {}).map((x) => ({ t: x.repo.split("/")[1], sub: x.plain || x.kind, href: `explore.html#${x.repo}`, k: "tool", ic: "github", extra: `${x.repo} ${x.what} ${x.kind}` })),
    ...(n?.items || []).slice(0, 30).map((x) => ({ t: x.title, sub: x.source, href: x.url, k: "news", ic: "news" })),
  ];
}
let INDEX;
async function runSearch(q) {
  INDEX ??= await searchIndex();
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const hits = INDEX.filter((x) => words.every((w) => `${x.t} ${x.sub} ${x.extra || ""}`.toLowerCase().includes(w))).slice(0, 40);
  $("#pres").innerHTML = hits.length
    ? hits.map((x, i) => `<li role="option" aria-selected="${i === 0}"><a href="${esc(x.href)}">${icon(x.ic)}<span>${esc(x.t)} <em>${esc(x.sub)}</em></span><small>${esc(x.k)}</small></a></li>`).join("")
    : `<li class="empty" style="margin:.6rem">No matches. Try "excel", "private", "images" or "cheap".</li>`;
}

// ---------- shared components ----------
function chips(el, items, onPick, start, role = "tab") {
  el.setAttribute("role", role === "tab" ? "tablist" : "group");
  el.innerHTML = items.map(([v, label, ic]) => `<button class="chip" role="${role === "tab" ? "tab" : "button"}" data-v="${esc(v)}" ${role === "tab" ? "aria-selected" : "aria-pressed"}="${v === start}">${ic ? icon(ic) : ""}${esc(label)}</button>`).join("");
  el.onclick = (e) => {
    const b = e.target.closest(".chip"); if (!b) return;
    $$(".chip", el).forEach((c) => c.setAttribute(role === "tab" ? "aria-selected" : "aria-pressed", c === b));
    onPick(b.dataset.v);
  };
  onPick(start);
}

function starLine(stats, repo) {
  const s = stats?.repos?.[repo];
  if (!s) return "";
  return `<span class="stars">${icon("star")}${num(s.stars)}</span>${s.week > 0 ? `<span class="delta">+${num(s.week)}/wk</span>` : ""}`;
}
function voteBtn(board, id) {
  const v = board?.tools?.find((x) => x.id === id);
  if (!v) return "";
  return `<a class="btn sm vote" href="${GH}/issues/${v.issue}" target="_blank" rel="noopener" title="Vote with a thumbs-up on GitHub">${icon("thumb")}${v.votes}</a>`;
}

// Two-step picker: what do you want to do, then what matters most. One clear recommendation.
async function picker(host, startTask = "chat") {
  const [m, t] = await Promise.all([load("models"), load("tasks")]);
  const byId = Object.fromEntries(m.models.map((x) => [x.id, x]));
  let task = t.tasks.find((x) => x.id === startTask) || t.tasks[0], prio = "best";
  host.innerHTML = `<div class="step"><span class="step-n">1</span><h3>What do you want to do?</h3></div>
    ${t.groups.map((g) => `<p class="field-label">${esc(g.label)}</p><div class="goal-grid" role="group" aria-label="${esc(g.label)}">${t.tasks.filter((x) => x.group === g.id).map((x) =>
      `<button class="goal" data-task="${x.id}" aria-pressed="false">${icon(x.icon)}<span>${esc(x.label)}</span></button>`).join("")}</div>`).join("")}
    <div class="step"><span class="step-n">2</span><h3>What matters most?</h3></div>
    <div class="seg" role="group" aria-label="What matters most">${t.priorities.map((p) => `<button class="seg-b" data-prio="${p.id}" aria-pressed="false">${icon(p.icon)}<span><b>${esc(p.label)}</b><small>${esc(p.hint)}</small></span></button>`).join("")}</div>
    <div class="rec-wrap" aria-live="polite"></div>`;
  const draw = () => {
    const avail = t.priorities.filter((p) => task.picks[p.id]);
    if (!task.picks[prio]) prio = avail[0].id;
    $$(".goal", host).forEach((b) => b.setAttribute("aria-pressed", b.dataset.task === task.id));
    $$(".seg-b", host).forEach((b) => { b.setAttribute("aria-pressed", b.dataset.prio === prio); b.disabled = !task.picks[b.dataset.prio]; b.title = b.disabled ? "No good option for this yet" : ""; });
    const [[first, why], ...rest] = task.picks[prio].filter(([id]) => byId[id]);
    const x = byId[first], app = APPS[x.p];
    const cost = API_ONLY.has(x.id) ? "Mostly used by developers, pay per use." : `${app.plan}${TOP_TIER.has(x.id) ? " The very top model can need a higher plan." : ""}`;
    $(".rec-wrap", host).innerHTML = `<article class="rec p-${x.p}">
      <div class="rec-head">${modelLogo(x)}<div><p class="field-label" style="margin:0">Our pick</p><h3>${esc(x.name)} ${newTag(x)}</h3><small class="muted">by ${esc(m.providers[x.p].name)}</small></div></div>
      <p class="rec-why">${esc(why)}</p>
      <div class="rec-facts">
        <div><span class="field-label">Where to use it</span>${API_ONLY.has(x.id) ? `<p>Through the API, inside other apps.</p>` : `<a class="btn primary sm" href="${app.url}" target="_blank" rel="noopener">Open ${esc(app.name)} ${icon("external")}</a>`}</div>
        <div><span class="field-label">What it costs</span><p>${esc(cost)}</p></div>
      </div>
      <p class="muted" style="font-size:.85rem;margin:0">${x.in != null ? `Developers: $${x.in} in / $${x.out} out per 1M tokens · ` : ""}<a href="models.html#bench">How it scores on tests</a></p>
    </article>
    ${rest.length ? `<p class="field-label" style="margin-top:1.2rem">Also good</p><div class="alt-row">${rest.map(([id, w]) => { const y = byId[id]; return `<div class="alt p-${y.p}">${modelLogo(y)}<div><b>${esc(y.name)}</b><p>${esc(w)}</p></div></div>`; }).join("")}</div>` : ""}`;
    if (page === "models") history.replaceState(null, "", `#task=${task.id}`);
  };
  host.onclick = (e) => {
    const g = e.target.closest(".goal"), p = e.target.closest(".seg-b");
    if (g) task = t.tasks.find((x) => x.id === g.dataset.task);
    if (p && !p.disabled) prio = p.dataset.prio;
    if (g || p) draw();
  };
  draw();
}

// ---------- pages ----------
const pages = {
  async index() {
    const [g, n, tags, ex, t] = await Promise.all([load("github"), load("news"), load("tags"), load("explain"), load("trending")]);
    $("#stAgent").textContent = g ? `Updated ${ago(g.updated)}` : "Updating";
    $("#stTools").textContent = `${Object.keys(ex || {}).length} tools explained`;
    $("#goalTiles").innerHTML = (tags?.goals || []).map((x) => `<a class="goal-tile" href="explore.html?goal=${x.id}">${icon(x.icon)}<b>${esc(x.label)}</b><small>${esc(x.hint)}</small></a>`).join("");
    picker($("#homePicker"), "chat");
    $("#homeNews").innerHTML = (n?.items || []).filter((x) => x.ai).slice(0, 4).map((x) => `<a href="${esc(x.url)}" target="_blank" rel="noopener"><b>${esc(x.title)}</b><small>${esc(x.source)} · ${ago(x.date)}${x.summary ? ` · ${esc(x.summary.slice(0, 110))}` : ""}</small></a>`).join("") || `<p class="muted">News is on its way.</p>`;
    const hot = (t?.items || []).filter((x) => ex?.[x.repo]).slice(0, 6);
    $("#homeHot").innerHTML = hot.map((x) => toolCard(fromRepo(ex[x.repo], g?.repos?.[x.repo]))).join("");
  },

  async models() {
    const m = await load("models");
    picker($("#picker"), location.hash.match(/task=(\w+)/)?.[1] || "chat");
    const body = $("#modelRows");
    chips($("#provChips"), [["all", "All"], ...Object.entries(m.providers).map(([k, p]) => [k, p.name])], (p) => {
      body.innerHTML = m.models.filter((x) => p === "all" || x.p === p).map((x) => `<tr id="m-${x.id}" class="p-${x.p}">
        <td><span class="mname">${modelLogo(x)}${esc(x.name)}${newTag(x)}</span><small class="muted mono">${esc(m.providers[x.p].app)}</small></td>
        <td><span class="tag">${esc(x.tier)}</span></td><td class="why">${esc(x.best)}${x.note ? `<br><small style="color:var(--accent)">${esc(x.note)}</small>` : ""}</td>
        <td class="num">${x.in != null ? "$" + x.in : "—"}</td><td class="num">${x.out != null ? "$" + x.out : esc(x.price || "—")}</td><td class="num">${esc(x.ctx || "—")}</td></tr>`).join("");
    }, "all", "filter");
    $("#modelsUpdated").textContent = m.updated;
    benchmarks(m);
  },

  async mcp() {
    const [tools, g, b] = await Promise.all([load("tools"), load("github"), load("leaderboard")]);
    const servers = tools.filter((x) => x.type === "mcp");
    let server = servers.find((x) => location.hash.includes(x.id)) || servers[0], client = "claude-code";
    const list = $("#srvList");
    list.innerHTML = servers.map((s) => `<button class="opt" role="option" data-id="${s.id}" aria-selected="${s === server}">${icon(s.remote ? "plug" : "terminal")}<span>${esc(s.name)}<small>${s.remote ? "remote · http" : "local · stdio"}</small></span></button>`).join("");
    list.onclick = (e) => { const o = e.target.closest(".opt"); if (!o) return; server = servers.find((s) => s.id === o.dataset.id); $$(".opt", list).forEach((x) => x.setAttribute("aria-selected", x === o)); draw(); };
    const draw = () => { $("#cfgOut").innerHTML = configFor(server, client); };
    chips($("#clientChips"), CLIENTS.map((c) => [c.id, c.name]), (c) => { client = c; draw(); }, client);
    if (location.hash.startsWith("#setup")) $("#setup").scrollIntoView();

  },

  async skills() {},

  async github() {
    const [t, tools, g, b] = await Promise.all([load("trending"), load("tools"), load("github"), load("leaderboard")]);
    $("#trendGrid").innerHTML = (t?.items || []).map((x) => `<article class="card link">
      <div class="head"><h3 class="mono" style="overflow-wrap:anywhere">${esc(x.repo)}</h3><span class="tag ok">${esc((x.sources || ["new"])[0])}</span></div>
      <p>${esc(x.desc || "No description.")}</p>
      <div class="foot"><span class="stars">${icon("star")}${num(x.stars)}</span><span>${ago(x.created)}</span>${x.lang ? `<span>${esc(x.lang)}</span>` : ""}</div>
      <a class="cover" href="https://github.com/${esc(x.repo)}" target="_blank" rel="noopener" aria-label="${esc(x.repo)} on GitHub"></a></article>`).join("") || `<div class="empty">Trending list appears after the agent's first run.</div>`;
    const clients = tools.filter((x) => x.type === "client");
    $("#clientGrid").innerHTML = clients.map((c) => { const s = g?.repos?.[c.repo]; return `<article class="card link">
      <div class="head"><h3>${esc(c.name)}</h3>${s?.release ? `<span class="tag ok">${esc(s.release.tag)}</span>` : ""}</div><p>${esc(c.d)}</p>
      <div class="foot">${starLine(g, c.repo)}${s?.release ? `<span>released ${ago(s.release.date)}</span>` : s ? `<span>updated ${ago(s.pushed)}</span>` : ""}</div>
      <a class="cover" href="https://github.com/${c.repo}" target="_blank" rel="noopener" aria-label="${esc(c.name)} on GitHub"></a></article>`; }).join("");
  },

  async news() {
    const n = await load("news");
    const items = n?.items || [];
    $("#newsUpdated").textContent = n ? ago(n.updated) : "—";
    let src = "all";
    const draw = () => {
      const list = items.filter((x) => src === "all" || (src === "big" ? x.big : x.source === src));
      $("#feed").innerHTML = list.map((x) => `<article class="card story${x.big ? " accent-left" : ""}">
        <time datetime="${esc(x.date)}">${new Date(x.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}<br>${ago(x.date)}</time>
        <div><div class="row" style="margin-bottom:.3rem"><span class="src">${esc(x.source)}</span>${x.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>
          <h3><a href="${esc(x.url)}" target="_blank" rel="noopener" style="color:inherit">${esc(x.title)}</a></h3>
          ${x.summary ? `<p>${esc(x.summary)}</p>` : ""}
          ${x.discuss ? `<p style="margin-top:.4rem"><a href="${esc(x.discuss)}" target="_blank" rel="noopener" class="mono" style="font-size:.8rem">discussion →</a></p>` : ""}</div></article>`).join("") || `<div class="empty">Nothing here yet.</div>`;
    };
    const sources = [...new Set(items.map((x) => x.source))];
    chips($("#srcChips"), [["all", "All"], ["big", "Big launches"], ...sources.map((s) => [s, s])], (s) => { src = s; draw(); }, "all", "filter");
  },

  async leaderboard() {
    const [b, tools, g, repos, ex, dl] = await Promise.all([load("leaderboard"), load("tools"), load("github"), load("repos"), load("explain"), load("downloads")]);
    const cats = Object.fromEntries((repos?.categories || []).map((c) => [c.id, c.name]));
    const allRepos = [...new Set([...(repos?.repos || []), ...Object.keys(ex || {})])].filter((r) => g?.repos?.[r]);
    const repoRow = (r, i, score, unit, extra = "") => { const e = ex?.[r]; return `<a class="card entry link" href="explore.html#${esc(r)}" style="text-decoration:none;color:inherit">
        <span class="pos">${i + 1}</span><div class="who"><span class="dot" style="--c:var(--accent)"></span><div><b>${esc(r)}</b><small>${esc(e?.kind || g.repos[r].desc?.slice(0, 60) || "")}${e ? ` · ${esc(cats[e.cat] || "")}` : ""}${extra}</small></div></div>
        <div class="score">${score}<small>${unit}</small></div></a>`; };
    const topBy = (f) => allRepos.map((r) => [r, f(r)]).filter(([, v]) => v > 0).sort((a, c) => c[1] - a[1]).slice(0, 50);
    const byId = Object.fromEntries(tools.map((x) => [x.id, x]));
    $("#boardUpdated").textContent = b ? ago(b.updated) : "—";
    const TYPE = { mcp: "MCP server", skill: "Skill", collection: "Collection" };
    const views = {
      downloads: () => Object.entries(dl?.repos || {}).sort((a, c) => c[1].total - a[1].total).slice(0, 50)
        .map(([r, d], i) => repoRow(r, i, num(d.total), "installs / 30 days", ` · ${d.packages.map((p) => esc(p)).join(", ")}`)),
      stars: () => topBy((r) => g.repos[r].stars).map(([r, v], i) => repoRow(r, i, num(v), "stars")),
      rising: () => topBy((r) => g.repos[r].week ?? 0).map(([r, v], i) => repoRow(r, i, "+" + num(v), "stars this week", ` · ${num(g.repos[r].stars)} total`)),
      tools: () => (b?.tools || []).filter((x) => byId[x.id]).map((x, i) => { const t = byId[x.id]; return `<div class="card entry">
        <span class="pos">${i + 1}</span><div class="who"><span class="dot" style="--c:var(--accent)"></span><div><b>${esc(t.name)}</b><small>${TYPE[t.type]} · ${esc(t.by)} ${g?.repos?.[t.repo] ? `· ★ ${num(g.repos[t.repo].stars)}` : ""}</small></div></div>
        <div class="row"><div class="score">${x.votes}<small>votes</small></div><a class="btn sm" href="${GH}/issues/${x.issue}" target="_blank" rel="noopener">${icon("thumb")}Vote</a></div></div>`; }),
      people: () => (b?.people || []).map((p, i) => `<div class="card entry">
        <span class="pos">${i + 1}</span><div class="who"><img src="${esc(p.avatar)}&s=72" alt="" width="36" height="36" loading="lazy"><div><b>${esc(p.login)}</b><small>${p.votes} votes · ${p.submissions} tools added · ${p.prs} fixes</small></div></div>
        <div class="score">${p.points}<small>points</small></div></div>`),
    };
    const note = {
      downloads: `Real installs from npm and PyPI in the last 30 days. Only packages whose registry page links back to the repo are counted. Apps shipped as installers or Docker images (Ollama, ComfyUI…) aren't measurable this way, so they're missing here: see Most starred.`,
      stars: "GitHub stars: a bookmark count. Good for popularity, easy to inflate.",
      rising: "Stars gained in the last 7 days. The agent keeps daily snapshots, so this fills in after a week of runs.",
      tools: "Community votes: a thumbs-up on each tool's GitHub page. Needs a free GitHub account.", people: "Points for voting, suggesting tools and fixing data.",
    };
    chips($("#boardTabs"), [["downloads", "Most downloaded", "trend"], ["stars", "Most starred", "star"], ["rising", "Rising this week", "zap"], ["tools", "Top tools (votes)", "trophy"], ["people", "Top people", "users"]], (v) => {
      $("#boardNote").innerHTML = note[v];
      const rows = views[v]();
      $("#board").innerHTML = rows.length ? rows.join("") : `<div class="empty">${v === "tools" || v === "people" ? `No ${v === "tools" ? "votes" : "players"} yet. Be the first: vote on a tool below and you'll appear here after the next agent run.` : "The agent is still collecting this data. Check back after the next run."}</div>`;
    }, ["people", "tools", "stars", "rising"].find((t) => location.hash === `#${t}`) || "downloads");
  },
};

// A repo (from explain.json) or a skill/MCP/collection (from tools.json) in one shape
const KIND = { repo: "App / project", skill: "Skill", mcp: "Connector (MCP)", collection: "Skill pack" };
const fromRepo = (e, s, d) => ({ key: e.repo, kind: "repo", name: e.repo.split("/")[1], owner: e.repo.split("/")[0], repo: e.repo, plain: e.plain || e.what, what: e.what, why: e.why,
  caution: e.caution, steps: e.steps || (e.start ? [`Start with: \`${e.start.replace(/`/g, "")}\``] : []), useFor: e.useFor || [], tags: e.tags || [], level: e.level && ({ beginner: "easy", intermediate: "setup", advanced: "dev" }[e.level] || e.level),
  alts: e.alts || [], stars: s?.stars ?? 0, week: s?.week ?? 0, installs: d ?? 0, updated: s?.pushed, src: e.source });
const fromTool = (t, s) => ({ key: t.id, kind: t.type, name: t.name, owner: t.by, repo: t.repo, path: t.path, plain: t.plain || t.d, what: t.d, caution: "", steps: t.steps || [], useFor: t.useFor || [],
  tags: t.tags || [], level: t.level, alts: [], stars: s?.stars ?? 0, week: s?.week ?? 0, installs: 0, official: t.official, mcp: t.type === "mcp" });
const LEVEL = { easy: ["No coding", "ok"], setup: ["Some setup", ""], dev: ["For developers", "warn"] };

function toolCard(x, tags) {
  const goals = Object.fromEntries((tags?.goals || []).map((g) => [g.id, g]));
  return `<button class="tool" data-open="${esc(x.key)}">
    <span class="tool-head">${x.repo ? avatar(x.repo) : `<span class="avatar">${icon("puzzle")}</span>`}<span class="tool-name"><b>${esc(x.name)}</b><small>${esc(KIND[x.kind])}${x.owner ? ` · ${esc(x.owner)}` : ""}</small></span></span>
    <span class="tool-plain">${esc(x.plain || "")}</span>
    <span class="tool-foot">${x.level ? `<span class="tag ${LEVEL[x.level]?.[1] || ""}">${esc(LEVEL[x.level]?.[0] || x.level)}</span>` : ""}${x.tags.slice(0, 2).map((t) => goals[t] ? `<span class="tag">${esc(goals[t].label)}</span>` : "").join("")}
      <span class="tool-stats">${x.stars ? `${icon("star")}${num(x.stars)}` : ""}${x.installs ? ` ${icon("trend")}${num(x.installs)}/mo` : ""}</span></span>
  </button>`;
}

function toolDetail(x, all, tags) {
  const goals = Object.fromEntries((tags?.goals || []).map((g) => [g.id, g]));
  const link = x.repo ? (x.path ? `https://github.com/${x.repo}/tree/main/${x.path}` : `https://github.com/${x.repo}`) : null;
  const alts = x.alts.map((a) => all.find((y) => y.key === a)).filter(Boolean);
  return `<div class="dlg-head">${x.repo ? avatar(x.repo, 52) : ""}<div><p class="field-label" style="margin:0">${esc(KIND[x.kind])}${x.official ? " · official" : ""}</p><h2>${esc(x.name)}</h2>${x.owner ? `<small class="muted">by ${esc(x.owner)}</small>` : ""}</div>
      <button class="icon-btn dlg-close" aria-label="Close">${icon("x")}</button></div>
    <p class="lead" style="margin:1rem 0">${md(x.plain || x.what || "")}</p>
    <div class="row" style="margin-bottom:1.4rem">${x.level ? `<span class="tag ${LEVEL[x.level]?.[1] || ""}">${esc(LEVEL[x.level]?.[0])}</span>` : ""}${x.tags.map((t) => goals[t] ? `<a class="tag" href="explore.html?goal=${t}">${esc(goals[t].label)}</a>` : "").join("")}</div>
    ${x.useFor.length ? `<h3>Use it to</h3><ul class="ticks">${x.useFor.map((u) => `<li>${icon("check")}<span>${md(u)}</span></li>`).join("")}</ul>` : ""}
    ${x.steps.length ? `<h3 style="margin-top:1.4rem">How to start</h3><ol class="steps compact">${x.steps.map((st) => `<li><p>${md(st)}</p></li>`).join("")}</ol>` : ""}
    ${x.caution ? `<div class="callout" style="margin-top:1.4rem">${icon("alert")}<div><b>Good to know.</b> ${md(x.caution)}</div></div>` : ""}
    ${x.why ? `<details class="more"><summary>More detail</summary><p>${md(x.what)}</p><p>${md(x.why)}</p></details>` : ""}
    ${alts.length ? `<h3 style="margin-top:1.4rem">Similar tools</h3><div class="row">${alts.map((a) => `<button class="chip" data-open="${esc(a.key)}">${esc(a.name)}</button>`).join("")}</div>` : ""}
    <div class="row" style="margin-top:1.6rem">${x.mcp ? `<a class="btn primary" href="mcp.html#setup=${esc(x.key)}">${icon("plug")}Set it up in your app</a>` : ""}${x.kind === "skill" ? `<a class="btn primary" href="skills.html#install">${icon("puzzle")}How to install skills</a>` : ""}
      ${link ? `<a class="btn" href="${link}" target="_blank" rel="noopener">${icon("github")}Open on GitHub</a>` : ""}
      <span class="muted mono" style="font-size:.8rem">${x.stars ? `${num(x.stars)} stars` : ""}${x.installs ? ` · ${num(x.installs)} installs/month` : ""}${x.updated ? ` · updated ${ago(x.updated)}` : ""}</span></div>`;
}

pages.explore = async () => {
  const [repos, ex, g, dl, tools, tags] = await Promise.all([load("repos"), load("explain"), load("github"), load("downloads"), load("tools"), load("tags")]);
  const inExplain = new Set(Object.keys(ex || {}));
  const all = [
    ...Object.values(ex || {}).map((e) => fromRepo(e, g?.repos?.[e.repo], dl?.repos?.[e.repo]?.total)),
    ...tools.filter((t) => t.type === "skill" || t.type === "mcp" || (t.type === "collection" && !inExplain.has(t.repo))).map((t) => fromTool(t, g?.repos?.[t.repo])),
  ];
  const params = new URLSearchParams(location.search);
  const st = { goal: params.get("goal") || "all", level: params.get("level") || "all", type: params.get("type") || "all", sort: "popular" };
  const q = $("#repoQ"); q.value = params.get("q") || "";
  const TYPES = [["all", "Everything"], ["repo", "Apps & projects"], ["skill", "Skills"], ["mcp", "Connectors (MCP)"]];
  const matches = (x) => (st.goal === "all" || x.tags.includes(st.goal)) && (st.level === "all" || x.level === st.level) && (st.type === "all" || x.kind === st.type || (st.type === "skill" && x.kind === "collection"));
  const sync = () => {
    const p = new URLSearchParams();
    for (const k of ["goal", "level", "type"]) if (st[k] !== "all") p.set(k, st[k]);
    if (q.value) p.set("q", q.value);
    history.replaceState(null, "", `${location.pathname}${p.size ? `?${p}` : ""}${location.hash}`);
  };
  const draw = () => {
    const words = q.value.toLowerCase().split(/\s+/).filter(Boolean);
    const list = all.filter(matches).filter((x) => words.every((w) => `${x.name} ${x.owner} ${x.plain} ${x.what} ${x.useFor.join(" ")}`.toLowerCase().includes(w)))
      .sort((a, b) => (st.sort === "rising" ? b.week - a.week : st.sort === "installs" ? b.installs - a.installs : b.stars - a.stars));
    const goal = tags.goals.find((x) => x.id === st.goal);
    $("#catWhat").innerHTML = goal ? `<div class="callout ok" style="margin-bottom:1.2rem">${icon(goal.icon)}<div><b>${esc(goal.label)}.</b> ${esc(goal.hint)}. ${list.length} tools.</div></div>` : `<p class="muted" style="margin:0 0 1rem">${list.length} tools</p>`;
    $("#repoGrid").innerHTML = list.map((x) => toolCard(x, tags)).join("") || `<div class="empty">Nothing matches yet. Try fewer filters or another word.</div>`;
    sync();
  };
  const counts = (id) => all.filter((x) => x.tags.includes(id)).length;
  $("#goalChips").innerHTML = `<button class="goal-chip" data-goal="all" aria-pressed="${st.goal === "all"}">${icon("layout")}<span>All goals</span></button>` +
    tags.goals.map((x) => `<button class="goal-chip" data-goal="${x.id}" aria-pressed="${st.goal === x.id}">${icon(x.icon)}<span>${esc(x.label)}</span><small>${counts(x.id)}</small></button>`).join("");
  $("#goalChips").onclick = (e) => { const b = e.target.closest(".goal-chip"); if (!b) return; st.goal = b.dataset.goal; $$(".goal-chip").forEach((c) => c.setAttribute("aria-pressed", c === b)); draw(); };
  chips($("#levelChips"), [["all", "Any skill level"], ...tags.levels.map((l) => [l.id, l.label])], (v) => { st.level = v; draw(); }, st.level, "filter");
  chips($("#typeChips"), TYPES, (v) => { st.type = v; draw(); }, st.type, "filter");
  chips($("#sortChips"), [["popular", "Popular", "star"], ["rising", "Rising", "zap"], ["installs", "Most installed", "trend"]], (v) => { st.sort = v; draw(); }, "popular", "filter");
  q.oninput = draw;

  const dlg = $("#toolDlg");
  const open = (key) => {
    const x = all.find((y) => y.key === key); if (!x) return;
    $("#toolBody").innerHTML = toolDetail(x, all, tags);
    if (!dlg.open) dlg.showModal();
    dlg.scrollTop = 0;
    history.replaceState(null, "", `${location.pathname}${location.search}#${key}`);
  };
  document.addEventListener("click", (e) => {
    const o = e.target.closest("[data-open]"); if (o) { e.preventDefault(); open(o.dataset.open); return; }
    if (e.target.closest(".dlg-close") || e.target === dlg) dlg.close();
  });
  dlg.addEventListener("close", () => history.replaceState(null, "", `${location.pathname}${location.search}`));
  draw();
  const hash = decodeURIComponent(location.hash.slice(1));
  if (hash) open(hash);
};

// home page cards open the directory
document.addEventListener("click", (e) => { const o = e.target.closest("[data-open]"); if (o && page !== "explore") location.href = `explore.html#${o.dataset.open}`; });

// ---------- benchmarks: heatmap, ranked bars, value scatter ----------
const tip = () => $("#tip") || (document.body.insertAdjacentHTML("beforeend", `<div class="tip" id="tip" role="tooltip"></div>`), $("#tip"));
document.addEventListener("pointerover", (e) => {
  const el = e.target.closest("[data-tip]"); const t = tip();
  if (!el) return t.classList.remove("on");
  t.innerHTML = el.dataset.tip; t.classList.add("on");
});
document.addEventListener("pointermove", (e) => {
  const t = $("#tip"); if (!t?.classList.contains("on")) return;
  const x = Math.min(e.clientX + 14, innerWidth - t.offsetWidth - 8), y = e.clientY + 16 + t.offsetHeight > innerHeight ? e.clientY - t.offsetHeight - 12 : e.clientY + 16;
  t.style.left = `${x}px`; t.style.top = `${y}px`;
});

// nudge labels that would overlap: same side, closer than 14px vertically, similar x
const placeLabels = (pts) => {
  const placed = [];
  for (const p of [...pts].sort((a, c) => a.cy - c.cy)) {
    let ly = p.cy;
    for (const q of placed) if (q.right === p.right && Math.abs(q.cx - p.cx) < 150 && Math.abs(q.ly - ly) < 14) ly = q.ly + 14;
    placed.push({ ...p, ly });
  }
  return placed;
};

async function benchmarks(m) {
  const b = await load("benchmarks");
  if (!b) return;
  const byId = Object.fromEntries(m.models.map((x) => [x.id, x]));
  const rows = Object.keys(b.scores).filter((id) => byId[id]);
  b.metrics = b.metrics.filter((met) => rows.some((id) => b.scores[id][met.id])); // never show an empty column or chip
  const fmt = (met, v) => (met.unit === "%" ? `${+v.toFixed(1)}%` : String(Math.round(v)));
  const tipFor = (x, met, sc) => esc(`<b>${x.name}</b><br>${met.name}: ${fmt(met, sc.v)}${sc.note ? `<br><small>${sc.note}</small>` : ""}`);

  // heatmap: shade by rank within each column (tests use different scales, and top scores bunch together)
  const range = Object.fromEntries(b.metrics.map((met) => {
    const vs = [...new Set(rows.map((id) => b.scores[id][met.id]?.v).filter((v) => v != null))].sort((x, y) => y - x);
    return [met.id, vs];
  }));
  $("#heat").innerHTML = `<thead><tr><th scope="col">Model</th>${b.metrics.map((met) => `<th scope="col" data-tip="${esc(`<b>${met.name}</b><br>${met.what}`)}">${esc(met.skill)}<small>${esc(met.short)}</small></th>`).join("")}</tr></thead>
    <tbody>${rows.map((id) => { const x = byId[id]; return `<tr class="p-${x.p}"><th scope="row" class="mcol"><span class="row" style="gap:.45rem;flex-wrap:nowrap"><span class="dot"></span>${esc(x.name)}</span></th>${b.metrics.map((met) => {
      const sc = b.scores[id][met.id];
      if (!sc) return `<td class="cell na" aria-label="not published">—</td>`;
      const vs = range[met.id], t = vs.length > 1 ? 1 - vs.indexOf(sc.v) / (vs.length - 1) : 1;
      return `<td class="cell${sc.v === vs[0] ? " top" : ""}" style="background:color-mix(in srgb, var(--seq) ${Math.round(8 + t * 72)}%, var(--card))" data-tip="${tipFor(x, met, sc)}"><a href="${esc(sc.src)}" target="_blank" rel="noopener">${fmt(met, sc.v)}</a></td>`;
    }).join("")}</tr>`; }).join("")}</tbody>`;

  // ranked bars for one metric (percent and 0-100 index metrics only: bars must start at zero)
  const barMetrics = b.metrics.filter((met) => met.max === 100);
  $("#provLegend").innerHTML = $("#scatterLegend").innerHTML = Object.entries(m.providers).map(([k, p]) => `<span class="p-${k}"><i></i>${esc(p.name)}</span>`).join("");
  chips($("#benchChips"), barMetrics.map((met) => [met.id, met.skill]), (mid) => {
    const met = b.metrics.find((x) => x.id === mid);
    $("#benchWhat").innerHTML = `<b style="color:var(--fg)">${esc(met.name)}.</b> ${esc(met.what)}`;
    const list = rows.filter((id) => b.scores[id][mid]).sort((a, c) => b.scores[c][mid].v - b.scores[a][mid].v);
    $("#bars").innerHTML = list.map((id) => { const x = byId[id], sc = b.scores[id][mid]; return `<a class="bar-row p-${x.p}" href="${esc(sc.src)}" target="_blank" rel="noopener" data-tip="${tipFor(x, met, sc)}">
      <span class="lbl"><span class="dot"></span>${esc(x.name)}</span>
      <span class="bar-track"><span class="bar" style="display:block;width:${sc.v}%"></span><span class="bar-val" style="left:${sc.v}%">${fmt(met, sc.v)}</span></span></a>`; }).join("")
      + (rows.length > list.length ? `<p class="muted" style="font-size:.85rem;margin-top:.4rem">Not published for this test: ${rows.filter((id) => !b.scores[id][mid]).map((id) => esc(byId[id].name)).join(", ")}.</p>` : "");
  }, barMetrics[0].id, "filter");

  // value scatter: AA index vs blended price (3 input : 1 output), log x
  const priceOf = (id) => (byId[id].in != null ? byId[id] : b.hosted?.[id]);
  const pts = rows.filter((id) => b.scores[id].aa && priceOf(id)).map((id) => ({ x: byId[id], v: b.scores[id].aa.v, price: (3 * priceOf(id).in + priceOf(id).out) / 4, via: b.hosted?.[id]?.note }));
  const W = 900, H = 460, L = 56, R = 24, T = 16, B = 46;
  const px = (p) => L + (Math.log10(p) - Math.log10(0.1)) / (Math.log10(30) - Math.log10(0.1)) * (W - L - R);
  const vs = pts.map((p) => p.v), y0 = Math.floor(Math.min(...vs) / 10) * 10, y1 = Math.ceil(Math.max(...vs) / 10) * 10;
  const py = (v) => T + (1 - (v - y0) / (y1 - y0)) * (H - T - B);
  const yt = []; for (let v = y0; v <= y1; v += 10) yt.push(v);
  $("#scatter").innerHTML = `
    ${yt.map((v) => `<line class="grid-l" x1="${L}" x2="${W - R}" y1="${py(v)}" y2="${py(v)}"/><text class="ax" x="${L - 10}" y="${py(v) + 4}" text-anchor="end">${v}</text>`).join("")}
    ${[0.1, 0.3, 1, 3, 10, 30].map((p) => `<text class="ax" x="${px(p)}" y="${H - B + 22}" text-anchor="middle">$${p}</text>`).join("")}
    <text class="ax" x="${W - R}" y="${H - 6}" text-anchor="end">price per 1M tokens →</text>
    <text class="ax" x="${L}" y="${T - 4}">↑ intelligence index</text>
    ${placeLabels(pts.map((p) => ({ ...p, cx: px(p.price), cy: py(p.v), right: px(p.price) > W - 190 }))).map((p) => `<g class="p-${p.x.p}" data-tip="${esc(`<b>${p.x.name}</b><br>Index ${p.v.toFixed(1)} · $${p.price.toFixed(2)} blended${p.via ? `<br><small>${p.via}</small>` : ""}`)}" tabindex="0">
      <circle class="pt" cx="${p.cx}" cy="${p.cy}" r="8" fill="var(--c)"/>
      <text class="pl" x="${p.cx + (p.right ? -13 : 13)}" y="${p.ly + 4}" text-anchor="${p.right ? "end" : "start"}">${esc(p.x.name.replace(/^Claude |^Gemini /, "").replace(/ \(.*\)$/, ""))}</text></g>`).join("")}`;

  $("#benchSources").innerHTML = `Checked ${esc(b.updated)}. Overall index: <a href="https://artificialanalysis.ai/" target="_blank" rel="noopener">Artificial Analysis</a> (highest-effort setting of each model). Other scores: each model's official launch post or model card, or the benchmark's own leaderboard; click any number for its source. Vendors test with their own setups, so small gaps (1–2 points) aren't meaningful.`;
}

pages.newsletter = async () => {
  const [idx, site] = await Promise.all([load("newsletter"), load("site")]);
  const issues = idx?.issues || [];
  $("#subscribe").innerHTML = site?.buttondown
    ? `<form class="row" action="https://buttondown.com/api/emails/embed-subscribe/${esc(site.buttondown)}" method="post" target="_blank" style="max-width:560px">
        <label class="sr" for="nlEmail">Email address</label>
        <input id="nlEmail" class="hero-search" style="height:48px;flex:1;min-width:220px" type="email" name="email" required placeholder="you@example.com" autocomplete="email">
        <button class="btn primary" type="submit">${icon("news")}Subscribe</button></form>
       <p class="muted" style="font-size:.85rem;margin-top:.6rem">Free. One email on Mondays. Unsubscribe with one click. Or follow the <a href="feed.xml">RSS feed</a>.</p>`
    : `<div class="row"><a class="btn primary" href="feed.xml">${icon("news")}Follow via RSS</a><span class="muted" style="font-size:.9rem">Email sign-up opens soon.</span></div>`;
  $("#issues").innerHTML = issues.map((i) => `<a href="?issue=${esc(i.date)}" data-issue="${esc(i.date)}"><b>${esc(i.subject)}</b><small>${esc(new Date(i.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }))}</small></a>`).join("") || `<p class="muted">First issue lands on Monday.</p>`;
  const show = async (date) => {
    const x = date && (await load(`newsletter/${date}`));
    if (!x) { $("#issue").innerHTML = `<div class="empty">No issue yet. The agent writes the first one on Monday morning.</div>`; return; }
    $("#issue").innerHTML = `<p class="field-label">${esc(new Date(x.date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }))}</p>
      <h2>${esc(x.subject)}</h2><p class="lead">${esc(x.intro)}</p>
      ${x.sections.map((sec) => `<h3 style="margin-top:2.2rem">${esc(sec.title)}</h3><div class="feed">${sec.items.map((i) => `<div class="card" style="padding:1rem 1.2rem">
        <div class="head" style="margin-bottom:.3rem"><h3 style="font:600 1rem var(--sans);margin:0"><a href="${esc(i.url)}" style="color:inherit" target="_blank" rel="noopener">${esc(i.title)}</a></h3>${i.meta ? `<span class="tag">${esc(i.meta)}</span>` : ""}</div>
        <p>${md(i.blurb)}</p></div>`).join("")}</div>`).join("")}`;
    $$("#issues a").forEach((a) => a.setAttribute("aria-current", a.dataset.issue === x.date ? "true" : "false"));
  };
  show(new URLSearchParams(location.search).get("issue") || issues[0]?.date);
};

function renderCollections(el, tools, g, b) {
  el.innerHTML = tools.filter((x) => x.type === "collection").map((c) => `<article class="card link">
    <div class="head"><h3>${esc(c.name)}</h3>${c.official ? `<span class="tag ok">official</span>` : `<span class="tag">${esc(c.cat)}</span>`}</div>
    <p>${esc(c.d)}</p>
    <div class="foot">${starLine(g, c.repo)}<span class="above" style="margin-left:auto">${voteBtn(b, c.id)}</span></div>
    <a class="cover" href="https://github.com/${c.repo}" target="_blank" rel="noopener" aria-label="${esc(c.name)} on GitHub"></a></article>`).join("");
}

// ---------- MCP config generator ----------
const CLIENTS = [
  { id: "claude-code", name: "Claude Code" }, { id: "claude-desktop", name: "Claude Desktop" }, { id: "claude-ai", name: "claude.ai" },
  { id: "chatgpt", name: "ChatGPT" }, { id: "codex", name: "Codex" }, { id: "cursor", name: "Cursor" }, { id: "vscode", name: "VS Code" }, { id: "gemini", name: "Gemini CLI" },
];
const J = (o) => JSON.stringify(o, null, 2);
function term(title, code, lang = "bash") {
  const hl = esc(code).replace(/^(#.*)$/gm, '<span class="c">$1</span>').replace(/(&quot;[^&]*?&quot;)(?=:)/g, '<span class="k">$1</span>');
  return `<div class="term"><div class="term-bar"><i></i><i></i><i></i><span>${esc(title)}</span><button class="copy" data-copy="${esc(code)}">${icon("copy")}copy</button></div><pre><code class="lang-${lang}">${hl}</code></pre></div>`;
}
function configFor(s, c) {
  const name = s.id.replace(/-mcp$/, "");
  const [cmd, ...args] = s.stdio || [];
  const env = s.env || {};
  const envFlag = (f) => Object.entries(env).map(([k, v]) => `${f} ${k}=${v} `).join("");
  const authNote = s.auth ? `<p class="muted" style="margin-top:.8rem">${icon("lock")} Needs: ${esc(s.auth)}. You'll be asked to sign in the first time it's used.</p>` : "";
  const webOnly = (where, steps) => s.remote
    ? `<ol class="steps">${steps.map(([h, p]) => `<li><h3>${h}</h3><p>${p}</p></li>`).join("")}</ol>${term("Server URL", s.remote, "text")}${authNote}`
    : `<div class="callout">${icon("alert")}<div><b>${esc(s.name)} is a local server, and ${where} can only use remote servers</b> (reachable over the internet). Use Claude Desktop, Claude Code, Codex, Cursor or VS Code for this one.</div></div>`;
  const stdioObj = { command: cmd, args, ...(s.env && { env }) };
  switch (c) {
    case "claude-code":
      return (s.remote
        ? term("Terminal", `claude mcp add --transport http ${name} ${s.remote}\n# then run /mcp inside Claude Code to sign in`)
        : term("Terminal", `claude mcp add --transport stdio ${envFlag("--env")}${name} -- ${s.stdio.join(" ")}`)) +
        `<p class="muted" style="margin-top:.8rem">Add <code>--scope user</code> to use it in every project, or <code>--scope project</code> to share it with your team via <code>.mcp.json</code>. Check it with <code>claude mcp list</code>.</p>` + authNote;
    case "claude-desktop":
      return s.remote
        ? webOnly("the Desktop config file", [["Open Customize → Connectors", "In Claude Desktop (or claude.ai), click <b>+ → Add custom connector</b>."], ["Paste the URL below", "Give it a name, paste the server URL, click Add."]])
        : `<p class="muted">Settings → Developer → <b>Edit Config</b>. Paste this, save, then <b>fully quit and reopen</b> Claude Desktop.</p>` +
          term("claude_desktop_config.json", J({ mcpServers: { [name]: stdioObj } }), "json") +
          `<p class="muted" style="margin-top:.8rem">File lives at <code>%APPDATA%\\Claude\\</code> on Windows, <code>~/Library/Application Support/Claude/</code> on macOS. On Windows, write paths with double backslashes.</p>`;
    case "claude-ai":
      return webOnly("claude.ai", [["Open Customize → Connectors", "Go to <a href='https://claude.ai/customize/connectors' target='_blank' rel='noopener'>claude.ai/customize/connectors</a> and click <b>+ → Add custom connector</b>. Free plan: 1 custom connector."], ["Paste the URL below", "Name it, paste the URL, click Add. Team/Enterprise: an owner adds it under Organization settings."]]);
    case "chatgpt":
      return webOnly("ChatGPT", [["Turn on Developer mode", "Settings → Security and login → <b>Developer mode</b>. Needs Plus, Pro, Business, Enterprise or Edu. Web only."], ["Create an app", "Go to <b>Plugins → +</b>, create a developer-mode app and paste the server URL below."]]);
    case "codex":
      return (s.remote
        ? term("Terminal", `codex mcp add ${name} --url ${s.remote}`)
        : term("Terminal", `codex mcp add ${name} ${envFlag("--env")}-- ${s.stdio.join(" ")}`)) +
        `<p class="muted" style="margin:.8rem 0">Or edit <code>~/.codex/config.toml</code> by hand (note: TOML, not JSON). Same file is used by the ChatGPT desktop app and the Codex IDE extension.</p>` +
        term("~/.codex/config.toml", s.remote ? `[mcp_servers.${name}]\nurl = "${s.remote}"` : `[mcp_servers.${name}]\ncommand = "${cmd}"\nargs = [${args.map((a) => `"${a}"`).join(", ")}]${s.env ? `\nenv = { ${Object.entries(env).map(([k, v]) => `${k} = "${v}"`).join(", ")} }` : ""}`, "toml") + authNote;
    case "cursor":
      return `<p class="muted">Create <code>.cursor/mcp.json</code> in your project (or <code>~/.cursor/mcp.json</code> for all projects).</p>` +
        term(".cursor/mcp.json", J({ mcpServers: { [name]: s.remote ? { url: s.remote } : stdioObj } }), "json") + authNote;
    case "vscode":
      return `<p class="muted">Create <code>.vscode/mcp.json</code>. Careful: VS Code uses the key <code>"servers"</code>, everyone else uses <code>"mcpServers"</code>.</p>` +
        term(".vscode/mcp.json", J({ servers: { [name]: s.remote ? { type: "http", url: s.remote } : { type: "stdio", ...stdioObj } } }), "json") + authNote;
    case "gemini":
      return (s.remote
        ? term("Terminal", `gemini mcp add --transport http ${name} ${s.remote}`)
        : term("Terminal", `gemini mcp add ${envFlag("-e")}${name} ${s.stdio.join(" ")}`)) +
        `<p class="muted" style="margin-top:.8rem">Saved to <code>.gemini/settings.json</code> (add <code>-s user</code> for all projects). Editing by hand? In Gemini, <code>"httpUrl"</code> means HTTP and <code>"url"</code> means the old SSE transport.</p>` + authNote;
  }
}
document.addEventListener("click", async (e) => {
  const b = e.target.closest("[data-copy]"); if (!b) return;
  try { await navigator.clipboard.writeText(b.dataset.copy); b.innerHTML = `${icon("check")}copied`; setTimeout(() => (b.innerHTML = `${icon("copy")}copy`), 1600); } catch { b.textContent = "select & copy"; }
});

// ---------- boot ----------
shell();
$$("[data-i]").forEach((el) => (el.outerHTML = icon(el.dataset.i)));
pages[page]?.().catch((e) => console.error(e));
const io = "IntersectionObserver" in window && new IntersectionObserver((es) => es.forEach((x) => x.isIntersecting && (x.target.classList.add("in"), io.unobserve(x.target))), { rootMargin: "0px 0px -8% 0px" });
$$(".reveal").forEach((el) => (io ? io.observe(el) : el.classList.add("in")));
