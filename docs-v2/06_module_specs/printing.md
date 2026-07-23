# Module · Printing

| Status | Phase | Service |
|---|---|---|
| 🟢 IMPLEMENTED | 8 | `PrintingService.gs` |

## 1. Purpose
ຄິວການພິມ + state machine + assign.

## 2. Features
ສ້າງວຽກ · queue · ເລື່ອນ status · assign ຜູ້ພິມ. **queued → printing → done → reprint / cancelled**.

## 3. UI (`printingView.html`)
ຟອມ ➕ (Order/ປະເພດ/ຈຳ) + ຄິວ + ປຸ່ມ status/assign.

## 4. API / Data
`apiPrintQueue` · `apiCreatePrint` · `apiSetPrintStatus` · `apiAssignPrint` → `PrintingService.*`. Sheet **PrintJobs** (`PRT-####`).

## 5. Relations
PrintJob *—1 Order.

## 6. Permissions
queue = Viewer+; create/status/assign = Staff+.

## 7. Acceptance
- [x] transition ຖືກ · assign · RBAC
