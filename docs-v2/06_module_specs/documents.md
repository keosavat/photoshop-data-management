# Module · Documents

| Status | Phase | Service |
|---|---|---|
| 🟢 IMPLEMENTED | 4 | `DocumentService.gs` |

## 1. Purpose
ເກັບເອກະສານ (PDF/DOCX/…) ພ້ອມ **versioning**.

## 2. Features
Upload (base64) · list · history/versions · soft delete. ໂຟເດີ `Documents/{TYPE}/`.

## 3. UI (`documentsView.html`)
Upload ໄຟລ໌ + ຕາຕະລາງ + ເບິ່ງ history.

## 4. API / Data
`apiDocuments` · `apiUploadDocument` · `apiDocHistory` → `DocumentService.*`. Sheet **Documents** (`DOC-####`, version, history JSON).

## 5. Relations
Document *—1 Customer/Order (optional).

## 6. Permissions
list = Viewer+; upload = Staff+; delete = Manager+.

## 7. Acceptance
- [x] version+1 ຕໍ່ upload ໃໝ່
- [x] history log · RBAC
