/**
 * SettingsService.gs — System Settings (STEP 13). Admin ເທົ່ານັ້ນ (§13 settings module).
 * ອ້າງອີງ Book 1: §12 (Audit), §13 (RBAC), §41 (Backup), §43 (Feature Toggle), §44 (Config), §49 (Notification).
 */

var SETTING_KEYS = ['DEFAULT_LANGUAGE', 'MAX_UPLOAD_MB', 'ALLOWED_EXTENSIONS', 'THUMBNAIL_SIZE', 'CACHE_TIME_SEC', 'DOC_CATEGORIES', 'DOC_ALLOWED_EXTENSIONS'];
var FEATURE_KEYS = ['qr_code', 'batch_print', 'ocr', 'notifications'];
var NOTIFY_KEYS  = ['NOTIFY_EMAIL_ENABLED', 'NOTIFY_EMAIL_TO', 'NOTIFY_TELEGRAM_ENABLED', 'NOTIFY_TELEGRAM_CHAT'];  // token = sensitive (PropertiesService)

function _requireAdmin_(token) {
  var u = getSession(token);
  if (!u || !can(u, 'settings', 'manage')) throw new Error('E005: ' + tAuth('error.E005'));  // Admin only
  return u;
}

// ============ 1. System Configuration (§44) ============
function getSettings(token) {
  _requireAdmin_(token);
  var out = {};
  SETTING_KEYS.forEach(function (k) { out[k] = getConfig(k); });
  return out;
}
function updateSetting(key, value, token) {
  var u = _requireAdmin_(token);
  if (SETTING_KEYS.indexOf(key) < 0) throw new Error('E_VALIDATION: setting ' + key);
  setConfig(key, value);
  audit('CONFIG_CHANGED', u.userId, key + '=' + value, null);
  return { ok: true, key: key, value: value };
}

// ============ 2. Feature Toggles (§43) ============
function getFeatureToggles(token) {
  _requireAdmin_(token);
  var out = {};
  FEATURE_KEYS.forEach(function (k) { out[k] = (String(getConfig('FEATURE_' + k)) === 'true'); });
  return out;
}
function setFeatureToggle(name, enabled, token) {
  var u = _requireAdmin_(token);
  if (FEATURE_KEYS.indexOf(name) < 0) throw new Error('E_VALIDATION: feature ' + name);
  setConfig('FEATURE_' + name, enabled ? 'true' : 'false');
  audit('FEATURE_TOGGLE', u.userId, name + '=' + enabled, null);
  return { ok: true };
}
/** public helper — Service ຕ້ອງກວດກ່ອນ execute (§43). */
function isFeatureEnabled(name) { return String(getConfig('FEATURE_' + name)) === 'true'; }

// ============ 3. User & Role Management (§13) ============
function listUsers(token) {
  _requireAdmin_(token);
  return listAll('Users').map(function (u) { return { userId: u.UserID, email: u.Email, name: u.Name, role: u.Role, active: u.Active }; });
}
function createUserRec(payload, token) {
  var u = _requireAdmin_(token);
  var rec = create('Users', { Email: payload.email, Name: payload.name, Role: payload.role || 'Viewer', Active: true }, u.userId);
  return { userId: rec.UserID };
}
function updateUserRec(userId, patch, token) {
  var u = _requireAdmin_(token);
  update('Users', userId, patch, u.userId);   // _validate_ ກວດ Role enum
  return { ok: true };
}

