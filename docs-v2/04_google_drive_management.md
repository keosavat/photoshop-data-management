# 04 · Google Drive Folder & File Management

**ການຈັດການ Google Drive** — PhotoShop Enterprise DAMS v2.0

| | |
|---|---|
| ສະຖານະ / Status | 🟢 IMPLEMENTED |
| ອ້າງອີງ / Based on | `app-v2/src/repositories/DriveRepository.gs` |

---

## 1. Shared root folder
`setupDriveRoot()` ສ້າງໂຟເດີ `PhotoShop-DAMS` (ໃນ Drive ຂອງ Owner) ແລ້ວເກັບ ID ໃນ Script Property **`ROOT_FOLDER_ID`**. `DriveRepository.root()` ໃຊ້ id ນີ້ ຈຶ່ງ **ທຸກຄົນ upload ບ່ອນດຽວກັນ** (ບໍ່ໄປ Drive ສ່ວນຕົວ).

> multi-user (Execute-as-user): ຕ້ອງ **share ໂຟເດີ `PhotoShop-DAMS`** ໃຫ້ພະນັກງານ (Editor) ເພື່ອໃຫ້ script ແລ່ນເປັນເຂົາເຂົ້າໄດ້.

## 2. Folder layout (getOrCreateFolderPath — idempotent)
```
/PhotoShop-DAMS/
  /Albums/{album_id | _unsorted}/     ← photos
  /Documents/{TYPE}/                   ← documents by type
  /_RecycleBin/                        ← soft delete
```

## 3. Upload pipeline (PhotoService / DocumentService)
1. Client reads file → base64 → `apiUploadPhoto` / `apiUploadDocument`.
2. Server: `Utilities.base64Decode` → `Utilities.newBlob`.
3. **SHA-256 dedup** (photos): `Utilities.computeDigest(SHA_256, bytes)` → hex. ຖ້າ hash ຊ້ຳ (status≠deleted) → return record ເກົ່າ (`meta.deduped=true`), ບໍ່ອັບຊ້ຳ.
4. `getOrCreateFolderPath([...])` → `folder.createFile(blob)`.
5. ເກັບ `drive_file_id`, `sha256`, `size` ໃນ Sheet.

## 4. Versioning (documents)
`newVersion(id, {blob})` → upload ໄຟລ໌ໃໝ່, version+1, ບັນທຶກ `history` (JSON: version, drive_file_id, at).

## 5. Soft delete
`softDelete(file)` → ຍ້າຍໄປ `_RecycleBin/`. Sheet record `status='deleted'`. Restore = `status='active'`.

## 6. Thumbnails (🟢 implemented)
`PhotoService.list/get/upload` ຕິດ `thumb_url` = `https://drive.google.com/thumbnail?id={drive_file_id}&sz=w400`. Gallery (`photosView.html`) render `<img>` grid (aspect 1:1, object-fit cover, lazy-load) ພ້ອມ fallback 🖼️ ຖ້າໂຫຼດບໍ່ໄດ້. ໃຊ້ thumbnail ຂອງ Google Drive ໂດຍກົງ — ບໍ່ຕ້ອງເກັບໄຟລ໌ເສີມ (staff ຕ້ອງມີສິດ view ໂຟເດີ).

## 7. ຄວນເສີມ (future)
- Per-customer folder tree
- Quota/retry/rate-limit wrappers (see `core/` utils)

---
*ຕໍ່ໄປ / Next:* [05 · API Specification](05_api_specification.md)
