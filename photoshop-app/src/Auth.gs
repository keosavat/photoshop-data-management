/**
 * Auth.gs — Authentication & Authorization (STEP 5).
 * ອ້າງອີງ Book 1: §13 (Security/RBAC), §12 (AuditLog), §14 (Multi-language), §54 (Error Codes).
 *
 * OAuth: GAS Web App ໃຊ້ Google Login ໂດຍອັດຕະໂນມັດ — server ຮູ້ຕົວຕົນຜ່ານ
 *        Session.getActiveUser().getEmail(). Auth.gs ຈັບຄູ່ email ກັບ Sheet Users → Role.
 * Session: ເກັບ token ໃນ CacheService (TTL 6 ຊມ.) — stateless per request.
 */

var SESSION_TTL_SEC  = 21600; // 6 ຊົ່ວໂມງ (absolute TTL)
var IDLE_TIMEOUT_SEC = 1800;  // 30 ນາທີ idle → expire (STEP 5.1)
var MAX_FAILED       = 5;     // login ຜິດເກີນ → lock
var LOCK_SEC         = 600;   // lock 10 ນາທີ
var FAIL_WINDOW_SEC  = 600;   // ນັບ fail ພາຍໃນ 10 ນາທີ

// ====================== Permission Matrix (§13) ======================
// module → action ທີ່ແຕ່ລະ Role ເຮັດໄດ້. '*' = ທຸກ action.
var PERMISSIONS = {
  Admin: { '*': ['*'] },
  Editor: {
    dashboard: ['view'],
    photos:    ['view', 'create', 'edit'],
    orders:    ['view', 'create', 'edit', 'print'],
    documents: ['view', 'create', 'edit'],
    search:    ['view'],
    reports:   ['view']
  },
  Viewer: {
    dashboard: ['view'],
    photos:    ['view'],
    orders:    ['view'],
    documents: ['view'],
    search:    ['view']
  }
};

// ---------------------- identity ----------------------
/** ຄືນ user record ຂອງຄົນທີ່ login ຢູ່ (ຈາກ Google) ຫຼື null ຖ້າບໍ່ມີສິດ/ບໍ່ active. */
function getCurrentUser() {
  var email = Session.getActiveUser().getEmail();
  if (!email) return null;
  var found = listAll('Users').filter(function (u) { return u.Email === email; });
  if (!found.length) return null;
  var u = found[0];
  if (u.Active === false || u.Active === 'FALSE') return null;
  return { userId: u.UserID, email: u.Email, name: u.Name, role: u.Role };
}

// ---------------------- session ----------------------
function _cache_() { return CacheService.getScriptCache(); }
function _uTokKey_(userId) { return 'utok:' + userId; }  // per-user current token (rotation)
function _lockKey_(email)  { return 'lock:' + email; }
function _failKey_(email)  { return 'fail:' + email; }

/**
 * Login: ກວດ Google identity ກັບ Users → ສ້າງ session token. meta={ip,browser,device}.
 * STEP 5.1: account lock (5 fails → 10 min), session rotation (revoke token ເກົ່າ).
 */
function login(meta) {
  var email = Session.getActiveUser().getEmail() || 'unknown';

  // 1) account lock check
  if (_cache_().get(_lockKey_(email))) {
    audit('LOGIN_FAILED', email, 'E001 locked', meta);
    throw new Error('E001: ' + tAuth('error.E001', meta));
  }

  var user = getCurrentUser();
  if (!user) {
    // 2) count failed attempts → lock ຖ້າເກີນ MAX_FAILED
    var n = Number(_cache_().get(_failKey_(email)) || 0) + 1;
    _cache_().put(_failKey_(email), String(n), FAIL_WINDOW_SEC);
    if (n >= MAX_FAILED) _cache_().put(_lockKey_(email), '1', LOCK_SEC);
    audit('LOGIN_FAILED', email, 'E001 (' + n + ')', meta);
    throw new Error('E001: ' + tAuth('error.E001', meta));
  }

  // 3) success — reset fail count
  _cache_().remove(_failKey_(email));

  // 4) session rotation — ຖອນ token ເກົ່າຂອງ user ນີ້ກ່ອນ
  var oldTok = _cache_().get(_uTokKey_(user.userId));
  if (oldTok) { _cache_().remove(oldTok); audit('SESSION_REVOKED', user.userId, 'rotation', meta); }

  // 5) create session (ພ້ອມ last activity ສຳລັບ idle timeout)
  var token = Utilities.getUuid();
  var sess = { userId: user.userId, email: user.email, name: user.name, role: user.role, last: Date.now(), csrf: Utilities.getUuid() };
  _cache_().put(token, JSON.stringify(sess), SESSION_TTL_SEC);
  _cache_().put(_uTokKey_(user.userId), token, SESSION_TTL_SEC);
  audit('LOGIN', user.userId, user.role, meta);
  audit('SESSION_CREATED', user.userId, token.slice(0, 8), meta);
  return { token: token, user: user, ttl: SESSION_TTL_SEC, csrf: sess.csrf };  // csrf ສຳລັບ mutating calls (STEP 9)
}

