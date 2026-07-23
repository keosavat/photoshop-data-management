// Phase H — ReportService (KPIs + RBAC)

function seedR() {
  __setProp('SHEET_ID', 'TEST_SS');
  __seed('Users', ['user_id', 'email', 'name', 'role', 'active'], [
    { user_id: 'USR-0001', email: 'manager@test.la', name: 'M', role: 'Manager', active: true },
    { user_id: 'USR-0002', email: 'staff@test.la', name: 'S', role: 'Staff', active: true }
  ]);
  __seed('Customers', CUSTOMER_HEADERS, [
    { customer_id: 'CUS-0001', name: 'A' }, { customer_id: 'CUS-0002', name: 'B' }
  ]);
  __seed('Orders', ORDER_HEADERS, [
    { order_id: 'ORD-0001', customer_id: 'C', type: 't', status: 'complete', total: 500 },
    { order_id: 'ORD-0002', customer_id: 'C', type: 't', status: 'new', total: 300 },
    { order_id: 'ORD-0003', customer_id: 'C', type: 't', status: 'cancelled', total: 0 }
  ]);
  __seed('Payments', PAYMENT_HEADERS, [
    { payment_id: 'PAY-0001', order_id: 'ORD-0001', amount: 500, method: 'cash', status: 'paid' },
    { payment_id: 'PAY-0002', order_id: 'ORD-0002', amount: 100, method: 'qr', status: 'paid' }
  ]);
}

test('overview aggregates counts + revenue', function () {
  seedR();
  __setUser('manager@test.la');
  var o = ReportService.overview().data;
  assertEqual(o.customers, 2);
  assertEqual(o.orders, 3);
  assertEqual(o.completedOrders, 1);
  assertEqual(o.pendingOrders, 1);
  assertEqual(o.revenue, 600);
});

test('ordersByStatus groups', function () {
  seedR();
  __setUser('manager@test.la');
  var by = ReportService.ordersByStatus().data;
  assertEqual(by.complete, 1);
  assertEqual(by['new'], 1);
  assertEqual(by.cancelled, 1);
});

test('RBAC: staff cannot read reports', function () {
  seedR();
  __setUser('staff@test.la');
  assertEqual(ReportService.overview().error.code, ERR.FORBIDDEN);
});
