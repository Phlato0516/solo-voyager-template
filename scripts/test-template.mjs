import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import ts from 'typescript';

const root = process.cwd();
const manifest = JSON.parse(fs.readFileSync('.openai/hosting.json', 'utf8'));
assert.deepEqual(manifest, { d1: 'DB', r2: 'BUCKET' }, 'Template must not identify a deployed Site');
const excluded = new Set(['.git', 'node_modules', 'dist', '.next', '.vinext', '.wrangler', '.sites-runtime']);
let scanned = 0;
function scan(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (excluded.has(entry.name)) continue;
    const file = path.join(dir, entry.name);
    assert(!entry.isSymbolicLink(), `Unexpected symlink: ${file}`);
    if (entry.isDirectory()) { scan(file); continue; }
    assert(!/^(?:\.env(?:\..*)?|.*\.(?:sqlite3?|db|pem))$/.test(entry.name), `Runtime/private file: ${file}`);
    if (entry.name.endsWith('.tsbuildinfo')) continue;
    const content = fs.readFileSync(file, 'utf8');
    assert(!/appg(?:prj|ver|dep)_[0-9a-f]{20,}/i.test(content), `Site identity in ${file}`);
    assert(!/https?:\/\/[^\s"'<>]*\.phlato\.chatgpt\.site/i.test(content), `Original origin in ${file}`);
    assert(!/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(content), `Private key in ${file}`);
    scanned++;
  }
}
scan(root);

const cache = new Map();
function load(file) {
  const absolute = path.resolve(file);
  if (cache.has(absolute)) return cache.get(absolute);
  const exports = {}; cache.set(absolute, exports);
  const js = ts.transpile(fs.readFileSync(absolute, 'utf8'), { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 });
  new Function('exports', 'require', js)(exports, id => {
    assert(id.startsWith('.'), `Unexpected parser dependency: ${id}`);
    return load(path.resolve(path.dirname(absolute), `${id}.ts`));
  });
  return exports;
}
const places = load('app/place-import.ts').parsePlaceImport(fs.readFileSync('examples/places.json', 'utf8'));
const bookings = load('app/import-bookings.ts').parseBookingImport(fs.readFileSync('examples/bookings.json', 'utf8'));
assert.equal(places.length, 1);
assert.equal(bookings.length, 2);
for (const item of [...places, ...bookings]) {
  assert.equal(item.id, undefined);
  assert.equal(item.owner, undefined);
  assert.equal(item.version, undefined);
  assert(!item.bookingNumber && !item.ticketNumber && !item.attachment);
}
const db = new DatabaseSync(':memory:');
try {
  db.exec(fs.readFileSync('drizzle/0000_sleepy_gideon.sql', 'utf8'));
  assert.equal(db.prepare('SELECT count(*) AS n FROM records').get().n, 0);
  assert.equal(db.prepare('SELECT count(*) AS n FROM members').get().n, 0);
  const columns = db.prepare('PRAGMA table_info(records)').all();
  assert.equal(columns.find(c => c.name === 'version').dflt_value, '1');
  assert(db.prepare('PRAGMA table_info(members)').all().some(c => c.name === 'role'));
} finally { db.close(); }
console.log(`PASS: ${scanned} source files checked; no Site identity; examples accepted by production parsers; blank migration, member role and version schema verified`);
