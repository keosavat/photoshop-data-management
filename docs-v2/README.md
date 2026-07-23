# PhotoShop Enterprise — DAMS · Documentation v2.0

**Digital Asset Management System (DAMS)** — ຊຸດເອກະສານພັດທະນາ v2.0 (ສອງພາສາ ລາວ/ອັງກິດ).

Google Apps Script · Google Drive · Google Sheets · HTML/CSS/JavaScript.

> ສະຖານະ: 🟢 **IMPLEMENTED** — ລະບົບສ້າງແລ້ວ, 11 module + 82/82 tests, deploy ແລ້ວ. ເອກະສານທັງ 10 ຊຸດຕື່ມເນື້ອຫາຈິງຄົບ.
> Status: 🟢 **IMPLEMENTED** — system built (11 modules, 82/82 tests, deployed). All 10 doc sets filled with real content.

---

## 📚 10 ຊຸດເອກະສານ / The 10 Document Sets

| # | ເອກະສານ / Document | ຂອບເຂດ / Scope | ອ້າງອີງ v1.0 / v1.0 source |
|---|---|---|---|
| 1 | [Master Development Rules](01_master_development_rules.md) | Coding standards, architecture, naming convention | Master_Development_Rules_v4.1 |
| 2 | [UI/UX Design System](02_uiux_design_system.md) | Colors, typography, components, layout, responsive | STEP7_DesignSystem |
| 3 | [Database & Sheets Schema](03_database_sheets_schema.md) | Sheets tables, columns, relations, validation | STEP3_Database |
| 4 | [Google Drive Management](04_google_drive_management.md) | Folder structure, permissions, dedup, thumbnails | STEP4_GoogleDrive |
| 5 | [API Specification](05_api_specification.md) | Apps Script endpoints, services, request/response | API_Documentation |
| 6 | [Module Specifications](06_module_specs/00_index.md) | 1 ໄຟລ໌ຕໍ່ 1 module / one file per module | STEP8–13 |
| 7 | [Testing & QA Guide](07_testing_qa_guide.md) | Test plan, cases, UAT, QA checklist | STEP15_Testing |
| 8 | [Deployment & Release Guide](08_deployment_release_guide.md) | Deploy, rollback, DR, release checklist | Installation_Guide, Release_Signoff |
| 9 | [User Manual](09_user_manual.md) | ຄູ່ມືຜູ້ໃຊ້ / end-user guide | User_Manual_v1.0_LA |
| 10 | [Developer Handbook](10_developer_handbook.md) | Onboarding, workflow, conventions | ໃໝ່ / new |

---

## 🧩 ຂອບເຂດລະບົບ v2.0 / System Scope v2.0

**Modules (8+):** Photos · Albums · Customers · Documents · Orders · Printing · Payments · Reports (+ Dashboard, Search, Settings).

**Services (9):** PhotoService · AlbumService · CustomerService · OrderService · DocumentService · ReportService · SearchService · SettingService · AuthService.

**Repositories (3):** DriveRepository · SheetRepository · CacheRepository.

**Architecture:** Presentation → Service → Apps Script → Repository → Storage (Drive / Sheets / Cache).

---

## 🗺️ ແຜນ 15 Phase / 15-Phase Plan

1. Design System · Layout · Sidebar · Navbar · Dashboard
2. Authentication · Google Login · Permission
3. Photo Module
4. Album Module
5. Customer Module
6. Document Module
7. Order Module
8. Printing Module
9. Search Engine
10. Reports
11. Settings
12. Performance
13. Testing
14. Optimization
15. Release

---

## ✅ ວິທີໃຊ້ / How to use

ທຸກຊຸດ (01–10) ຕື່ມເນື້ອຫາຈິງຈາກລະບົບທີ່ສ້າງແລ້ວ (`app-v2/`) — schema, API, drive, testing, deploy, module specs, ຄູ່ມືຜູ້ໃຊ້, developer handbook. ໃຊ້ເປັນເອກະສານອ້າງອີງຂອງລະບົບ.

All sets (01–10) are filled with real content derived from the built system (`app-v2/`) — schema, API, drive, testing, deployment, module specs, user manual, developer handbook. Use as the system's reference documentation.
