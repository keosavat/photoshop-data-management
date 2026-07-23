// Phase H — SettingService (settings + user management + RBAC)

function seedSet() {
  __setProp('SHEET_ID', 'TEST_SS');
  __seed('Users', ['user_id', 'email', 'name', 'role', 'active'], [
    { user_id: 'USR-0001', email: 'owner@test.la', name: 'O', role: 'Owner', active: true },
    { user_id: 'USR-0002', email: 'admin@test.la', name: 'A', role: 'Admin', active: true },
    { user_id: 'USR-0003', email: 'staff@test.la', name: 'S', role: 'Staff', active: true }
  ]);
  __seed('Settings', SETTING_HEADERS, []);
}

test('admin can set/get settings (upsert)', function () {
  seedSet();
  __setUser('admin@test.la');
  assert(SettingService.set('theme', 'dark').ok);
  assertEqual(SettingService.get('theme').data, 'dark');
  SettingService.set('theme', 'light');
  assertEqual(SettingService.get('theme').data, 'light', 'updated not duplicated');
  assertEqual(SettingService.all().data.length, 1);
});

test('staff cannot read settings; admin cannot manage users', function () {
  seedSet();
  __setUser('staff@test.la');
  assertEqual(SettingService.all().error.code, ERR.FORBIDDEN);
  __setUser('admin@test.la');
  assertEqual(SettingService.listUsers().error.code, ERR.FORBIDDEN);
});

test('owner manages users (add/role/deactivate + duplicate guard)', function () {
  seedSet();
  __setUser('owner@test.la');
  var u = SettingService.addUser({ email: 'new@test.la', name: 'New', role: 'Staff' });
  assertEqual(u.ok, true);
  assert(u.data.user_id.indexOf('USR-') === 0);

  assertEqual(SettingService.addUser({ email: 'new@test.la', role: 'Staff' }).error.code, ERR.DUPLICATE);
  assertEqual(SettingService.addUser({ email: 'bad', role: 'Staff' }).error.code, ERR.VALIDATION);
  assertEqual(SettingService.addUser({ email: 'x@test.la', role: 'King' }).error.code, ERR.VALIDATION);

  assertEqual(SettingService.setUserRole('new@test.la', 'Manager').data.role, 'Manager');
  assertEqual(SettingService.deactivateUser('new@test.la').data.active, false);
  assert(SettingService.listUsers().data.length >= 4);
});
