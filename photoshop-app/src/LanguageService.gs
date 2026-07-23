/**
 * LanguageService.gs — i18n Framework (STEP 6).
 * ອ້າງອີງ Book 1: §14 (Multi-language).
 *
 * ໝາຍເຫດ single-source: I18N ໃນໄຟລ໌ນີ້ຄື "runtime source" ຝັ່ງ server (GAS ອ່ານ .json
 * ໂດຍກົງບໍ່ໄດ້). ໄຟລ໌ i18n/lo|th|en.json ຄື canonical source ສຳລັບ reference/build —
 * ຕ້ອງໃຫ້ key ຕົງກັນສະເໝີ. client ຮັບ bundle ຈາກ server ຜ່ານ getI18nBundle().
 */

var SUPPORTED_LANGS = ['lo', 'th', 'en'];

var I18N = {
  lo: {
    'app.title': 'ລະບົບຄຸ້ມຄອງຂໍ້ມູນ ແລະຮູບພາບ',
    'nav.dashboard': 'ໜ້າຫຼັກ', 'nav.photos': 'ຮູບພາບ', 'nav.orders': 'ອໍເດີ',
    'nav.documents': 'ເອກະສານ', 'nav.search': 'ຄົ້ນຫາ', 'nav.reports': 'ລາຍງານ', 'nav.settings': 'ຕັ້ງຄ່າ',
    'btn.upload': 'ອັບໂຫຼດ', 'btn.search': 'ຄົ້ນຫາ', 'btn.print': 'ພິມ', 'btn.save': 'ບັນທຶກ', 'btn.cancel': 'ຍົກເລີກ',
    'order.status.New': 'ໃໝ່', 'order.status.Uploaded': 'ອັບໂຫຼດແລ້ວ', 'order.status.Verified': 'ກວດແລ້ວ',
    'order.status.Printing': 'ກຳລັງພິມ', 'order.status.Completed': 'ສຳເລັດ', 'order.status.Archived': 'ຈັດເກັບ',
    'error.E001': 'ເຂົ້າສູ່ລະບົບບໍ່ສຳເລັດ', 'error.E002': 'ອັບໂຫຼດບໍ່ສຳເລັດ', 'error.E003': 'ພື້ນທີ່ Drive ເຕັມ',
    'error.E004': 'ບໍ່ພົບໂຟນເດີ', 'error.E005': 'ບໍ່ມີສິດເຂົ້າເຖິງ', 'error.E006': 'ນາມສະກຸນໄຟລ໌ບໍ່ຮອງຮັບ', 'error.E007': 'ໄຟລ໌ໃຫຍ່ເກີນກຳນົດ',
    'auth.login': 'ເຂົ້າສູ່ລະບົບ', 'auth.logout': 'ອອກຈາກລະບົບ', 'auth.login.success': 'ເຂົ້າສູ່ລະບົບສຳເລັດ', 'auth.denied': 'ທ່ານບໍ່ມີສິດເຮັດລາຍການນີ້',
    'welcome': 'ຍິນດີຕ້ອນຮັບ, {name}', 'validation.required': 'ກະລຸນາຕື່ມ {field}', 'notify.saved': 'ບັນທຶກສຳເລັດ', 'notify.deleted': 'ລຶບສຳເລັດ'
  },
  th: {
    'app.title': 'ระบบจัดการข้อมูลและรูปภาพ',
    'nav.dashboard': 'หน้าหลัก', 'nav.photos': 'รูปภาพ', 'nav.orders': 'ออร์เดอร์',
    'nav.documents': 'เอกสาร', 'nav.search': 'ค้นหา', 'nav.reports': 'รายงาน', 'nav.settings': 'ตั้งค่า',
    'btn.upload': 'อัปโหลด', 'btn.search': 'ค้นหา', 'btn.print': 'พิมพ์', 'btn.save': 'บันทึก', 'btn.cancel': 'ยกเลิก',
    'order.status.New': 'ใหม่', 'order.status.Uploaded': 'อัปโหลดแล้ว', 'order.status.Verified': 'ตรวจแล้ว',
    'order.status.Printing': 'กำลังพิมพ์', 'order.status.Completed': 'สำเร็จ', 'order.status.Archived': 'จัดเก็บ',
    'error.E001': 'เข้าสู่ระบบไม่สำเร็จ', 'error.E002': 'อัปโหลดไม่สำเร็จ', 'error.E003': 'พื้นที่ Drive เต็ม',
    'error.E004': 'ไม่พบโฟลเดอร์', 'error.E005': 'ไม่มีสิทธิ์เข้าถึง', 'error.E006': 'นามสกุลไฟล์ไม่รองรับ', 'error.E007': 'ไฟล์ใหญ่เกินกำหนด',
    'auth.login': 'เข้าสู่ระบบ', 'auth.logout': 'ออกจากระบบ', 'auth.login.success': 'เข้าสู่ระบบสำเร็จ', 'auth.denied': 'คุณไม่มีสิทธิ์ทำรายการนี้',
    'welcome': 'ยินดีต้อนรับ, {name}', 'validation.required': 'กรุณากรอก {field}', 'notify.saved': 'บันทึกสำเร็จ', 'notify.deleted': 'ลบสำเร็จ'
  },
  en: {
    'app.title': 'Data & Photo Management System',
    'nav.dashboard': 'Dashboard', 'nav.photos': 'Photos', 'nav.orders': 'Orders',
    'nav.documents': 'Documents', 'nav.search': 'Search', 'nav.reports': 'Reports', 'nav.settings': 'Settings',
    'btn.upload': 'Upload', 'btn.search': 'Search', 'btn.print': 'Print', 'btn.save': 'Save', 'btn.cancel': 'Cancel',
    'order.status.New': 'New', 'order.status.Uploaded': 'Uploaded', 'order.status.Verified': 'Verified',
    'order.status.Printing': 'Printing', 'order.status.Completed': 'Completed', 'order.status.Archived': 'Archived',
    'error.E001': 'Login failed', 'error.E002': 'Upload failed', 'error.E003': 'Drive quota exceeded',
    'error.E004': 'Folder missing', 'error.E005': 'Permission denied', 'error.E006': 'Invalid file type', 'error.E007': 'File too large',
    'auth.login': 'Sign in', 'auth.logout': 'Sign out', 'auth.login.success': 'Signed in successfully', 'auth.denied': 'You do not have permission for this action',
    'welcome': 'Welcome, {name}', 'validation.required': 'Please enter {field}', 'notify.saved': 'Saved successfully', 'notify.deleted': 'Deleted successfully'
  }
};

