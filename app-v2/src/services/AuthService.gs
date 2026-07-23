/**
 * AuthService.gs — authentication + RBAC (see docs-v2/06 settings, docs-v2/01 §Security).
 * Roles (high→low): Owner, Admin, Manager, Editor, Staff, Viewer.
 */
const ROLE_RANK = (function () {
  const m = {};
  CONFIG.ROLES.forEach(function (r, i) { m[r] = i; });
  return m;
})();

function roleRank(role) { return role in ROLE_RANK ? ROLE_RANK[role] : 999; }

/** True if `role` is at least as privileged as `minRole`. */
function roleAtLeast(role, minRole) { return roleRank(role) <= roleRank(minRole); }

/** action → minimum role required. */
const PERMISSIONS = {
  'customer.read': 'Viewer', 'customer.write': 'Staff', 'customer.delete': 'Manager',
  'album.read': 'Viewer', 'album.write': 'Staff', 'album.delete': 'Manager',
  'photo.read': 'Viewer', 'photo.write': 'Staff', 'photo.delete': 'Manager',
  'document.read': 'Staff', 'document.write': 'Editor', 'document.delete': 'Manager',
  'order.read': 'Staff', 'order.write': 'Staff', 'order.delete': 'Manager',
  'payment.read': 'Manager', 'payment.write': 'Manager',
  'printing.read': 'Staff', 'printing.write': 'Staff',
  'report.read': 'Manager',
  'settings.read': 'Admin', 'settings.write': 'Admin',
  'user.manage': 'Owner'
};

function truthy_(v) {
  return !(v === false || v === '' || v === 0 || v === undefined || v === null ||
    v === 'FALSE' || v === 'false' || v === '0' || v === 'no');
}

const Auth = {
  _repo: function () { return new SheetRepository(); },

  currentEmail: function () { return Session.getActiveUser().getEmail(); },

  getUser: function (email) {
    email = email || this.currentEmail();
    if (!email) return null;
    return this._repo().findById(CONFIG.SHEETS.Users, 'email', email);
  },

  /** Role of the current (or given) user, or null if unknown/inactive. */
  currentRole: function (email) {
    const u = this.getUser(email);
    if (!u) return null;
    if (!truthy_(u.active)) return null;
    return u.role || null;
  },

  /** Can `role` (default current) perform `action`? */
  can: function (action, role) {
    role = role || this.currentRole();
    if (!role) return false;
    const min = PERMISSIONS[action];
    if (!min) return false;
    return roleAtLeast(role, min);
  },

  /** Throw UNAUTHORIZED / FORBIDDEN, or return the effective role. */
  guard: function (action) {
    const role = this.currentRole();
    if (!role) throw AppError(ERR.UNAUTHORIZED, 'Not signed in or inactive');
    if (!this.can(action, role)) throw AppError(ERR.FORBIDDEN, 'Role ' + role + ' cannot ' + action);
    return role;
  }
};
