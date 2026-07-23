# Module · Dashboard

| Status | Phase | Service |
|---|---|---|
| 🟢 IMPLEMENTED | 1 | `DashboardService.gs` |

## 1. Purpose
ໜ້າພາບລວມ + role ຜູ້ໃຊ້.

## 2. Features
KPI (ຮູບ/ລູກຄ້າ/ອໍເດີ້/ລາຍຮັບ) · quick actions · activity timeline · ບົດບາດ.

## 3. UI (`dashboard.html`)
KPI cards + quick actions + timeline (bilingual).

## 4. API / Data
`getDashboard()` → `DashboardService.*` (aggregate ຫຼາຍ Sheet).

## 5. Permissions
Viewer+ (ທຸກຄົນທີ່ login).

## 6. Acceptance
- [x] ຕົວເລກ live · role ສະແດງຖືກ
