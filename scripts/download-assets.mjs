// Mirrors the asset manifest into public/, generating placeholders for any
// file that can't be fetched. Safe to re-run: existing files are skipped.
//
//   node scripts/download-assets.mjs

import { mkdir, writeFile, access } from "node:fs/promises";
import { dirname, join, extname } from "node:path";
import { ORIGIN, ASSETS } from "./assets-manifest.mjs";

const OUT_ROOT = new URL("../public/", import.meta.url).pathname;
const CONCURRENCY = 6;
const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  Referer: `${ORIGIN}/`,
};

const exists = (p) => access(p).then(() => true, () => false);

const placeholderSVG = (label) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
  <rect width="1200" height="800" fill="#0d0d0d"/>
  <rect x="1" y="1" width="1198" height="798" fill="none" stroke="#222" stroke-width="2"/>
  <text x="600" y="390" fill="#444" font-family="monospace" font-size="28" text-anchor="middle">PLACEHOLDER</text>
  <text x="600" y="430" fill="#333" font-family="monospace" font-size="16" text-anchor="middle">${label}</text>
</svg>`;

const missing = [];
let done = 0;
let skipped = 0;

async function fetchOne(entry) {
  const savePath = entry.split("?")[0];
  const dest = join(OUT_ROOT, savePath);
  if (await exists(dest)) {
    skipped++;
    return;
  }
  await mkdir(dirname(dest), { recursive: true });
  try {
    const res = await fetch(`${ORIGIN}/${entry}`, { headers: HEADERS });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length === 0) throw new Error("empty body");
    await writeFile(dest, buf);
    done++;
    console.log(`ok   ${savePath} (${(buf.length / 1024).toFixed(0)}kb)`);
  } catch (err) {
    missing.push({ path: savePath, error: String(err.message ?? err) });
    const ext = extname(savePath).toLowerCase();
    // Images get a visible placeholder; videos are listed for manual replacement.
    if ([".webp", ".jpg", ".jpeg", ".png"].includes(ext)) {
      await writeFile(dest.replace(ext, ".svg"), placeholderSVG(savePath));
    }
    console.warn(`MISS ${savePath}: ${err.message ?? err}`);
  }
}

const queue = [...ASSETS];
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length) await fetchOne(queue.shift());
  })
);

await writeFile(
  join(OUT_ROOT, "..", "missing-assets.json"),
  JSON.stringify(missing, null, 2)
);
console.log(
  `\ndownloaded ${done}, skipped ${skipped}, missing ${missing.length} (see missing-assets.json)`
);
