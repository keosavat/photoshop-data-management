# Module · Photos

| Status | Phase | Service |
|---|---|---|
| 🟢 IMPLEMENTED | 3 | `PhotoService.gs` |

## 1. Purpose
ອັບໂຫຼດ/ຈັດການຮູບ ໄປໂຟເດີກາງ `PhotoShop-DAMS/Albums/`.

## 2. Features
Upload (base64) · **SHA-256 dedup** · list · album ໃສ່. Soft delete → `_RecycleBin`.

## 3. UI (`photosView.html`)
ເລືອກໄຟລ໌ → Upload → grid ຮູບ.

## 4. API / Data
`apiPhotos` · `apiUploadPhoto` → `PhotoService.*`. Sheet **Photos** (`PHO-####`, ເກັບ sha256/drive_file_id/size). ເບິ່ງ [04 Drive](../04_google_drive_management.md).

## 5. Relations
Photo *—1 Album; Album *—1 Customer.

## 6. Permissions
list = Viewer+; upload/delete = Staff+.

## 7. Acceptance
- [x] dedup ຮູບຊ້ຳ (meta.deduped)
- [x] ໄປໂຟເດີກາງ (ROOT_FOLDER_ID)
- [x] RBAC
