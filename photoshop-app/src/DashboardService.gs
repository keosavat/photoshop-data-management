/**
 * DashboardService.gs — Service Layer ສຳລັບ Dashboard (STEP 8).
 * ອ້າງອີງ Book 1: §16 (Performance/batch), §29 (Budget), §48 (Cache), §52 (Event Log).
 * ຮຽກຜ່ານ Repository (Database.gs) ເທົ່ານັ້ນ — ບໍ່ແຕະ Sheets ໂດຍກົງ (§22.1).
 */

var DASH_CACHE_KEY = 'dash_v1';

/**
 * ຄືນຂໍ້ມູນສະຫຼຸບໜ້າ Dashboard (KPI + orders-by-status + storage + recent activity).
 * ໃຊ້ Cache (§48) ຫຼຸດການອ່ານ Sheets ຊ້ຳ; opt.force=true ເພື່ອ bypass.
 */
function getDashboardData(opt) {
  opt = opt || {};
  var t0 = Date.now();
  var cache = CacheService.getScriptCache();
  if (!opt.force) {
    var cached = cache.get(DASH_CACHE_KEY);
    if (cached) { recordCache(true); return JSON.parse(cached); }   // cache hit (STEP 14)
  }
  recordCache(false);
  var data = {
    counts: {
      customers: listAll('Customers').length,
      photos:    listAll('Photos').length,
      documents: listAll('Documents').length,
      orders:    listAll('Orders').length
    },
    ordersByStatus: _countBy_('Orders', 'Status'),
    storageUsedMB: _storageUsedMB_(),
    recent: _recentActivity_(8),
    generatedAt: new Date().toISOString()
  };
  cache.put(DASH_CACHE_KEY, JSON.stringify(data), Number(getConfig('CACHE_TIME_SEC')));
  recordMetric('dashboard', Date.now() - t0);   // STEP 14 metric
  return data;
}

/** ລ້າງ cache Dashboard (ຮຽກຫຼັງ create/update ຂໍ້ມູນສຳຄັນ). */
function invalidateDashboardCache() {
  CacheService.getScriptCache().remove(DASH_CACHE_KEY);
}

// ---------------------- helpers ----------------------
function _countBy_(sheet, field) {
  var m = {};
  listAll(sheet).forEach(function (r) { var v = r[field] || '-'; m[v] = (m[v] || 0) + 1; });
  return m;
}

function _storageUsedMB_() {
  // DriveApp.getStorageUsed() ຊ້າ — cache 1 ຊົ່ວໂມງ (storage ບໍ່ປ່ຽນໄວ) ເພື່ອໃຫ້ Dashboard ໂຫຼດໄວ
  var c = CacheService.getScriptCache();
  var cached = c.get('storage_mb');
  if (cached !== null) return Number(cached);
  var mb = null;
  try { mb = Math.round(DriveApp.getStorageUsed() / 1048576); } catch (e) {}
  if (mb !== null) c.put('storage_mb', String(mb), 3600);
  return mb;
}

function _recentActivity_(n) {
  var all = listAll('AuditLogs');
  all.sort(function (a, b) { return (String(b.Timestamp) > String(a.Timestamp)) ? 1 : -1; });
  return all.slice(0, n).map(function (r) {
    return { event: r.EventType, user: r.UserID, detail: r.Detail, at: String(r.Timestamp || '') };
  });
}
