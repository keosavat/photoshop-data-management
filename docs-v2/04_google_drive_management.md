# 04 · Google Drive Folder & File Management

**ການຈັດການ Google Drive** — PhotoShop Enterprise DAMS v2.0

| | |
|---|---|
| ສະຖານະ / Status | 🟡 DRAFT (skeleton) |
| ອ້າງອີງ / Based on | v1.0 `STEP4_GoogleDrive` |

---

## 1. ໂຄງສ້າງໂຟເດີ / Folder Structure
- [ ] Root folder ID (Script Property) → per-year / per-customer / per-album layout
```
/PhotoShop-DAMS/
  /Customers/{customer_id}/
  /Albums/{album_id}/
  /Documents/{type}/
  /Orders/{order_id}/
  /_Thumbnails/  /_RecycleBin/
```

## 2. ການສ້າງອັດຕະໂນມັດ / Auto-create
- [ ] Folder auto-create on first upload, idempotent

## 3. Permissions
- [ ] Folder permission model per role (link §Security)

## 4. ໄຟລ໌ / File handling
- [ ] Auto-rename convention · duplicate check (SHA-256) · metadata

## 5. Thumbnails
- [ ] Generation, size, cache location

## 6. Recycle Bin
- [ ] Soft-delete → restore → purge policy

## 7. Drive API notes
- [ ] Quotas, batching, retry, rate-limit

---
*ຕໍ່ໄປ / Next:* [05 · API Specification](05_api_specification.md)
