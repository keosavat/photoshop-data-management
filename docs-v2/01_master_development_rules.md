# 01 · Master Development Rules / ກົດການພັດທະນາ

| Status | 🟢 IMPLEMENTED |
|---|---|

ກົດຫຼັກທີ່ບັງຄັບໃຊ້ໃນ `app-v2/`. ຖ້າມີຄວາມຂັດແຍ້ງ ໃຫ້ຍຶດເອກະສານນີ້.

---

## 1. ຫຼັກການ / Principles
- **Test-gated phases:** ແຕ່ລະ phase ຕ້ອງ `node test/run.js` = 82/82 green ກ່ອນໄປຕໍ່ / ກ່ອນ deploy.
- **Layered:** client → `api*` (Code.gs) → Service → Repository → Google (Sheets/Drive). ຫ້າມ client ຮຽກ Repository ໂດຍກົງ.
- **Config ກາງ:** ຄ່າຄົງທີ່ທັງໝົດຢູ່ `Config.gs` (ບໍ່ hardcode ຊື່ tab/prefix ກະຈາຍ).

## 2. Result envelope (ບັງຄັບ)
ທຸກ service ຕອບ `{ ok, data, error, meta }` — ບໍ່ throw ຂ້າມ layer. Error codes:
`E_VALIDATION · E_NOT_FOUND · E_UNAUTHORIZED · E_FORBIDDEN · E_DUPLICATE · E_QUOTA · E_INTERNAL`.

## 3. Security
- **RBAC ທຸກ mutation:** `Auth.guard(action)` ກ່ອນ write. 6 roles, permission matrix ໃນ `AuthService.gs`.
- **ບໍ່ເກັບ secret ໃນໂຄດ:** `SHEET_ID`, `ROOT_FOLDER_ID` ຢູ່ Script Properties.
- **ບໍ່ log ຂໍ້ມູນສ່ວນຕົວ** (email/ໂທ) ໃນ error message.

## 4. Data
- **ID:** prefix + zero-pad 4 (`CUS-0001`). ສ້າງຜ່ານ `Ids.next()`.
- **Validation:** `Validator` ກ່ອນ persist (required, type, enum).
- **Soft delete:** `status='deleted'` (ບໍ່ລຶບແຖວ). Recycle bin ສຳລັບໄຟລ໌.
- **Dedup:** ຮູບ = SHA-256; ຊ້ຳ → return record ເກົ່າ.

## 5. Naming
- Files: `PascalCase.gs` (service), `camelCaseView.html` (view).
- Functions: `apiXxx` (client-callable), `setupXxx` (bootstrap), private = trailing `_`.
- Constants UPPER_SNAKE; Sheet tabs PascalCase.
- Style: 2-space indent, semicolons, JSDoc ເທິງ public function.

## 6. Git / release
- Commit ຕໍ່ phase, message ບອກ scope + test count.
- Push ຂຶ້ນ GitHub ຫຼັງ test ຜ່ານ.
- Deploy = `clasp push -f` → new version (ເບິ່ງ [08](08_deployment_release_guide.md)).

## 7. Definition of Done
Code + test (82/82) + docs ອັບເດດ + commit/push + deploy version ໃໝ່.

## 8. ຫ້າມ / Don't
- ຫ້າມ push ຖ້າ test ບໍ່ຜ່ານ.
- ຫ້າມ client ຮຽກ Repository/SpreadsheetApp ໂດຍກົງ.
- ຫ້າມ hardcode SHEET_ID / folder id.

---
*ຕໍ່ໄປ / Next:* [02 · UI/UX Design System](02_uiux_design_system.md)
