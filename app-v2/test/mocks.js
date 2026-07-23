/**
 * mocks.js — in-memory mocks of Google Apps Script services for unit testing.
 * Fresh state per test file so tests stay isolated.
 */
function makeGas() {
  const store = { properties: {}, spreadsheets: {}, currentUser: 'owner@test.la', logs: [], cache: {} };

  // ---------- Sheets ----------
  function RangeMock(sheet, r0, c0, nr, nc) {
    return {
      getValues() {
        const out = [];
        for (let i = 0; i < nr; i++) {
          const row = [];
          const rr = sheet.values[r0 + i] || [];
          for (let j = 0; j < nc; j++) row.push(rr[c0 + j] === undefined ? '' : rr[c0 + j]);
          out.push(row);
        }
        return out;
      },
      setValues(vals) {
        for (let i = 0; i < vals.length; i++) {
          if (!sheet.values[r0 + i]) sheet.values[r0 + i] = [];
          for (let j = 0; j < vals[i].length; j++) sheet.values[r0 + i][c0 + j] = vals[i][j];
        }
        return this;
      }
    };
  }
  function SheetMock(name) {
    const sheet = { name, values: [] };
    sheet.getName = () => name;
    sheet.appendRow = (arr) => { sheet.values.push(arr.slice()); return sheet; };
    sheet.getLastColumn = () => sheet.values.reduce((m, r) => Math.max(m, r.length), 0);
    sheet.getLastRow = () => sheet.values.length;
    sheet.getDataRange = () => RangeMock(sheet, 0, 0, Math.max(sheet.values.length, 1), Math.max(sheet.getLastColumn(), 1));
    sheet.getRange = (r, c, nr, nc) => RangeMock(sheet, r - 1, c - 1, nr, nc);
    sheet.deleteRow = (r) => { sheet.values.splice(r - 1, 1); return sheet; };
    sheet.clear = () => { sheet.values = []; return sheet; };
    return sheet;
  }
  function SpreadsheetMock(id) {
    const sheets = {};
    return {
      getId: () => id,
      getSheetByName: (n) => sheets[n] || null,
      insertSheet: (n) => { sheets[n] = SheetMock(n); return sheets[n]; },
      getSheets: () => Object.keys(sheets).map((k) => sheets[k])
    };
  }
  const SpreadsheetApp = {
    openById: (id) => {
      if (!store.spreadsheets[id]) store.spreadsheets[id] = SpreadsheetMock(id);
      return store.spreadsheets[id];
    }
  };
  const PropertiesService = {
    getScriptProperties: () => ({
      getProperty: (k) => (k in store.properties ? store.properties[k] : null),
      setProperty: (k, v) => { store.properties[k] = v; },
      deleteProperty: (k) => { delete store.properties[k]; }
    })
  };

  // ---------- Drive ----------
  let folderSeq = 1, fileSeq = 1;
  const folderRegistry = {};
  function FolderMock(name) {
    const f = { name, id: 'fld' + (folderSeq++), folders: [], files: [] };
    folderRegistry[f.id] = f;
    f.getName = () => f.name;
    f.getId = () => f.id;
    f.getFoldersByName = (n) => {
      const matches = f.folders.filter((x) => x.name === n);
      let i = 0;
      return { hasNext: () => i < matches.length, next: () => matches[i++] };
    };
    f.createFolder = (n) => { const c = FolderMock(n); f.folders.push(c); return c; };
    f.createFile = (blob) => {
      const file = {
        id: 'file' + (fileSeq++), name: (blob && blob.name) || 'file', blob,
        getName() { return this.name; }, setName(n) { this.name = n; return this; },
        getId() { return this.id; }, moveTo(dst) { dst.files.push(this); return this; }
      };
      f.files.push(file); file.parent = f; return file;
    };
    f.addFile = (file) => { f.files.push(file); return f; };
    return f;
  }
  const rootFolder = FolderMock('My Drive');
  const DriveApp = {
    getRootFolder: () => rootFolder,
    getFolderById: (id) => {
      if (!folderRegistry[id]) throw new Error('No folder with id: ' + id);
      return folderRegistry[id];
    }
  };

  // ---------- Cache ----------
  const CacheService = {
    getScriptCache: () => ({
      get: (k) => (k in store.cache ? store.cache[k] : null),
      put: (k, v) => { store.cache[k] = v; },
      remove: (k) => { delete store.cache[k]; }
    })
  };

  // ---------- Session / Utilities / Logger ----------
  const Session = {
    getActiveUser: () => ({ getEmail: () => store.currentUser }),
    getEffectiveUser: () => ({ getEmail: () => store.currentUser })
  };
  let uu = 1;
  const crypto = require('crypto');
  const Utilities = {
    getUuid: () => 'uuid-' + (uu++),
    formatDate: (d) => String(d),
    DigestAlgorithm: { SHA_256: 'SHA_256' },
    // Returns a signed byte array like GAS (-128..127).
    computeDigest: (algo, input) => {
      const buf = Buffer.isBuffer(input) ? input
        : Array.isArray(input) ? Buffer.from(input.map((b) => (b < 0 ? b + 256 : b)))
        : Buffer.from(String(input), 'utf8');
      const digest = crypto.createHash('sha256').update(buf).digest();
      return Array.from(digest).map((b) => (b > 127 ? b - 256 : b));
    },
    base64Encode: (bytes) => {
      const buf = Array.isArray(bytes) ? Buffer.from(bytes.map((b) => (b < 0 ? b + 256 : b))) : Buffer.from(String(bytes), 'utf8');
      return buf.toString('base64');
    },
    base64Decode: (str) => {
      const buf = Buffer.from(String(str), 'base64');
      return Array.from(buf).map((b) => (b > 127 ? b - 256 : b));
    },
    newBlob: (bytes, contentType, name) => {
      const arr = Array.isArray(bytes) ? bytes.slice() : Array.from(Buffer.from(String(bytes), 'utf8'));
      return {
        _name: name || 'blob', _type: contentType || 'application/octet-stream', _bytes: arr,
        getName() { return this._name; }, setName(n) { this._name = n; return this; },
        getContentType() { return this._type; }, getBytes() { return this._bytes.slice(); }
      };
    }
  };
  const Logger = { log: (x) => { store.logs.push(String(x)); } };

  return { store, globals: { SpreadsheetApp, PropertiesService, DriveApp, CacheService, Session, Utilities, Logger } };
}

module.exports = { makeGas };
