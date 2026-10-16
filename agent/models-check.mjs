// Decides whether a proposed model-list change can go live without a human.
// Returns the reasons it cannot; an empty list means every price was confirmed against the catalog,
// every model a task pick uses still exists, and the change is small.
const norm = (s = "") => s.toLowerCase().replace(/^[^:]+:\s*/, "").replace(/[^a-z0-9.]+/g, " ").trim();
const usd = (perToken) => +(perToken * 1e6).toFixed(2);

// The AI only sees and returns the fields it is asked for (aiKeys). For a model it kept (same id and name), carry over
// the curated extras it never saw (lockPrice, src), and with lockPrice keep the official price over the catalog's.
export function keepCurated(beforeList, aiKeys, afterList) {
  const before = Object.fromEntries(beforeList.map((m) => [m.id, m]));
  const locked = [];
  const clean = afterList.map((m) => {
    const b = before[m.id];
    if (!b || b.name !== m.name) return m;
    // keep the curated key order, so an unchanged model also serializes unchanged
    const keys = [...new Set([...Object.keys(b), ...Object.keys(m)])].filter((k) => k in m || !aiKeys.includes(k));
    const out = Object.fromEntries(keys.map((k) => [k, k in m ? m[k] : b[k]]));
    if (b.lockPrice && ["in", "out", "price"].some((k) => out[k] !== b[k])) {
      for (const k of ["in", "out", "price"]) if (k in b) out[k] = b[k]; else delete out[k];
      locked.push(b.name);
    }
    return out;
  });
  return { clean, locked };
}

export function checkChanges(beforeList, afterList, catalogRaw, usedIds) {
  const before = Object.fromEntries(beforeList.map((m) => [m.id, m]));
  const after = Object.fromEntries(afterList.map((m) => [m.id, m]));
  const touched = afterList.filter((m) => JSON.stringify(m) !== JSON.stringify(before[m.id]));
  const removed = beforeList.filter((m) => !after[m.id]);
  const renamed = touched.filter((m) => before[m.id] && before[m.id].name !== m.name);
  const problems = [];
  for (const id of usedIds) if (!after[id]) problems.push(`\`${id}\` is used by a task pick but is gone from the list`);
  if (afterList.length < 15 || afterList.length > 30) problems.push(`the list would have ${afterList.length} models (expected 15-30)`);
  if (touched.length + removed.length > 4) problems.push(`${touched.length + removed.length} models changed at once (auto-apply allows up to 4)`);
  if (new Set(afterList.map((m) => m.id)).size !== afterList.length) problems.push("duplicate ids");
  for (const m of touched) {
    const b = before[m.id];
    const newModel = !b || b.name !== m.name;
    if (!newModel && b.in === m.in && b.out === m.out) continue; // wording-only edits need no catalog proof
    const c = catalogRaw.find((x) => !x.id.includes(":") && norm(x.name) === norm(m.name));
    if (!c) { problems.push(`"${m.name}" was not found in the OpenRouter catalog`); continue; }
    // the "open" group is for models anyone can download: the catalog must link the weights
    if (m.p === "open" && newModel && !c.hugging_face_id) { problems.push(`"${m.name}" has no downloadable weights listed, so it does not belong under open models`); continue; }
    if (m.in == null) continue; // open-weight models are listed as "free*", not by API price
    const cin = usd(c.pricing.prompt), cout = usd(c.pricing.completion);
    if (Math.abs(cin - m.in) > 0.005 || Math.abs(cout - m.out) > 0.005) problems.push(`"${m.name}" price ${m.in}/${m.out} does not match the catalog ${cin}/${cout}`);
  }
  return { problems, touched, removed, renamed };
}
