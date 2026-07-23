// Phase H — SearchService (unified + permission-scoped)

function seedS() {
  __setProp('SHEET_ID', 'TEST_SS');
  __seed('Users', ['user_id', 'email', 'name', 'role', 'active'], [
    { user_id: 'USR-0001', email: 'staff@test.la', name: 'S', role: 'Staff', active: true },
    { user_id: 'USR-0002', email: 'viewer@test.la', name: 'V', role: 'Viewer', active: true }
  ]);
  __seed('Customers', CUSTOMER_HEADERS, [
    { customer_id: 'CUS-0001', name: 'Alice', phone: '111' },
    { customer_id: 'CUS-0002', name: 'Wedding Guy', phone: '222' }
  ]);
  __seed('Orders', ORDER_HEADERS, [
    { order_id: 'ORD-0001', customer_id: 'CUS-0001', type: 'wedding', status: 'new', total: 1000 }
  ]);
}

test('staff search finds across customers + orders', function () {
  seedS();
  __setUser('staff@test.la');
  var r = SearchService.search('wedding');
  assertEqual(r.ok, true);
  assertEqual(r.data.orders.length, 1, 'wedding order');
  assertEqual(r.data.customers.length, 1, 'Wedding Guy customer');
});

test('viewer cannot see orders/documents keys', function () {
  seedS();
  __setUser('viewer@test.la');
  var r = SearchService.search('a');
  assert(r.data.customers !== undefined, 'can read customers');
  assert(r.data.orders === undefined, 'orders hidden from viewer');
  assert(r.data.documents === undefined, 'documents hidden from viewer');
});

test('unknown user unauthorized', function () {
  seedS();
  __setUser('ghost@test.la');
  assertEqual(SearchService.search('x').error.code, ERR.UNAUTHORIZED);
});
