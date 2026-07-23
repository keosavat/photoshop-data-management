/**
 * DriveService.gs — Repository Layer ຝັ່ງ Google Drive (STEP 4).
 * ອ້າງອີງ Book 1: §9 (Drive), §3.2 (Folder Tree), §13 (Permission), §45 (File Lifecycle),
 *                §46 (Background Job), §54 (Error Codes).
 * ກົດ: ມີແຕ່ Layer ນີ້ (ແລະ Database.gs) ທີ່ຮຽກ DriveApp — Service/UI ຫ້າມຮຽກໂດຍກົງ (§22.1).
 *
 * Error Codes (ຂະຫຍາຍຈາກ §54):
 *   E002 Upload Failed | E003 Drive Quota | E004 Folder Missing | E005 Permission Denied
 *   E006 Invalid File Type | E007 File Too Large
 */

// ====================== Folder Names (Naming Convention §10, §3.2) ======================
var DRIVE_FOLDERS = {
  PHOTOS: 'Photos', THUMBNAILS: 'Thumbnails', DOCUMENTS: 'Documents',
  TEMP: 'Temp', RECYCLE: 'RecycleBin', ARCHIVE: 'Archive', BACKUPS: 'Backups', SYSTEM: 'System'
};

// ---------------------- retry policy (§46) ----------------------
/** ລອງໃໝ່ສູງສຸດ maxTries ຄັ້ງ ພ້ອມ backoff — ໃຊ້ກັບ Drive ops ທີ່ອາດ transient. */
function _withRetry_(fn, maxTries) {
  maxTries = maxTries || 3;
  var lastErr;
  for (var i = 1; i <= maxTries; i++) {
    try { return fn(); }
    catch (e) {
      lastErr = e;
      if (String(e.message).indexOf('E003') >= 0) throw e; // quota — ຢ່າ retry
      Utilities.sleep(400 * i);                              // backoff
    }
  }
  throw new Error('E002: Upload/Drive op failed after ' + maxTries + ' tries — ' + lastErr.message);
}

// ---------------------- folder helpers ----------------------
function _root_() {
  var id = getRootFolderId();
  if (!id) throw new Error('E004: ROOT_FOLDER_ID ບໍ່ໄດ້ຕັ້ງຄ່າ (Config)');
  try { return DriveApp.getFolderById(id); }
  catch (e) { throw new Error('E004: Root folder ບໍ່ພົບ/ບໍ່ມີສິດ — ' + e.message); }
}

/** ຫາ subfolder ຕາມຊື່ ຫຼືສ້າງໃໝ່ຖ້າຍັງບໍ່ມີ (idempotent). */
function _getOrCreate_(parent, name) {
  var it = parent.getFoldersByName(name);
  return it.hasNext() ? it.next() : parent.createFolder(name);
}

/** ສ້າງ base folders ທັງໝົດຕາມ §3.2 (run ຄັ້ງດຽວຕອນ setup). */
function ensureBaseFolders() {
  var root = _root_();
  Object.keys(DRIVE_FOLDERS).forEach(function (k) { _getOrCreate_(root, DRIVE_FOLDERS[k]); });
  Logger.log('ensureBaseFolders() ສຳເລັດ');
}

/** ໂຟນເດີຮູບຂອງລູກຄ້າ: Photos/{Year}/{Month}/{Category}/{CustomerCode}/ (§3.2). */
function getCustomerPhotoFolder(customerCode, category, when) {
  if (!customerCode) throw new Error('E004: ຂາດ CustomerCode');
  var d = when || new Date();
  var year = String(d.getFullYear());
  var month = ('0' + (d.getMonth() + 1)).slice(-2);
  var cat = (category || 'general');
  var root = _root_();
  var f = _getOrCreate_(root, DRIVE_FOLDERS.PHOTOS);
  f = _getOrCreate_(f, year);
  f = _getOrCreate_(f, month);
  f = _getOrCreate_(f, cat);
  f = _getOrCreate_(f, customerCode);
  return f;
}

