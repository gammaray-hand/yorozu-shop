const requiredFields = ["name", "short", "image", "url", "shop"];

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
    if (product.url && !isRakutenAffiliateUrl(product.url)) {
      errors.push(`${label}: url は楽天公式のアフィリエイトURLではありません。`);
    }
    if (product.image && !product.image.startsWith("https://")) {
      errors.push(`${label}: image は https URL にしてください。`);
    }
    if (names.has(product.name)) errors.push(`${label}: 商品名が重複しています。`);
    if (urls.has(product.url)) errors.push(`${label}: 商品リンクが重複しています。`);
    names.add(product.name);
    urls.add(product.url);
  });
  return errors;
}

function isRakutenAffiliateUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && (
      (url.hostname === "a.r10.to" && /^\/[A-Za-z0-9]+$/.test(url.pathname)) ||
      (url.hostname === "hb.afl.rakuten.co.jp" && url.pathname.startsWith("/hgc/"))
    );
  } catch {
    return false;
  }
}

export function normalizeProduct(product) {
  return Object.fromEntries(requiredFields.map(field => [field, String(product[field] ?? "").trim()]));
}
