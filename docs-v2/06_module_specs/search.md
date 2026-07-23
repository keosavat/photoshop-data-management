# Module · Search

| Status | Phase | Service |
|---|---|---|
| 🟢 IMPLEMENTED | 9 | `SearchService.gs` |

## 1. Purpose
ຄົ້ນຫາຂ້າມ module.

## 2. Features
ຄຳຄົ້ນ → ຜົນຈັດກຸ່ມ (Customers/Photos/Documents/Orders) — ກັ່ນຕາມ role.

## 3. UI (`searchView.html`)
ຊ່ອງຄົ້ນ + ຜົນແຍກກຸ່ມ.

## 4. API / Data
`apiSearch(q)` → `SearchService.*`. ອ່ານຫຼາຍ Sheet.

## 5. Permissions
ຜົນສະແດງສະເພາະ entity ທີ່ role ເບິ່ງໄດ້.

## 6. Acceptance
- [x] ຈັດກຸ່ມຜົນ · RBAC filter
