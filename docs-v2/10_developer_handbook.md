# 10 · Developer Handbook / ຄູ່ມືນັກພັດທະນາ

| Status | 🟢 IMPLEMENTED |
|---|---|

---

## 1. Repo layout
```
app-v2/
  src/
    Config.gs Code.gs Setup.gs        ← config, api*, bootstrap
    core/         Ids Validator Result Log ...
    repositories/ SheetRepository DriveRepository CacheRepository
    services/     Auth Customer Photo Album Document Order
                  Payment Printing Search Report Setting Dashboard
    client/       index.html · css/style.html · js/*View.html
    appsscript.json
  test/  mocks.js harness.js run.js NN_*.test.js
  .clasp.json .claspignore
```

## 2. Architecture (layers)
```
client (google.script.run) → api*() in Code.gs → Service (rules+RBAC)
   → Repository (Sheet/Drive/Cache) → Google APIs
```
Service ຄືນ Result envelope; `api*` ເປັນ thin wrapper.

## 3. ເພີ່ມ module ໃໝ່ / Add a module
1. Service ໃໝ່ `services/XxxService.gs` (ໃຊ້ Repository + `Auth.guard` + Result).
2. ເພີ່ມ `apiXxx()` ໃນ `Code.gs`.
3. Test `test/NN_xxx.test.js` (`__seed/__setUser`).
4. View `client/js/xxxView.html` (IIFE `return {load}`) + include ໃນ `index.html` + case ໃນ router `showView()` (`app.html`).
5. `node test/run.js` → 82/82 → commit → push.

## 4. Gotchas
- **Include path:** clasp `rootDir:./src` ຕັດ `src/` → ໃຊ້ `client/index` (ບໍ່ແມ່ນ `src/client/index`).
- **Include order:** `app.html` (ນິຍາມ `DAMS`) ຕ້ອງມາ**ກ່ອນ** `dashboard.html`.
- **Test isolation:** re-seed ທຸກ sheet ຕໍ່ test (state ຮົ່ວ).
- **Drive root:** `ROOT_FOLDER_ID` ຕ້ອງຕັ້ງ + folder share ໃຫ້ staff (Execute-as-user).

## 5. Local dev
```bash
cd app-v2
node test/run.js          # unit (82/82)
# design-preview.html      → ເປີດໃນ browser (mock data, ບໍ່ຕ້ອງ deploy)
clasp push -f              # ຂຶ້ນ Apps Script
```

## 6. Onboarding checklist
- [ ] `npm i -g @google/clasp` + `clasp login`
- [ ] clone repo, `node test/run.js` ຜ່ານ
- [ ] ອ່ານ [01 Rules](01_master_development_rules.md), [03 Schema](03_database_sheets_schema.md), [05 API](05_api_specification.md)
- [ ] `clasp push -f` ໄປ project ທົດສອບ

## 7. Extension points (future)
Thumbnails, per-customer folders, quota/retry wrappers, audit log, notifications, Workspace-domain hardening.

## 8. References
[01 Rules](01_master_development_rules.md) · [02 Design](02_uiux_design_system.md) · [03 Schema](03_database_sheets_schema.md) · [04 Drive](04_google_drive_management.md) · [05 API](05_api_specification.md) · [06 Modules](06_module_specs/) · [07 Testing](07_testing_qa_guide.md) · [08 Deploy](08_deployment_release_guide.md) · [09 Manual](09_user_manual.md)

---
*ກັບໄປ / Back:* [README](README.md)
