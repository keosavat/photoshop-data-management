# ADR-005 — ນຳໃຊ້ Personal Gmail + Google One (ພ້ອມ Users Allowlist)

- **Status:** Accepted — 2026-07-10
- **ອ້າງອີງ:** Book 1 §13 (Security/RBAC), §41 (Storage/Backup), §49 (Notification); Installation Guide v1.0

## Context (ບໍລິບົດ)

Book 1 §13 ກຳນົດໃຫ້ Login ຈຳກັດ **ພາຍໃນ Domain ຂອງບໍລິສັດ** ແລະ Web App access = DOMAIN
(ຕ້ອງໃຊ້ Google Workspace). ແຕ່ການ deploy ຈິງຂອງຮ້ານໃຊ້ **Google Account ສ່ວນຕົວ (Gmail)**
ພ້ອມ **Google One** ສຳລັບພື້ນທີ່ເກັບ. ຂໍ້ຈຳກັດຂອງບັນຊີ consumer:

1. ຕອນ Deploy Web App **ບໍ່ມີ** ຕົວເລືອກ "ພາຍໃນ Domain" — ມີແຕ່ *Only myself* ຫຼື *Anyone with a Google account*.
2. Storage ຟຣີ 15GB (ບໍ່ພຽງພໍ) — ແກ້ດ້ວຍ **Google One** (100GB/2TB).
3. Quota email (consumer) ຕໍ່າກວ່າ Workspace (~100/ມື້).

## Decision (ການຕັດສິນໃຈ)

ຍອມຮັບການ deploy ເທິງ Personal Gmail + Google One ໂດຍມີເງື່ອນໄຂຄວບຄຸມ:

1. **Access = "Anyone with a Google account"** (ຍ້ອນ domain-lock ບໍ່ໄດ້).
2. **ຄວບຄຸມການເຂົ້າເຖິງຜ່ານ Sheet `Users` (Allowlist)** — `Auth.getCurrentUser()` ກວດ email
   ທຽບກັບ Sheet Users; email ໃດບໍ່ຢູ່ໃນ Users → login ບໍ່ຜ່ານ (E001) ແລະເຮັດຫຍັງບໍ່ໄດ້.
   Admin ເພີ່ມ/ລຶບຜູ້ໃຊ້ຜ່ານ Settings › Users.
3. **ຫ້າມ Share Web App URL** ໃຫ້ຄົນນອກ.
4. **Storage** ໃຊ້ Google One; ຕິດຕາມຜ່ານ Reports › Storage Analytics (ເຕືອນ ≥80%).
5. **Notifications** ນຳໃຊ້ Telegram ເປັນຫຼັກ (ຫຼີກ quota email consumer); email ໃຊ້ເທົ່າທີ່ຈຳເປັນ.

ການຕັດສິນໃຈນີ້ **ຂັດ** ກົດ domain-lock ໃນ §13 ໂດຍເຈດຕະນາ ສຳລັບ deployment ນີ້.

## Consequences (ຜົນທີ່ຕາມມາ)

**ບວກ:** ໃຊ້ໄດ້ເທິງ Gmail ສ່ວນຕົວ; ຄ່າໃຊ້ຈ່າຍຕໍ່າກວ່າ Workspace; Google One storage ພຽງພໍ.

**ຄວາມສ່ຽງ / ຂໍ້ຈຳກັດ:**
- Web App URL ເຂົ້າເຖິງໄດ້ໂດຍຜູ້ໃດກໍໄດ້ທີ່ມີ Google account (ຫຼຸດຄວາມສ່ຽງດ້ວຍ Users allowlist).
- ບໍ່ມີ Domain Admin controls (audit ລວມ, force logout, ອື່ນໆ).
- Email ~100/ມື້ (consumer).
- ຕ້ອງຮັກສາ Sheet Users ໃຫ້ຮັດກຸມ ແລະ Backup ສະໝ່ຳສະເໝີ.

**Follow-up:** ຖ້າຂະຫຍາຍ/ຕ້ອງການຄວາມປອດໄພສູງຂຶ້ນ → ຍ້າຍໄປ **Google Workspace**
ແລ້ວເປີດ domain restriction ຄືນ (Super-seding ADR ນີ້).
