# Photo Shop — Data & Photo Management System

ລະບົບຄຸ້ມຄອງຂໍ້ມູນ ແລະ ຮູບພາບ ສຳລັບຮ້ານຖ່າຍຮູບ — Google Apps Script + Google Sheets (DB) + Google Drive (files).

Data & photo management system for a photo shop, built on Google Apps Script with Google Sheets as the database and Google Drive for file storage.

---

## 📂 Repository structure / ໂຄງສ້າງ

```
.
├── index.html          → ໜ້າເວັບລວມ (landing page — open this)
├── photoshop-app/      → ໂປຣແກຣມ (Google Apps Script source)
│   ├── src/            → server .gs services
│   ├── src/client/     → UI (HTML/CSS/JS)
│   ├── i18n/           → lo / th / en
│   ├── migrations/ · tests/ · docs/
│   └── README.md       → app-specific readme
└── docs/               → ເອກະສານທັງໝົດ (all documentation)
    ├── rules/          → Master Development Rules (v4.1 — latest)
    ├── steps/          → STEP 1–15 (development phases, latest versions)
    ├── books/          → Book 2, 3, 4
    ├── guides/         → Installation, API, User Manual, Release, UAT
    └── archive/        → ເວີຊັນເກົ່າ (superseded older versions)
```

## 📖 Documentation

| ໝວດ / Category | ໄຟລ໌ / Files |
|---|---|
| **Rules** | Master Development Rules v4.1 (Project Constitution) |
| **Steps** | STEP 1–15 — Planning, Architecture, Database, Drive, Auth, Multi-language, Design, Dashboard, Photo Archive, Documents, Search, Reports, Settings, Optimization, Testing |
| **Books** | Book 2 (Development Phases), Book 3 (Claude Prompt Collection), Book 4 (Technical Documentation) |
| **Guides** | Installation Guide, API Documentation, User Manual (LA), Release Signoff, UAT Checklist |

## 🧩 The application

See [`photoshop-app/README.md`](photoshop-app/README.md). All 15 build steps are complete (v1.0). Core services: Auth (OAuth + RBAC), Database, DriveService, PhotoService (SHA-256 dedup, state machine), DocumentService, SearchService, ReportService, SettingsService, DashboardService, MetricsService.

## ⚙️ Setup (summary)

1. Push the `photoshop-app/` source to Google Apps Script with `clasp`.
2. In Apps Script, set the Script Property `SHEET_ID` (optional).
3. Run `createDatabase()` → `seedDatabase()` → `validateSchema()` (expect `{ok:true}`).

Full instructions: `docs/guides/Installation_Guide_v1.0.pdf`.

---

*Private repository. Documents are in `.docx` / `.pdf` / `.xlsx` format — click a file on GitHub to preview or download.*
