# 05 · API Specification

**ຂໍ້ກຳນົດ API / Client-callable endpoints** — PhotoShop Enterprise DAMS v2.0

| | |
|---|---|
| ສະຖານະ / Status | 🟢 IMPLEMENTED |
| ອ້າງອີງ / Based on | `app-v2/src/Code.gs` |

---

## 1. Conventions
- **Transport:** client calls server via `google.script.run.withSuccessHandler(...)[fn](args)`. Wrapped by `DAMS.call(fn, ...args)` (returns a Promise).
- **Response envelope** (every service returns this):
```json
{ "ok": true, "data": {}, "error": null, "meta": {} }
```
On failure: `{ "ok": false, "data": null, "error": { "code": "E_...", "message": "..." } }`
- **Error codes:** `E_VALIDATION`, `E_NOT_FOUND`, `E_UNAUTHORIZED`, `E_FORBIDDEN`, `E_DUPLICATE`, `E_QUOTA`, `E_INTERNAL`.
- **RBAC:** every endpoint is guarded by `Auth.guard(action)` inside its service.

## 2. Web entry
| Function | Purpose |
|---|---|
| `doGet()` | serves `client/index` via HtmlService |
| `include(path)` | injects a client partial |
| `getDashboard()` | KPIs + role for the signed-in user |

## 3. Endpoints by module

### Customers
| Endpoint | Min role |
|---|---|
| `apiCustomers()` | Viewer |
| `apiCreateCustomer({name, phone?, email?, ...})` | Staff |
| `apiUpdateCustomer(id, patch)` | Staff |
| `apiDeleteCustomer(id)` | Manager |

### Albums
`apiAlbums()` (Viewer) · `apiCreateAlbum({name, customer_id?})` (Staff)

### Photos
| Endpoint | Min role |
|---|---|
| `apiPhotos(albumId?)` | Viewer |
| `apiUploadPhoto({name, mimeType, dataBase64, album_id?})` | Staff |

Upload decodes base64 → `Utilities.newBlob` → SHA-256 dedup → shared Drive folder.

### Documents
`apiDocuments()` (Staff) · `apiUploadDocument({name, type, dataBase64, category?})` (Editor) · `apiDocHistory(id)` (Staff)

### Orders
`apiOrders()` (Staff) · `apiCreateOrder({customer_id, type, total?})` (Staff) · `apiSetOrderStatus(id, next)` (Staff)

### Payments (Manager+)
`apiPayments(orderId)` · `apiRecordPayment({order_id, amount, method})` · `apiOrderPaymentStatus(orderId, total)`

### Printing
`apiPrintQueue()` (Staff) · `apiCreatePrint({order_id, type, qty?})` (Staff) · `apiSetPrintStatus(id, next)` (Staff) · `apiAssignPrint(id, user)` (Staff)

### Search
`apiSearch(query)` — returns only entity types the role may read.

### Reports (Manager+)
`apiReportOverview()` · `apiOrdersByStatus()`

### Settings / Users
`apiSettingsAll()` / `apiSetSetting(key, value)` (Admin+) · `apiListUsers()` / `apiAddUser({email, role, name?})` / `apiSetUserRole(email, role)` / `apiDeactivateUser(email)` (Owner)

## 4. Example
```js
// client
DAMS.call('apiCreateCustomer', { name: 'ນາງ ດາວ', phone: '+856 20 5551111' })
  .then(r => r.ok ? console.log(r.data.customer_id) : alert(r.error.code));
```

---
*ຕໍ່ໄປ / Next:* [06 · Module Specifications](06_module_specs/00_index.md)
