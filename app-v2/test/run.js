/**
 * run.js — discover and run all *.test.js files; print summary; exit non-zero on failure.
 * Usage: node test/run.js
 */
const fs = require('fs');
const path = require('path');
const { runFile } = require('./harness');

const root = path.resolve(__dirname, '..');
const dir = __dirname;
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.test.js')).sort();

let total = 0, passed = 0;
const failures = [];

files.forEach((f) => {
  let res;
  try {
    res = runFile(root, path.join(dir, f));
  } catch (e) {
    console.log('✗ ' + f + ' (LOAD ERROR: ' + (e && e.message) + ')');
    failures.push(f + ' :: LOAD ERROR :: ' + (e && e.stack || e));
    return;
  }
  res.forEach((r) => { total++; if (r.pass) passed++; else failures.push(f + ' › ' + r.name + ' :: ' + r.error); });
  const okCount = res.filter((r) => r.pass).length;
  console.log((res.length && res.every((r) => r.pass) ? '✓' : '✗') + ' ' + f + ' (' + okCount + '/' + res.length + ')');
});

console.log('\n' + passed + '/' + total + ' assertions passed across ' + files.length + ' file(s)');
if (failures.length) {
  console.log('\nFAILURES:');
  failures.forEach((x) => console.log('  - ' + x));
  process.exit(1);
}
