/**
 * Result.gs — standard response envelope (see docs-v2/05 §1).
 * ທຸກ service method ຄວນ return ຮູບແບບນີ້.
 */
function ok(data, meta) {
  return { ok: true, data: data === undefined ? null : data, error: null, meta: meta || {} };
}

function fail(code, message, meta) {
  return { ok: false, data: null, error: { code: code, message: message || code }, meta: meta || {} };
}

/** Wrap a function; convert thrown AppError/Error into fail(). */
function guardResult(fn) {
  try {
    return fn();
  } catch (e) {
    if (e && e.isAppError) return fail(e.code, e.message);
    return fail(ERR.INTERNAL, (e && e.message) || String(e));
  }
}
