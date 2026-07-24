# Module · Documents

| Status | Phase | Service |
|---|---|---|
| 🟢 IMPLEMENTED | 4 | `DocumentService.gs` |

## 1. Purpose
ເກັບເອກະສານ (PDF/DOCX/…) ພ້ອມ **versioning**, ຈັດ**ໝວດ** ແລະ **ຄົ້ນຫາ**ໄດ້.

## 2. Features
Upload form: **ໝວດ (datalist — ເພີ່ມໃໝ່ໄດ້) · ຊື່ເອກະສານ · ໄຟລ໌** (type auto ຈາກ ext). List: filter ຕາມໝວດ + search ຕາມຊື່. ຕໍ່ແຖວ: **ເບິ່ງ 👁 · ແຊ 🔗 · ພິມ 🖨 · ດາວໂຫຼດ ⬇**. version+history.

## 3. UI (`documentsView.html`)
ຟອມ (category/name/file) + ຕາຕະລາງ (category/name/type/ver/date) + search/filter + action 4 ອັນ.

## 4. API / Data
`apiDocuments` · `apiUploadDocument(name,type,category,dataBase64)` · `apiDocHistory` · `apiShareLink(fileId)` → `DocumentService.*`. Sheet **Documents** (`DOC-####`, `category`, version, history JSON).

## 5. Relations
Document *—1 Customer/Order (optional).

## 6. Permissions
list/share = Staff+; upload = Editor+; delete = Manager+.

## 7. Acceptance
- [x] ໝວດ addable + search
- [x] version+history · view/share/print/download
- [x] RBAC
