// Contribute + admin pages. Talks to Supabase (config in data/site.json).
// Visitors can only add pending submissions; moderators review them (rules live in supabase/schema.sql).
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const cfg = (await load("site")) || {};
const sb = cfg.supabaseUrl && cfg.supabaseAnonKey ? createClient(cfg.supabaseUrl, cfg.supabaseAnonKey) : null;
const offline = `<div class="callout">${icon("alert")}<div>Submissions open very soon. Until then, email ideas to the site owner or use GitHub.</div></div>`;

const KINDS = {
  tool: { icon: "puzzle", label: "Suggest a tool", hint: "A GitHub project, skill or connector we should explain.",
    fields: [["url", "GitHub link", "https://github.com/owner/project", true], ["body", "What does it do, and why is it useful?", "", true, "area"], ["name", "Your name (optional)", ""], ["contact", "Email, if we may ask a question (optional, never shown)", "", false, "email"]] },
  fix: { icon: "alert", label: "Report something wrong", hint: "A wrong price, outdated info, a broken link or a bad explanation.",
    fields: [["target", "Which tool or page?", "e.g. ollama/ollama or the Models page", true], ["body", "What is wrong, and what is right?", "", true, "area"], ["url", "Source that proves it (optional)", "https://…"], ["contact", "Email (optional, never shown)", "", false, "email"]] },
  tip: { icon: "chat", label: "Share a tip", hint: "How you use a tool. Approved tips appear under it for everyone.",
    fields: [["target", "Which tool?", "e.g. ollama/ollama", true], ["body", "Your tip (what works, what to avoid)", "", true, "area"], ["name", "Name to show with your tip", "", true], ["contact", "Email (optional, never shown)", "", false, "email"]] },
  volunteer: { icon: "users", label: "Volunteer as a reviewer", hint: "Help approve submissions. You get a login to the review page.",
    fields: [["name", "Your name", "", true], ["contact", "Email you will sign in with", "", true, "email"], ["body", "What do you know about, and how much time can you give?", "", true, "area"]] },
};

async function contribute() {
  const host = $("#contrib");
  const params = new URLSearchParams(location.search);
  let kind = KINDS[params.get("kind")] ? params.get("kind") : null;
  const draw = () => {
    host.innerHTML = `<div class="kind-grid">${Object.entries(KINDS).map(([k, x]) => `<button class="goal" data-kind="${k}" aria-pressed="${k === kind}">${icon(x.icon)}<span><b>${esc(x.label)}</b><small class="muted" style="display:block;font-weight:400">${esc(x.hint)}</small></span></button>`).join("")}</div>
      ${kind ? form(kind) : ""}`;
    if (kind) $("#cForm").onsubmit = send;
  };
  const form = (k) => `<form id="cForm" class="card cform" novalidate>
      <h3>${esc(KINDS[k].label)}</h3>
      ${KINDS[k].fields.map(([f, label, ph, req, type]) => `<label class="fld"><span>${esc(label)}${req ? "" : ""}</span>
        ${type === "area" ? `<textarea name="${f}" rows="5" ${req ? "required" : ""} minlength="10" maxlength="4000" placeholder="${esc(ph)}"></textarea>` : `<input name="${f}" type="${type === "email" ? "email" : "text"}" ${req ? "required" : ""} maxlength="${f === "url" ? 500 : 200}" placeholder="${esc(ph)}" value="${esc(f === "target" ? params.get("target") || "" : "")}">`}</label>`).join("")}
      <label class="hp" aria-hidden="true">Website <input name="website" tabindex="-1" autocomplete="off"></label>
      <p class="muted" style="font-size:.85rem">A human reviews every submission before anything changes on the site.</p>
      <div class="row"><button class="btn primary" type="submit">${icon("check")}Send</button><span id="cMsg" role="status"></span></div>
    </form>`;
  async function send(e) {
    e.preventDefault();
    const f = e.target, msg = $("#cMsg"), data = Object.fromEntries(new FormData(f));
    if (!f.reportValidity()) return;
    if (data.website) { msg.textContent = "Thanks!"; return; } // bot filled the hidden field
    if (!sb) { msg.innerHTML = offline; return; }
    const row = { kind, ...Object.fromEntries(Object.entries(data).filter(([k, v]) => k !== "website" && v.trim()).map(([k, v]) => [k, v.trim()])) };
    const btn = f.querySelector("button[type=submit]"); btn.disabled = true; msg.textContent = "Sending…";
    const { error } = await sb.from("submissions").insert(row);
    btn.disabled = false;
    if (error) { msg.innerHTML = `<span style="color:var(--warn)">${esc(error.message.includes("Too many") ? error.message : "Could not send. Check the fields and try again.")}</span>`; return; }
    f.outerHTML = `<div class="callout ok">${icon("check")}<div><b>Thank you.</b> A reviewer will look at it within a few days. ${kind === "volunteer" ? "If approved, sign in on the review page with the same email." : ""}</div></div>`;
  }
  host.onclick = (e) => { const b = e.target.closest("[data-kind]"); if (!b) return; kind = b.dataset.kind; history.replaceState(null, "", `?kind=${kind}`); draw(); $("#cForm")?.scrollIntoView({ behavior: "smooth", block: "start" }); };
  draw();
}

