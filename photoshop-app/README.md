# Photo Shop Data & Photo Management (v1.0)

Google Apps Script + Google Sheets (DB) + Google Drive (files).

## Scope v1.0
Photo Archive + Order Tracking (Lite). Services: general print, event, ID/passport, restoration.

## Docs (see /docs or workspace)
- Book 1 — Master Development Rules v4.1 (Project Constitution)
- Book 2 — Development Phases (STEP 1–15)
- Book 3 — Claude Prompt Collection
- Book 4 — Technical Documentation

## Structure (Book 1 §3.1)
src/ (server .gs), src/client/ (UI), i18n/ (lo/th/en.json), docs/, migrations/, tests/

## Setup (STEP 3)
1. Push with clasp, then in Apps Script set Script Property `SHEET_ID` (optional).
2. Run `createDatabase()` → `seedDatabase()` → `validateSchema()` (expect `{ok:true}`).

## Status
- STEP 1 — Project Planning: DONE (v1.1)
- STEP 2 — Architecture: DONE
- STEP 3 — Database: DONE (Config.gs, Database.gs, Migration.gs, i18n) + 3.1 refinements
- STEP 4 — Google Drive: DONE (DriveService.gs: folders, upload, move, cleanup)
- STEP 5 — Authentication: DONE (Auth.gs: OAuth/session, RBAC, guard; Code.gs router) + 5.1 hardening
- STEP 6 — Multi-language: DONE (LanguageService.gs, client i18n.html, switcher, remember+fallback)
- STEP 7 — Design System: DONE (style.html tokens+components, app-shell, design-preview.html)
- STEP 8 — Dashboard: DONE (DashboardService.gs +cache, dashboard.html, KPI/quick-actions/timeline, skeleton/empty/error/toast)
- STEP 9 — Photo Archive: DONE (PhotoService.gs pipeline, SHA256 dedup, CSRF, state machine, batch+progress, lazy gallery)
- STEP 10 — Document Management: DONE (DocumentService.gs pipeline, dynamic categories, preview, version control, search, RBAC download)
- STEP 11 — Search Engine: DONE (SearchService.gs unified index, incremental update, filters, ranking, recent/saved)
- STEP 12 — Reports: DONE (ReportService.gs KPI/trend/top/storage, export csv/xlsx/pdf, role-based)
- STEP 13 — Settings: DONE (SettingsService.gs config/toggles/users/notify/backup/audit-viewer, Admin-only)
- STEP 14 — Optimization: DONE (MetricsService.gs metrics/monitoring/benchmarks, Utils.gs errors/retry/rate-limit, security review)
- STEP 15 — Testing & Deployment: DONE (tests/Tests.gs unit+E2E, UAT checklist, deployment guide, rollback/DR, release checklist)

## Status: ALL 15 STEPS COMPLETE — v1.0 ready for Production Release (after UAT + release checklist).

## Deploy (summary)
`npm i -g @google/clasp` → `clasp login` → `clasp push` → set Script Properties (ROOT_FOLDER_ID, SHEET_ID) → run `createDatabase` → `seedDatabase` → `validateSchema` → `reindexAll` → Deploy Web App (execute as user, access DOMAIN). Run `runUnitTests()` and `runE2E()` in Dev first.

## Schema
Current SCHEMA_VERSION 1.4.0 (Photos +Status; Documents expanded; SearchIndex; Metrics). Re-run `createDatabase()` then `reindexAll()` in dev if DB was created earlier.
