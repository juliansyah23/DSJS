/**
 * Mengonversi `detail.json` (hasil scrape SIMPONIE Tangerang Selatan, berisi HTML mentah)
 * menjadi data terstruktur & ringan: `src/app/perizinan.json`.
 *
 * Pemakaian (dari folder frontend):
 *   npm run perizinan:build
 *   node scripts/build-perizinan.mjs [path/ke/detail.json]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const input = resolve(process.argv[2] ?? resolve(here, "../../detail.json"));
const output = resolve(here, "../src/app/perizinan.json");

const ENTITIES = { nbsp: " ", amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", ndash: "–", mdash: "—", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", hellip: "…", bull: "•" };

const decode = (s) =>
  s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === "#") {
      const code = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : m;
    }
    return ENTITIES[e.toLowerCase()] ?? m;
  });

const clean = (s) => decode(s.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();

/** Ambil link <a href> (http/https saja) dari potongan HTML. */
const extractLinks = (html) => {
  const links = [];
  for (const m of html.matchAll(/<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const href = decode(m[1]).trim();
    if (!/^https?:\/\//i.test(href)) continue;
    if (links.some((l) => l.href === href)) continue;
    links.push({ label: clean(m[2]) || "Buka tautan", href });
  }
  return links;
};

/** HTML umum -> daftar baris teks (+ link bila ada). */
const toLines = (html) => {
  const marked = html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li[^>]*>/gi, "\n• ")
    .replace(/<\/(p|div|li|tr|h[1-6]|ul|ol|table)>/gi, "\n")
    .replace(/<\/td>/gi, " ");
  const lines = [];
  let pendingNumber = "";
  for (const chunk of marked.split("\n")) {
    const text = clean(chunk);
    if (!text || text === "•") continue;
    // Nomor langkah yang berdiri sendiri ("1", "2.") digabung ke baris berikutnya.
    if (/^\d+\.?$/.test(text)) { pendingNumber = text.replace(/\.$/, "") + ". "; continue; }
    const links = extractLinks(chunk);
    const full = pendingNumber + text;
    pendingNumber = "";
    lines.push(links.length ? { text: full, links } : { text: full });
  }
  return lines;
};

/** Tab syarat: dikelompokkan per "Peruntukan" + "Jenis Permohonan". */
const parseSyarat = (html) => {
  const parts = html.split(/<p class="panel-title">/i).slice(1);
  const groups = [];
  for (const part of parts) {
    const end = part.indexOf("</p>");
    const title = clean(part.slice(0, end));
    const peruntukan = (title.match(/Peruntukan\s*:\s*(.*?)\s*(?:Jenis Permohonan|$)/i)?.[1] ?? title).trim();
    const jenisPermohonan = (title.match(/Jenis Permohonan\s*:\s*(.*)$/i)?.[1] ?? "").trim();
    const items = [];
    for (const block of part.slice(end).split(/<div class="list-group-item media">/i).slice(1)) {
      const body = block.match(/<div class="media-body">([\s\S]*?)<div class="media-right">/i)?.[1] ?? "";
      const status = clean(block.match(/text-caption">([\s\S]*?)<\/div>/i)?.[1] ?? "");
      const text = clean(body);
      if (!text) continue;
      const links = extractLinks(body);
      items.push({ text, status: status || "Wajib", ...(links.length ? { links } : {}) });
    }
    if (items.length) groups.push({ peruntukan, jenisPermohonan, items });
  }
  return groups;
};

/** Cari ringkasan (output, masa berlaku, biaya) dari teks deskripsi. */
const summary = (lines) => {
  const find = (re) => {
    for (const { text } of lines) {
      const m = text.match(re);
      if (m) return m[1].replace(/^[:\s]+/, "").trim();
    }
    return "";
  };
  return {
    output: find(/^Output\s*:?\s*(.+)$/i),
    masaBerlaku: find(/^Masa\s*Berlaku\s*:?\s*(.+)$/i),
    biaya: find(/^Biaya\s*:?\s*(.+)$/i),
  };
};

const raw = JSON.parse(readFileSync(input, "utf8"));
const tab = (entry, id) => entry.tabs?.find((t) => t.id === id)?.content ?? "";
const ALLOWED_PERMIT_VALUES = new Set(["128", "263", "264", "267", "269", "279", "449"]);

const result = raw.filter((entry) => ALLOWED_PERMIT_VALUES.has(String(entry.value))).map((entry) => {
  const deskripsi = toLines(tab(entry, "deskripsi"));
  // Baris pertama deskripsi biasanya judul (sama dengan nama izin) -> buang.
  if (deskripsi[0] && deskripsi[0].text.toLowerCase() === entry.name.trim().toLowerCase()) deskripsi.shift();
  return {
    value: String(entry.value),
    name: entry.name.trim(),
    url: entry.url ?? "",
    daftarUrl: entry.daftar_sekarang?.url ?? entry.daftar_sekarang?.href ?? "",
    ...summary(deskripsi),
    deskripsi,
    dasarHukum: toLines(tab(entry, "dasar_hukum")),
    prosedur: toLines(tab(entry, "prosedur")),
    syarat: parseSyarat(tab(entry, "syarat")),
  };
});

result.sort((a, b) => a.name.localeCompare(b.name, "id"));
writeFileSync(output, JSON.stringify(result));

const kb = (n) => `${(n / 1024).toFixed(0)} KB`;
console.log(`✔ ${result.length} jenis perizinan -> ${output} (${kb(Buffer.byteLength(JSON.stringify(result)))})`);
for (const r of result) {
  if (!r.syarat.length) console.warn(`  ! ${r.value} ${r.name}: tidak ada grup syarat terdeteksi`);
}