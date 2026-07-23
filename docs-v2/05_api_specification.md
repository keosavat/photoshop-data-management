# 05 · API Specification

**ຂໍ້ກຳນົດ API / Apps Script Endpoints** — PhotoShop Enterprise DAMS v2.0

| | |
|---|---|
| ສະຖານະ / Status | 🟡 DRAFT (skeleton) |
| ອ້າງອີງ / Based on | v1.0 `API_Documentation` |

---

## 1. ຮູບແບບ / Conventions
- [ ] Transport: `google.script.run` (client) / doGet/doPost (web)
- [ ] Request envelope, response envelope `{ok, data, error, meta}`
- [ ] Error codes, pagination, CSRF token

## 2. Services (9)
PhotoService · AlbumService · CustomerService · OrderService · DocumentService · ReportService · SearchService · SettingService · AuthService.

## 3. Endpoint template (ໃຊ້ຕໍ່ 1 method / per method)
### `PhotoService.upload(params)`
- **ຄຳອະທິບາຍ / Description:** …
- **Auth / Role:** …
- **Request:**
```json
{ "albumId": "ALB-0001", "file": "<blob>", "name": "..." }
```
- **Response:**
```json
{ "ok": true, "data": { "photoId": "PHO-0001" } }
```
- **Errors:** `E_UNAUTHORIZED`, `E_QUOTA`, …

- [ ] ຕື່ມທຸກ method ຂອງທຸກ service / add all methods for each service

## 4. Repository interfaces
DriveRepository · SheetRepository · CacheRepository — [ ] method signatures.

## 5. Auth & Security
- [ ] Google login, session/token, role permission, audit log (link §Security & 10)

---
*ຕໍ່ໄປ / Next:* [06 · Module Specifications](06_module_specs/00_index.md)
