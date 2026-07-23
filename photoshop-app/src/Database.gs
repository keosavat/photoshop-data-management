/**
 * Database.gs — Repository Layer (STEP 3).
 * ອ້າງອີງ Book 1: §22.1 (Repository), §6/§10 (DB/Naming), §11 (Validation), §16 (batch), §52 (Audit).
 * ກົດ: ມີແຕ່ Layer ນີ້ (ແລະ DriveService.gs) ທີ່ຮຽກ SpreadsheetApp — Service/UI ຫ້າມຮຽກໂດຍກົງ.
 *
 * ໜ້າທີ່ຫຼັກ:
 *   listAll(sheet, opt)          — ອ່ານທຸກແຖວ (ຂ້າມ soft-deleted ໂດຍ default)
 *   getById(sheet, id)           — ຫາ 1 record ຕາມ PK
 *   create(sheet, obj, actor)    — ສ້າງ record ໃໝ່ (gen PK + audit + validate)
 *   update(sheet, id, patch, a)  — ແກ້ໄຂ (audit UpdatedBy/At)
 *   softDelete(sheet, id, actor) — Soft delete (IsDeleted=true) — ສອດຄ່ອງ RecycleBin (§45)
 *   audit(eventType, userId, detail) — ບັນທຶກ AuditLogs/EventLog (§52)
 */

// ---------- low-level helpers ----------
function _ss_() {
  var id = getSpreadsheetId();
  if (!id) throw new Error('E004: SHEET_ID ບໍ່ໄດ້ຕັ້ງຄ່າ (Config)');
  return SpreadsheetApp.openById(id);
}
function _sheet_(name) {
  var sh = _ss_().getSheetByName(name);
  if (!sh) throw new Error('E004: Sheet not found: ' + name);
  return sh;
}
function _now_()  { return new Date(); }
function _headerIndex_(headers) {
  var m = {};
  for (var i = 0; i < headers.length; i++) m[headers[i]] = i;
  return m;
}

/** batch read: ຄືນ { headers, rows(2D), idx } — ອ່ານຄັ້ງດຽວ (§16). */
function _readSheet_(name) {
  var sh = _sheet_(name);
  var values = sh.getDataRange().getValues();
  var headers = values.length ? values[0] : headersFor(name);
  return { sh: sh, headers: headers, rows: values.slice(1), idx: _headerIndex_(headers) };
}

/** ແປງ 1 ແຖວ (array) → object ຕາມ headers. */
function _rowToObj_(headers, row) {
  var o = {};
  for (var i = 0; i < headers.length; i++) o[headers[i]] = row[i];
  return o;
}

// ---------- PK generation (ADR-004: Prefixed sequential) ----------
/** ສ້າງ PK ໃໝ່ ຮູບແບບ PREFIX-000001 ໂດຍອີງເລກສູງສຸດທີ່ມີຢູ່. */
function _nextId_(name) {
  var s = SCHEMA[name];
  var data = _readSheet_(name);
  var pkCol = data.idx[s.pk];
  var max = 0;
  for (var i = 0; i < data.rows.length; i++) {
    var val = String(data.rows[i][pkCol] || '');
    var m = val.match(/-(\d+)$/);
    if (m) { var n = parseInt(m[1], 10); if (n > max) max = n; }
  }
  var next = max + 1;
  return s.prefix + '-' + ('000000' + next).slice(-6);
}

// ---------- validation (§11, §13) ----------
function _validate_(name, obj) {
  var errors = [];
  if (name === 'Users' && obj.Role && ENUMS.Role.indexOf(obj.Role) < 0)
    errors.push('Role ບໍ່ຖືກ: ' + obj.Role);
  if (name === 'Photos' && obj.Category && ENUMS.Category.indexOf(obj.Category) < 0)
    errors.push('Category ບໍ່ຖືກ: ' + obj.Category);
  if (name === 'Orders') {
    if (obj.Status && ENUMS.OrderStatus.indexOf(obj.Status) < 0) errors.push('Status ບໍ່ຖືກ: ' + obj.Status);
    if (obj.Type && ENUMS.OrderType.indexOf(obj.Type) < 0) errors.push('Type ບໍ່ຖືກ: ' + obj.Type);
    if (obj.Priority && ENUMS.Priority.indexOf(obj.Priority) < 0) errors.push('Priority ບໍ່ຖືກ: ' + obj.Priority);
  }
  if (errors.length) throw new Error('E_VALIDATION: ' + errors.join('; '));
}

