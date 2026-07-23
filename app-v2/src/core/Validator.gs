/**
 * Validator.gs — input validation helpers (see docs-v2/03 §Validation).
 * throw AppError(E_VALIDATION) ເມື່ອຜິດ.
 */
function requireFields(obj, fields) {
  const missing = [];
  (fields || []).forEach(function (f) {
    const v = obj ? obj[f] : undefined;
    if (v === undefined || v === null || v === '') missing.push(f);
  });
  if (missing.length) {
    throw AppError(ERR.VALIDATION, 'Missing required: ' + missing.join(', '));
  }
  return true;
}

function isEmail(s) {
  return typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

/** Lao/intl phone: digits, spaces, +, -, min 6 digits. */
function isPhone(s) {
  if (typeof s !== 'string') return false;
  const digits = s.replace(/[^\d]/g, '');
  return /^[\d +\-]+$/.test(s) && digits.length >= 6;
}

function assert_(cond, code, message) {
  if (!cond) throw AppError(code || ERR.VALIDATION, message);
  return true;
}
