/**
 * SheetRepository.gs — data access over Google Sheets (see docs-v2/03, 04, 10).
 * ທຸກການເຂົ້າ Sheets ຕ້ອງຜ່ານ class ນີ້. Row 1 = headers.
 */
class SheetRepository {
  constructor(sheetId) {
    this._sheetId = sheetId || getProp_('SHEET_ID');
    this._ssCache = null;
  }

  _ss() {
    if (!this._ssCache) {
      if (!this._sheetId) throw AppError(ERR.INTERNAL, 'SHEET_ID not set');
      this._ssCache = SpreadsheetApp.openById(this._sheetId);
    }
    return this._ssCache;
  }

  _sheet(name) {
    let sh = this._ss().getSheetByName(name);
    if (!sh) throw AppError(ERR.NOT_FOUND, 'Sheet not found: ' + name);
    return sh;
  }

  /** Ensure a sheet exists with the given headers; create if missing, and
   *  append any missing header columns to an existing sheet (safe migration). */
  ensureSheet(name, headers) {
    let sh = this._ss().getSheetByName(name);
    if (!sh) {
      sh = this._ss().insertSheet(name);
      sh.appendRow(headers);
      return sh;
    }
    if (headers && headers.length) {
      const lastCol = sh.getLastColumn();
      if (lastCol === 0) { sh.appendRow(headers); return sh; }
      const existing = sh.getRange(1, 1, 1, lastCol).getValues()[0] || [];
      const missing = headers.filter(function (h) { return existing.indexOf(h) === -1; });
      if (missing.length) {
        sh.getRange(1, existing.length + 1, 1, missing.length).setValues([missing]);
      }
    }
    return sh;
  }

  _matrix(name) {
    const values = this._sheet(name).getDataRange().getValues();
    const headers = values.length ? values[0] : [];
    return { headers: headers, rows: values.slice(1) };
  }

  _toObject(headers, row) {
    const o = {};
    headers.forEach(function (h, i) { o[h] = row[i]; });
    return o;
  }

  /** Return all rows as objects (skips fully-empty rows). */
  findAll(name) {
    const m = this._matrix(name);
    const self = this;
    return m.rows
      .filter(function (r) { return r.some(function (c) { return c !== '' && c !== null; }); })
      .map(function (r) { return self._toObject(m.headers, r); });
  }

  findById(name, idField, id) {
    const all = this.findAll(name);
    for (let i = 0; i < all.length; i++) {
      if (String(all[i][idField]) === String(id)) return all[i];
    }
    return null;
  }

  /** Append an object; values ordered by header. Returns the object. */
  insert(name, obj) {
    const sh = this._sheet(name);
    const headers = sh.getDataRange().getValues()[0] || [];
    const row = headers.map(function (h) {
      return obj[h] === undefined || obj[h] === null ? '' : obj[h];
    });
    sh.appendRow(row);
    return obj;
  }

  /** Patch an existing row by id. Returns merged object or throws NOT_FOUND. */
  update(name, idField, id, patch) {
    const sh = this._sheet(name);
    const values = sh.getDataRange().getValues();
    const headers = values[0] || [];
    const idCol = headers.indexOf(idField);
    if (idCol < 0) throw AppError(ERR.INTERNAL, 'No column: ' + idField);
    for (let r = 1; r < values.length; r++) {
      if (String(values[r][idCol]) === String(id)) {
        const merged = this._toObject(headers, values[r]);
        Object.keys(patch || {}).forEach(function (k) { merged[k] = patch[k]; });
        const newRow = headers.map(function (h) {
          return merged[h] === undefined || merged[h] === null ? '' : merged[h];
        });
        sh.getRange(r + 1, 1, 1, headers.length).setValues([newRow]);
        return merged;
      }
    }
    throw AppError(ERR.NOT_FOUND, name + ' id ' + id + ' not found');
  }

  /** Delete a row by id. Returns true or throws NOT_FOUND. */
  deleteById(name, idField, id) {
    const sh = this._sheet(name);
    const values = sh.getDataRange().getValues();
    const headers = values[0] || [];
    const idCol = headers.indexOf(idField);
    for (let r = 1; r < values.length; r++) {
      if (String(values[r][idCol]) === String(id)) {
        sh.deleteRow(r + 1);
        return true;
      }
    }
    throw AppError(ERR.NOT_FOUND, name + ' id ' + id + ' not found');
  }

  /** All ids in a sheet (for nextId). */
  ids(name, idField) {
    return this.findAll(name).map(function (o) { return o[idField]; });
  }
}