/** ແທນ {param} ໃນຂໍ້ຄວາມດ້ວຍຄ່າຈາກ params. */
function _interpolate_(s, params) {
  if (!params) return s;
  return String(s).replace(/\{(\w+)\}/g, function (m, k) { return (k in params) ? params[k] : m; });
}

/**
 * t(key, params, lang) — ແປ key ຕາມພາສາ; fallback ໄປ DEFAULT_LANGUAGE ແລ້ວ key ເອງ.
 * ຮອງຮັບ parameter: t('welcome', { name: 'Somchai' }).
 */
function t(key, params, lang) {
  lang = lang || getUserLanguage();
  var def = getConfig('DEFAULT_LANGUAGE');
  var dict = I18N[lang] || I18N[def] || {};
  var s;
  if (key in dict) s = dict[key];
  else if (I18N[def] && key in I18N[def]) s = I18N[def][key];  // fallback default lang
  else s = key;                                                // fallback key ເອງ
  return _interpolate_(s, params);
}

// ---------------------- user language (ຈື່ຄ່າ) ----------------------
/** ພາສາທີ່ user ເລືອກ (User Property ຜູກ Google account) ຫຼື default. */
function getUserLanguage() {
  var v = PropertiesService.getUserProperties().getProperty('LANG');
  return (v && SUPPORTED_LANGS.indexOf(v) >= 0) ? v : getConfig('DEFAULT_LANGUAGE');
}

/** ບັນທຶກພາສາຂອງ user. */
function setUserLanguage(lang) {
  if (SUPPORTED_LANGS.indexOf(lang) < 0) throw new Error('E_VALIDATION: unsupported lang ' + lang);
  PropertiesService.getUserProperties().setProperty('LANG', lang);
  return lang;
}

// ---------------------- client bundle ----------------------
/** ຄືນ dictionary ເຕັມຂອງພາສາ (default merge lang) ໃຫ້ client. */
function getI18nBundle(lang) {
  lang = lang || getUserLanguage();
  var def = getConfig('DEFAULT_LANGUAGE');
  var base = I18N[def] || {};
  var over = I18N[lang] || {};
  var out = {};
  for (var k in base) if (base.hasOwnProperty(k)) out[k] = base[k];
  for (var k2 in over) if (over.hasOwnProperty(k2)) out[k2] = over[k2];  // lang override default
  return out;
}

/** Language Switcher — ບັນທຶກພາສາ ແລະຄືນ bundle ໃໝ່ (client ໃຊ້ປ່ຽນທັນທີ). */
function setUserLanguageAndBundle(lang) {
  setUserLanguage(lang);
  return getI18nBundle(lang);
}

/** ລາຍຊື່ພາສາທີ່ຮອງຮັບ (ໃຫ້ Switcher). */
function getSupportedLanguages() {
  return [
    { code: 'lo', label: 'ລາວ' },
    { code: 'th', label: 'ไทย' },
    { code: 'en', label: 'English' }
  ];
}
