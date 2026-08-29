import { readFile, writeFile } from "node:fs/promises";
import { normalizeProduct, validateProducts } from "./catalog.mjs";

const inputPath = process.argv[2];
if (!inputPath) {
  console.error("使い方: node scripts/add-products.mjs <追加商品JSON>");
  process.exit(1);
}

const catalogUrl = new URL("../data/products.json", import.meta.url);
const current = JSON.parse(await readFile(catalogUrl, "utf8"));
const raw = JSON.parse(await readFile(inputPath, "utf8"));
const candidates = (Array.isArray(raw) ? raw : [raw]).map(normalizeProduct);
const added = [];
const skipped = [];

for (const product of candidates) {
  const duplicate = current.some(item => item.name === product.name || item.url === product.url);
  if (duplicate) {
    skipped.push({ name: product.name || "名称不明", reason: "商品名またはURLが既存商品と重複" });
    continue;
  }
  const errors = validateProducts([product]);
  if (errors.length) {
    skipped.push({ name: product.name || "名称不明", reason: errors.join(" / ") });
    continue;
  }
  current.push(product);
  added.push(product.name);
}

const catalogErrors = validateProducts(current);
if (catalogErrors.length) {
  console.error(catalogErrors.join("\n"));
  process.exit(1);
}

if (added.length) await writeFile(catalogUrl, `${JSON.stringify(current, null, 2)}\n`);
console.log(JSON.stringify({ added, skipped, total: current.length }, null, 2));
