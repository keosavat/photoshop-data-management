# Module · Photos

| Status | Phase | Service |
|---|---|---|
| 🟢 IMPLEMENTED | 3 | `PhotoService.gs` |

## 1. Purpose
ອັບໂຫຼດ/ຈັດການຮູບ ໄປໂຟເດີກາງ `PhotoShop-DAMS/Albums/`.

## 2. Features
Upload form: **ລູກຄ້າ (select ຈາກ Customers) · ວັນທີ · ໄຟລ໌**. **SHA-256 dedup** · list · **thumbnail grid** · ຄົ້ນຫາ (ຊື່/ລູກຄ້າ). ຕໍ່ຮູບ: **ເບິ່ງ 👁 · ແຊ 🔗 · ພິມ 🖨 · ດາວໂຫຼດ ⬇**.

## 3. UI (`photosView.html`)
ຟອມ (customer/date/file) → Upload; grid ຮູບຈິງ (1:1) + ປຸ່ມ action 4 ອັນ/ຮູບ + search.

## 4. API / Data
`apiPhotos` · `apiUploadPhoto(name,dataBase64,customer_id,customer_name,photo_date,album_id?)` · `apiShareLink(fileId)` → `PhotoService.*`. Sheet **Photos** (`PHO-####`; +`customer_name`,`photo_date`; `thumb_url` computed). ເບິ່ງ [04 Drive](../04_google_drive_management.md).

## 5. Relations
Photo *—1 Album/Customer.

## 6. Permissions
list = Viewer+; upload/delete = Staff+; share = Viewer+ (ຕັ້ງ anyone-with-link view).

## 7. Acceptance
- [x] customer + date ເກັບ/ສະແດງ
- [x] dedup · thumbnail · view/share/print/download
- [x] RBAC
