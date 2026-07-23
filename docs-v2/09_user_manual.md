# 09 · User Manual / ຄູ່ມືຜູ້ໃຊ້

| Status | 🟢 v2.0 live |
|---|---|

---

## 1. ເຂົ້າໃຊ້ / Getting started
1. ເປີດ **Web app URL** (ຈາກເຈົ້າຂອງຮ້ານ).
2. ຄັ້ງທຳອິດ Google ຂໍ authorize → **Advanced → Go to … (unsafe) → Allow** (ເປັນ app ຂອງຮ້ານເອງ).
3. ຈະເຫັນ **Dashboard**. ຊ້າຍມື = ເມນູ (ສອງພາສາ). ຂວາເທິງ = ຄົ້ນຫາ · ☀️/🌙 ປ່ຽນ theme · ຊື່ຜູ້ໃຊ້.

## 2. ໂມດູນ / Modules
| ເມນູ | ເຮັດຫຍັງໄດ້ |
|---|---|
| **Dashboard / ພາບລວມ** | ຕົວເລກລວມ (ຮູບ, ລູກຄ້າ, ອໍເດີ້, ລາຍຮັບ), ບົດບາດຂອງເຈົ້າ |
| **Photos / ຮູບພາບ** | ເລືອກໄຟລ໌ → **Upload** (ຮູບໄປ folder ກາງ). ຮູບຊ້ຳຈະ dedup ອັດຕະໂນມັດ |
| **Albums / ອະລະບໍ້າ** | ➕ ເພີ່ມ (ຊື່ + Customer ID), ເບິ່ງລາຍການ |
| **Customers / ລູກຄ້າ** | ➕ ເພີ່ມ (ຊື່/ໂທ/email), ເບິ່ງລາຍການ |
| **Documents / ເອກະສານ** | Upload ໄຟລ໌ (PDF/DOCX/…), ເກັບ version ອັດຕະໂນມັດ |
| **Orders / ອໍເດີ້** | ➕ ໃໝ່ (Customer/ປະເພດ/ຍອດ), ກົດ →status ເລື່ອນ (new→in_progress→printing→delivery→complete) |
| **Printing / ການພິມ** | ➕ ວຽກພິມ (Order/ປະເພດ/ຈຳ), ເລື່ອນ queued→printing→done |
| **Payments / ຊຳລະ** | ບັນທຶກການຊຳລະ (Order/ຈຳນວນ/ວິທີ), ເບິ່ງສະຖານະຕາມອໍເດີ້ (paid/partial/unpaid) — *Manager+* |
| **Search / ຄົ້ນຫາ** | ພິມຄຳ → ຜົນຈັດກຸ່ມ (ສະເພາະທີ່ role ເບິ່ງໄດ້) |
| **Reports / ລາຍງານ** | KPI + ອໍເດີ້ຕາມສະຖານະ — *Manager+* |
| **Settings / ຕັ້ງຄ່າ** | ຄ່າລະບົບ (*Admin+*) · ຈັດການຜູ້ໃຊ້/role (*Owner*) |

## 3. ບົດບາດ / Roles (RBAC)
Owner > Admin > Manager > Editor > Staff > Viewer. ຖ້າກົດແລ້ວຂຶ້ນ ⚠️ FORBIDDEN = role ຂອງເຈົ້າບໍ່ມີສິດອັນນັ້ນ (ປົກກະຕິ).

## 4. FAQ
- **ອັບຮູບບໍ່ໄດ້?** ຕ້ອງ role Staff ຂຶ້ນໄປ + ໂຟເດີ `PhotoShop-DAMS` ຕ້ອງ share ໃຫ້ເຈົ້າ.
- **ຮູບຫາຍ?** ກວດ status (deleted) — restore ໄດ້.
- **ຕົວເລກບໍ່ອັບເດດ?** ກົດ refresh ຂອງ browser (cache ~5 ນາທີ).

---
*ຕໍ່ໄປ / Next:* [10 · Developer Handbook](10_developer_handbook.md)
