# Module · Albums

| Status | Phase | Service |
|---|---|---|
| 🟢 IMPLEMENTED | 4 | `AlbumService.gs` |

## 1. Purpose
ຈັດກຸ່ມຮູບເປັນອະລະບໍ້າຕໍ່ລູກຄ້າ.

## 2. Features
ສ້າງ · list · ຜູກ Customer. ໂຟເດີ Drive ຕໍ່ album.

## 3. UI (`albumsView.html`)
ຟອມ ➕ (ຊື່ + Customer ID) + ລາຍການ.

## 4. API / Data
`apiAlbums` · `apiCreateAlbum` → `AlbumService.*`. Sheet **Albums** (`ALB-####`).

## 5. Relations
Album 1—* Photos; Album *—1 Customer.

## 6. Permissions
list = Viewer+; create = Staff+.

## 7. Acceptance
- [x] ID auto · validation · RBAC
