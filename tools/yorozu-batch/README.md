# よろず・夜間100件照合クラウド試験（PoC）

これは架空の商品マスター6件・受注明細100件だけを使う検証です。実顧客情報、API、秘密鍵、外部送信はありません。

- Python標準ライブラリのみで入力CSVを照合し、確認事項と検品サマリーを作成。
- 異常を仕込んだ5行を検出。1行には2つのフラグがあり計6フラグ。検査OKは95行。
- 同じデータを2回処理した決定性、原本ハッシュ不変、必須列不足時の停止を自動テスト。
- GitHub-hosted ActionsのPR時・手動起動のみ。スケジュールなし、自宅PCとの接続なし。
- 出力は7日保持のGitHub Artifact。公開サイト・main・商品ページは変更しません。

```sh
python -m unittest discover -s tools/yorozu-batch -p 'test_*.py' -v
python tools/yorozu-batch/audit.py tools/yorozu-batch/fixtures/orders_100.csv tools/yorozu-batch/fixtures/master_6.csv out
```

実受託に必要な自動化許可・入出力の機密保護・保管期間・異常再検査・契約・採算は別途検証が必要です。
