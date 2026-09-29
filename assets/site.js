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
  tag: '<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5"/>',
};
const icon = (n, label) => `<svg class="i" viewBox="0 0 24 24" ${label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"'}>${P[n] || ""}</svg>`;

// ---------- helpers ----------
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const md = (s) => esc(s).replace(/`([^`]+)`/g, "<code>$1</code>"); // inline `code` only
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const num = (n) => (n >= 1e6 ? (n / 1e6).toFixed(1) + "M" : n >= 1e3 ? (n / 1e3).toFixed(n >= 1e4 ? 0 : 1) + "k" : String(n ?? 0));
const ago = (d) => {
  const s = (Date.now() - new Date(d)) / 1000;
  for (const [u, n] of [["y", 31536e3], ["mo", 2592e3], ["d", 86400], ["h", 3600], ["m", 60]]) if (s >= n) return `${Math.floor(s / n)}${u} ago`;
  return "just now";
};
const cache = {};
const load = (n) => (cache[n] ??= fetch(`data/${n}.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null));
const store = { get: (k) => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch {} } };
const repoUrl = (t) => (t.path ? `https://github.com/${t.repo}/tree/main/${t.path}` : `https://github.com/${t.repo}`);
const price = (m) => (m.in != null ? `$${m.in} / $${m.out}` : m.price || "—");
const isNew = (m) => m.released && Date.now() - new Date(m.released) < 14 * 864e5;
const newTag = (m) => (isNew(m) ? `<span class="tag ok">new</span>` : "");

