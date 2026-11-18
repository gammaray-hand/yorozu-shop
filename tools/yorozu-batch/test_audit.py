import csv
import hashlib
import tempfile
import unittest
from pathlib import Path
from audit import audit

BASE=Path(__file__).parent
ORDERS=BASE/'fixtures/orders_100.csv'
MASTER=BASE/'fixtures/master_6.csv'

class BatchAuditTests(unittest.TestCase):
    def test_expected_100_rows_and_6_flags(self):
        original=[hashlib.sha256(p.read_bytes()).hexdigest() for p in (ORDERS,MASTER)]
        with tempfile.TemporaryDirectory() as tmp:
            s=audit(ORDERS,MASTER,tmp)
            self.assertEqual((s['orders'],s['masters'],s['rows_needing_review'],s['issue_flags']),(100,6,5,6))
            with open(Path(tmp)/'照合結果.csv',encoding='utf-8-sig',newline='') as f:
                result=list(csv.DictReader(f))
            self.assertEqual(len(result),100)
            self.assertEqual(sum(r['検査状態']=='確認要' for r in result),5)
        self.assertEqual(original,[hashlib.sha256(p.read_bytes()).hexdigest() for p in (ORDERS,MASTER)])
    def test_deterministic_outputs(self):
        with tempfile.TemporaryDirectory() as tmp:
            a,b=Path(tmp)/'a',Path(tmp)/'b'
            self.assertEqual(audit(ORDERS,MASTER,a),audit(ORDERS,MASTER,b))
            for name in ('照合結果.csv','確認事項.csv','検品サマリー.json'):
                self.assertEqual((a/name).read_bytes(),(b/name).read_bytes())
    def test_missing_columns_stop(self):
        with tempfile.TemporaryDirectory() as tmp:
            bad=Path(tmp)/'bad.csv'
            bad.write_text('注文ID,数量\n1,3\n',encoding='utf-8')
            target=Path(tmp)/'out'
            with self.assertRaises(ValueError): audit(bad,MASTER,target)
            self.assertFalse(target.exists())

if __name__=='__main__':
    unittest.main()
