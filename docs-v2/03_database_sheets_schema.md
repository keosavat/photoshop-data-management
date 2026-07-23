# 03 · Database & Google Sheets Schema

**ໂຄງສ້າງຖານຂໍ້ມູນ / Data Schema** — PhotoShop Enterprise DAMS v2.0

| | |
|---|---|
| ສະຖານະ / Status | 🟡 DRAFT (skeleton) |
| ອ້າງອີງ / Based on | v1.0 `STEP3_Database` |

---

## 1. ພາບລວມ / Overview
Google Sheets = ຖານຂໍ້ມູນ (DB). ແຕ່ລະ tab = 1 table.
Each Sheet tab is one table. Access only via `SheetRepository`.

## 2. ຕາຕະລາງ / Tables
Customers · Albums · Orders · Payments · Documents · Settings · Logs.
(ແນະນຳເພີ່ມ / suggested: Photos, OrderItems, PrintJobs, Users, AuditLog.)

## 3. Schema ຕໍ່ຕາຕະລາງ / Per-table schema

ໃຊ້ template ນີ້ຕໍ່ 1 ຕາຕະລາງ / use this template per table:

### Customers
| Column | Type | Required | ຄຳອະທິບາຍ / Description | Example |
|---|---|---|---|---|
| `customer_id` | string (PK) | ✔ | | CUS-0001 |
| `name` | string | ✔ | | |
| `phone` | string | | | |
| `address` | string | | | |
| `birthday` | date | | | |
| `tags` | string[] | | | |
| `created_at` | datetime | ✔ | | |
| [ ] ຕື່ມ | | | | |

### Orders / Payments / Documents / Albums / Settings / Logs
- [ ] ຕື່ມ schema ຕາມ template ຂ້າງເທິງ / add each using the template above

## 4. ຄວາມສຳພັນ / Relationships
- [ ] Customer 1—* Orders · Order 1—* OrderItems · Order 1—* Payments · Album 1—* Photos
- [ ] ERD diagram (mermaid)

## 5. ID & Key strategy
- [ ] Prefix + zero-pad (CUS-, ALB-, ORD-, PAY-, DOC-), sequence source

## 6. Validation & Integrity
- [ ] Required fields, formats, unique keys, referential checks

## 7. Migration & Seed
- [ ] `createDatabase()` → `seedDatabase()` → `validateSchema()` (expect `{ok:true}`)

---
*ຕໍ່ໄປ / Next:* [04 · Google Drive Management](04_google_drive_management.md)
