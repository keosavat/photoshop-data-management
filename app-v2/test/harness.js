/**
 * harness.js — loads all .gs source into one VM context (mimicking GAS's shared
 * global scope), injects mocks + a micro test framework, then runs a test file.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { makeGas } = require('./mocks');

// Load order matters only for top-level const/class definitions.
const SRC_ORDER = [
  'src/Config.gs',
  'src/core/Errors.gs',
  'src/core/Result.gs',
  'src/core/Ids.gs',
  'src/core/Validator.gs',
  'src/core/Logger.gs',
  'src/repositories/SheetRepository.gs',
  'src/repositories/DriveRepository.gs',
  'src/repositories/CacheRepository.gs',
  'src/services/AuthService.gs',
  'src/services/CustomerService.gs',
  'src/services/AlbumService.gs',
  'src/services/PhotoService.gs',
  'src/services/DocumentService.gs',
  'src/services/OrderService.gs',
  'src/services/PaymentService.gs',
  'src/services/PrintingService.gs',
  'src/services/SearchService.gs',
  'src/services/ReportService.gs',
  'src/services/SettingService.gs',
  'src/Code.gs'
];

function loadSrc(root) {
  return SRC_ORDER
    .filter((p) => fs.existsSync(path.join(root, p)))
    .map((p) => '\n//=== ' + p + ' ===\n' + fs.readFileSync(path.join(root, p), 'utf8'))
    .join('\n');
}

function runFile(root, testFile) {
  const { store, globals } = makeGas();
  const results = [];

  const sandbox = Object.assign({}, globals, {
    console,
    __store: store,
    __results: results,
    __setUser(email) { store.currentUser = email; },
    __setProp(k, v) { store.properties[k] = v; },
    __blob(name, content, type) {
      const bytes = Array.from(Buffer.from(String(content), 'utf8'));
      return {
        _content: content,
        getName: () => name,
        setName(n) { this.name = n; return this; },
        getContentType: () => type || 'image/jpeg',
        getBytes: () => bytes.slice()
      };
    },
    __seed(name, headers, rows) {
      if (!store.properties.SHEET_ID) store.properties.SHEET_ID = 'TEST_SS';
      const ss = globals.SpreadsheetApp.openById(store.properties.SHEET_ID);
      let sh = ss.getSheetByName(name) || ss.insertSheet(name);
      sh.clear();
      sh.appendRow(headers);
      (rows || []).forEach((o) => sh.appendRow(headers.map((h) => (o[h] === undefined ? '' : o[h]))));
      return sh;
    },
    test(name, fn) {
      try { fn(); results.push({ name, pass: true }); }
      catch (e) { results.push({ name, pass: false, error: (e && e.message) || String(e) }); }
    },
    assert(c, m) { if (!c) throw new Error('assert failed: ' + (m || '')); },
    assertEqual(a, b, m) {
      if (a !== b) throw new Error('expected ' + JSON.stringify(b) + ' got ' + JSON.stringify(a) + (m ? ' (' + m + ')' : ''));
    },
    assertDeep(a, b, m) {
      if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error('deep mismatch: ' + JSON.stringify(a) + ' vs ' + JSON.stringify(b) + (m ? ' (' + m + ')' : ''));
    },
    assertThrows(fn, code, m) {
      try { fn(); } catch (e) {
        if (code && e.code !== code) throw new Error('expected code ' + code + ' got ' + (e.code || '?') + (m ? ' (' + m + ')' : ''));
        return;
      }
      throw new Error('expected throw ' + (m || ''));
    }
  });

  vm.createContext(sandbox);
  const code = loadSrc(root) + '\n//=== TEST: ' + path.basename(testFile) + ' ===\n' + fs.readFileSync(testFile, 'utf8');
  vm.runInContext(code, sandbox, { filename: testFile });
  return results;
}

module.exports = { runFile };
