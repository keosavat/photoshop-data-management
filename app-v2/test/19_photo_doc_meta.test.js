// Photos customer/date + Documents category + share link + schema migration

function seedMeta() {
  __setProp('SHEET_ID', 'TEST_SS');
  __seed('Users', ['user_id', 'email', 'name', 'role', 'active'], [
    { user_id: 'USR-0001', email: 'owner@test.la', name: 'Owner', role: 'Owner', active: true },
    { user_id: 'USR-0002', email: 'staff@test.la', name: 'Staff', role: 'Staff', active: true }
  ]);
}

test('photo upload stores customer + date and lists them', function () {
  seedMeta();
  __seed('Photos', PHOTO_HEADERS, []);
  __setUser('staff@test.la');
  var r = PhotoService.upload({
    name: 'p.jpg', blob: __blob('p.jpg', 'META'),
    customer_id: 'CUS-0007', customer_name: 'Somchai', photo_date: '2026-07-24'
  });
  assertEqual(r.data.customer_id, 'CUS-0007');
  assertEqual(r.data.customer_name, 'Somchai');
  assertEqual(r.data.photo_date, '2026-07-24');
  var listed = PhotoService.list().data[0];
  assertEqual(listed.customer_name, 'Somchai');
  assertEqual(listed.photo_date, '2026-07-24');
});

test('apiShareLink makes file shareable and returns urls', function () {
  seedMeta();
  __seed('Photos', PHOTO_HEADERS, []);
  __setUser('staff@test.la');
  var up = PhotoService.upload({ name: 'p.jpg', blob: __blob('p.jpg', 'SHARE') }).data;
  var s = apiShareLink(up.drive_file_id);
  assertEqual(s.ok, true);
  assert(s.data.view.indexOf(up.drive_file_id) !== -1, 'view url has file id');
  assert(s.data.download.indexOf('export=download') !== -1, 'download url');
  assert(s.data.share.indexOf('usp=sharing') !== -1, 'share url');
});

test('document upload persists category', function () {
  seedMeta();
  __seed('Documents', DOCUMENT_HEADERS, []);
  __setUser('owner@test.la'); // document.write requires Editor+
  var d = DocumentService.upload({ name: 'Contract', type: 'PDF', category: 'ສັນຍາ', blob: __blob('c.pdf', 'X') }).data;
  assertEqual(d.category, 'ສັນຍາ');
  assertEqual(DocumentService.list().data[0].category, 'ສັນຍາ');
});

test('ensureSheet migrates missing columns on existing sheet', function () {
  seedMeta();
  // Seed Photos with the OLD header set (no customer_name / photo_date).
  __seed('Photos', ['photo_id', 'album_id', 'customer_id', 'name', 'drive_file_id',
    'sha256', 'size', 'favorite', 'status', 'created_at'], []);
  __setUser('staff@test.la');
  // Upload triggers ensureSheet(PHOTO_HEADERS) which should append the new columns,
  // so the new fields round-trip through insert + findAll.
  PhotoService.upload({ name: 'm.jpg', blob: __blob('m.jpg', 'MIG'), customer_name: 'Dao', photo_date: '2026-07-24' });
  var listed = PhotoService.list().data[0];
  assertEqual(listed.customer_name, 'Dao', 'migrated customer_name column');
  assertEqual(listed.photo_date, '2026-07-24', 'migrated photo_date column');
});
