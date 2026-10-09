// node agent/models-check.test.mjs
import assert from "node:assert/strict";
import { checkChanges } from "./models-check.mjs";

const filler = Array.from({ length: 16 }, (_, i) => ({ id: `m${i}`, p: "open", name: `Open ${i}`, tier: "Open", best: "x", price: "free*" }));
const haiku4 = { id: "haiku", p: "anthropic", name: "Claude Haiku 4.5", tier: "Fast", best: "x", in: 1, out: 5 };
const haiku5 = { ...haiku4, name: "Claude Haiku 5.5", in: 0.1, out: 0.5 };
const catalog = [
  { id: "anthropic/claude-haiku-5.5", name: "Anthropic: Claude Haiku 5.5", pricing: { prompt: 0.0000001, completion: 0.0000005 } },
  { id: "anthropic/claude-haiku-5.5:batch", name: "Anthropic: Claude Haiku 5.5 (batch)", pricing: { prompt: 0.00000005, completion: 0.00000025 } },
];
const used = new Set(["haiku", "m0"]);

// a confirmed rename with catalog prices goes through, and is reported as a rename
let r = checkChanges([haiku4, ...filler], [haiku5, ...filler], catalog, used);
assert.deepEqual(r.problems, []);
assert.equal(r.renamed.length, 1);

// a price the catalog does not show is stopped
r = checkChanges([haiku4, ...filler], [{ ...haiku5, in: 0.2 }, ...filler], catalog, used);
assert.match(r.problems.join(), /does not match/);

// a model that is not in the catalog is stopped
r = checkChanges([haiku4, ...filler], [{ ...haiku5, name: "Claude Haiku 9" }, ...filler], catalog, used);
assert.match(r.problems.join(), /not found/);

// dropping a model that a task pick uses is stopped
r = checkChanges([haiku4, ...filler], filler, catalog, used);
assert.match(r.problems.join(), /used by a task pick/);

// a rewrite of many models at once is stopped; a wording-only edit needs no catalog proof
r = checkChanges([haiku4, ...filler], [haiku4, ...filler.map((m) => ({ ...m, best: "y" }))], catalog, used);
assert.match(r.problems.join(), /changed at once/);
r = checkChanges([haiku4, ...filler], [{ ...haiku4, best: "y" }, ...filler], catalog, used);
assert.deepEqual(r.problems, []);
// an "open" model swapped for one without downloadable weights is stopped (Mistral Small 4 -> Large 4, 9 Oct 2026)
const small = { id: "mistral", p: "open", name: "Mistral Small 4", tier: "Open", best: "x", price: "free*" };
const openCat = [
  { id: "mistralai/mistral-large-4-0", name: "Mistral: Mistral Large 4", pricing: { prompt: 0.00000068, completion: 0.00000209 } },
  { id: "mistralai/mistral-small-2603", name: "Mistral: Mistral Small 4", hugging_face_id: "mistralai/Mistral-Small-4-119B-2603", pricing: { prompt: 0, completion: 0 } },
  { id: "mistralai/mistral-small-2610", name: "Mistral: Mistral Small 5", hugging_face_id: "mistralai/Mistral-Small-5", pricing: { prompt: 0, completion: 0 } },
];
r = checkChanges([small, ...filler], [{ ...small, name: "Mistral Large 4" }, ...filler], openCat, new Set(["mistral"]));
assert.match(r.problems.join(), /no downloadable weights/);
r = checkChanges([small, ...filler], [{ ...small, name: "Mistral Small 5" }, ...filler], openCat, new Set(["mistral"]));
assert.deepEqual(r.problems, []);
r = checkChanges([small, ...filler], [{ ...small, name: "Mistral Tiny 9" }, ...filler], openCat, new Set(["mistral"]));
assert.match(r.problems.join(), /not found/);
console.log("models-check: ok");
