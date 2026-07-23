// Setup — setupDatabase() bootstrap + validateSchema()

test('setupDatabase creates all tabs and seeds Owner', function () {
  __setProp('SHEET_ID', 'TEST_SS');
  __setUser('boss@shop.la');
  var r = setupDatabase();
  assertEqual(r.ok, true);
  assert(r.data.sheets.indexOf('Customers') >= 0);
  assert(r.data.sheets.indexOf('Logs') >= 0);
  assertEqual(r.data.sheets.length, 11);
  assertEqual(r.data.ownerSeeded, true);
  assertEqual(r.data.owner, 'boss@shop.la');

  // now Auth should see boss as Owner
  assertEqual(Auth.currentRole(), 'Owner');
  // validateSchema passes
  var v = validateSchema();
  assertEqual(v.data.ok, true);
  assertDeep(v.data.missing, []);
});

test('setupDatabase is idempotent (no duplicate owner)', function () {
  __setProp('SHEET_ID', 'TEST_SS');
  __setUser('boss@shop.la');
  setupDatabase();
  var again = setupDatabase();
  assertEqual(again.data.ownerSeeded, false, 'owner already exists');
});

test('setupDatabase without SHEET_ID fails', function () {
  __setUser('boss@shop.la');
  __setProp('SHEET_ID', ''); // clear so bootstrap guard triggers
  var r = setupDatabase();
  assertEqual(r.ok, false);
  assertEqual(r.error.code, ERR.INTERNAL);
});
