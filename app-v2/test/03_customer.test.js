// Phase C — CustomerService (CRUD + validation + RBAC)

function seedAuth() {
  __setProp('SHEET_ID', 'TEST_SS');
  __seed('Users', ['user_id', 'email', 'name', 'role', 'active'], [
    { user_id: 'USR-0001', email: 'owner@test.la', name: 'Owner', role: 'Owner', active: true },
    { user_id: 'USR-0002', email: 'staff@test.la', name: 'Staff', role: 'Staff', active: true },
    { user_id: 'USR-0003', email: 'viewer@test.la', name: 'Viewer', role: 'Viewer', active: true }
  ]);
}

test('create assigns sequential ids and persists', function () {
  seedAuth();
  __setUser('owner@test.la');
  var r1 = CustomerService.create({ name: 'Alpha', phone: '+856 20 1112222' });
  assertEqual(r1.ok, true);
  assertEqual(r1.data.customer_id, 'CUS-0001');
  var r2 = CustomerService.create({ name: 'Beta' });
  assertEqual(r2.data.customer_id, 'CUS-0002');
  var list = CustomerService.list();
  assertEqual(list.ok, true);
  assertEqual(list.data.length, 2);
});

test('create validates required name and formats', function () {
  seedAuth();
  __setUser('owner@test.la');
  var bad = CustomerService.create({ phone: '123456' });
  assertEqual(bad.ok, false);
  assertEqual(bad.error.code, ERR.VALIDATION);
  var badPhone = CustomerService.create({ name: 'X', phone: 'abc' });
  assertEqual(badPhone.error.code, ERR.VALIDATION);
  var badEmail = CustomerService.create({ name: 'X', email: 'nope' });
  assertEqual(badEmail.error.code, ERR.VALIDATION);
});

test('tags array is joined to CSV', function () {
  seedAuth();
  __setUser('owner@test.la');
  var r = CustomerService.create({ name: 'Tagged', tags: ['vip', 'wedding'] });
  assertEqual(r.data.tags, 'vip,wedding');
});

test('RBAC: viewer cannot create, staff can, viewer cannot delete', function () {
  seedAuth();
  __setUser('viewer@test.la');
  var v = CustomerService.create({ name: 'NoWay' });
  assertEqual(v.ok, false);
  assertEqual(v.error.code, ERR.FORBIDDEN);

  __setUser('staff@test.la');
  var s = CustomerService.create({ name: 'OkStaff' });
  assertEqual(s.ok, true);

  __setUser('viewer@test.la');
  var d = CustomerService.remove(s.data.customer_id);
  assertEqual(d.error.code, ERR.FORBIDDEN);
});

test('get / update / remove happy path', function () {
  seedAuth();
  __setUser('owner@test.la');
  var c = CustomerService.create({ name: 'Gamma' }).data;
  var got = CustomerService.get(c.customer_id);
  assertEqual(got.data.name, 'Gamma');

  var upd = CustomerService.update(c.customer_id, { name: 'Gamma2', tags: ['a', 'b'] });
  assertEqual(upd.data.name, 'Gamma2');
  assertEqual(upd.data.tags, 'a,b');

  var del = CustomerService.remove(c.customer_id);
  assertEqual(del.ok, true);
  var gone = CustomerService.get(c.customer_id);
  assertEqual(gone.error.code, ERR.NOT_FOUND);
});

test('get missing -> NOT_FOUND', function () {
  seedAuth();
  __setUser('owner@test.la');
  var r = CustomerService.get('CUS-9999');
  assertEqual(r.ok, false);
  assertEqual(r.error.code, ERR.NOT_FOUND);
});
