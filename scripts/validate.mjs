import { readFile } from "node:fs/promises";
import { validateProducts } from "./catalog.mjs";

const products = JSON.parse(await readFile(new URL("../data/products.json", import.meta.url), "utf8"));
const errors = validateProducts(products);

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`OK: ${products.length}商品。必須項目・URL形式・重複を確認しました。`);
