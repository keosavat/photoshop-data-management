// Phase D — PhotoService (upload, dedup, state, RBAC)

function seedAuthP() {
  __setProp('SHEET_ID', 'TEST_SS');
  __seed('Users', ['user_id', 'email', 'name', 'role', 'active'], [
    { user_id: 'USR-0001', email: 'owner@test.la', name: 'Owner', role: 'Owner', active: true },
    { user_id: 'USR-0002', email: 'staff@test.la', name: 'Staff', role: 'Staff', active: true },
    { user_id: 'USR-0003', email: 'viewer@test.la', name: 'Viewer', role: 'Viewer', active: true }
  ]);
  __seed('Photos', PHOTO_HEADERS, []); // reset per test
}

test('upload creates record with drive id + hash', function () {
  seedAuthP();
  __setUser('staff@test.la');
  var r = PhotoService.upload({ name: 'a.jpg', blob: __blob('a.jpg', 'AAA'), album_id: 'ALB-0001' });
  assertEqual(r.ok, true);
  assertEqual(r.data.photo_id, 'PHO-0001');
  assert(r.data.drive_file_id, 'has drive file id');
  assert(r.data.sha256.length === 64, 'sha256 hex length');
  assertEqual(r.meta.deduped, false);
});

test('duplicate content is deduped (no new record)', function () {
  seedAuthP();
  __setUser('staff@test.la');
  var a = PhotoService.upload({ name: 'a.jpg', blob: __blob('a.jpg', 'SAME') });
  var b = PhotoService.upload({ name: 'copy.jpg', blob: __blob('copy.jpg', 'SAME') });
  assertEqual(b.meta.deduped, true);
  assertEqual(b.data.photo_id, a.data.photo_id, 'returns existing');
  assertEqual(PhotoService.list().data.length, 1, 'only one record');
});

test('different content is not deduped', function () {
  seedAuthP();
  __setUser('staff@test.la');
  PhotoService.upload({ name: 'a.jpg', blob: __blob('a.jpg', 'X1') });
  var b = PhotoService.upload({ name: 'b.jpg', blob: __blob('b.jpg', 'X2') });
  assertEqual(b.meta.deduped, false);
  assertEqual(PhotoService.list().data.length, 2);
});

test('RBAC: viewer cannot upload; delete needs Manager+', function () {
  seedAuthP();
  __setUser('viewer@test.la');
  var v = PhotoService.upload({ name: 'a.jpg', blob: __blob('a.jpg', 'Z') });
  assertEqual(v.error.code, ERR.FORBIDDEN);

  __setUser('staff@test.la');
  var p = PhotoService.upload({ name: 'a.jpg', blob: __blob('a.jpg', 'Z') }).data;
  var del = PhotoService.remove(p.photo_id);
  assertEqual(del.error.code, ERR.FORBIDDEN, 'staff cannot hard-delete');
});

test('move / favorite / softDelete / restore', function () {
  seedAuthP();
  __setUser('staff@test.la');
  var p = PhotoService.upload({ name: 'a.jpg', blob: __blob('a.jpg', 'M') }).data;

  assertEqual(PhotoService.move(p.photo_id, 'ALB-0009').data.album_id, 'ALB-0009');
  assertEqual(PhotoService.setFavorite(p.photo_id, true).data.favorite, true);
  assertEqual(PhotoService.softDelete(p.photo_id).data.status, 'deleted');
  assertEqual(PhotoService.restore(p.photo_id).data.status, 'active');
});

test('list filters by album', function () {
  seedAuthP();
  __setUser('staff@test.la');
  PhotoService.upload({ name: '1', blob: __blob('1', 'a'), album_id: 'ALB-1' });
  PhotoService.upload({ name: '2', blob: __blob('2', 'b'), album_id: 'ALB-2' });
  assertEqual(PhotoService.list('ALB-1').data.length, 1);
});

test('thumbnail url is derived from drive_file_id', function () {
  seedAuthP();
  __setUser('staff@test.la');
  var up = PhotoService.upload({ name: 'a.jpg', blob: __blob('a.jpg', 'THUMB') }).data;
  assert(up.thumb_url.indexOf(up.drive_file_id) !== -1, 'upload return has thumb_url with file id');

  var listed = PhotoService.list().data[0];
  assert(listed.thumb_url.indexOf('drive.google.com/thumbnail') !== -1, 'list item has drive thumbnail url');
  assert(listed.thumb_url.indexOf(listed.drive_file_id) !== -1, 'thumb_url references its own file id');

  var got = PhotoService.get(up.photo_id).data;
  assertEqual(got.thumb_url, up.thumb_url, 'get returns same thumb_url');
});
