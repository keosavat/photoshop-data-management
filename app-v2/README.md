# app-v2 — PhotoShop Enterprise DAMS (backend)

Google Apps Script backend for **DAMS v2.0**, built phase by phase with **unit tests that mock Google services** (run in Node — no Google account needed to test).

## ໂຄງສ້າງ / Structure
```
app-v2/
  src/
    Config.gs                 # central config (sheets, id prefixes, roles, drive)
    core/                     # Result, Errors, Ids, Validator, Logger
    repositories/             # SheetRepository, DriveRepository, CacheRepository
    services/                 # AuthService, CustomerService, ... (per module)
  test/
    mocks.js                  # in-memory GAS service mocks
    harness.js                # loads .gs into one VM context + test framework
    run.js                    # test runner
    NN_*.test.js              # one suite per phase
  appsscript.json
```

## ວິທີແລ່ນ test / Run tests
```bash
cd app-v2
node test/run.js
```
Tests use no network and no Google account — `test/mocks.js` fakes SpreadsheetApp, DriveApp, CacheService, Session, etc.

## ສະຖານະ phase / Phase status — ✅ ທຸກໂມດູນຜ່ານ (60/60)
| Phase | ໂມດູນ / Module | Tests |
|---|---|---|
| A | Foundation (Config, core, repositories) | ✅ 11/11 |
| B | AuthService (RBAC roles/permissions) | ✅ 6/6 |
| C | CustomerService | ✅ 6/6 |
| D | PhotoService (upload, SHA-256 dedup, state) | ✅ 6/6 |
| E | OrderService (state machine) | ✅ 6/6 |
| F | PaymentService (methods, order status) | ✅ 5/5 |
| G | AlbumService · DocumentService (versioning) · PrintingService | ✅ 11/11 |
| H | SearchService · ReportService · SettingService (users) | ✅ 9/9 |
| | **TOTAL** | **✅ 60/60** |

**Rule:** each phase must be green before the next starts. Run `node test/run.js`.

## ຫຼັກສະຖາປັດຕະຍະກຳ / Architecture
Service → Repository → (Sheets / Drive / Cache). Every service method returns a
`{ ok, data, error, meta }` envelope and is guarded by `Auth.guard(action)` (see
`docs-v2/05` and `docs-v2/06`).

## Deploy (real Google) — later
Push `src/` with `clasp`, set Script Property `SHEET_ID`, then run setup per `docs-v2/08`.
