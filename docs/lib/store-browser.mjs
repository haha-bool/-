/**
 * 静态版数据层：sql.js（SQLite WASM）+ localStorage 持久化。
 *
 * 和 Node 版 Store 保持同一套方法签名，因此 lib/api.mjs 可以原样复用，
 * 区别只在于数据库文件被序列化成 base64 存在当前浏览器里。
 */
import {
  SCHEMA, MIGRATIONS, TABLES, ALL_TABLES, SCHEMA_VERSION,
  newId, nowIso,
} from './schema.mjs';

const STORAGE_KEY = 'tradeos.static.db.v1';
const BACKUP_KEY = 'tradeos.static.backup.v1';
const META_KEY = 'tradeos.static.meta.v1';

function bytesToBase64(bytes) {
  let out = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    out += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(out);
}

function base64ToBytes(text) {
  const bin = atob(text);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export function loadStoredDb() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? base64ToBytes(raw) : null;
  } catch {
    return null;
  }
}

export class BrowserStore {
  constructor(SQL, db, { onDirty } = {}) {
    this.SQL = SQL;
    this.db = db;
    this.onDirty = onDirty || (() => {});
    this.dataDir = 'browser';
    this.meta = {
      get: (key) => this.get('SELECT value FROM meta WHERE key = ?', [key])?.value ?? null,
      set: (key, value) => this.run(
        'INSERT INTO meta(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
        [key, String(value)]
      ),
    };
  }

  static create(SQL, { seed, bytes, onDirty } = {}) {
    const db = new SQL.Database(bytes || undefined);
    db.run(SCHEMA.replace('PRAGMA journal_mode = WAL;', ''));
    for (const [table, column, def] of MIGRATIONS) {
      try {
        db.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${def}`);
      } catch { /* 列已存在 */ }
    }
    const store = new BrowserStore(SQL, db, { onDirty });
    if (seed && !bytes) store.importAll(seed);
    return store;
  }

  all(sql, params = []) {
    const stmt = this.db.prepare(sql);
    try {
      stmt.bind(params);
      const rows = [];
      while (stmt.step()) rows.push(stmt.getAsObject());
      return rows;
    } finally {
      stmt.free();
    }
  }

  get(sql, params = []) {
    return this.all(sql, params)[0] ?? undefined;
  }

  run(sql, params = []) {
    this.db.run(sql, params);
    this.onDirty();
    return { changes: this.db.getRowsModified() };
  }

  tx(fn) {
    this.db.exec('BEGIN');
    try {
      const out = fn();
      this.db.exec('COMMIT');
      this.onDirty();
      return out;
    } catch (err) {
      this.db.exec('ROLLBACK');
      throw err;
    }
  }

  coerce(spec, body, { partial = false } = {}) {
    const row = {};
    for (const field of spec.fields) {
      if (!(field in body)) {
        if (!partial && field in spec.defaults) row[field] = spec.defaults[field];
        continue;
      }
      let value = body[field];
      if (spec.numbers.includes(field)) {
        const n = Number(value);
        value = Number.isFinite(n) ? Math.round(n) : (spec.defaults[field] ?? 0);
      } else if (spec.floats?.includes(field)) {
        if (value === null || value === '') {
          value = null;
        } else {
          const n = Number(value);
          value = Number.isFinite(n) ? Math.round(n * 10000) / 10000 : (spec.defaults[field] ?? 0);
        }
      } else if (value === null) {
        value = null;
      } else if (typeof value === 'object') {
        value = JSON.stringify(value);
      } else {
        value = String(value);
        if (value.length > 20000) value = value.slice(0, 20000);
      }
      row[field] = value;
    }
    for (const req of spec.required) {
      if (!partial && !(req in row)) throw new Error(`缺少必填字段：${req}`);
    }
    return row;
  }

  list(name, filters = {}) {
    const spec = TABLES[name];
    const where = [];
    const params = [];
    for (const [key, value] of Object.entries(filters)) {
      if (value === undefined || value === null || value === '') continue;
      if (!spec.fields.includes(key) && key !== 'id') continue;
      where.push(`${key} = ?`);
      params.push(value);
    }
    const sql = `SELECT * FROM ${spec.table}${where.length ? ' WHERE ' + where.join(' AND ') : ''} ORDER BY ${spec.order}`;
    return this.all(sql, params);
  }

  find(name, id) {
    return this.get(`SELECT * FROM ${TABLES[name].table} WHERE id = ?`, [id]) ?? null;
  }

  create(name, body) {
    const spec = TABLES[name];
    const row = this.coerce(spec, body);
    const id = body.id ? String(body.id) : newId(name.slice(0, 3));
    const ts = nowIso();
    const cols = ['id', ...Object.keys(row), 'created_at', 'updated_at'];
    const vals = [id, ...Object.values(row), ts, ts];
    this.run(
      `INSERT INTO ${spec.table} (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`,
      vals
    );
    return this.find(name, id);
  }

  update(name, id, body) {
    const spec = TABLES[name];
    if (!this.find(name, id)) return null;
    const row = this.coerce(spec, body, { partial: true });
    const keys = Object.keys(row);
    if (!keys.length) return this.find(name, id);
    keys.push('updated_at');
    const vals = [...Object.values(row), nowIso(), id];
    this.run(
      `UPDATE ${spec.table} SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`,
      vals
    );
    return this.find(name, id);
  }

  remove(name, id) {
    const spec = TABLES[name];
    const info = this.run(`DELETE FROM ${spec.table} WHERE id = ?`, [id]);
    return info.changes > 0;
  }

  exportAll() {
    const data = {};
    for (const t of ALL_TABLES) data[t] = this.all(`SELECT * FROM ${t}`);
    return {
      app: 'personal-trade-os',
      schema_version: SCHEMA_VERSION,
      exported_at: nowIso(),
      data,
    };
  }

  importAll(payload) {
    if (!payload || payload.app !== 'personal-trade-os' || !payload.data) {
      throw new Error('文件不是本系统导出的备份');
    }
    const d = payload.data;
    const tables = ALL_TABLES;
    this.tx(() => {
      for (const t of tables) this.db.exec(`DELETE FROM ${t}`);
      for (const t of tables) {
        for (const row of d[t] ?? []) {
          const cols = Object.keys(row);
          if (!cols.length) continue;
          this.run(
            `INSERT OR REPLACE INTO ${t} (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`,
            cols.map((c) => row[c] ?? null)
          );
        }
      }
    });
    return { tables: tables.map((t) => `${t}:${(d[t] ?? []).length}`) };
  }

  snapshot() {
    return bytesToBase64(this.db.export());
  }

  backup() {
    try {
      localStorage.setItem(BACKUP_KEY, JSON.stringify(this.exportAll()));
      return '浏览器本地快照';
    } catch {
      return '浏览器本地快照（空间不足，未写入）';
    }
  }
}

export function persistStore(store) {
  localStorage.setItem(STORAGE_KEY, store.snapshot());
  localStorage.setItem(META_KEY, JSON.stringify({ saved_at: nowIso(), version: SCHEMA_VERSION }));
}