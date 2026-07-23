/**
 * Migration.gs — ສ້າງ/ກວດ/seed ຖານຂໍ້ມູນ Google Sheets (STEP 3).
 * ອ້າງອີງ Book 1: §6 (DB), §8 (Sheets), §10 (Naming). ໃຊ້ SCHEMA ຈາກ Config.gs.
 *
 * ວິທີໃຊ້ (ຄັ້ງດຽວຕອນ setup):
 *   1) ຕັ້ງ Script Property "SHEET_ID" = id ຂອງ Spreadsheet (ຫຼືປ່ອຍໃຫ້ createDatabase ສ້າງໃໝ່)
 *   2) run createDatabase()   → ສ້າງທຸກ Sheet + header
 *   3) run seedDatabase()     → ເພີ່ມ Admin user ເລີ່ມຕົ້ນ
 *   4) run validateSchema()   → ກວດ header ຕົງ SCHEMA
 */

/** ສ້າງ Spreadsheet (ຖ້າຍັງບໍ່ມີ) + ທຸກ Sheet ພ້ອມ header ຕາມ SCHEMA. */
function createDatabase() {
  var id = getSpreadsheetId();
  var ss;
  if (id) {
    ss = SpreadsheetApp.openById(id);
  } else {
    ss = SpreadsheetApp.create('PhotoShop_Database_' + getConfig('SYSTEM_VERSION'));
    setConfig('SHEET_ID', ss.getId());
    Logger.log('ສ້າງ Spreadsheet ໃໝ່, SHEET_ID = ' + ss.getId());
  }

  Object.keys(SCHEMA).forEach(function (name) {
    var sh = ss.getSheetByName(name) || ss.insertSheet(name);
    var headers = headersFor(name);
    sh.clear();
    sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
    sh.setFrozenRows(1);
  });

  // ລຶບ Sheet1 ເລີ່ມຕົ້ນ ຖ້າວ່າງ
  var def = ss.getSheetByName('Sheet1');
  if (def && ss.getSheets().length > 1) ss.deleteSheet(def);

  recordMigration_(getConfig('SCHEMA_VERSION'), 'createDatabase');
  Logger.log('createDatabase() ສຳເລັດ: ' + Object.keys(SCHEMA).join(', '));
  return ss.getId();
}

/** ບັນທຶກປະຫວັດ migration ໃນ Sheet SchemaMigrations (idempotent ຕໍ່ version). */
function recordMigration_(version, actor) {
  try {
    var exists = listAll('SchemaMigrations').filter(function (m) { return String(m.Version) === String(version); });
    if (exists.length) return;
    create('SchemaMigrations', { Version: version, AppliedAt: new Date(), AppliedBy: actor || 'migration' }, actor || 'migration');
  } catch (e) {
    Logger.log('recordMigration failed: ' + e.message);
  }
}

/** ຄືນ Schema Version ຫຼ້າສຸດທີ່ນຳໃຊ້ (ຫຼື null ຖ້າຍັງບໍ່ມີ). */
function getAppliedSchemaVersion() {
  var rows = listAll('SchemaMigrations');
  if (!rows.length) return null;
  return rows[rows.length - 1].Version;
}

/** ເພີ່ມຂໍ້ມູນເລີ່ມຕົ້ນ: Admin 1 ຄົນ. (idempotent — ບໍ່ຊ້ຳ) */
function seedDatabase() {
  var email = Session.getActiveUser().getEmail() || 'admin@example.com';
  var exists = listAll('Users').filter(function (u) { return u.Email === email; });
  if (exists.length) { Logger.log('seed: Admin ມີແລ້ວ (' + email + ')'); return; }
  create('Users', { Email: email, Name: 'System Admin', Role: 'Admin', Active: true }, 'migration');
  audit('SEED', 'migration', 'created initial admin: ' + email);
  Logger.log('seedDatabase() ສຳເລັດ: admin = ' + email);
}

/** ກວດ header ຂອງທຸກ Sheet ໃຫ້ຕົງ SCHEMA. ຄືນ { ok, problems[] }. */
function validateSchema() {
  var problems = [];
  var ss = _ss_();
  Object.keys(SCHEMA).forEach(function (name) {
    var sh = ss.getSheetByName(name);
    if (!sh) { problems.push('ຂາດ Sheet: ' + name); return; }
    var want = headersFor(name);
    var got = sh.getRange(1, 1, 1, Math.max(want.length, sh.getLastColumn())).getValues()[0];
    for (var i = 0; i < want.length; i++) {
      if (String(got[i] || '').trim() !== want[i]) {
        problems.push(name + ' col ' + (i + 1) + ': ຄາດ "' + want[i] + '" ແຕ່ພົບ "' + (got[i] || '') + '"');
      }
    }
  });
  var ok = problems.length === 0;
  Logger.log('validateSchema(): ' + (ok ? 'PASS' : 'FAIL\n' + problems.join('\n')));
  return { ok: ok, problems: problems };
}