// ============ 4. Notification Settings (§49) ============
function getNotificationSettings(token) {
  _requireAdmin_(token);
  return {
    emailEnabled: String(getConfig('NOTIFY_EMAIL_ENABLED')) === 'true',
    emailTo: getConfig('NOTIFY_EMAIL_TO') || '',
    telegramEnabled: String(getConfig('NOTIFY_TELEGRAM_ENABLED')) === 'true',
    telegramChat: getConfig('NOTIFY_TELEGRAM_CHAT') || ''
  };
}
function updateNotificationSettings(patch, token) {
  var u = _requireAdmin_(token);
  Object.keys(patch || {}).forEach(function (k) {
    if (NOTIFY_KEYS.indexOf(k) >= 0 || k === 'NOTIFY_TELEGRAM_TOKEN') setConfig(k, patch[k]);
  });
  audit('NOTIFY_CONFIG', u.userId, Object.keys(patch || {}).join(','), null);
  return { ok: true };
}
/** ສົ່ງແຈ້ງເຕືອນ (gated ໂດຍ Feature Toggle notifications §43). best-effort. */
function sendNotification(subject, body) {
  if (!isFeatureEnabled('notifications')) return { skipped: true };
  var sent = [];
  try {
    if (String(getConfig('NOTIFY_EMAIL_ENABLED')) === 'true' && getConfig('NOTIFY_EMAIL_TO')) {
      MailApp.sendEmail(getConfig('NOTIFY_EMAIL_TO'), subject, body); sent.push('email');
    }
  } catch (e) { Logger.log('email notify failed: ' + e.message); }
  try {
    if (String(getConfig('NOTIFY_TELEGRAM_ENABLED')) === 'true' && getConfig('NOTIFY_TELEGRAM_CHAT') && getConfig('NOTIFY_TELEGRAM_TOKEN')) {
      var url = 'https://api.telegram.org/bot' + getConfig('NOTIFY_TELEGRAM_TOKEN') + '/sendMessage';
      UrlFetchApp.fetch(url, { method: 'post', payload: { chat_id: getConfig('NOTIFY_TELEGRAM_CHAT'), text: subject + '\n' + body }, muteHttpExceptions: true });
      sent.push('telegram');
    }
  } catch (e) { Logger.log('telegram notify failed: ' + e.message); }
  return { sent: sent };
}
function testNotification(token) {
  var u = _requireAdmin_(token);
  var r = sendNotification('Test notification', 'ທົດສອບແຈ້ງເຕືອນຈາກ Settings');
  audit('NOTIFY_TEST', u.userId, JSON.stringify(r), null);
  return r;
}

// ============ 5. Backup & Maintenance (§41, §36) ============
function backupNow(token) {
  var u = _requireAdmin_(token);
  var r = backupDatabaseFile();  // DriveService
  audit('BACKUP', u.userId, r.name, null);
  return r;
}
function listBackups(token) { _requireAdmin_(token); return listBackupFiles(); }
/** Restore = ສະຫຼັບ active DB ໄປ backup ທີ່ເລືອກ (ບໍ່ທຳລາຍ — reversible). */
function restoreFromBackup(backupFileId, token) {
  var u = _requireAdmin_(token);
  DriveApp.getFileById(backupFileId);           // ກວດວ່າມີ/ມີສິດ
  setConfig('SHEET_ID', backupFileId);
  audit('RESTORE', u.userId, backupFileId, null);
  return { ok: true, note: 'active DB switched to backup' };
}
function runMaintenance(token) {
  var u = _requireAdmin_(token);
  var temp = cleanupTemp(), recycle = cleanupRecycleBin();   // DriveService
  audit('MAINTENANCE', u.userId, 'temp=' + temp + ' recycle=' + recycle, null);
  return { tempRemoved: temp, recycleRemoved: recycle };
}

// ============ 6. Audit Viewer (§12) ============
function getAuditLogs(opt, token) {
  _requireAdmin_(token);
  opt = opt || {};
  var rows = listAll('AuditLogs').filter(function (r) {
    if (opt.eventType && String(r.EventType).indexOf(opt.eventType) < 0) return false;
    if (opt.userId && r.UserID !== opt.userId) return false;
    if (opt.date && String(r.Timestamp).indexOf(opt.date) < 0) return false;
    return true;
  });
  rows.sort(function (a, b) { return (String(b.Timestamp) > String(a.Timestamp)) ? 1 : -1; });
  var total = rows.length, page = opt.page || 1, size = opt.size || 25;
  return {
    rows: rows.slice((page - 1) * size, page * size).map(function (r) {
      return { logId: r.LogID, event: r.EventType, user: r.UserID, detail: r.Detail, ip: r.IP, at: String(r.Timestamp || '') };
    }),
    total: total, page: page, size: size
  };
}
