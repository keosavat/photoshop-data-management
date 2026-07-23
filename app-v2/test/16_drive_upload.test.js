// Phase 3 — shared Drive folder + photo upload endpoint

function seedDrive() {
  __setProp('SHEET_ID', 'TEST_SS');
  __seed('Users', ['user_id', 'email', 'name', 'role', 'active'], [
    { user_id: 'USR-0001', email: 'owner@test.la', name: 'O', role: 'Owner', active: true }
  ]);
  __seed('Photos', PHOTO_HEADERS, []);
}

test('setupDriveRoot creates shared folder and stores ROOT_FOLDER_ID', function () {
  var r = setupDriveRoot();
  assertEqual(r.ok, true);
  assert(!!r.data.rootFolderId, 'has folder id');
  assertEqual(r.data.name, CONFIG.DRIVE.root);
  // DriveRepository now resolves root via the stored id
  var d = new DriveRepository();
  assertEqual(d.root().getId(), r.data.rootFolderId, 'uses shared folder');
});

test('setupDriveRoot is idempotent (same folder id)', function () {
  var a = setupDriveRoot();
  var b = setupDriveRoot();
  assertEqual(a.data.rootFolderId, b.data.rootFolderId);
});

test('apiUploadPhoto decodes base64 into a photo record', function () {
  seedDrive();
  __setUser('owner@test.la');
  setupDriveRoot();
  var r = apiUploadPhoto({ name: 'a.jpg', mimeType: 'image/jpeg', dataBase64: 'aGVsbG8=', album_id: 'ALB-0001' });
  assertEqual(r.ok, true);
  assertEqual(r.data.photo_id, 'PHO-0001');
  assert(!!r.data.drive_file_id, 'stored in drive');
  assertEqual(PhotoService.list().data.length, 1);
});

test('apiUploadPhoto dedups identical content', function () {
  seedDrive();
  __setUser('owner@test.la');
  apiUploadPhoto({ name: 'x.jpg', dataBase64: 'c2FtZQ==' });
  var dup = apiUploadPhoto({ name: 'y.jpg', dataBase64: 'c2FtZQ==' });
  assertEqual(dup.meta.deduped, true);
  assertEqual(PhotoService.list().data.length, 1);
});

test('apiUploadPhoto RBAC: viewer forbidden', function () {
  seedDrive();
  __seed('Users', ['user_id', 'email', 'name', 'role', 'active'], [
    { user_id: 'USR-0009', email: 'v@test.la', name: 'V', role: 'Viewer', active: true }
  ]);
  __setUser('v@test.la');
  assertEqual(apiUploadPhoto({ name: 'a', dataBase64: 'aGVsbG8=' }).error.code, ERR.FORBIDDEN);
});
