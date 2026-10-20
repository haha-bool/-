import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import {
  SCHEMA, MIGRATIONS, TABLES, ALL_TABLES, SCHEMA_VERSION,
  newId, nowIso, todayStr, addDays,
} from './schema.mjs';

export * from './schema.mjs';

export class Store {
  constructor(dataDir) {
    this.dataDir = dataDir;
    fs.mkdirSync(dataDir, { recursive: true });
    this.dbPath = path.join(dataDir, 'trade-os.db');
    this.db = new DatabaseSync(this.dbPath);
    this.db.exec('PRAGMA foreign_keys = ON');
    this.db.exec(SCHEMA);
    for (const [table, column, def] of MIGRATIONS) {
      try {
        this.db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${def}`);
      } catch { /* 列已存在 */ }
    }
    this.meta = {
      get: (key) => this.db.prepare('SELECT value FROM meta WHERE key = ?').get(key)?.value ?? null,
      set: (key, value) => this.db.prepare(
        'INSERT INTO meta(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
      ).run(key, String(value)),
    };
  }

  all(sql, params = []) {
    return this.db.prepare(sql).all(...params);
  }

  get(sql, params = []) {
    return this.db.prepare(sql).get(...params);
  }

  run(sql, params = []) {
    return this.db.prepare(sql).run(...params);
  }

  tx(fn) {
    this.db.exec('BEGIN');
    try {
      const out = fn();
      this.db.exec('COMMIT');
      return out;
    } catch (err) {
      this.db.exec('ROLLBACK');
      throw err;
    }
  }

  /* ---------------- 通用 CRUD ---------------- */

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

  /* ---------------- 导出 / 导入 ---------------- */

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

  /** 结构化 JSON 快照备份，保留最近 N 份 */
  backup(keep = 30) {
    const dir = path.join(this.dataDir, 'backups');
    fs.mkdirSync(dir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const file = path.join(dir, `backup-${stamp}.json`);
    fs.writeFileSync(file, JSON.stringify(this.exportAll(), null, 2), 'utf8');
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort();
    while (files.length > keep) {
      const old = files.shift();
      try { fs.unlinkSync(path.join(dir, old)); } catch { /* ignore */ }
    }
    return file;
  }
}