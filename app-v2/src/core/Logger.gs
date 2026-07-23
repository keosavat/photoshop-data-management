/**
 * Log.gs — thin logging wrapper (see docs-v2/01 §Logging).
 * ໃຊ້ຊື່ Log_ ເພື່ອບໍ່ຊ້ຳກັບ GAS Logger.
 */
const Log_ = {
  info: function (msg, ctx) { this._write('INFO', msg, ctx); },
  warn: function (msg, ctx) { this._write('WARN', msg, ctx); },
  error: function (msg, ctx) { this._write('ERROR', msg, ctx); },
  _write: function (level, msg, ctx) {
    const line = '[' + level + '] ' + msg + (ctx ? ' ' + JSON.stringify(ctx) : '');
    if (typeof Logger !== 'undefined' && Logger.log) Logger.log(line);
    else if (typeof console !== 'undefined') console.log(line);
  }
};
