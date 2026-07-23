# Module · Customers

| Status | Phase | Service |
|---|---|---|
| 🟢 IMPLEMENTED | 5 | `CustomerService.gs` |

## 1. ຈຸດປະສົງ / Purpose
ຈັດການຂໍ້ມູນລູກຄ້າ / customer records.

## 2. Features
ເພີ່ມ · ແກ້ໄຂ · ລຶບ (soft) · ລາຍການ. ຊື່ · ໂທ · email · ທີ່ຢູ່ · tags.

## 3. UI (`customersView.html`)
ຕາຕະລາງລູກຄ້າ + ຟອມ ➕ ເພີ່ມ (ຊື່/ໂທ/email).

## 4. API / Data
`apiCustomers` · `apiCreateCustomer` · `apiUpdateCustomer` · `apiDeleteCustomer` → `CustomerService.*`. Sheet **Customers** (`CUS-####`). ເບິ່ງ [03 Schema](../03_database_sheets_schema.md), [05 API](../05_api_specification.md).

## 5. Relations
Customer 1—* Albums / Orders / Payments.

## 6. Permissions
list = Viewer+; create/update = Staff+; delete = Manager+.

## 7. Acceptance
- [x] ID auto `CUS-0001`
- [x] validation (required name)
- [x] soft delete (status)
- [x] RBAC guard
