// Phase G — AlbumService

function seedA() {
  __setProp('SHEET_ID', 'TEST_SS');
  __seed('Users', ['user_id', 'email', 'name', 'role', 'active'], [
    { user_id: 'USR-1', email: 'owner@test.la', name: 'O', role: 'Owner', active: true },
    { user_id: 'USR-2', email: 'staff@test.la', name: 'S', role: 'Staff', active: true },
    { user_id: 'USR-3', email: 'manager@test.la', name: 'M', role: 'Manager', active: true },
    { user_id: 'USR-4', email: 'viewer@test.la', name: 'V', role: 'Viewer', active: true }
  ]);
  __seed('Albums', ALBUM_HEADERS, []);
}

test('create/list/get', function () {
  seedA();
  __setUser('staff@test.la');
  var a = AlbumService.create({ name: 'Wedding A', customer_id: 'CUS-0001' });
  assertEqual(a.data.album_id, 'ALB-0001');
  assertEqual(a.data.status, 'active');
  assertEqual(AlbumService.list().data.length, 1);
  assertEqual(AlbumService.get('ALB-0001').data.name, 'Wedding A');
});

test('archive / setCover / update', function () {
  seedA();
  __setUser('staff@test.la');
  var a = AlbumService.create({ name: 'X' }).data;
  assertEqual(AlbumService.archive(a.album_id).data.status, 'archived');
  assertEqual(AlbumService.setCover(a.album_id, 'PHO-0007').data.cover_photo_id, 'PHO-0007');
  assertEqual(AlbumService.update(a.album_id, { name: 'X2' }).data.name, 'X2');
});

test('RBAC: viewer read-only, delete needs Manager+', function () {
  seedA();
  __setUser('viewer@test.la');
  assert(AlbumService.list().ok);
  assertEqual(AlbumService.create({ name: 'no' }).error.code, ERR.FORBIDDEN);

  __setUser('staff@test.la');
  var a = AlbumService.create({ name: 'Z' }).data;
  assertEqual(AlbumService.remove(a.album_id).error.code, ERR.FORBIDDEN);
  __setUser('manager@test.la');
  assert(AlbumService.remove(a.album_id).ok);
});
