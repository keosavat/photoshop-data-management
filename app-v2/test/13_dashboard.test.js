// Phase 1 (server) — getDashboard() endpoint

function seedDash() {
  __setProp('SHEET_ID', 'TEST_SS');
  __seed('Users', ['user_id', 'email', 'name', 'role', 'active'], [
    { user_id: 'USR-0001', email: 'owner@test.la', name: 'O', role: 'Owner', active: true }
  ]);
  __seed('Customers', CUSTOMER_HEADERS, [
    { customer_id: 'CUS-0001', name: 'A' }, { customer_id: 'CUS-0002', name: 'B' }
  ]);
  __seed('Orders', ORDER_HEADERS, [
    { order_id: 'ORD-0001', customer_id: 'C', type: 't', status: 'complete', total: 500 },
    { order_id: 'ORD-0002', customer_id: 'C', type: 't', status: 'new', total: 300 }
  ]);
  __seed('Payments', PAYMENT_HEADERS, [
    { payment_id: 'PAY-0001', order_id: 'ORD-0001', amount: 500, method: 'cash', status: 'paid' }
  ]);
}

test('getDashboard aggregates kpis for signed-in user', function () {
  seedDash();
  __setUser('owner@test.la');
  var r = getDashboard();
  assertEqual(r.ok, true);
  assertEqual(r.data.role, 'Owner');
  assertEqual(r.data.kpis.customers, 2);
  assertEqual(r.data.kpis.orders, 2);
  assertEqual(r.data.kpis.revenue, 500);
  assertEqual(r.data.kpis.completedJobs, 1);
  assertEqual(r.data.kpis.pendingJobs, 1);
});

test('getDashboard requires sign-in', function () {
  seedDash();
  __setUser('ghost@test.la');
  assertEqual(getDashboard().error.code, ERR.UNAUTHORIZED);
});
