/**
 * Ids.gs — ID generation (see docs-v2/03 §ID strategy).
 * ຮູບແບບ: PREFIX-000N  (e.g. CUS-0001)
 */
function padNumber_(n, width) {
  let s = String(n);
  while (s.length < width) s = '0' + s;
  return s;
}

/** Build an id from an entity key + sequence number. */
function makeId(entityKey, seq) {
  const prefix = CONFIG.ID_PREFIX[entityKey];
  if (!prefix) throw AppError(ERR.INTERNAL, 'No prefix for ' + entityKey);
  return prefix + '-' + padNumber_(seq, CONFIG.ID_PAD);
}

/** Parse the numeric sequence out of an id, or 0 if not matching. */
function parseIdSeq(id) {
  if (!id) return 0;
  const m = String(id).match(/-(\d+)$/);
  return m ? parseInt(m[1], 10) : 0;
}

/** Given existing ids, return the next id for an entity. */
function nextId(entityKey, existingIds) {
  let max = 0;
  (existingIds || []).forEach(function (id) {
    const n = parseIdSeq(id);
    if (n > max) max = n;
  });
  return makeId(entityKey, max + 1);
}
