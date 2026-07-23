/**
 * CacheRepository.gs — JSON cache over CacheService (see docs-v2/10 §Performance).
 */
class CacheRepository {
  constructor(ttlSec) {
    this._ttl = ttlSec || CONFIG.CACHE_TTL_SEC;
    this._c = CacheService.getScriptCache();
  }

  get(key) {
    const raw = this._c.get(key);
    if (raw === null || raw === undefined) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
  }

  put(key, value, ttlSec) {
    this._c.put(key, JSON.stringify(value), ttlSec || this._ttl);
    return value;
  }

  remove(key) { this._c.remove(key); }

  /** get-or-compute helper. */
  remember(key, fn, ttlSec) {
    const hit = this.get(key);
    if (hit !== null) return hit;
    const val = fn();
    this.put(key, val, ttlSec);
    return val;
  }
}
