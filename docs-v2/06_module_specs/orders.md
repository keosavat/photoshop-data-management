# Module · Orders

| Status | Phase | Service |
|---|---|---|
| 🟢 IMPLEMENTED | 7 | `OrderService.gs` |

## 1. Purpose
ຈັດການອໍເດີ້ + state machine.

## 2. Features
ສ້າງ · list · ເລື່ອນ status. **new → in_progress → printing → delivery → complete / cancelled**.

## 3. UI (`ordersView.html`)
ຟອມ ➕ (Customer/ປະເພດ/ຍອດ) + ຕາຕະລາງ + ປຸ່ມ →status.

## 4. API / Data
`apiOrders` · `apiCreateOrder` · `apiSetOrderStatus` → `OrderService.*`. Sheet **Orders** (`ORD-####`) + **OrderItems** (`ITM-####`).

## 5. Relations
Order *—1 Customer; Order 1—* Items / Payments / PrintJobs.

## 6. Permissions
list = Viewer+; create/status = Staff+; cancel = Manager+.

## 7. Acceptance
- [x] transition ຖືກກົດ (state machine)
- [x] ID auto · RBAC
