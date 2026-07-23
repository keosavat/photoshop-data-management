// Phase G — PrintingService (types + queue state machine + RBAC)

function seedPr() {
  __setProp('SHEET_ID', 'TEST_SS');
  __seed('Users', ['user_id', 'email', 'name', 'role', 'active'], [
    { user_id: 'USR-1', email: 'staff@test.la', name: 'S', role: 'Staff', active: true },
    { user_id: 'USR-2', email: 'viewer@test.la', name: 'V', role: 'Viewer', active: true }
  ]);
  __seed('PrintJobs', PRINT_HEADERS, []);
}

test('create job with valid type', function () {
  seedPr();
  __setUser('staff@test.la');
  var r = PrintingService.create({ order_id: 'ORD-0001', type: 'Wedding', qty: 3 });
  assertEqual(r.data.print_id, 'PRT-0001');
  assertEqual(r.data.status, 'queued');
  assertEqual(r.data.qty, 3);
});

test('invalid print type rejected', function () {
  seedPr();
  __setUser('staff@test.la');
  assertEqual(PrintingService.create({ order_id: 'O', type: 'Poster' }).error.code, ERR.VALIDATION);
});

test('queue transitions queued->printing->done->reprint->printing', function () {
  seedPr();
  __setUser('staff@test.la');
  var j = PrintingService.create({ order_id: 'O', type: 'Frame' }).data;
  assertEqual(PrintingService.setStatus(j.print_id, 'printing').data.status, 'printing');
  assertEqual(PrintingService.setStatus(j.print_id, 'done').data.status, 'done');
  assertEqual(PrintingService.setStatus(j.print_id, 'reprint').data.status, 'reprint');
  assertEqual(PrintingService.setStatus(j.print_id, 'printing').data.status, 'printing');
  assertEqual(PrintingService.setStatus(j.print_id, 'reprint').error.code, ERR.VALIDATION);
});

test('assign + RBAC viewer cannot read queue', function () {
  seedPr();
  __setUser('staff@test.la');
  var j = PrintingService.create({ order_id: 'O', type: 'Canvas' }).data;
  assertEqual(PrintingService.assign(j.print_id, 'staff@test.la').data.assigned_to, 'staff@test.la');
  __setUser('viewer@test.la');
  assertEqual(PrintingService.queue().error.code, ERR.FORBIDDEN);
});
