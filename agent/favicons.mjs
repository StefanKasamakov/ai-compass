// Downloads a 128px icon for every app in data/apps.json into assets/favicons/<id>.png,
// so the site never calls a third-party icon service from the visitor's browser.
// Run: node agent/favicons.mjs   (skips icons that already exist)
import fs from "node:fs/promises";

const ROOT = new URL("../", import.meta.url);
const apps = JSON.parse(await fs.readFile(new URL("data/apps.json", ROOT), "utf8"));
await fs.mkdir(new URL("assets/favicons/", ROOT), { recursive: true });
let got = 0;
for (const a of apps) {
  const file = new URL(`assets/favicons/${a.id}.png`, ROOT);
  if (await fs.stat(file).then(() => true, () => false)) continue;
  const res = await fetch(`https://www.google.com/s2/favicons?domain=${encodeURIComponent(a.domain)}&sz=128`, { headers: { "user-agent": "Mozilla/5.0" } }).catch(() => null);
  if (!res?.ok) { console.warn(`no icon for ${a.id}`); continue; }
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 120) { console.warn(`tiny icon for ${a.id}, skipped`); continue; } // default globe placeholder
  await fs.writeFile(file, buf);
  got++;
}
console.log(`favicons: ${got} downloaded, ${apps.length} apps`);
