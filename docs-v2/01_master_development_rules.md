# 01 · Master Development Rules

**ໜັງສືກົດພັດທະນາຫຼັກ / Project Constitution** — PhotoShop Enterprise DAMS v2.0

| | |
|---|---|
| ສະຖານະ / Status | 🟡 DRAFT (skeleton) |
| ເວີຊັນ / Version | 2.0 |
| ອ້າງອີງ / Based on | v1.0 `Master_Development_Rules_v4.1` |

> ເອກະສານນີ້ເປັນ **ກົດສູງສຸດ** — ຖ້າມີຄວາມຂັດແຍ້ງ, ໃຫ້ຍຶດເອກະສານນີ້.
> This is the **highest authority** document — in case of conflict, this wins.

---

## 1. ຈຸດປະສົງ / Purpose
- ກຳນົດມາດຕະຖານກາງທັງໝົດ ເພື່ອໃຫ້ການພັດທະນາເປັນລະບຽບ ແລະ ຂະຫຍາຍໄດ້.
- Define all shared standards so development stays consistent and scalable.

## 2. ຫຼັກການສະຖາປັດຕະຍະກຳ / Architecture Principles
- Layered: Presentation → Service → Apps Script → Repository → Storage.
- Separation of concerns: UI ບໍ່ຮູ້ຈັກ storage ໂດຍກົງ; ຜ່ານ Service + Repository ສະເໝີ.
- Single responsibility ຕໍ່ file/service/module.
- [ ] ໄດອະແກຣມສະຖາປັດຕະຍະກຳ (ໃສ່ຮູບ/mermaid)

## 3. ໂຄງສ້າງໂຟເດີ / Folder Structure
```
src/
  components/ layouts/ pages/
  services/ repositories/ utils/
  assets/ (css/ js/ i18n/)
  tests/
```
- [ ] ອະທິບາຍໜ້າທີ່ຂອງແຕ່ລະໂຟເດີ / describe each folder's role

## 4. Naming Convention
| ປະເພດ / Type | ກົດ / Rule | ຕົວຢ່າງ / Example |
|---|---|---|
| Service files | PascalCase + `Service` | `PhotoService.gs` |
| Repository | PascalCase + `Repository` | `DriveRepository.gs` |
| Functions | camelCase | `uploadPhoto()` |
| Constants | UPPER_SNAKE | `MAX_FILE_SIZE` |
| Sheet tabs | PascalCase | `Customers` |
| [ ] ຕື່ມ | | |

## 5. ມາດຕະຖານໂຄດ / Coding Standards
- [ ] Language style (JS/GS), 2-space indent, semicolons
- [ ] Error handling pattern (try/catch, retry, rate-limit)
- [ ] Logging convention → link §API / Logger util
- [ ] Comment & JSDoc rules
- [ ] Security rules → link `docs-v2/05` & Security section

## 6. Git / Version Control
- [ ] Branch model, commit message format, PR review rules
- [ ] Versioning (semantic) & changelog

## 7. Definition of Done (DoD)
- [ ] Code + tests + docs updated + reviewed + deployed

## 8. ພາກ​ຄວບຄຸມ​ຄຸນ​ນະ​ພາບ / Quality Gates
- [ ] Lint, test pass, performance budget, security review

---
*ຕໍ່ໄປ / Next:* [02 · UI/UX Design System](02_uiux_design_system.md)
