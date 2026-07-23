/**
 * SearchService.gs — Unified Search Engine (STEP 11).
 * ອ້າງອີງ Book 1: §16 (Performance), §29 (Budget), §47 (Search Index), §48 (Cache), §56 (SLA ≤2s).
 * Unified Index (Sheet SearchIndex) ຄົ້ນຫາຂ້າມ Photos + Documents ຈາກ index ກາງ.
 * Incremental update: ອັບເດດ index ເມື່ອ upload/update/delete (ບໍ່ rebuild ທຸກຄັ້ງ).
 */

// ---------------------- build index entries ----------------------
function _idxFromPhoto_(p) {
  return {
    RefType: 'photo', RefID: p.PhotoID, CustomerCode: p.CustomerCode, OrderID: '',
    Category: p.Category, Name: p.PhotoID, FileType: 'image', Status: p.Status,
    Keywords: [p.PhotoID, p.CustomerCode, p.Category].join(' ').toLowerCase(), Date: p.CreatedAt
  };
}
function _idxFromDoc_(d) {
  var ext = (d.FileName && d.FileName.indexOf('.') >= 0) ? d.FileName.split('.').pop().toLowerCase() : '';
  return {
    RefType: 'document', RefID: d.DocID, CustomerCode: d.CustomerCode, OrderID: d.OrderID || '',
    Category: d.Category, Name: d.Title, FileType: ext, Status: d.Status,
    Keywords: [d.DocID, d.Title, d.CustomerCode, d.Category, d.FileName].join(' ').toLowerCase(), Date: d.CreatedAt
  };
}

// ---------------------- incremental upsert / remove ----------------------
function _idxFind_(refType, refId) {
  var rows = listAll('SearchIndex').filter(function (r) { return r.RefType === refType && String(r.RefID) === String(refId); });
  return rows.length ? rows[0] : null;
}
function _idxUpsert_(entry) {
  var existing = _idxFind_(entry.RefType, entry.RefID);
  if (existing) return update('SearchIndex', existing.IndexID, entry, 'index');
  return create('SearchIndex', entry, 'index');
}

/** Incremental: re-index 1 record ຫຼັງ upload/update (ຮຽກຈາກ Photo/Document Service). */
function indexRef(refType, refId) {
  try {
    if (refType === 'photo') { var p = getById('Photos', refId); if (p) _idxUpsert_(_idxFromPhoto_(p)); }
    else if (refType === 'document') { var d = getById('Documents', refId); if (d) _idxUpsert_(_idxFromDoc_(d)); }
  } catch (e) { Logger.log('indexRef failed: ' + e.message); }  // index ບໍ່ໃຫ້ລົ້ມ business
}

/** Incremental: ໝາຍ index entry ວ່າ Deleted (ບໍ່ລຶບແຖວຈິງ). */
function indexRemove(refType, refId) {
  var e = _idxFind_(refType, refId);
  if (e) update('SearchIndex', e.IndexID, { Status: 'Deleted' }, 'index');
}

/** Full rebuild (ໃຊ້ຄັ້ງດຽວ ຫຼືຕອນ migrate). */
function reindexAll() {
  var n = 0;
  listAll('Photos').forEach(function (p) { _idxUpsert_(_idxFromPhoto_(p)); n++; });
  listAll('Documents').forEach(function (d) { _idxUpsert_(_idxFromDoc_(d)); n++; });
  Logger.log('reindexAll: ' + n + ' entries');
  return n;
}

// ---------------------- ranking ----------------------
/** Exact > startsWith > contains(name) > contains(keywords). */
function _rank_(r, q) {
  var name = String(r.Name || '').toLowerCase();
  if (name === q) return 100;
  if (name.indexOf(q) === 0) return 60;
  if (name.indexOf(q) >= 0) return 40;
  if (String(r.Keywords).indexOf(q) >= 0) return 20;
  return 0;
}

function _idxBrief_(r) {
  return { refType: r.RefType, refId: r.RefID, name: r.Name, category: r.Category,
           customerCode: r.CustomerCode, orderId: r.OrderID, fileType: r.FileType, status: r.Status, date: String(r.Date || '') };
}

// ---------------------- unified search ----------------------
/**
 * ຄົ້ນຫາຂ້າມ Photos+Documents. filters = { refType, customerCode, orderId, category, status, fileType, dateFrom, dateTo }.
 * opts = { page, size }. ຄືນ { results, total, tookMs, page, size }. SLA ≤2s (§56).
 */
function search(query, filters, opts) {
  var t0 = Date.now();
  filters = filters || {}; opts = opts || {};
  var q = String(query || '').toLowerCase().trim();

  var rows = listAll('SearchIndex').filter(function (r) {
    if (r.Status === 'Deleted') return false;
    if (filters.refType && r.RefType !== filters.refType) return false;
    if (filters.customerCode && r.CustomerCode !== filters.customerCode) return false;
    if (filters.orderId && r.OrderID !== filters.orderId) return false;
    if (filters.category && r.Category !== filters.category) return false;
    if (filters.status && r.Status !== filters.status) return false;
    if (filters.fileType && String(r.FileType).toLowerCase() !== String(filters.fileType).toLowerCase()) return false;
    if (filters.dateFrom && String(r.Date) < filters.dateFrom) return false;
    if (filters.dateTo && String(r.Date) > filters.dateTo) return false;
    if (q && String(r.Keywords).indexOf(q) < 0 && String(r.Name).toLowerCase().indexOf(q) < 0) return false;
    return true;
  });

  if (q) {
    rows.forEach(function (r) { r._score = _rank_(r, q); });
    rows.sort(function (a, b) { return (b._score || 0) - (a._score || 0); });
    _addRecentSearch_(q);
  } else {
    rows.sort(function (a, b) { return (String(b.Date) > String(a.Date)) ? 1 : -1; });  // ໃໝ່ກ່ອນ
  }

  var total = rows.length;
  var page = opts.page || 1, size = opts.size || 20;
  var results = rows.slice((page - 1) * size, page * size).map(_idxBrief_);
  var took = Date.now() - t0;
  recordMetric('search', took);   // STEP 14 metric
  return { results: results, total: total, tookMs: took, page: page, size: size };
}

// ---------------------- recent searches + saved filters (per user) ----------------------
function _up_() { return PropertiesService.getUserProperties(); }
function _addRecentSearch_(q) {
  try {
    var list = getRecentSearches();
    list = list.filter(function (x) { return x !== q; }); list.unshift(q);
    _up_().setProperty('RECENT_SEARCHES', JSON.stringify(list.slice(0, 10)));
  } catch (e) {}
}
function getRecentSearches() {
  var raw = _up_().getProperty('RECENT_SEARCHES');
  return raw ? JSON.parse(raw) : [];
}
function saveSearchFilter(name, filters) {
  var map = getSavedFilters(); map[name] = filters;
  _up_().setProperty('SAVED_FILTERS', JSON.stringify(map));
  return map;
}
function getSavedFilters() {
  var raw = _up_().getProperty('SAVED_FILTERS');
  return raw ? JSON.parse(raw) : {};
}
