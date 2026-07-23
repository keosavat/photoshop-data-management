/**
 * MetricsService.gs — Metrics & Monitoring (STEP 14).
 * ອ້າງອີງ Book 1: §29 (Budget), §35 (Coding Metrics), §37 (Monitoring), §56 (SLA).
 * ບັນທຶກ metric ໃນ CacheService (aggregate — overhead ຕໍ່າ, ບໍ່ຂຽນ Sheet ຕໍ່ຄັ້ງ);
 * flushMetrics() ຂຽນ snapshot ໄປ Sheet Metrics (scheduled/manual) ສຳລັບ history.
 */

var METRIC_NAMES = ['upload', 'search', 'dashboard'];
var BENCHMARKS = { upload: 5000, search: 2000, dashboard: 2000 };  // ms (§56)

function _mc_() { return CacheService.getScriptCache(); }

/** ບັນທຶກເວລາ (ms) ຂອງ operation. best-effort — ບໍ່ໃຫ້ລົ້ມ business. */
function recordMetric(name, ms) {
  try {
    var k = 'm_' + name;
    var a = JSON.parse(_mc_().get(k) || '{"count":0,"sum":0,"max":0}');
    a.count++; a.sum += ms; if (ms > a.max) a.max = ms;
    _mc_().put(k, JSON.stringify(a), 21600);
  } catch (e) {}
}
/** ບັນທຶກ cache hit/miss (Cache Hit Rate). */
function recordCache(hit) {
  try { var k = hit ? 'm_cache_hit' : 'm_cache_miss'; _mc_().put(k, String(Number(_mc_().get(k) || 0) + 1), 21600); } catch (e) {}
}

function _agg_(name) {
  var a = JSON.parse(_mc_().get('m_' + name) || '{"count":0,"sum":0,"max":0}');
  return { name: name, count: a.count, avgMs: a.count ? Math.round(a.sum / a.count) : 0, maxMs: a.max };
}
function getCacheHitRate() {
  var h = Number(_mc_().get('m_cache_hit') || 0), m = Number(_mc_().get('m_cache_miss') || 0), t = h + m;
  return t ? Math.round(h / t * 100) : null;
}

/** ສະຫຼຸບ metrics + benchmark pass/fail (Admin — §37 monitoring). */
function getMetricsSummary(token) {
  var u = getSession(token);
  if (!u || !can(u, 'settings', 'manage')) throw new Error('E005: ' + tAuth('error.E005'));
  var metrics = METRIC_NAMES.map(_agg_);
  var benchmarks = metrics.map(function (mm) {
    var target = BENCHMARKS[mm.name];
    return { name: mm.name, avgMs: mm.avgMs, targetMs: target, pass: (mm.count === 0) || (mm.avgMs <= target) };
  });
  return { metrics: metrics, cacheHitRatePct: getCacheHitRate(), benchmarks: benchmarks };
}

/** ຂຽນ snapshot metrics ໄປ Sheet Metrics (scheduled trigger ຫຼື manual). */
function flushMetrics() {
  try {
    METRIC_NAMES.forEach(function (n) {
      var a = _agg_(n);
      create('Metrics', { Name: n, Count: a.count, AvgMs: a.avgMs, MaxMs: a.maxMs, CacheHitRate: getCacheHitRate(), At: new Date() }, 'metrics');
    });
  } catch (e) { Logger.log('flushMetrics failed: ' + e.message); }
}
