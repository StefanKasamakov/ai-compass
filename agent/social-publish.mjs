// Posts the approved Instagram drafts whose time has come (social_posts, status 'approved', publish_at <= now)
// to Instagram, and the same pictures to the Facebook Page. Runs hourly from .github/workflows/social.yml.
// Needs SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, META_PAGE_TOKEN, META_PAGE_ID, META_IG_USER_ID.
// The pictures are already public (whichaimap.com/social/...), so Instagram fetches them by URL.
import { createClient } from "@supabase/supabase-js";

const G = "https://graph.facebook.com/v23.0";
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, META_PAGE_TOKEN: TOKEN, META_PAGE_ID: PAGE, META_IG_USER_ID: IG } = process.env;
if (!SUPABASE_URL || !TOKEN || !IG) { console.log("social-publish: Instagram is not connected yet, nothing to do"); process.exit(0); }
const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(method, path, params = {}) {
  const body = new URLSearchParams({ ...params, access_token: TOKEN });
  const r = await fetch(method === "GET" ? `${G}/${path}?${body}` : `${G}/${path}`, method === "GET" ? {} : { method, body });
  const j = await r.json();
  if (j.error) throw new Error(`${path}: ${j.error.message}`);
  return j;
}
async function ready(id) {
  for (let i = 0; i < 30; i++) {
    const s = await api("GET", id, { fields: "status_code" });
    if (s.status_code === "FINISHED") return;
    if (s.status_code === "ERROR" || s.status_code === "EXPIRED") throw new Error(`Instagram could not process ${id}`);
    await sleep(5000);
  }
  throw new Error("Instagram processing timed out");
}
async function instagram(p) {
  let id;
  if (p.images.length === 1) id = (await api("POST", `${IG}/media`, { image_url: p.images[0], caption: p.body })).id;
  else {
    const kids = [];
    for (const url of p.images.slice(0, 10)) kids.push((await api("POST", `${IG}/media`, { image_url: url, is_carousel_item: "true" })).id);
    for (const k of kids) await ready(k);
    id = (await api("POST", `${IG}/media`, { media_type: "CAROUSEL", children: kids.join(","), caption: p.body })).id;
  }
  await ready(id);
  const mid = (await api("POST", `${IG}/media_publish`, { creation_id: id })).id;
  return (await api("GET", mid, { fields: "permalink" })).permalink || mid;
}
async function facebook(p) {
  const ids = [];
  for (const url of p.images.slice(0, 10)) ids.push((await api("POST", `${PAGE}/photos`, { url, published: "false" })).id);
  const post = await api("POST", `${PAGE}/feed`, { message: `${p.body}\n\n${p.link}`, ...Object.fromEntries(ids.map((id, i) => [`attached_media[${i}]`, JSON.stringify({ media_fbid: id })])) });
  return `https://www.facebook.com/${post.id}`;
}

const { data, error } = await sb.from("social_posts").select("*").eq("channel", "instagram").eq("status", "approved").lte("publish_at", new Date().toISOString()).order("publish_at").limit(1);
if (error) throw new Error(error.message);
// ponytail: one post per run, so a backlog after a pause goes out an hour apart instead of all at once
for (const p of data) {
  try {
    const ig = await instagram(p);
    const fb = PAGE ? await facebook(p).catch((e) => { console.warn(`[facebook] ${e.message}`); return ""; }) : "";
    await sb.from("social_posts").update({ status: "posted", posted_url: ig, error: fb ? null : "Facebook copy failed", handled_at: new Date().toISOString() }).eq("id", p.id);
    console.log(`social-publish: "${p.title}" -> ${ig}${fb ? ` and ${fb}` : ""}`);
  } catch (e) {
    await sb.from("social_posts").update({ status: "failed", error: e.message }).eq("id", p.id);
    console.error(`social-publish: "${p.title}" failed: ${e.message}`);
    process.exitCode = 1;
  }
}
if (!data.length) console.log("social-publish: nothing due");
