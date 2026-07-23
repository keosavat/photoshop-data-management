// Phase E — OrderService (CRUD + state machine + RBAC)

function seedAuthO() {
  __setProp('SHEET_ID', 'TEST_SS');
  __seed('Users', ['user_id', 'email', 'name', 'role', 'active'], [
    { user_id: 'USR-0001', email: 'owner@test.la', name: 'Owner', role: 'Owner', active: true },
    { user_id: 'USR-0002', email: 'staff@test.la', name: 'Staff', role: 'Staff', active: true },
    { user_id: 'USR-0003', email: 'manager@test.la', name: 'Manager', role: 'Manager', active: true },
    { user_id: 'USR-0004', email: 'viewer@test.la', name: 'Viewer', role: 'Viewer', active: true }
  ]);
  __seed('Orders', ORDER_HEADERS, []);
}

test('create makes new order ORD-0001', function () {
  seedAuthO();
  __setUser('staff@test.la');
  var r = OrderService.create({ customer_id: 'CUS-0001', type: 'wedding', total: 500000 });
  assertEqual(r.ok, true);
  assertEqual(r.data.order_id, 'ORD-0001');
  assertEqual(r.data.status, 'new');
  assertEqual(r.data.total, 500000);
});

test('create requires customer_id and type', function () {
  seedAuthO();
  __setUser('staff@test.la');
  assertEqual(OrderService.create({ type: 'x' }).error.code, ERR.VALIDATION);
  assertEqual(OrderService.create({ customer_id: 'C' }).error.code, ERR.VALIDATION);
});

test('valid full lifecycle new->...->complete', function () {
  seedAuthO();
  __setUser('staff@test.la');
  var o = OrderService.create({ customer_id: 'C', type: 't' }).data;
  assertEqual(OrderService.setStatus(o.order_id, 'in_progress').data.status, 'in_progress');
  assertEqual(OrderService.setStatus(o.order_id, 'printing').data.status, 'printing');
  assertEqual(OrderService.setStatus(o.order_id, 'delivery').data.status, 'delivery');
  assertEqual(OrderService.setStatus(o.order_id, 'complete').data.status, 'complete');
});

test('illegal transition rejected', function () {
  seedAuthO();
  __setUser('staff@test.la');
  var o = OrderService.create({ customer_id: 'C', type: 't' }).data;
  assertEqual(OrderService.setStatus(o.order_id, 'complete').error.code, ERR.VALIDATION);
  OrderService.setStatus(o.order_id, 'in_progress');
  assertEqual(OrderService.setStatus(o.order_id, 'delivery').error.code, ERR.VALIDATION);
});

test('cancel allowed from active, not from complete', function () {
  seedAuthO();
  __setUser('staff@test.la');
  var o = OrderService.create({ customer_id: 'C', type: 't' }).data;
  assertEqual(OrderService.cancel(o.order_id).data.status, 'cancelled');

  var o2 = OrderService.create({ customer_id: 'C', type: 't' }).data;
  OrderService.setStatus(o2.order_id, 'in_progress');
  OrderService.setStatus(o2.order_id, 'printing');
  OrderService.setStatus(o2.order_id, 'delivery');
  OrderService.setStatus(o2.order_id, 'complete');
  assertEqual(OrderService.cancel(o2.order_id).error.code, ERR.VALIDATION);
});

test('RBAC: viewer no access; delete needs Manager+', function () {
  seedAuthO();
  __setUser('viewer@test.la');
  assertEqual(OrderService.list().error.code, ERR.FORBIDDEN);

  __setUser('staff@test.la');
  var o = OrderService.create({ customer_id: 'C', type: 't' }).data;
  assertEqual(OrderService.remove(o.order_id).error.code, ERR.FORBIDDEN);

  __setUser('manager@test.la');
  assertEqual(OrderService.remove(o.order_id).ok, true);
});
