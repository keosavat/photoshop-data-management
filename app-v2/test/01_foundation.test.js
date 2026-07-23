// Phase A — Foundation tests (Ids, Validator, Result, Sheet/Drive/Cache repositories)

// ----- Ids -----
test('makeId pads to 4', function () {
  assertEqual(makeId('Customers', 1), 'CUS-0001');
  assertEqual(makeId('Orders', 42), 'ORD-0042');
});
test('parseIdSeq extracts number', function () {
  assertEqual(parseIdSeq('CUS-0007'), 7);
  assertEqual(parseIdSeq(''), 0);
});
test('nextId picks max+1', function () {
  assertEqual(nextId('Customers', ['CUS-0001', 'CUS-0003', 'CUS-0002']), 'CUS-0004');
  assertEqual(nextId('Customers', []), 'CUS-0001');
});

// ----- Validator -----
test('requireFields throws E_VALIDATION on missing', function () {
  assertThrows(function () { requireFields({ a: 1 }, ['a', 'b']); }, ERR.VALIDATION);
  assert(requireFields({ a: 1, b: 2 }, ['a', 'b']) === true);
});
test('isEmail / isPhone', function () {
  assert(isEmail('a@b.la'));
  assert(!isEmail('nope'));
  assert(isPhone('+856 20 1234567'));
  assert(!isPhone('abc'));
});

// ----- Result -----
test('ok / fail envelope shape', function () {
  var r = ok({ x: 1 }, { page: 1 });
  assertEqual(r.ok, true); assertDeep(r.data, { x: 1 }); assertDeep(r.meta, { page: 1 });
  var f = fail(ERR.NOT_FOUND, 'nope');
  assertEqual(f.ok, false); assertEqual(f.error.code, ERR.NOT_FOUND);
});
test('guardResult converts AppError to fail', function () {
  var r = guardResult(function () { throw AppError(ERR.FORBIDDEN, 'no'); });
  assertEqual(r.ok, false); assertEqual(r.error.code, ERR.FORBIDDEN);
});

// ----- SheetRepository (uses seeded mock sheet) -----
test('SheetRepository CRUD', function () {
  __setProp('SHEET_ID', 'TEST_SS');
  __seed('Customers', ['customer_id', 'name', 'phone'], [
    { customer_id: 'CUS-0001', name: 'Alpha', phone: '111' },
    { customer_id: 'CUS-0002', name: 'Beta', phone: '222' }
  ]);
  var repo = new SheetRepository();

  var all = repo.findAll('Customers');
  assertEqual(all.length, 2);
  assertEqual(all[0].name, 'Alpha');

  var found = repo.findById('Customers', 'customer_id', 'CUS-0002');
  assertEqual(found.name, 'Beta');

  repo.insert('Customers', { customer_id: 'CUS-0003', name: 'Gamma', phone: '333' });
  assertEqual(repo.findAll('Customers').length, 3);

  var upd = repo.update('Customers', 'customer_id', 'CUS-0001', { name: 'Alpha2' });
  assertEqual(upd.name, 'Alpha2');
  assertEqual(repo.findById('Customers', 'customer_id', 'CUS-0001').name, 'Alpha2');

  repo.deleteById('Customers', 'customer_id', 'CUS-0002');
  assertEqual(repo.findAll('Customers').length, 2);
  assert(repo.findById('Customers', 'customer_id', 'CUS-0002') === null);
});
test('SheetRepository update missing throws NOT_FOUND', function () {
  __setProp('SHEET_ID', 'TEST_SS');
  __seed('Customers', ['customer_id', 'name'], []);
  var repo = new SheetRepository();
  assertThrows(function () { repo.update('Customers', 'customer_id', 'X', { name: 'z' }); }, ERR.NOT_FOUND);
});

// ----- DriveRepository -----
test('DriveRepository getOrCreateFolderPath is idempotent', function () {
  var drive = new DriveRepository();
  var a = drive.getOrCreateFolderPath(['Customers', 'CUS-0001']);
  var b = drive.getOrCreateFolderPath(['Customers', 'CUS-0001']);
  assertEqual(a.getId(), b.getId(), 'same folder returned, not duplicated');
});

// ----- CacheRepository -----
test('CacheRepository put/get/remove + remember', function () {
  var cache = new CacheRepository();
  cache.put('k', { v: 1 });
  assertDeep(cache.get('k'), { v: 1 });
  cache.remove('k');
  assert(cache.get('k') === null);

  var calls = 0;
  var r1 = cache.remember('m', function () { calls++; return 42; });
  var r2 = cache.remember('m', function () { calls++; return 99; });
  assertEqual(r1, 42); assertEqual(r2, 42); assertEqual(calls, 1, 'computed once');
});
