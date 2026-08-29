# よろず便利商店 Web商品棚

GitHub Pagesで公開する静的商品棚です。見た目は `index.html`、商品情報は `data/products.json` に分離しています。

## AI側の標準更新フロー

1. 商品名・紹介文・正規画像URL・楽天アフィリエイトURLを確認する。
2. `scripts/add-products.mjs` で商品を追加する。処理不能な1商品はスキップし、残りを継続する。
3. `npm run validate` で必須項目、URL形式、重複を検査する。
4. feature branchへ反映し、差分を確認してからmainへ反映する。
5. GitHub Pages反映後に `npm run check:live` を実行する。
6. 公開ページのPC幅・スマホ幅を目視確認する。

重大な誤り（不正なアフィリエイトURL、権利不明画像、既存サイト破損の可能性）は自動スキップせず停止します。

## 追加商品JSON

単品オブジェクトまたは配列を受け付けます。

```json
{
  "name": "商品名",
  "short": "紹介文",
  "image": "https://正規画像URL",
  "url": "https://a.r10.to/短縮コード",
  "shop": "楽天市場"
}
```

実行例：

```sh
node scripts/add-products.mjs /tmp/new-products.json
npm run validate
```

`url` は短縮URLのほか、楽天ウェブサービスが正式に返す `https://hb.afl.rakuten.co.jp/hgc/...` 形式にも対応しています。APIから `affiliateUrl` を取得できる環境では、短縮URLの手動取得は不要です。
