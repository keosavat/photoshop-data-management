// Phase 4 (server) — endpoints for Documents / Printing / Reports / Settings

function seedApi3() {
  __setProp('SHEET_ID', 'TEST_SS');
  __seed('Users', ['user_id', 'email', 'name', 'role', 'active'], [
    { user_id: 'USR-0001', email: 'owner@test.la', name: 'O', role: 'Owner', active: true },
    { user_id: 'USR-0002', email: 'admin@test.la', name: 'A', role: 'Admin', active: true },
    { user_id: 'USR-0003', email: 'editor@test.la', name: 'E', role: 'Editor', active: true },
    { user_id: 'USR-0004', email: 'manager@test.la', name: 'M', role: 'Manager', active: true },
    { user_id: 'USR-0005', email: 'staff@test.la', name: 'S', role: 'Staff', active: true }
  ]);
  __seed('Documents', DOCUMENT_HEADERS, []);
  __seed('PrintJobs', PRINT_HEADERS, []);
  __seed('Settings', SETTING_HEADERS, []);
  __seed('Orders', ORDER_HEADERS, [
    { order_id: 'ORD-0001', customer_id: 'C', type: 't', status: 'complete', total: 500 },
    { order_id: 'ORD-0002', customer_id: 'C', type: 't', status: 'new', total: 300 }
  ]);
  __seed('Payments', PAYMENT_HEADERS, [
    { payment_id: 'PAY-0001', order_id: 'ORD-0001', amount: 500, method: 'cash', status: 'paid' }
  ]);
  __seed('Customers', CUSTOMER_HEADERS, [{ customer_id: 'CUS-0001', name: 'A' }]);
}

test('apiUploadDocument + apiDocuments (Editor)', function () {
  seedApi3();
  __setUser('editor@test.la');
  var d = apiUploadDocument({ name: 'c.pdf', type: 'PDF', dataBase64: 'aGVsbG8=' });
  assertEqual(d.ok, true);
  assertEqual(d.data.document_id, 'DOC-0001');
  assertEqual(d.data.version, 1);
  assertEqual(apiDocuments().data.length, 1);
});

test('apiCreatePrint + status + queue (Staff)', function () {
  seedApi3();
  __setUser('staff@test.la');
  var j = apiCreatePrint({ order_id: 'ORD-0001', type: 'Wedding', qty: 2 });
  assertEqual(j.data.print_id, 'PRT-0001');
  assertEqual(apiSetPrintStatus(j.data.print_id, 'printing').data.status, 'printing');
  assertEqual(apiPrintQueue().data.length, 1);
});

test('apiReportOverview + apiOrdersByStatus (Manager)', function () {
  seedApi3();
  __setUser('manager@test.la');
  var o = apiReportOverview().data;
  assertEqual(o.orders, 2);
  assertEqual(o.completedOrders, 1);
  assertEqual(o.revenue, 500);
  assertEqual(apiOrdersByStatus().data.complete, 1);
});

test('settings + users endpoints (Admin/Owner) with RBAC', function () {
  seedApi3();
  __setUser('admin@test.la');
  assert(apiSetSetting('theme', 'dark').ok);
  assertEqual(apiSettingsAll().data.length, 1);
  assertEqual(apiListUsers().error.code, ERR.FORBIDDEN); // admin cannot manage users

  __setUser('owner@test.la');
  var u = apiAddUser({ email: 'new@test.la', role: 'Staff' });
  assertEqual(u.ok, true);
  assert(apiListUsers().data.length >= 6);

  __setUser('staff@test.la');
  assertEqual(apiSettingsAll().error.code, ERR.FORBIDDEN);
});
