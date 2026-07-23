# 08 · Deployment & Release Guide

**ຄູ່ມື Deploy** — PhotoShop Enterprise DAMS v2.0 (clasp + Apps Script Web App)

| | |
|---|---|
| ສະຖານະ / Status | 🟢 DEPLOYED (Version 5+) |

---

## 1. ຕິດຕັ້ງເຄື່ອງມື / Prerequisites
```bash
npm install -g @google/clasp
clasp login
```

## 2. Push ໂຄດ / Push source
ຢູ່ໂຟເດີ `app-v2/` (ມີ `.clasp.json` ຊີ້ `rootDir: ./src`):
```bash
clasp create --type standalone --title "PhotoShop Enterprise DAMS v2" --rootDir ./src   # ຄັ້ງທຳອິດ
clasp push -f
```
> ໝາຍເຫດ: manifest `appsscript.json` ຢູ່ໃນ `src/`. `.claspignore` ບໍ່ຄວນ exclude ມັນ.

## 3. Bootstrap DB (ໃນ Apps Script editor)
1. **Project Settings → Script Properties** → ເພີ່ມ `SHEET_ID` = ID ຂອງ Google Sheet DB.
2. Editor → ເລືອກ function `setupDatabase` → **Run** → authorize (Review permissions → Allow).
   - ຜົນ: `{ sheets:11, ownerSeeded:true }` — 11 tabs + ເຈົ້າເປັນ Owner.
3. ເລືອກ `setupDriveRoot` → **Run** — ສ້າງໂຟເດີ `PhotoShop-DAMS` + ເກັບ `ROOT_FOLDER_ID`.
4. (ທາງເລືອກ) `validateSchema` → `{ ok:true }`.

## 4. Deploy Web App
**Deploy → New deployment → Web app**:
- **Execute as:** `Me` (single-owner) ຫຼື `User accessing the web app` (multi-user RBAC).
- **Who has access:** `Only myself` ຫຼື `Anyone with Google account` (ໃຫ້ພະນັກງານໃຊ້).
- ໄດ້ **Web app URL** (`.../exec`).

ອັບເດດພາຍຫຼັງ: `clasp push -f` → **Deploy → Manage deployments → Edit ✏️ → Version: New version → Deploy**.

## 5. ເປີດ access ພະນັກງານ (multi-user, Gmail ທຳມະດາ)
1. Deploy config = Execute as **User accessing** + Anyone with Google account.
2. **Share** DB Sheet + folder `PhotoShop-DAMS` ໃຫ້ email ພະນັກງານ (Editor).
3. ເພີ່ມ email ໃນ tab **Users** ພ້ອມ role.
> Tradeoff: staff ທີ່ share sheet ໄດ້ ສາມາດເປີດ sheet ໂດຍກົງ. ຖ້າຕ້ອງເຄັ່ງ ໃຫ້ໃຊ້ Google Workspace domain.

## 6. Rollback
**Manage deployments → Edit → Version → ເລືອກ version ເກົ່າ → Deploy**. ໂຄດເກົ່າຢູ່ໃນ clasp/GitHub history.

## 7. Release checklist
- [ ] `node test/run.js` ຜ່ານໝົດ (82/82)
- [ ] `clasp push` ສຳເລັດ
- [ ] `validateSchema()` = ok
- [ ] Web app URL ເປີດໄດ້ (dashboard render)
- [ ] Deploy config + shares ຖືກຕ້ອງ
- [ ] GitHub sync ຄົບ

---
*ຕໍ່ໄປ / Next:* [09 · User Manual](09_user_manual.md)
