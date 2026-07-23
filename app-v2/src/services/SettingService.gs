/**
 * SettingService.gs — settings + user management (see docs-v2/06_module_specs/settings.md).
 * Settings: Admin+. User management: Owner only.
 */
const SETTING_HEADERS = ['key', 'value'];
const USER_HEADERS = ['user_id', 'email', 'name', 'role', 'active'];

const SettingService = {
  _repo: function () {
    const r = new SheetRepository();
    r.ensureSheet(CONFIG.SHEETS.Settings, SETTING_HEADERS);
    r.ensureSheet(CONFIG.SHEETS.Users, USER_HEADERS);
    return r;
  },

  // ---- settings ----
  all: function () {
    return guardResult(function () {
      Auth.guard('settings.read');
      return ok(SettingService._repo().findAll(CONFIG.SHEETS.Settings));
    });
  },
  get: function (key) {
    return guardResult(function () {
      Auth.guard('settings.read');
      const row = SettingService._repo().findById(CONFIG.SHEETS.Settings, 'key', key);
      return ok(row ? row.value : null);
    });
  },
  set: function (key, value) {
    return guardResult(function () {
      Auth.guard('settings.write');
      requireFields({ key: key }, ['key']);
      const repo = SettingService._repo();
      const existing = repo.findById(CONFIG.SHEETS.Settings, 'key', key);
      if (existing) return ok(repo.update(CONFIG.SHEETS.Settings, 'key', key, { value: value }));
      return ok(repo.insert(CONFIG.SHEETS.Settings, { key: key, value: value }));
    });
  },

  // ---- users (Owner only) ----
  listUsers: function () {
    return guardResult(function () {
      Auth.guard('user.manage');
      return ok(SettingService._repo().findAll(CONFIG.SHEETS.Users));
    });
  },
  addUser: function (input) {
    return guardResult(function () {
      Auth.guard('user.manage');
      input = input || {};
      requireFields(input, ['email', 'role']);
      assert_(isEmail(input.email), ERR.VALIDATION, 'invalid email');
      assert_(CONFIG.ROLES.indexOf(input.role) >= 0, ERR.VALIDATION, 'invalid role');
      const repo = SettingService._repo();
      if (repo.findById(CONFIG.SHEETS.Users, 'email', input.email)) {
        throw AppError(ERR.DUPLICATE, 'email exists');
      }
      const rec = {
        user_id: nextId('Users', repo.ids(CONFIG.SHEETS.Users, 'user_id')),
        email: input.email, name: input.name || '', role: input.role, active: true
      };
      repo.insert(CONFIG.SHEETS.Users, rec);
      return ok(rec);
    });
  },
  setUserRole: function (email, role) {
    return guardResult(function () {
      Auth.guard('user.manage');
      assert_(CONFIG.ROLES.indexOf(role) >= 0, ERR.VALIDATION, 'invalid role');
      return ok(SettingService._repo().update(CONFIG.SHEETS.Users, 'email', email, { role: role }));
    });
  },
  deactivateUser: function (email) {
    return guardResult(function () {
      Auth.guard('user.manage');
      return ok(SettingService._repo().update(CONFIG.SHEETS.Users, 'email', email, { active: false }));
    });
  }
};