// ---------- shell ----------
const NAV = [
  ["index", "Home", "./"], ["models", "Models", "models.html"], ["explore", "Repos", "explore.html"], ["mcp", "MCP", "mcp.html"], ["skills", "Skills", "skills.html"],
  ["github", "GitHub 101", "github.html"], ["news", "News", "news.html"], ["leaderboard", "Leaderboard", "leaderboard.html"],
];
function shell() {
  document.body.insertAdjacentHTML("afterbegin", `
  <a class="sr" href="#main">Skip to content</a>
  <header class="top"><div class="wrap">
    <a class="brand" href="./">${icon("compass")}ai-compass</a>
    <nav class="nav" id="nav" aria-label="Main">${NAV.map(([id, label, href]) => `<a href="${href}"${id === page ? ' aria-current="page"' : ""}>${label}</a>`).join("")}</nav>
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
      <p style="max-width:44ch">A plain-English map of AI models, MCP servers and agent skills. Kept fresh by an agent that checks GitHub and the official blogs every few hours.</p></div>
    <div class="row" style="align-items:start;gap:2.5rem">
      <div><div class="field-label">Contribute</div>
        <p><a href="${GH}/issues/new?template=submit-tool.yml">Suggest a tool</a><br><a href="leaderboard.html#how">How points work</a><br><a href="${GH}/blob/main/data">Edit the data</a></p></div>
      <div><div class="field-label">Project</div>
        <p><a href="${GH}">Source on GitHub</a><br><a href="${GH}/actions">Agent runs</a><br><span id="footUpdated"></span></p></div>
    </div>
  </div></footer>
  <dialog class="palette" id="palette" aria-label="Search">
    <div class="in">${icon("search")}<input id="pq" placeholder="Search models, MCP servers, skills, pages…" autocomplete="off" aria-label="Search" aria-controls="pres"><kbd>Esc</kbd></div>
    <ul id="pres" role="listbox"></ul>
  </dialog>`);

  // theme
  const setTheme = (t) => { document.documentElement.dataset.theme = t; $("#themeBtn").innerHTML = icon(t === "dark" ? "sun" : "moon"); store.set("theme", t); };
  setTheme(store.get("theme") || "dark");
  $("#themeBtn").onclick = () => setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
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
  const [m, tools, tasks, n, ex] = await Promise.all([load("models"), load("tools"), load("tasks"), load("news"), load("explain")]);
  return [
    ...NAV.map(([, label, href]) => ({ t: label, sub: "Page", href, k: "page", ic: "arrow" })),
    { t: "What is MCP?", sub: "Guide", href: "mcp.html#what", k: "guide", ic: "book" },
    { t: "Add an MCP server to your app", sub: "Config generator", href: "mcp.html#setup", k: "guide", ic: "terminal" },
    { t: "What is a skill?", sub: "Guide", href: "skills.html#what", k: "guide", ic: "book" },
    { t: "Explain a GitHub repo for me", sub: "Repo Explainer", href: "explore.html", k: "guide", ic: "bot" },
    { t: "How to judge a GitHub repo", sub: "Guide", href: "github.html#judge", k: "guide", ic: "book" },
    ...(tasks || []).map((t) => ({ t: `I want to: ${t.label}`, sub: "Model picker", href: `models.html#task=${t.id}`, k: "task", ic: t.icon })),
    ...(m?.models || []).map((x) => ({ t: x.name, sub: `${m.providers[x.p].name} · ${x.tier}`, href: `models.html#m-${x.id}`, k: "model", ic: "cpu" })),
    ...(tools || []).map((x) => ({ t: x.name, sub: `${x.type === "mcp" ? "MCP server" : x.type} · ${x.by}`, href: x.type === "mcp" ? `mcp.html#setup=${x.id}` : repoUrl(x), k: x.type, ic: x.type === "mcp" ? "plug" : x.type === "skill" ? "puzzle" : "github", extra: x.d })),
    ...Object.values(ex || {}).map((x) => ({ t: x.repo, sub: x.kind, href: `explore.html#${x.repo}`, k: "repo", ic: "github", extra: `${x.what} ${x.cat}` })),
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
    : `<li class="empty" style="margin:.6rem">No matches. Try "browser", "excel" or "cheap".</li>`;
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
  return `<a class="btn sm vote" href="${GH}/issues/${v.issue}" target="_blank" rel="noopener" title="Vote with 👍 on GitHub">${icon("thumb")}${v.votes}</a>`;
}

async function picker(chipsEl, outEl, start) {
  const [m, tasks] = await Promise.all([load("models"), load("tasks")]);
  const byId = Object.fromEntries(m.models.map((x) => [x.id, x]));
  chips(chipsEl, tasks.map((t) => [t.id, t.label, t.icon]), (id) => {
    const t = tasks.find((x) => x.id === id);
    if (page === "models") history.replaceState(null, "", `#task=${id}`);
    outEl.innerHTML = t.picks.filter(([mid]) => byId[mid]).map(([mid, why], i) => {
      const x = byId[mid];
      return `<div class="pick p-${x.p}"><span class="rank">${i ? `ALT` : `BEST`}</span>
        <span class="name"><span class="dot"></span>${esc(x.name)}${newTag(x)}</span>
        <span class="price">${esc(price(x))}<br>${esc(m.providers[x.p].app)}</span>
        <span class="why">${esc(why)}</span></div>`;
    }).join("");
  }, start);
}

// ---------- pages ----------
const pages = {
  async index() {
    const [g, n, t, b, tools, m] = await Promise.all([load("github"), load("news"), load("trending"), load("leaderboard"), load("tools"), load("models")]);
    $("#stTracked").textContent = `${Object.keys(g?.repos || {}).length} repos tracked`;
    $("#stNews").textContent = `${n?.items.length ?? 0} stories this month`;
    $("#stAgent").textContent = g ? `Agent ran ${ago(g.updated)}` : "Agent pending";
    $("#stModels").textContent = `${m.models.length} models · ${tools.filter((x) => x.type === "mcp").length} MCP servers · ${tools.filter((x) => x.type === "skill").length} skills`;
    picker($("#taskChips"), $("#taskOut"), "code");
    $("#homeNews").innerHTML = (n?.items || []).slice(0, 6).map((x) => `<a href="${esc(x.url)}" target="_blank" rel="noopener"><b>${esc(x.title)}</b><small>${esc(x.source)} · ${ago(x.date)}</small></a>`).join("") || `<p class="muted">The agent hasn't collected news yet.</p>`;
    $("#homeTrend").innerHTML = (t?.items || []).slice(0, 5).map((x) => `<a href="https://github.com/${esc(x.repo)}" target="_blank" rel="noopener"><b>${esc(x.repo)}</b><small>★ ${num(x.stars)} · new ${ago(x.created)} · ${esc((x.desc || "").slice(0, 70))}</small></a>`).join("");
    const ex = await load("explain");
    $("#homeRepos").innerHTML = ["ruvnet/ruflo", "diegosouzapw/OmniRoute", "ollama/ollama", "JuliusBrussee/caveman"].filter((r) => ex?.[r]).map((r) => `<a class="card link" href="explore.html#${r}" style="text-decoration:none;color:inherit;background:var(--bg-2)">
      <div class="head"><h3 class="mono">${esc(r.split("/")[1])}</h3><span class="tag">${esc(ex[r].kind)}</span></div><p>${esc(ex[r].what)}</p></a>`).join("");
    const byId = Object.fromEntries(tools.map((x) => [x.id, x]));
    const top = (b?.tools || []).filter((x) => x.votes > 0).slice(0, 5);
    $("#homeBoard").innerHTML = top.length
      ? top.map((x, i) => `<a href="leaderboard.html"><b>${i + 1}. ${esc(byId[x.id]?.name)}</b><small>${x.votes} votes</small></a>`).join("")
      : `<p class="muted">Voting just opened. Pick your favourite tools on GitHub with a 👍 and climb the people board.</p><a class="btn sm" href="leaderboard.html">${icon("trophy")}Open the leaderboard</a>`;
  },

  async models() {
    const m = await load("models");
    const start = location.hash.match(/task=(\w+)/)?.[1] || "code";
    picker($("#taskChips"), $("#taskOut"), start);
    const body = $("#modelRows");
    chips($("#provChips"), [["all", "All"], ...Object.entries(m.providers).map(([k, p]) => [k, p.name])], (p) => {
      body.innerHTML = m.models.filter((x) => p === "all" || x.p === p).map((x) => `<tr id="m-${x.id}" class="p-${x.p}">
        <td><span class="mname"><span class="dot"></span>${esc(x.name)}${newTag(x)}</span><small class="muted mono">${esc(m.providers[x.p].app)}</small></td>
        <td><span class="tag">${esc(x.tier)}</span></td><td class="why">${esc(x.best)}${x.note ? `<br><small style="color:var(--accent)">${esc(x.note)}</small>` : ""}</td>
        <td class="num">${x.in != null ? "$" + x.in : "—"}</td><td class="num">${x.out != null ? "$" + x.out : esc(x.price || "—")}</td><td class="num">${esc(x.ctx || "—")}</td></tr>`).join("");
    }, "all", "filter");
    $("#modelsUpdated").textContent = m.updated;
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

    $("#srvGrid").innerHTML = servers.map((s) => `<article class="card link">
      <div class="head"><h3>${esc(s.name)}</h3>${s.official ? `<span class="tag ok">official</span>` : `<span class="tag">community</span>`}</div>
      <p>${esc(s.d)}</p>
      <div class="foot">${starLine(g, s.repo)}<span>${s.remote ? "remote" : "local"}</span><span>${esc(s.cat)}</span><span class="above" style="margin-left:auto">${voteBtn(b, s.id)}</span></div>
      <a class="cover" href="${repoUrl(s)}" target="_blank" rel="noopener" aria-label="${esc(s.name)} on GitHub"></a></article>`).join("");
  },

  async skills() {
    const [tools, g, b] = await Promise.all([load("tools"), load("github"), load("leaderboard")]);
    const skills = tools.filter((x) => x.type === "skill");
    const PLAT = { claude: "Claude", codex: "Codex / ChatGPT", any: "Any agent" };
    let cat = "all";
    const draw = () => {
      const q = $("#skillQ").value.trim().toLowerCase();
      const list = skills.filter((s) => (cat === "all" || s.cat === cat) && (!q || `${s.name} ${s.d} ${s.cat} ${s.by}`.toLowerCase().includes(q)));
      $("#skillGrid").innerHTML = list.map((s) => `<article class="card link">
        <div class="head"><h3 class="mono">${esc(s.name)}</h3><span class="tag">${PLAT[s.plat]}</span></div>
        <p>${esc(s.d)}</p>
        <div class="foot"><span>${esc(s.by)}</span><span>${esc(s.cat)}</span><span class="above" style="margin-left:auto">${voteBtn(b, s.id)}</span></div>
        <a class="cover" href="${repoUrl(s)}" target="_blank" rel="noopener" aria-label="${esc(s.name)} on GitHub"></a></article>`).join("") || `<div class="empty">No skill matches. Check the big directories below.</div>`;
    };
    chips($("#catChips"), [["all", "All"], ...[...new Set(skills.map((s) => s.cat))].map((c) => [c, c])], (c) => { cat = c; draw(); }, "all", "filter");
    $("#skillQ").oninput = draw;
    renderCollections($("#collGrid"), tools, g, b);
  },

  async github() {
    const [t, tools, g, b] = await Promise.all([load("trending"), load("tools"), load("github"), load("leaderboard")]);
    $("#trendGrid").innerHTML = (t?.items || []).map((x) => `<article class="card link">
      <div class="head"><h3 class="mono" style="overflow-wrap:anywhere">${esc(x.repo)}</h3><span class="tag ok">new</span></div>
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
    const [b, tools, g] = await Promise.all([load("leaderboard"), load("tools"), load("github")]);
    const byId = Object.fromEntries(tools.map((x) => [x.id, x]));
    $("#boardUpdated").textContent = b ? ago(b.updated) : "—";
    const TYPE = { mcp: "MCP server", skill: "Skill", collection: "Collection" };
    const views = {
      tools: () => (b?.tools || []).filter((x) => byId[x.id]).map((x, i) => { const t = byId[x.id]; return `<div class="card entry">
        <span class="pos">${i + 1}</span><div class="who"><span class="dot" style="--c:var(--accent)"></span><div><b>${esc(t.name)}</b><small>${TYPE[t.type]} · ${esc(t.by)} ${g?.repos?.[t.repo] ? `· ★ ${num(g.repos[t.repo].stars)}` : ""}</small></div></div>
        <div class="row"><div class="score">${x.votes}<small>votes</small></div><a class="btn sm" href="${GH}/issues/${x.issue}" target="_blank" rel="noopener">${icon("thumb")}Vote</a></div></div>`; }),
      people: () => (b?.people || []).map((p, i) => `<div class="card entry">
        <span class="pos">${i + 1}</span><div class="who"><img src="${esc(p.avatar)}&s=72" alt="" width="36" height="36" loading="lazy"><div><b>${esc(p.login)}</b><small>${p.votes} votes · ${p.submissions} tools added · ${p.requests || 0} explained · ${p.prs} PRs</small></div></div>
        <div class="score">${p.points}<small>points</small></div></div>`),
    };
    chips($("#boardTabs"), [["tools", "Top tools", "trophy"], ["people", "Top people", "users"]], (v) => {
      const rows = views[v]();
      $("#board").innerHTML = rows.length ? rows.join("") : `<div class="empty">No ${v === "tools" ? "votes" : "players"} yet. Be the first: vote on a tool below and you'll appear here after the next agent run.</div>`;
    }, location.hash === "#people" ? "people" : "tools");
  },
};

