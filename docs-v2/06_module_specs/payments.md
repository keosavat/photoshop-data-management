# Module · Payments

| Status | Phase | Service |
|---|---|---|
| 🟢 IMPLEMENTED | 8 | `PaymentService.gs` |

## 1. Purpose
ບັນທຶກການຊຳລະ + ສະຖານະຕໍ່ອໍເດີ້.

## 2. Features
record · list · payment status ຕໍ່ order (**paid / partial / unpaid**) ຈາກຍອດ vs ຊຳລະ.

## 3. UI (`paymentsView.html`)
ຟອມບັນທຶກ (Order/ຈຳນວນ/ວິທີ) + ຕາຕະລາງ.

## 4. API / Data
`apiPayments` · `apiRecordPayment` · `apiOrderPaymentStatus` → `PaymentService.*`. Sheet **Payments** (`PAY-####`).

## 5. Relations
Payment *—1 Order.

## 6. Permissions
list/status = Manager+; record = Staff+.

## 7. Acceptance
- [x] ຄິດ paid/partial/unpaid ຖືກ
- [x] RBAC
