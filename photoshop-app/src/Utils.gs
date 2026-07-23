/**
 * Utils.gs — shared utilities (STEP 14 optimization).
 * ອ້າງອີງ Book 1: §11 (Error Handling), §13.2 (Rate Limit), §46 (Retry/Background), §54 (Error Codes).
 * ໃຊ້ຮ່ວມທຸກ Module — Error standardization + retry + rate limit.
 */

// ---------------------- Central Error Codes (§54) ----------------------
var ERROR_CODES = {
  E001: 'error.E001', E002: 'error.E002', E003: 'error.E003', E004: 'error.E004',
  E005: 'error.E005', E006: 'error.E006', E007: 'error.E007'
};

/** ສ້າງ Error ມາດຕະຖານ: "Exxx: <ຂໍ້ຄວາມ i18n> <extra>". */
function appError(code, extra) {
  var key = ERROR_CODES[code] || null;
  var msg = key ? t(key) : code;
  return new Error(code + ': ' + msg + (extra ? ' — ' + extra : ''));
}

// ---------------------- Unified Retry (§46) ----------------------
/** ລອງໃໝ່ maxTries ຄັ້ງ ພ້ອມ backoff. E003 (quota) ບໍ່ retry. */
function withRetry(fn, maxTries) {
  maxTries = maxTries || 3;
  var last;
  for (var i = 1; i <= maxTries; i++) {
    try { return fn(); }
    catch (e) { last = e; if (String(e.message).indexOf('E003') >= 0) throw e; Utilities.sleep(400 * i); }
  }
  throw appError('E002', 'after ' + maxTries + ' tries: ' + (last && last.message));
}

// ---------------------- Rate Limit (§13.2) ----------------------
/** ຈຳກັດ action ຕໍ່ user ຕໍ່ນາທີ. ເກີນ → throw E005. */
function rateLimit_(userId, action, maxPerMin) {
  maxPerMin = maxPerMin || 60;
  var c = CacheService.getScriptCache();
  var key = 'rl_' + action + '_' + userId;
  var n = Number(c.get(key) || 0) + 1;
  c.put(key, String(n), 60);
  if (n > maxPerMin) throw appError('E005', 'rate limit (' + action + ')');
  return n;
}
