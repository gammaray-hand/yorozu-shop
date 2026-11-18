#!/usr/bin/env python3
"""Offline synthetic CSV audit PoC. No network, credentials or third-party dependencies."""
import csv
import json
import sys
from collections import Counter
from decimal import Decimal, InvalidOperation
from pathlib import Path

ORDER_COLUMNS = ['注文ID','受注日','商品コード','商品名（原本）','数量','単価','金額（原本）']
MASTER_COLUMNS = ['商品コード','正式商品名','標準単価','単位']

def read_csv(path, required):
    with open(path, encoding='utf-8-sig', newline='') as stream:
        reader = csv.DictReader(stream)
        if not reader.fieldnames or any(key not in reader.fieldnames for key in required):
            raise ValueError(f'Missing required columns: {path}')
        return list(reader)

def decimal(value):
    try:
        return Decimal(str(value).replace(',', '').strip())
    except (InvalidOperation, ValueError):
        return None

def save_csv(path, headings, rows):
    with open(path,'w',encoding='utf-8-sig',newline='') as stream:
        writer=csv.DictWriter(stream,fieldnames=headings)
        writer.writeheader()
        writer.writerows(rows)

def audit(orders_file, master_file, output_dir):
    orders=read_csv(orders_file,ORDER_COLUMNS)
    masters=read_csv(master_file,MASTER_COLUMNS)
    index={}
    for row in masters:
        code=row['商品コード'].strip()
        if code in index:
            raise ValueError('Duplicate master code: '+code)
        index[code]=row
    issues=[]
    results=[]
    for line, row in enumerate(orders,start=2):
        code=row['商品コード'].strip()
        item=index.get(code)
        flags=[]
        def flag(kind, detail):
            flags.append(kind)
            issues.append({'元CSV行':line,'注文ID':row['注文ID'],'商品コード':code,'種別':kind,'内容':detail})
        quantity=decimal(row['数量'])
        price=decimal(row['単価'])
        amount=decimal(row['金額（原本）'])
        if item is None:
            flag('マスター未登録','マスターに商品コードがない')
        else:
            if row['商品名（原本）'] != item['正式商品名']:
                flag('名称差異（要確認）','商品名がマスターと異なる')
            standard=decimal(item['標準単価'])
            if price is not None and standard is not None and price != standard:
                flag('標準単価との差（要確認）','値引き等の可能性があるため確認')
        if quantity is None or quantity <= 0:
            flag('数量不正・未記入','数量が正の数でない')
        if price is None or price < 0:
            flag('単価不正・未記入','単価が無効')
        if amount is None:
            flag('金額不正・未記入','金額が無効')
        if quantity is not None and price is not None and amount is not None and quantity * price != amount:
            flag('数量×単価と金額の差','計算値と原本が不一致')
        results.append({**row,'検査状態':'確認要' if flags else '検査OK','確認項目数':len(flags),'検査内容':' / '.join(flags)})
    target=Path(output_dir)
    target.mkdir(parents=True,exist_ok=True)
    save_csv(target/'照合結果.csv',ORDER_COLUMNS+['検査状態','確認項目数','検査内容'],results)
    save_csv(target/'確認事項.csv',['元CSV行','注文ID','商品コード','種別','内容'],issues)
    summary={'orders':len(orders),'masters':len(masters),'rows_needing_review':sum(r['検査状態']=='確認要' for r in results),'issue_flags':len(issues),'flags_by_type':dict(Counter(i['種別'] for i in issues))}
    (target/'検品サマリー.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding='utf-8')
    return summary

if __name__=='__main__':
    if len(sys.argv)!=4:
        sys.exit('Usage: python audit.py orders.csv master.csv output_directory')
    print(json.dumps(audit(*sys.argv[1:]),ensure_ascii=False,indent=2))