// ---------------------- naming (§10) ----------------------
/** ຊື່ໄຟລ໌ມາດຕະຖານ: {CustomerCode}_{id}.{ext}  (ຕົວຢ່າງ CUS-000001_PHOTO-000012.jpg). */
function buildFileName(customerCode, id, ext) {
  return customerCode + '_' + id + '.' + String(ext).toLowerCase().replace(/^\./, '');
}

// ---------------------- validation ----------------------
function _checkFile_(blob) {
  var name = blob.getName() || '';
  var ext = name.indexOf('.') >= 0 ? name.split('.').pop().toLowerCase() : '';
  var allowed = String(getConfig('ALLOWED_EXTENSIONS')).split(',');
  if (allowed.indexOf(ext) < 0) throw new Error('E006: ນາມສະກຸນບໍ່ຮອງຮັບ: ' + ext);
  var maxBytes = Number(getConfig('MAX_UPLOAD_MB')) * 1024 * 1024;
  if (blob.getBytes().length > maxBytes) throw new Error('E007: ໄຟລ໌ໃຫຍ່ເກີນ ' + getConfig('MAX_UPLOAD_MB') + 'MB');
  return ext;
}

// ---------------------- upload ----------------------
/**
 * Upload ຮູບ/ໄຟລ໌ເຂົ້າ folder ຂອງລູກຄ້າ. opts = { customerCode, category, id, when }.
 * ຄືນ { fileId, name, url, thumbUrl }. Validate ຂະໜາດ/ນາມສະກຸນ (E006/E007) + retry (§46).
 */
function uploadPhoto(blob, opts) {
  opts = opts || {};
  var ext = _checkFile_(blob);
  return _withRetry_(function () {
    var folder = getCustomerPhotoFolder(opts.customerCode, opts.category, opts.when);
    var fname = buildFileName(opts.customerCode, opts.id || ('TMP-' + Date.now()), ext);
    blob.setName(fname);
    var file = folder.createFile(blob);
    return {
      fileId: file.getId(),
      name: file.getName(),
      url: file.getUrl(),
      thumbUrl: generateThumbnail(file.getId())
    };
  });
}

/** ໂຟນເດີເອກະສານ: Documents/{Category}/{Year}/{CustomerCode}/ (§3.2). */
function getDocumentFolder(customerCode, category, when) {
  var d = when || new Date();
  var root = _root_();
  var f = _getOrCreate_(root, DRIVE_FOLDERS.DOCUMENTS);
  f = _getOrCreate_(f, category || 'other');
  f = _getOrCreate_(f, String(d.getFullYear()));
  if (customerCode) f = _getOrCreate_(f, customerCode);
  return f;
}

/**
 * Upload ເອກະສານ (STEP 10). opts = { customerCode, category, id }.
 * ຄືນ { fileId, name, url, previewUrl }. validate ຂະໜາດ (E007) + retry (§46).
 */
function uploadDocument(blob, opts) {
  opts = opts || {};
  var maxBytes = Number(getConfig('MAX_UPLOAD_MB')) * 1024 * 1024;
  if (blob.getBytes().length > maxBytes) throw new Error('E007: ໄຟລ໌ໃຫຍ່ເກີນ ' + getConfig('MAX_UPLOAD_MB') + 'MB');
  return _withRetry_(function () {
    var folder = getDocumentFolder(opts.customerCode, opts.category, opts.when);
    if (opts.name) blob.setName(opts.name);
    var file = folder.createFile(blob);
    return { fileId: file.getId(), name: file.getName(), url: file.getUrl(), previewUrl: getDrivePreviewUrl(file.getId()) };
  });
}

/** URL preview ຂອງ Google Drive (ຮອງຮັບ PDF/Image/Office). */
function getDrivePreviewUrl(fileId) { return 'https://drive.google.com/file/d/' + fileId + '/preview'; }

/** ຄືນ URL thumbnail ຂອງໄຟລ໌ (ໃຊ້ Drive built-in). Phase 9 ອາດ resize ຈິງເປັນ Background Job. */
function generateThumbnail(fileId) {
  try {
    var file = DriveApp.getFileById(fileId);
    return 'https://drive.google.com/thumbnail?id=' + file.getId() + '&sz=w' + getConfig('THUMBNAIL_SIZE');
  } catch (e) { return ''; }
}