// ---------- CRUD ----------
/** ອ່ານທຸກ record. opt.includeDeleted=true ເພື່ອລວມ soft-deleted. */
function listAll(name, opt) {
  opt = opt || {};
  var data = _readSheet_(name);
  var out = [];
  var hasDel = data.idx['IsDeleted'] !== undefined;
  for (var i = 0; i < data.rows.length; i++) {
    var o = _rowToObj_(data.headers, data.rows[i]);
    if (o[SCHEMA[name].pk] === '' || o[SCHEMA[name].pk] === undefined) continue;
    if (hasDel && !opt.includeDeleted && (o.IsDeleted === true || o.IsDeleted === 'TRUE')) continue;
    out.push(o);
  }
  return out;
}

function getById(name, id) {
  var data = _readSheet_(name);
  var pkCol = data.idx[SCHEMA[name].pk];
  for (var i = 0; i < data.rows.length; i++) {
    if (String(data.rows[i][pkCol]) === String(id)) return _rowToObj_(data.headers, data.rows[i]);
  }
  return null;
}

/** ສ້າງ record ໃໝ່ — gen PK, ຕິດ audit/soft-delete default, validate, append (§16). */
function create(name, obj, actor) {
  obj = obj || {};
  _validate_(name, obj);
  var s = SCHEMA[name];
  var data = _readSheet_(name);
  if (!obj[s.pk]) obj[s.pk] = _nextId_(name);
  var now = _now_();
  if (!s.append_only) {
    obj.IsDeleted = false; obj.DeletedAt = ''; obj.DeletedBy = '';
    obj.CreatedBy = actor || 'system'; obj.CreatedAt = now;
    obj.UpdatedBy = actor || 'system'; obj.UpdatedAt = now;
  }
  var row = data.headers.map(function (h) { return (h in obj) ? obj[h] : ''; });
  data.sh.appendRow(row);
  if (name !== 'AuditLogs' && name !== 'SearchIndex' && name !== 'Metrics') audit('CREATE_' + name, actor, obj[s.pk]);  // derived data ບໍ່ audit
  return obj;
}

/** ແກ້ໄຂ record — patch ສະເພາະ field ທີ່ສົ່ງມາ, ຕິດ UpdatedBy/At. */
function update(name, id, patch, actor) {
  var data = _readSheet_(name);
  var pkCol = data.idx[SCHEMA[name].pk];
  for (var i = 0; i < data.rows.length; i++) {
    if (String(data.rows[i][pkCol]) === String(id)) {
      var current = _rowToObj_(data.headers, data.rows[i]);
      for (var k in patch) if (patch.hasOwnProperty(k)) current[k] = patch[k];
      _validate_(name, current);
      if (data.idx['UpdatedBy'] !== undefined) { current.UpdatedBy = actor || 'system'; current.UpdatedAt = _now_(); }
      var row = data.headers.map(function (h) { return (h in current) ? current[h] : ''; });
      data.sh.getRange(i + 2, 1, 1, data.headers.length).setValues([row]);  // +2: header + 1-based
      if (name !== 'SearchIndex') audit('UPDATE_' + name, actor, id);       // index = derived, ບໍ່ audit
      return current;
    }
  }
  throw new Error('E004: record ບໍ່ພົບ ' + name + '/' + id);
}

/** Soft delete — ຕັ້ງ IsDeleted=true (ບໍ່ລຶບແຖວຈິງ) ເພື່ອສອດຄ່ອງ RecycleBin (§45). */
function softDelete(name, id, actor) {
  return update(name, id, { IsDeleted: true, DeletedAt: _now_(), DeletedBy: actor || 'system' }, actor);
}

/**
 * ບັນທຶກ AuditLogs / EventLog (§52).
 * meta (optional): { ip, browser, device } — ດຶງໄດ້ຈາກ client ຕອນ doPost (Phase 5).
 * ຝັ່ງ server (GAS) ບໍ່ເຫັນ IP/Browser ໂດຍກົງ ຈຶ່ງໃຫ້ Service ສົ່ງ meta ເຂົ້າມາ.
 */
function audit(eventType, userId, detail, meta) {
  try {
    meta = meta || {};
    var data = _readSheet_('AuditLogs');
    var id = _nextId_('AuditLogs');
    var o = {
      LogID: id, EventType: eventType, UserID: userId || 'system', Detail: detail || '',
      IP: meta.ip || '', Browser: meta.browser || '', Device: meta.device || '', Timestamp: _now_()
    };
    var row = data.headers.map(function (h) { return (h in o) ? o[h] : ''; });
    data.sh.appendRow(row);
  } catch (e) {
    // ຫ້າມໃຫ້ audit ລົ້ມ ເຮັດ business ລົ້ມ — log ຜ່ານ Logger ເທົ່ານັ້ນ
    Logger.log('audit failed: ' + e.message);
  }
}
