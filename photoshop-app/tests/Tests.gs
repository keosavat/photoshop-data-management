/**
 * Tests.gs — Unit + E2E tests (STEP 15). ອ້າງອີງ Book 1: §24 (Review), §30 (Test Strategy).
 * GAS ບໍ່ມີ test framework — ໃຊ້ assert runner ງ່າຍ.
 * ແລ່ນ: runUnitTests() (pure, ບໍ່ແຕະ Sheet/Drive) ຫຼື runE2E() (Dev env — ຕ້ອງ setup DB).
 */

// ---------------------- assert helpers ----------------------
var _T_ = [];
function _assert_(cond, name) { _T_.push({ name: name, ok: !!cond }); }
function _assertEq_(a, b, name) { _T_.push({ name: name, ok: (a === b), got: a, want: b }); }

// ============ Unit Tests (Auth / Drive / Search / Reports — pure) ============
function test_search_ranking() {
  _assertEq_(_rank_({ Name: 'passport', Keywords: 'passport' }, 'passport'), 100, 'rank: exact=100');
  _assertEq_(_rank_({ Name: 'passport', Keywords: '' }, 'pass'), 60, 'rank: startsWith=60');
  _assertEq_(_rank_({ Name: 'my passport', Keywords: '' }, 'passport'), 40, 'rank: contains-name=40');
  _assertEq_(_rank_({ Name: 'x', Keywords: 'passport' }, 'passport'), 20, 'rank: contains-keywords=20');
}
function test_search_indexFromDoc() {
  var e = _idxFromDoc_({ DocID: 'DOC-1', FileName: 'scan.pdf', Title: 'T', CustomerCode: 'C', Category: 'passport', Status: 'Ready', OrderID: '' });
  _assertEq_(e.fileType, 'pdf', 'index: fileType from filename');
  _assertEq_(e.RefType, 'document', 'index: refType document');
}
function test_reports_bucket() {
  _assertEq_(_bucket_('2026-07-10', 'monthly'), '2026-07', 'bucket monthly');
  _assertEq_(_bucket_('2026-07-10', 'yearly'), '2026', 'bucket yearly');
  _assertEq_(_bucket_('2026-07-10', 'daily'), '2026-07-10', 'bucket daily');
}
function test_reports_csv() {
  _assertEq_(_csvEscape_('a,b'), '"a,b"', 'csv escape comma');
  _assertEq_(_toCsv_([['x', 'y'], ['1', '2']]), 'x,y\n1,2', 'csv rows');
}
function test_auth_permissions() {
  _assert_(can({ role: 'Admin' }, 'settings', 'manage') === true, 'perm: Admin settings');
  _assert_(can({ role: 'Viewer' }, 'settings', 'manage') === false, 'perm: Viewer no settings');
  _assert_(can({ role: 'Editor' }, 'photos', 'create') === true, 'perm: Editor photo create');
  _assert_(can({ role: 'Viewer' }, 'photos', 'create') === false, 'perm: Viewer no create');
  _assert_(can({ role: 'Editor' }, 'reports', 'export') === false, 'perm: Editor no export');
}
function test_hash() {
  var bytes = Utilities.newBlob('abc').getBytes();
  _assertEq_(computePhotoHash(bytes), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad', 'sha256(abc)');
}
function test_i18n_interpolate() {
  _assertEq_(_interpolate_('Hi {name}', { name: 'A' }), 'Hi A', 'i18n interpolate');
  _assertEq_(_interpolate_('none', null), 'none', 'i18n no params');
}
function test_error_codes() {
  _assert_(appError('E006', 'ext').message.indexOf('E006:') === 0, 'appError prefix E006');
}

/** ແລ່ນ unit tests ທັງໝົດ → ຄືນ summary. */
function runUnitTests() {
  _T_ = [];
  [test_search_ranking, test_search_indexFromDoc, test_reports_bucket, test_reports_csv,
   test_auth_permissions, test_hash, test_i18n_interpolate, test_error_codes]
    .forEach(function (fn) { try { fn(); } catch (e) { _T_.push({ name: fn.name, ok: false, err: e.message }); } });
  var passed = _T_.filter(function (r) { return r.ok; }).length;
  var out = { total: _T_.length, passed: passed, failed: _T_.length - passed, results: _T_ };
  Logger.log(JSON.stringify(out, null, 2));
  return out;
}

// ============ E2E Test (Dev env) ============
/**
 * E2E: Login → Upload → Search → Preview → Report → Backup.
 * ⚠ ແລ່ນໃນ Dev ເທົ່ານັ້ນ (ຕ້ອງ createDatabase + ROOT_FOLDER_ID ຕັ້ງແລ້ວ). ໃຊ້ໄຟລ໌ຮູບນ້ອຍຈຳລອງ.
 */
function runE2E() {
  var res = [];
  function step(name, fn) { try { fn(); res.push({ step: name, ok: true }); } catch (e) { res.push({ step: name, ok: false, err: e.message }); } }

  createDatabase(); seedDatabase();
  var sess, csrf, photoId;
  step('login', function () { sess = login({ ip: 'test' }); csrf = sess.csrf; if (!sess.token) throw new Error('no token'); });
  step('customer', function () { create('Customers', { CustomerCode: 'CUS-000001', Name: 'Test' }, 'e2e'); });
  step('upload', function () {
    var blob = Utilities.newBlob('fakeimg', 'image/png', 'e2e.png');
    var r = photoUpload({ name: 'e2e.png', mime: 'image/png', dataBase64: Utilities.base64Encode(blob.getBytes()), customerCode: 'CUS-000001', category: 'general' }, sess.token, csrf);
    photoId = r.photoId; if (r.status !== 'Ready') throw new Error('status ' + r.status);
  });
  step('search', function () { var s = search('CUS-000001', {}, {}); if (!s.results.length) throw new Error('no results'); });
  step('preview(list)', function () { var l = listPhotos({}); if (!l.length) throw new Error('no photos'); });
  step('report', function () { var k = getKpiReport(sess.token); if (k.photos < 1) throw new Error('kpi photos 0'); });
  step('backup', function () { var b = backupNow(sess.token); if (!b.fileId) throw new Error('no backup'); });

  var passed = res.filter(function (r) { return r.ok; }).length;
  var out = { total: res.length, passed: passed, failed: res.length - passed, steps: res };
  Logger.log(JSON.stringify(out, null, 2));
  return out;
}
