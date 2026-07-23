// Phase G — DocumentService (versioning + RBAC)

function seedD() {
  __setProp('SHEET_ID', 'TEST_SS');
  __seed('Users', ['user_id', 'email', 'name', 'role', 'active'], [
    { user_id: 'USR-1', email: 'editor@test.la', name: 'E', role: 'Editor', active: true },
    { user_id: 'USR-2', email: 'staff@test.la', name: 'S', role: 'Staff', active: true },
    { user_id: 'USR-3', email: 'manager@test.la', name: 'M', role: 'Manager', active: true },
    { user_id: 'USR-4', email: 'viewer@test.la', name: 'V', role: 'Viewer', active: true }
  ]);
  __seed('Documents', DOCUMENT_HEADERS, []);
}

test('upload creates v1 with history', function () {
  seedD();
  __setUser('editor@test.la');
  var r = DocumentService.upload({ name: 'contract.pdf', type: 'pdf', blob: __blob('c.pdf', 'v1') });
  assertEqual(r.ok, true);
  assertEqual(r.data.document_id, 'DOC-0001');
  assertEqual(r.data.version, 1);
  assertEqual(r.data.type, 'PDF');
});

test('unsupported type rejected', function () {
  seedD();
  __setUser('editor@test.la');
  assertEqual(DocumentService.upload({ name: 'x', type: 'exe', blob: __blob('x', 'z') }).error.code, ERR.VALIDATION);
});

test('newVersion increments version and history', function () {
  seedD();
  __setUser('editor@test.la');
  var d = DocumentService.upload({ name: 'a.docx', type: 'DOCX', blob: __blob('a', 'v1') }).data;
  var v2 = DocumentService.newVersion(d.document_id, { blob: __blob('a', 'v2') });
  assertEqual(v2.data.version, 2);
  var hist = DocumentService.history(d.document_id);
  assertEqual(hist.data.length, 2);
  assertEqual(hist.data[1].version, 2);
});

test('RBAC: staff cannot write, editor can; viewer cannot read', function () {
  seedD();
  __setUser('staff@test.la');
  assertEqual(DocumentService.upload({ name: 'a', type: 'PDF', blob: __blob('a', 'x') }).error.code, ERR.FORBIDDEN);
  __setUser('viewer@test.la');
  assertEqual(DocumentService.list().error.code, ERR.FORBIDDEN);
  __setUser('editor@test.la');
  assert(DocumentService.upload({ name: 'a', type: 'PDF', blob: __blob('a', 'x') }).ok);
});
