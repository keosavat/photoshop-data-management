# 07 · Testing & QA Guide

| | |
|---|---|
| ສະຖານະ / Status | 🟢 IMPLEMENTED — 82/82 passing |

---

## 1. ວິທີ / How it works
Apps Script code (`.gs`) ບໍ່ແລ່ນນອກ Google. ຈຶ່ງໃຊ້ **Node harness ທີ່ mock Google services** (`test/mocks.js`): SpreadsheetApp, DriveApp, CacheService, Session, Utilities (base64, computeDigest, newBlob), PropertiesService.

`test/harness.js` ໂຫຼດທຸກ `.gs` ເຂົ້າ VM context ດຽວ (ຄື GAS global scope), ໃສ່ mocks + micro test framework, ແລ້ວແລ່ນແຕ່ລະ suite.

## 2. ແລ່ນ / Run
```bash
cd app-v2
node test/run.js
```
Output: ✓/✗ ຕໍ່ໄຟລ໌ + ຈຳນວນ assertion ຜ່ານ. exit code ≠ 0 ຖ້າມີ fail.

## 3. Coverage (18 suites, 82 assertions)
| Suite | ຄຸ້ມ |
|---|---|
| 01 foundation | Ids, Validator, Result, Sheet/Drive/Cache repos |
| 02 auth | 6 roles, permission matrix, guard |
| 03–09 | Customer, Photo, Order, Payment, Album, Document, Printing |
| 10–12 | Search, Report, Setting |
| 13 dashboard · 14 setup · 15–18 api | getDashboard, setupDatabase, all `api*` endpoints |
| 16 drive_upload | shared folder + base64 upload + dedup |

## 4. ຮູບແບບ test / Pattern
```js
test('name', function () {
  __setProp('SHEET_ID', 'TEST_SS');
  __seed('Customers', CUSTOMER_HEADERS, [ ... ]);
  __setUser('owner@test.la');
  var r = CustomerService.create({ name: 'A' });
  assertEqual(r.data.customer_id, 'CUS-0001');
});
```
Helpers: `__seed`, `__setUser`, `__setProp`, `__blob`, `assert`, `assertEqual`, `assertDeep`, `assertThrows`.

## 5. QA gate
Rule: ແຕ່ລະ phase ຕ້ອງ **82/82 green** ກ່ອນ deploy. Run before every `clasp push`.

## 6. UAT (ຕໍ່ໄປ)
- [ ] ທົດສອບແຕ່ລະ role ເປີດ web app ຈິງ (Owner/Manager/Editor/Staff/Viewer)
- [ ] Upload ຮູບ/ເອກະສານ → ກວດໃນ folder `PhotoShop-DAMS`
- [ ] ສ້າງ order → payment → print flow

---
*ຕໍ່ໄປ / Next:* [08 · Deployment](08_deployment_release_guide.md)
