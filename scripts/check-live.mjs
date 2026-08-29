import { validateProducts } from "./catalog.mjs";

const base = process.argv[2] || "https://gammaray-hand.github.io/yorozu-shop/";
const timeoutMs = 15000;

async function check(url, label, options = {}) {
  const response = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(timeoutMs), ...options });
  if (!response.ok) throw new Error(`${label}: HTTP ${response.status}`);
  return response;
}

const page = await (await check(base, "公開ページ")).text();
if (!page.includes('id="products"') || !page.includes('rel="sponsored noopener"')) {
  throw new Error("公開ページ: 商品棚またはPRリンク属性を確認できません。 ");
}

const productsUrl = new URL("data/products.json", base);
const products = await (await check(productsUrl, "商品データ", { cache: "no-store" })).json();
const catalogErrors = validateProducts(products);
if (catalogErrors.length) throw new Error(catalogErrors.join("\n"));
const failures = [];

await Promise.all(products.flatMap(product =>
  [["画像", product.image], ["商品リンク", product.url]].map(async ([kind, url]) => {
    try {
      await check(url, `${product.name} ${kind}`, { method: "HEAD" });
    } catch (error) {
      failures.push(error.message);
    }
  })
));

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log(`OK: 公開ページ、${products.length}商品、全画像、全商品リンクが応答しました。`);