// ---------------------- move / archive / recycle (§45) ----------------------
function _moveTo_(fileId, targetFolderName) {
  return _withRetry_(function () {
    var file = DriveApp.getFileById(fileId);
    var target = _getOrCreate_(_root_(), targetFolderName);
    file.moveTo(target);   // GAS: ຍ້າຍໄຟລ໌ (getParents/removeFile ໃນ runtime ເກົ່າ)
    return file.getId();
  });
}
function moveToArchive(fileId)     { return _moveTo_(fileId, DRIVE_FOLDERS.ARCHIVE); }
/** Soft-delete ໄຟລ໌: ຍ້າຍໄປ RecycleBin (ຄູ່ກັບ Database.softDelete). */
function moveToRecycleBin(fileId)  { return _moveTo_(fileId, DRIVE_FOLDERS.RECYCLE); }

// ---------------------- cleanup jobs (§45, §46) ----------------------
/** ລຶບໄຟລ໌ໃນ Temp ທີ່ເກົ່າກວ່າ 24 ຊົ່ວໂມງ. (time-driven trigger) */
function cleanupTemp() {
  var cutoff = new Date(Date.now() - 24 * 3600 * 1000);
  return _purgeOld_(DRIVE_FOLDERS.TEMP, cutoff);
}
/** ລຶບຖາວອນໄຟລ໌ໃນ RecycleBin ທີ່ເກົ່າກວ່າ 30 ວັນ. (time-driven trigger) */
function cleanupRecycleBin() {
  var cutoff = new Date(Date.now() - 30 * 24 * 3600 * 1000);
  return _purgeOld_(DRIVE_FOLDERS.RECYCLE, cutoff);
}
function _purgeOld_(folderName, cutoff) {
  var folder = _getOrCreate_(_root_(), folderName);
  var files = folder.getFiles();
  var removed = 0;
  while (files.hasNext()) {
    var f = files.next();
    if (f.getLastUpdated() < cutoff) { f.setTrashed(true); removed++; }
  }
  Logger.log('purge ' + folderName + ': ລຶບ ' + removed + ' ໄຟລ໌');
  return removed;
}

// ---------------------- backup (§41) — ໃຊ້ໂດຍ SettingsService (STEP 13) ----------------------
/** ສຳເນົາ Spreadsheet (DB) ໄປ Backups folder. */
function backupDatabaseFile() {
  var id = getSpreadsheetId();
  if (!id) throw new Error('E004: SHEET_ID ບໍ່ໄດ້ຕັ້ງຄ່າ');
  var backups = _getOrCreate_(_root_(), DRIVE_FOLDERS.BACKUPS);
  var name = 'backup_' + Utilities.formatDate(new Date(), 'GMT', 'yyyyMMdd_HHmmss');
  var f = DriveApp.getFileById(id).makeCopy(name, backups);
  return { fileId: f.getId(), name: name };
}
/** ລາຍການ backup ຫຼ້າສຸດ (ສູງສຸດ 50). */
function listBackupFiles() {
  var backups = _getOrCreate_(_root_(), DRIVE_FOLDERS.BACKUPS);
  var it = backups.getFiles(), out = [];
  while (it.hasNext()) { var f = it.next(); out.push({ fileId: f.getId(), name: f.getName(), date: f.getLastUpdated() }); }
  out.sort(function (a, b) { return b.date - a.date; });
  return out.slice(0, 50);
}

/** ຕັ້ງ time-driven triggers ໃຫ້ cleanup ແລ່ນອັດຕະໂນມັດ (run ຄັ້ງດຽວ). */
function createCleanupTriggers() {
  ScriptApp.newTrigger('cleanupTemp').timeBased().everyDays(1).atHour(2).create();
  ScriptApp.newTrigger('cleanupRecycleBin').timeBased().everyDays(1).atHour(3).create();
  Logger.log('ຕັ້ງ cleanup triggers ສຳເລັດ');
}
