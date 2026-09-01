const requiredFields = ["name", "short", "image", "url", "shop", "category"];
const supportedCategories = new Set(["desk", "gadget", "home", "outdoor"]);

export function validateProducts(products) {
  const errors = [];
  if (!Array.isArray(products)) return ["商品データの最上位は配列にしてください。"];

  const names = new Set();
  const urls = new Set();
  products.forEach((product, index) => {
    const label = `商品${index + 1}`;
    if (!product || typeof product !== "object" || Array.isArray(product)) {
      errors.push(`${label}: オブジェクトではありません。`);
      return;
    }
    for (const field of requiredFields) {
      if (typeof product[field] !== "string" || product[field].trim() === "") {
        errors.push(`${label}: ${field} が空です。`);
      }
    }
    if (product.url && !isSupportedAffiliateUrl(product.url)) {
      errors.push(`${label}: url は対応済みのアフィリエイトURLではありません。`);
    }
    if (product.image && !product.image.startsWith("https://")) {
      errors.push(`${label}: image は https URL にしてください。`);
    }
    if (product.category && !supportedCategories.has(product.category)) {
      errors.push(`${label}: category が未対応です。`);
    }
    if (names.has(product.name)) errors.push(`${label}: 商品名が重複しています。`);
    if (urls.has(product.url)) errors.push(`${label}: 商品リンクが重複しています。`);
    names.add(product.name);
    urls.add(product.url);
  });
  return errors;
}

function isSupportedAffiliateUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;

    const rakuten = (
      (url.hostname === "a.r10.to" && /^\/[A-Za-z0-9]+$/.test(url.pathname)) ||
      (url.hostname === "hb.afl.rakuten.co.jp" && url.pathname.startsWith("/hgc/"))
    );
    if (rakuten) return true;

    if (url.hostname === "px.a8.net" && url.pathname === "/svt/ejp") {
      const redirect = new URL(url.searchParams.get("a8ejpredirect") ?? "");
      return Boolean(url.searchParams.get("a8mat")) && redirect.protocol === "https:";
    }
    return false;
  } catch {
    return false;
  }
}

export function normalizeProduct(product) {
  return Object.fromEntries(requiredFields.map(field => [field, String(product[field] ?? "").trim()]));
}
