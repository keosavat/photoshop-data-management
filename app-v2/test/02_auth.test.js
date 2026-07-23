// Phase B — AuthService (roles + RBAC)

function seedUsers() {
  __setProp('SHEET_ID', 'TEST_SS');
  __seed('Users', ['user_id', 'email', 'name', 'role', 'active'], [
    { user_id: 'USR-0001', email: 'owner@test.la', name: 'Owner', role: 'Owner', active: true },
    { user_id: 'USR-0002', email: 'staff@test.la', name: 'Staff', role: 'Staff', active: true },
    { user_id: 'USR-0003', email: 'viewer@test.la', name: 'Viewer', role: 'Viewer', active: true },
    { user_id: 'USR-0004', email: 'ex@test.la', name: 'Ex', role: 'Admin', active: false }
  ]);
}

test('roleRank / roleAtLeast ordering', function () {
  assert(roleRank('Owner') < roleRank('Viewer'));
  assert(roleAtLeast('Admin', 'Manager'));
  assert(!roleAtLeast('Staff', 'Manager'));
  assert(roleAtLeast('Owner', 'Owner'));
});

test('currentRole resolves from Users sheet', function () {
  seedUsers();
  __setUser('staff@test.la');
  assertEqual(Auth.currentRole(), 'Staff');
  __setUser('owner@test.la');
  assertEqual(Auth.currentRole(), 'Owner');
});

test('inactive or unknown user -> null role', function () {
  seedUsers();
  __setUser('ex@test.la');
  assert(Auth.currentRole() === null, 'inactive');
  __setUser('ghost@test.la');
  assert(Auth.currentRole() === null, 'unknown');
});

test('can() enforces minimum role', function () {
  seedUsers();
  __setUser('staff@test.la');
  assert(Auth.can('customer.write'), 'staff can write customer');
  assert(!Auth.can('customer.delete'), 'staff cannot delete customer');
  assert(!Auth.can('settings.write'), 'staff cannot settings');
  __setUser('owner@test.la');
  assert(Auth.can('user.manage'), 'owner can manage users');
  assert(Auth.can('settings.write'));
});

test('viewer read-only', function () {
  seedUsers();
  __setUser('viewer@test.la');
  assert(Auth.can('customer.read'));
  assert(!Auth.can('customer.write'));
});

test('guard throws UNAUTHORIZED / FORBIDDEN and returns role', function () {
  seedUsers();
  __setUser('ghost@test.la');
  assertThrows(function () { Auth.guard('customer.read'); }, ERR.UNAUTHORIZED);
  __setUser('viewer@test.la');
  assertThrows(function () { Auth.guard('customer.write'); }, ERR.FORBIDDEN);
  __setUser('owner@test.la');
  assertEqual(Auth.guard('customer.write'), 'Owner');
});
