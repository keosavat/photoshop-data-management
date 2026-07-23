// Phase F — PaymentService (record, validation, order status, RBAC)

function seedAuthPay() {
  __setProp('SHEET_ID', 'TEST_SS');
  __seed('Users', ['user_id', 'email', 'name', 'role', 'active'], [
    { user_id: 'USR-0001', email: 'manager@test.la', name: 'Manager', role: 'Manager', active: true },
    { user_id: 'USR-0002', email: 'staff@test.la', name: 'Staff', role: 'Staff', active: true }
  ]);
  __seed('Payments', PAYMENT_HEADERS, []);
}

test('record creates PAY-0001', function () {
  seedAuthPay();
  __setUser('manager@test.la');
  var r = PaymentService.record({ order_id: 'ORD-0001', amount: 100000, method: 'cash' });
  assertEqual(r.ok, true);
  assertEqual(r.data.payment_id, 'PAY-0001');
  assertEqual(r.data.status, 'paid');
});

test('validation: amount>0, method, required', function () {
  seedAuthPay();
  __setUser('manager@test.la');
  assertEqual(PaymentService.record({ order_id: 'O', amount: 0, method: 'cash' }).error.code, ERR.VALIDATION);
  assertEqual(PaymentService.record({ order_id: 'O', amount: 100, method: 'bitcoin' }).error.code, ERR.VALIDATION);
  assertEqual(PaymentService.record({ amount: 100, method: 'cash' }).error.code, ERR.VALIDATION);
});

test('statusForOrder: unpaid -> partial -> paid', function () {
  seedAuthPay();
  __setUser('manager@test.la');
  assertEqual(PaymentService.statusForOrder('ORD-0001', 1000).data.status, 'unpaid');
  PaymentService.record({ order_id: 'ORD-0001', amount: 400, method: 'cash' });
  assertEqual(PaymentService.statusForOrder('ORD-0001', 1000).data.status, 'partial');
  PaymentService.record({ order_id: 'ORD-0001', amount: 600, method: 'transfer' });
  var s = PaymentService.statusForOrder('ORD-0001', 1000).data;
  assertEqual(s.status, 'paid');
  assertEqual(s.paid, 1000);
});

test('listByOrder filters', function () {
  seedAuthPay();
  __setUser('manager@test.la');
  PaymentService.record({ order_id: 'A', amount: 1, method: 'qr' });
  PaymentService.record({ order_id: 'B', amount: 2, method: 'qr' });
  assertEqual(PaymentService.listByOrder('A').data.length, 1);
});

test('RBAC: staff cannot record or read payments', function () {
  seedAuthPay();
  __setUser('staff@test.la');
  assertEqual(PaymentService.record({ order_id: 'O', amount: 1, method: 'cash' }).error.code, ERR.FORBIDDEN);
  assertEqual(PaymentService.statusForOrder('O', 10).error.code, ERR.FORBIDDEN);
});