pages.explore = async () => {
  const [repos, ex, g] = await Promise.all([load("repos"), load("explain"), load("github")]);
  const cats = Object.fromEntries(repos.categories.map((c) => [c.id, c]));
  const all = [...new Set([...repos.repos, ...Object.keys(ex || {})])].map((repo) => {
    const e = ex?.[repo], s = g?.repos?.[repo];
    return { repo, e, s, cat: e?.cat, stars: s?.stars ?? 0, week: s?.week ?? 0 };
  });
  let cat = "all", sort = "stars";
  const q = $("#repoQ");
  const LV = { beginner: "ok", intermediate: "", advanced: "warn" };
  const card = ({ repo, e, s }) => {
    const [owner, name] = repo.split("/");
    return `<article class="card" id="${esc(repo)}">
      <div class="head"><div style="min-width:0"><small class="mono muted">${esc(owner)} /</small><h3 class="mono" style="overflow-wrap:anywhere">${esc(name)}</h3></div>
        <div class="row" style="justify-content:end">${e ? `<span class="tag">${esc(e.kind)}</span><span class="tag ${LV[e.level]}">${esc(e.level)}</span>` : `<span class="tag">explanation pending</span>`}</div></div>
      ${e ? `<p style="color:var(--fg);margin-bottom:.5rem">${md(e.what)}</p><p>${md(e.why)}</p>` : `<p>${esc(s?.desc || "")}</p>`}
      ${e?.caution ? `<div class="callout" style="margin-top:.9rem;font-size:.88rem;padding:.7rem .9rem">${icon("alert")}<div>${md(e.caution)}</div></div>` : ""}
      ${e?.start ? `<div class="term" style="margin-top:.9rem"><div class="term-bar"><i></i><i></i><i></i><span>try it</span><button class="copy" data-copy="${esc(e.start.replace(/`/g, ""))}">${icon("copy")}copy</button></div><pre><code>${esc(e.start.replace(/`/g, ""))}</code></pre></div>` : ""}
      ${e?.alts?.length ? `<p style="margin-top:.9rem;font-size:.86rem">Similar: ${e.alts.map((a) => `<a class="mono" href="#${esc(a)}" data-jump="${esc(a)}">${esc(a.split("/")[1] || a)}</a>`).join(" · ")}</p>` : ""}
      <div class="foot">${s ? `<span class="stars">${icon("star")}${num(s.stars)}</span>${s.week > 0 ? `<span class="delta">+${num(s.week)}/wk</span>` : ""}<span>updated ${ago(s.pushed)}</span>` : ""}
        ${e?.source === "trending" ? `<span class="tag ok">trending</span>` : ""}${e?.by ? `<span>asked by @${esc(e.by)}</span>` : ""}
        <a style="margin-left:auto" href="https://github.com/${esc(repo)}" target="_blank" rel="noopener">GitHub ${icon("external")}</a></div></article>`;
  };
  const draw = () => {
    const words = q.value.toLowerCase().split(/\s+/).filter(Boolean);
    const list = all
      .filter((r) => cat === "all" || r.cat === cat)
      .filter((r) => words.every((w) => `${r.repo} ${r.e?.kind} ${r.e?.what} ${r.e?.why} ${cats[r.cat]?.name} ${r.s?.desc}`.toLowerCase().includes(w)))
      .sort((a, b) => (sort === "rising" ? b.week - a.week : b.stars - a.stars));
    $("#catWhat").innerHTML = cat !== "all" ? `<div class="callout ok" style="margin-bottom:1.2rem">${icon(cats[cat].icon)}<div><b>${esc(cats[cat].name)}.</b> ${esc(cats[cat].what)}</div></div>` : "";
    $("#repoGrid").innerHTML = list.map(card).join("") || `<div class="empty">No repo matches. <a href="https://github.com/${REPO}/issues/new?template=explain-repo.yml">Ask the agent to explain it →</a></div>`;
  };
  const count = (id) => all.filter((r) => r.cat === id).length;
  chips($("#repoCats"), [["all", `All ${all.length}`], ...repos.categories.map((c) => [c.id, `${c.name} ${count(c.id)}`, c.icon])], (c) => { cat = c; draw(); }, "all", "filter");
  chips($("#sortChips"), [["stars", "Most stars"], ["rising", "Rising this week", "trend"]], (v) => { sort = v; draw(); }, "stars", "filter");
  q.oninput = draw;
  const jump = (repo) => {
    q.value = repo; cat = "all";
    $$("#repoCats .chip").forEach((c) => c.setAttribute("aria-pressed", c.dataset.v === "all"));
    draw(); $("#repoGrid").scrollIntoView({ behavior: "smooth" });
  };
  document.addEventListener("click", (e) => { const a = e.target.closest("[data-jump]"); if (a) { e.preventDefault(); history.replaceState(null, "", `#${a.dataset.jump}`); jump(a.dataset.jump); } });
  const hash = decodeURIComponent(location.hash.slice(1));
  if (hash.includes("/")) jump(hash);
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
