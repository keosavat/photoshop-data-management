// Phase 3b — server endpoints for Albums / Orders / Payments UI

function seedApi2() {
  __setProp('SHEET_ID', 'TEST_SS');
  __seed('Users', ['user_id', 'email', 'name', 'role', 'active'], [
    { user_id: 'USR-0001', email: 'owner@test.la', name: 'O', role: 'Owner', active: true },
    { user_id: 'USR-0002', email: 'staff@test.la', name: 'S', role: 'Staff', active: true }
  ]);
  __seed('Albums', ALBUM_HEADERS, []);
  __seed('Orders', ORDER_HEADERS, []);
  __seed('Payments', PAYMENT_HEADERS, []);
}

test('apiCreateAlbum + apiAlbums', function () {
  seedApi2();
  __setUser('staff@test.la');
  var a = apiCreateAlbum({ name: 'Wedding', customer_id: 'CUS-0001' });
  assertEqual(a.ok, true);
  assertEqual(a.data.album_id, 'ALB-0001');
  assertEqual(apiAlbums().data.length, 1);
});

test('apiCreateOrder + apiSetOrderStatus lifecycle', function () {
  seedApi2();
  __setUser('staff@test.la');
  var o = apiCreateOrder({ customer_id: 'CUS-0001', type: 'wedding', total: 800000 }).data;
  assertEqual(o.order_id, 'ORD-0001');
  assertEqual(apiSetOrderStatus(o.order_id, 'in_progress').data.status, 'in_progress');
  assertEqual(apiSetOrderStatus(o.order_id, 'complete').error.code, ERR.VALIDATION);
});

test('payments endpoints: record + status + list (Manager only)', function () {
  seedApi2();
  __setUser('owner@test.la');
  apiRecordPayment({ order_id: 'ORD-0001', amount: 500000, method: 'transfer' });
  var s = apiOrderPaymentStatus('ORD-0001', 800000).data;
  assertEqual(s.status, 'partial');
  assertEqual(s.paid, 500000);
  assertEqual(apiPayments('ORD-0001').data.length, 1);
});

test('RBAC: staff cannot record payment', function () {
  seedApi2();
  __setUser('staff@test.la');
  assertEqual(apiRecordPayment({ order_id: 'O', amount: 1, method: 'cash' }).error.code, ERR.FORBIDDEN);
});