/**
 * ຄືນ user ຂອງ session token (ຫຼື null). STEP 5.1: idle timeout 30 ນາທີ + slide window.
 */
function getSession(token, meta) {
  if (!token) return null;
  var raw = _cache_().get(token);
  if (!raw) return null;
  var s = JSON.parse(raw);
  var now = Date.now();
  if (s.last && (now - s.last) > IDLE_TIMEOUT_SEC * 1000) {
    _cache_().remove(token);
    if (s.userId) _cache_().remove(_uTokKey_(s.userId));
    audit('SESSION_EXPIRED', s.userId || 'unknown', 'idle', meta);
    return null;
  }
  s.last = now;                                        // slide idle window
  _cache_().put(token, JSON.stringify(s), SESSION_TTL_SEC);
  return s;
}

/** Logout: ລຶບ session + pointer. */
function logout(token, meta) {
  var user = getSession(token, meta);
  _cache_().remove(token);
  if (user) {
    if (user.userId) _cache_().remove(_uTokKey_(user.userId));
    audit('LOGOUT', user.userId, '', meta);
    audit('SESSION_REVOKED', user.userId, 'logout', meta);
  }
  return true;
}

// ---------------------- authorization ----------------------
/** ກວດວ່າ user (role) ເຮັດ action ໃນ module ໄດ້ບໍ. */
function can(user, module, action) {
  if (!user || !user.role) return false;
  var perm = PERMISSIONS[user.role];
  if (!perm) return false;
  if (perm['*']) return true;                              // Admin
  var allowed = perm[module];
  if (!allowed) return false;
  return allowed.indexOf('*') >= 0 || allowed.indexOf(action) >= 0;
}

/**
 * Backend Route Guard — ໃຊ້ຫຸ້ມທຸກ API call ຝັ່ງ server.
 * ຄືນ user ຖ້າຜ່ານ; throw E005 + audit PERMISSION_DENIED ຖ້າບໍ່ຜ່ານ.
 */
function guard(token, module, action, meta) {
  var user = getSession(token, meta);
  if (!user) throw new Error('E001: ' + tAuth('error.E001', meta));
  if (!can(user, module, action)) {
    audit('PERMISSION_DENIED', user.userId, module + '/' + action, meta);
    throw new Error('E005: ' + tAuth('error.E005', meta));
  }
  return user;
}

/**
 * CSRF Protection (STEP 9, ເລື່ອນມາຈາກ STEP 5).
 * csrf token ຜູກກັບ session (ສ້າງຕອນ login). ທຸກ mutating action ຝັ່ງ server
 * ຕ້ອງຮຽກ requireCsrf(token, csrf) ກ່ອນ.
 */
function getCsrfToken(token) {
  var s = getSession(token);
  return s ? s.csrf : null;
}
function requireCsrf(token, csrf) {
  var s = getSession(token);
  if (!s) throw new Error('E001: ' + tAuth('error.E001'));
  if (!csrf || csrf !== s.csrf) {
    audit('CSRF_FAILED', s.userId, '', null);
    throw new Error('E005: ' + tAuth('error.E005'));
  }
  return s;
}

/**
 * Frontend Route Guard support — ຄືນ map module→actions ທີ່ user ເຮັດໄດ້,
 * ໃຫ້ client ໃຊ້ຊ່ອນ/ສະແດງເມນູ ແລະ guard route.
 */
function getUiPermissions(token) {
  var user = getSession(token);
  if (!user) return { role: null, modules: {} };
  var modules = {};
  var allMods = ['dashboard', 'photos', 'orders', 'documents', 'search', 'reports', 'settings', 'users'];
  var allActs = ['view', 'create', 'edit', 'delete', 'print', 'export', 'manage'];
  allMods.forEach(function (m) {
    modules[m] = allActs.filter(function (a) { return can(user, m, a); });
  });
  return { role: user.role, modules: modules };
}

// ---------------------- i18n helper (§14) ----------------------
/** ຂໍ້ຄວາມ auth ຕາມພາສາ — STEP 6: delegate ໄປ LanguageService.t(). */
function tAuth(key, meta) {
  var lang = (meta && meta.lang) || null;  // null → t() ໃຊ້ getUserLanguage()
  return t(key, null, lang);
}
