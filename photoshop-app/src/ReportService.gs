/**
 * ReportService.gs — Service Layer: Reports & Statistics (STEP 12).
 * ອ້າງອີງ Book 1: §13 (RBAC), §16 (batch), §37 (Monitoring), §41 (Storage/Backup), §50 (Export), §52 (Audit).
 * Role-based: reports.view (Admin/Editor), export = Admin ('*'); Viewer ບໍ່ເຫັນ Reports (§13 matrix).
 */

var STORAGE_WARN_PERCENT = 80;

// ---------------------- RBAC gates ----------------------
function _reqReportView_(token) {
  var u = getSession(token);
  if (!u || !can(u, 'reports', 'view')) throw new Error('E005: ' + tAuth('error.E005'));
  return u;
}
function _reqReportExport_(token) {
  var u = getSession(token);
  if (!u || !can(u, 'reports', 'export')) throw new Error('E005: ' + tAuth('error.E005'));  // Admin only
  return u;
}

// ---------------------- KPI ----------------------
function getKpiReport(token) {
  _reqReportView_(token);
  return {
    customers: listAll('Customers').length,
    photos: listAll('Photos').length,
    documents: listAll('Documents').length,
    orders: listAll('Orders').length,
    storageMB: _storageUsedMB_()
  };
}

// ---------------------- Trend (daily / monthly / yearly) ----------------------
function _bucket_(dateVal, period) {
  if (!dateVal) return null;
  var d = new Date(dateVal);
  if (isNaN(d.getTime())) return null;
  var y = d.getFullYear(), m = ('0' + (d.getMonth() + 1)).slice(-2), day = ('0' + d.getDate()).slice(-2);
  if (period === 'yearly') return '' + y;
  if (period === 'daily') return y + '-' + m + '-' + day;
  return y + '-' + m; // monthly (default)
}

function getTrendReport(period, token) {
  _reqReportView_(token);
  period = period || 'monthly';
  var map = {};
  function add(list, key) {
    list.forEach(function (r) {
      var bk = _bucket_(r.CreatedAt || r.UpdatedAt, period);
      if (!bk) return;
      map[bk] = map[bk] || { uploads: 0, orders: 0 };
      map[bk][key]++;
    });
  }
  add(listAll('Photos'), 'uploads');
  add(listAll('Documents'), 'uploads');
  add(listAll('Orders'), 'orders');
  return Object.keys(map).sort().map(function (k) { return { period: k, uploads: map[k].uploads, orders: map[k].orders }; });
}

// ---------------------- Top Categories ----------------------
function _topOf_(list, field, n) {
  var m = {};
  list.forEach(function (r) { var v = r[field] || '-'; m[v] = (m[v] || 0) + 1; });
  return Object.keys(m).map(function (k) { return { name: k, count: m[k] }; })
    .sort(function (a, b) { return b.count - a.count; }).slice(0, n || 5);
}
function getTopCategories(token) {
  _reqReportView_(token);
  return {
    photoCategories: _topOf_(listAll('Photos'), 'Category', 5),
    docCategories: _topOf_(listAll('Documents'), 'Category', 5),
    jobTypes: _topOf_(listAll('Orders'), 'Type', 5)
  };
}

// ---------------------- Storage Analytics ----------------------
function getStorageAnalytics(token) {
  _reqReportView_(token);
  var used = 0, limit = 0;
  try { used = DriveApp.getStorageUsed(); limit = DriveApp.getStorageLimit(); } catch (e) {}
  var usedMB = Math.round(used / 1048576), limitMB = Math.round(limit / 1048576);
  var percent = limitMB ? Math.round(used / limit * 100) : null;
  // ໝາຍເຫດ: ບໍ່ໄດ້ເກັບ storage ຍ້ອນຫຼັງ — ໃຊ້ຈຳນວນ upload ຕໍ່ເດືອນເປັນ proxy trend.
  var monthly = getTrendReport('monthly', token).map(function (x) { return { period: x.period, uploads: x.uploads }; });
  return { usedMB: usedMB, limitMB: limitMB, percent: percent, warn: (percent !== null && percent >= STORAGE_WARN_PERCENT), monthly: monthly };
}

// ---------------------- Export (CSV / Excel / PDF) ----------------------
function _reportRows_(type, token) {
  if (type === 'kpi') {
    var k = getKpiReport(token);
    return [['Metric', 'Value'], ['Customers', k.customers], ['Photos', k.photos], ['Documents', k.documents], ['Orders', k.orders], ['Storage (MB)', k.storageMB]];
  }
  if (type === 'trend') {
    var rows = [['Period', 'Uploads', 'Orders']];
    getTrendReport('monthly', token).forEach(function (r) { rows.push([r.period, r.uploads, r.orders]); });
    return rows;
  }
  if (type === 'top') {
    var t = getTopCategories(token);
    var out = [['Group', 'Name', 'Count']];
    t.photoCategories.forEach(function (r) { out.push(['PhotoCategory', r.name, r.count]); });
    t.docCategories.forEach(function (r) { out.push(['DocCategory', r.name, r.count]); });
    t.jobTypes.forEach(function (r) { out.push(['JobType', r.name, r.count]); });
    return out;
  }
  if (type === 'storage') {
    var s = getStorageAnalytics(token);
    var rows2 = [['Metric', 'Value'], ['Used (MB)', s.usedMB], ['Limit (MB)', s.limitMB], ['Percent', s.percent], ['Warn', s.warn]];
    rows2.push(['Month', 'Uploads']);
    s.monthly.forEach(function (r) { rows2.push([r.period, r.uploads]); });
    return rows2;
  }
  throw new Error('E004: unknown report ' + type);
}

function _csvEscape_(v) { v = (v === null || v === undefined) ? '' : String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
function _toCsv_(rows) { return rows.map(function (r) { return r.map(_csvEscape_).join(','); }).join('\n'); }

/**
 * Export report. format = csv | xlsx | pdf. ຄືນ CSV (content) ຫຼື base64 (xlsx/pdf).
 * RBAC: export = Admin ('*') ເທົ່ານັ້ນ.
 */
function exportReport(type, format, token) {
  var user = _reqReportExport_(token);
  var rows = _reportRows_(type, token);
  audit('REPORT_EXPORT', user.userId, type + '.' + format, null);
  if (format === 'csv') return { filename: type + '.csv', mime: 'text/csv', content: _toCsv_(rows) };

  // xlsx / pdf ຜ່ານ temp Spreadsheet + Drive export
  var maxCols = rows.reduce(function (a, r) { return Math.max(a, r.length); }, 1);
  var norm = rows.map(function (r) { var c = r.slice(); while (c.length < maxCols) c.push(''); return c; });
  var ss = SpreadsheetApp.create('report_' + type + '_' + Date.now());
  var sh = ss.getSheets()[0];
  sh.getRange(1, 1, norm.length, maxCols).setValues(norm);
  SpreadsheetApp.flush();
  var fmt = (format === 'pdf') ? 'pdf' : 'xlsx';
  var url = 'https://docs.google.com/spreadsheets/d/' + ss.getId() + '/export?format=' + fmt;
  var resp = UrlFetchApp.fetch(url, { headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() } });
  var b64 = Utilities.base64Encode(resp.getBlob().getBytes());
  DriveApp.getFileById(ss.getId()).setTrashed(true);  // ລ້າງ temp
  var mime = (fmt === 'pdf') ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  return { filename: type + '.' + fmt, mime: mime, dataBase64: b64 };
}