async function admin() {
  const host = $("#admin");
  if (!sb) { host.innerHTML = offline; return; }
  const { data: { session } } = await sb.auth.getSession();
  if (!session) {
    host.innerHTML = `<form id="login" class="card cform" style="max-width:480px"><h3>Reviewer sign-in</h3><p class="muted">We email you a one-time sign-in link. No password.</p>
      <label class="fld"><span>Email</span><input name="email" type="email" required autocomplete="email"></label>
      <div class="row"><button class="btn primary">${icon("arrow")}Email me a link</button><span id="lMsg" role="status"></span></div></form>`;
    $("#login").onsubmit = async (e) => {
      e.preventDefault();
      const { error } = await sb.auth.signInWithOtp({ email: new FormData(e.target).get("email"), options: { emailRedirectTo: location.href.split("#")[0] } });
      $("#lMsg").textContent = error ? error.message : "Check your inbox for the link.";
    };
    return;
  }
  const { data: isMod } = await sb.rpc("is_moderator");
  const { data: isOwner } = await sb.rpc("is_owner");
  const out = `<button class="btn sm" id="signOut">${icon("x")}Sign out</button>`;
  if (!isMod) { host.innerHTML = `<div class="callout">${icon("lock")}<div>Signed in as ${esc(session.user.email)}, but this account is not a reviewer yet. If you applied as a volunteer, wait for the owner's approval.</div></div><p>${out}</p>`; $("#signOut").onclick = () => sb.auth.signOut().then(() => location.reload()); return; }

  const tabs = [["pending", "Waiting"], ["approved", "Approved"], ["applied", "Done"], ["rejected", "Rejected"], ["social", "Social drafts"], ...(isOwner ? [["team", "Team"]] : [])];
  host.innerHTML = `<div class="spread" style="align-items:center"><p class="muted" style="margin:0">Signed in as ${esc(session.user.email)}${isOwner ? " (owner)" : ""}</p>${out}</div>
    <div class="chips" id="aTabs"></div><div id="aList" class="feed"></div>`;
  $("#signOut").onclick = () => sb.auth.signOut().then(() => location.reload());
  const K = Object.fromEntries(Object.entries(KINDS).map(([k, x]) => [k, x.label]));

  const views = {
    async status(st) {
      const { data, error } = await sb.from("submissions").select("*").eq("status", st).order("created_at", { ascending: false }).limit(100);
      if (error) return `<div class="empty">${esc(error.message)}</div>`;
      return data.map((s) => `<article class="card sub" data-id="${s.id}">
        <div class="head"><div><span class="tag">${esc(K[s.kind])}</span> <small class="muted mono">${ago(s.created_at)}</small></div>${s.contact ? `<small class="muted mono">${esc(s.contact)}</small>` : ""}</div>
        ${s.target ? `<p><b>About:</b> ${esc(s.target)}</p>` : ""}${s.url ? `<p><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.url)}</a></p>` : ""}
        <p style="color:var(--fg);white-space:pre-wrap">${esc(s.body)}</p>${s.name ? `<p class="muted">by ${esc(s.name)}</p>` : ""}
        ${s.review_note ? `<p class="muted"><b>Note:</b> ${esc(s.review_note)}</p>` : ""}
        ${st === "pending" ? `<div class="row" style="margin-top:.8rem"><input class="note" placeholder="Note (optional)" maxlength="1000">
          <button class="btn sm primary" data-act="approved">${icon("check")}Approve</button><button class="btn sm" data-act="rejected">${icon("x")}Reject</button></div>` : ""}
      </article>`).join("") || `<div class="empty">Nothing here.</div>`;
    },
    async social() {
      const { data, error } = await sb.from("social_posts").select("*").eq("status", "draft").order("created_at", { ascending: false });
      if (error) return `<div class="empty">${esc(error.message)}</div>`;
      return data.map((p) => {
        const text = p.link ? `${p.body}\n\n${p.link}` : p.body;
        const open = p.channel === "reddit"
          ? `https://www.reddit.com/${p.community || "r/artificial"}/submit?type=TEXT&title=${encodeURIComponent(p.title || "")}&text=${encodeURIComponent(text)}`
          : `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(text)}`;
        return `<article class="card sub" data-post="${p.id}">
          <div class="head"><div><span class="tag ok">${p.channel === "reddit" ? "Reddit" : "LinkedIn"}</span> ${p.community ? `<span class="tag">${esc(p.community)}</span>` : ""}</div><small class="muted mono">${ago(p.created_at)}</small></div>
          ${p.title ? `<h3>${esc(p.title)}</h3>` : ""}<p style="color:var(--fg);white-space:pre-wrap">${esc(text)}</p>
          <div class="row" style="margin-top:.8rem"><a class="btn sm primary" href="${open}" target="_blank" rel="noopener">${icon("external")}Open in ${p.channel === "reddit" ? "Reddit" : "LinkedIn"}</a>
            <button class="btn sm" data-copy="${esc(text)}">${icon("copy")}Copy text</button>
            <button class="btn sm" data-post-act="posted">${icon("check")}Mark posted</button><button class="btn sm" data-post-act="discarded">${icon("x")}Discard</button></div>
          ${p.channel === "reddit" ? `<p class="muted" style="font-size:.82rem;margin-top:.6rem">Check the subreddit's self-promotion rules first. Post from your own account and stay around to answer comments.</p>` : ""}
        </article>`;
      }).join("") || `<div class="empty">No drafts. The agent writes new ones every Monday with the newsletter.</div>`;
    },
    async team() {
      const { data } = await sb.from("moderators").select("*").order("added_at");
      return `<article class="card"><h3>Add a reviewer</h3><p class="muted">Approve their volunteer application first. They must have signed in here once.</p>
        <form id="addMod" class="row"><input name="email" type="email" required placeholder="volunteer@email.com" class="note"><button class="btn sm primary">${icon("users")}Make reviewer</button><span id="mMsg"></span></form></article>
        ${(data || []).map((m) => `<div class="card entry"><span class="pos">${m.role === "owner" ? "O" : "M"}</span><div class="who"><div><b>${esc(m.email)}</b><small>${esc(m.role)} since ${ago(m.added_at)}</small></div></div><div></div></div>`).join("")}`;
    },
  };
  const show = async (v) => {
    $("#aList").innerHTML = `<p class="muted">Loading…</p>`;
    $("#aList").innerHTML = await (views[v] ? views[v]() : views.status(v));
    const add = $("#addMod");
    if (add) add.onsubmit = async (e) => {
      e.preventDefault();
      const { data, error } = await sb.rpc("promote_moderator", { target_email: new FormData(add).get("email") });
      $("#mMsg").textContent = error ? error.message : data === "ok" ? "Added." : "They need to sign in here once first.";
      if (data === "ok") show("team");
    };
  };
  $("#aList").onclick = async (e) => {
    const act = e.target.closest("[data-act]"), post = e.target.closest("[data-post-act]");
    if (act) {
      const card = act.closest("[data-id]"), note = card.querySelector(".note").value.trim();
      const { error } = await sb.from("submissions").update({ status: act.dataset.act, review_note: note || null }).eq("id", card.dataset.id);
      if (error) { card.insertAdjacentHTML("beforeend", `<p style="color:var(--warn)">${esc(error.message)}</p>`); return; }
      card.remove();
    }
    if (post) {
      const card = post.closest("[data-post]");
      const { error } = await sb.from("social_posts").update({ status: post.dataset.postAct, handled_at: new Date().toISOString() }).eq("id", card.dataset.post);
      if (!error) card.remove();
    }
  };
  chips($("#aTabs"), tabs, show, "pending");
}

if (page === "contribute") contribute();
if (page === "admin") admin();
