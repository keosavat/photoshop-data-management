// Phase 2 (server) — client-callable API endpoints in Code.gs

function seedApi() {
  __setProp('SHEET_ID', 'TEST_SS');
  __seed('Users', ['user_id', 'email', 'name', 'role', 'active'], [
    { user_id: 'USR-0001', email: 'owner@test.la', name: 'O', role: 'Owner', active: true },
    { user_id: 'USR-0002', email: 'viewer@test.la', name: 'V', role: 'Viewer', active: true }
  ]);
  __seed('Customers', CUSTOMER_HEADERS, []);
  __seed('Photos', PHOTO_HEADERS, []);
}

test('apiCreateCustomer + apiCustomers round-trip', function () {
  seedApi();
  __setUser('owner@test.la');
  var c = apiCreateCustomer({ name: 'Alpha', phone: '+856 20 5551111' });
  assertEqual(c.ok, true);
  assertEqual(c.data.customer_id, 'CUS-0001');
  var list = apiCustomers();
  assertEqual(list.ok, true);
  assertEqual(list.data.length, 1);
  assertEqual(list.data[0].name, 'Alpha');
});

test('apiCreateCustomer validation surfaces error envelope', function () {
  seedApi();
  __setUser('owner@test.la');
  var bad = apiCreateCustomer({ phone: '123456' });
  assertEqual(bad.ok, false);
  assertEqual(bad.error.code, ERR.VALIDATION);
});

test('apiUpdateCustomer / apiDeleteCustomer', function () {
  seedApi();
  __setUser('owner@test.la');
  var c = apiCreateCustomer({ name: 'Beta' }).data;
  assertEqual(apiUpdateCustomer(c.customer_id, { name: 'Beta2' }).data.name, 'Beta2');
  assertEqual(apiDeleteCustomer(c.customer_id).ok, true);
  assertEqual(apiCustomers().data.length, 0);
});

test('apiPhotos empty + RBAC on customer create', function () {
  seedApi();
  __setUser('owner@test.la');
  assertEqual(apiPhotos().data.length, 0);
  __setUser('viewer@test.la');
  assertEqual(apiCreateCustomer({ name: 'X' }).error.code, ERR.FORBIDDEN);
});
