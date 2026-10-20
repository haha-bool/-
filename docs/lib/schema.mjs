/**
 * 数据模型与表定义（浏览器 / Node 共用，不依赖 node:sqlite）
 * 由 db.mjs 拆分而来；服务端 Store 与静态版 BrowserStore 共享同一套 schema 与 TABLES。
 */

export const SCHEMA_VERSION = 3;

export const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS meta (
  key   TEXT PRIMARY KEY,
  value TEXT
);

CREATE TABLE IF NOT EXISTS goals (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  category    TEXT DEFAULT 'career',
  horizon     TEXT DEFAULT 'mid',
  target_date TEXT,
  status      TEXT DEFAULT 'active',
  progress    INTEGER DEFAULT 0,
  why         TEXT,
  metric      TEXT,
  sort        INTEGER DEFAULT 0,
  created_at  TEXT,
  updated_at  TEXT
);

CREATE TABLE IF NOT EXISTS milestones (
  id         TEXT PRIMARY KEY,
  goal_id    TEXT REFERENCES goals(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  due_date   TEXT,
  status     TEXT DEFAULT 'open',
  note       TEXT,
  sort       INTEGER DEFAULT 0,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS projects (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  kind       TEXT DEFAULT 'practice',
  goal_id    TEXT,
  goal       TEXT,
  background TEXT,
  status     TEXT DEFAULT 'active',
  start_date TEXT,
  due_date   TEXT,
  progress   INTEGER DEFAULT 0,
  decisions  TEXT,
  risks      TEXT,
  result     TEXT,
  retro      TEXT,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS tasks (
  id            TEXT PRIMARY KEY,
  title         TEXT NOT NULL,
  detail        TEXT,
  category      TEXT DEFAULT 'study',
  priority      TEXT DEFAULT 'P1',
  status        TEXT DEFAULT 'todo',
  plan_date     TEXT,
  due_date      TEXT,
  estimate_min  INTEGER DEFAULT 30,
  goal_id       TEXT,
  project_id    TEXT,
  template_id   TEXT,
  done_criteria TEXT,
  recurrence    TEXT,
  sort          INTEGER DEFAULT 0,
  created_at    TEXT,
  updated_at    TEXT,
  completed_at  TEXT
);
CREATE INDEX IF NOT EXISTS idx_tasks_plan ON tasks(plan_date, status);

CREATE TABLE IF NOT EXISTS task_templates (
  id            TEXT PRIMARY KEY,
  title         TEXT NOT NULL,
  detail        TEXT,
  category      TEXT DEFAULT 'study',
  priority      TEXT DEFAULT 'P1',
  estimate_min  INTEGER DEFAULT 30,
  cadence       TEXT DEFAULT 'daily',
  weekday_mask  TEXT,
  goal_id       TEXT,
  done_criteria TEXT,
  active        INTEGER DEFAULT 1,
  sort          INTEGER DEFAULT 0,
  created_at    TEXT,
  updated_at    TEXT
);

CREATE TABLE IF NOT EXISTS knowledge (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  category    TEXT DEFAULT '流程',
  stage       TEXT DEFAULT '',
  plain       TEXT,
  pro         TEXT,
  scenario    TEXT,
  example     TEXT,
  pitfalls    TEXT,
  checklist   TEXT,
  tags        TEXT,
  source_name TEXT,
  source_url  TEXT,
  verified_on TEXT,
  trust       TEXT DEFAULT 'principle',
  mastery     INTEGER DEFAULT 0,
  my_notes    TEXT,
  sort        INTEGER DEFAULT 0,
  created_at  TEXT,
  updated_at  TEXT
);

CREATE TABLE IF NOT EXISTS knowledge_links (
  id      TEXT PRIMARY KEY,
  from_id TEXT NOT NULL,
  to_id   TEXT NOT NULL,
  rel     TEXT DEFAULT 'related',
  UNIQUE(from_id, to_id, rel)
);

CREATE TABLE IF NOT EXISTS english_sessions (
  id          TEXT PRIMARY KEY,
  scenario    TEXT NOT NULL,
  scenario_key TEXT,
  goal        TEXT,
  context     TEXT,
  user_answer TEXT,
  notes       TEXT,
  self_check  TEXT,
  ai_feedback TEXT,
  status      TEXT DEFAULT 'draft',
  created_at  TEXT,
  updated_at  TEXT
);

CREATE TABLE IF NOT EXISTS error_log (
  id         TEXT PRIMARY KEY,
  kind       TEXT DEFAULT 'grammar',
  wrong      TEXT,
  correct    TEXT,
  rule       TEXT,
  session_id TEXT,
  hits       INTEGER DEFAULT 1,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS expressions (
  id         TEXT PRIMARY KEY,
  category   TEXT DEFAULT 'general',
  en         TEXT NOT NULL,
  zh         TEXT,
  note       TEXT,
  session_id TEXT,
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS reviews (
  id          TEXT PRIMARY KEY,
  kind        TEXT DEFAULT 'weekly',
  period      TEXT,
  title       TEXT,
  goal_text   TEXT,
  result_text TEXT,
  worked      TEXT,
  problems    TEXT,
  info_gap    TEXT,
  my_share    TEXT,
  external    TEXT,
  changes     TEXT,
  rule_text   TEXT,
  mood        INTEGER,
  created_at  TEXT,
  updated_at  TEXT
);

CREATE TABLE IF NOT EXISTS daily_log (
  date           TEXT PRIMARY KEY,
  english_min    INTEGER DEFAULT 0,
  trade_min      INTEGER DEFAULT 0,
  auto_english   INTEGER DEFAULT 0,
  auto_trade     INTEGER DEFAULT 0,
  note           TEXT,
  created_at     TEXT,
  updated_at     TEXT
);

/* ---------------- 第二阶段：客户 CRM ---------------- */
CREATE TABLE IF NOT EXISTS clients (
  id               TEXT PRIMARY KEY,
  company          TEXT NOT NULL,
  country          TEXT,
  region           TEXT,
  website          TEXT,
  source           TEXT DEFAULT 'other',
  stage            TEXT DEFAULT 'lead',
  level            TEXT DEFAULT 'B',
  kind             TEXT DEFAULT 'sim',
  products_interest TEXT,
  facts            TEXT,
  guesses          TEXT,
  pending          TEXT,
  notes            TEXT,
  last_contact_on  TEXT,
  next_follow_up   TEXT,
  created_at       TEXT,
  updated_at       TEXT
);
CREATE INDEX IF NOT EXISTS idx_clients_stage ON clients(stage, next_follow_up);

CREATE TABLE IF NOT EXISTS contacts (
  id         TEXT PRIMARY KEY,
  client_id  TEXT REFERENCES clients(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  title      TEXT,
  email      TEXT,
  phone      TEXT,
  whatsapp   TEXT,
  language   TEXT DEFAULT 'en',
  is_primary INTEGER DEFAULT 0,
  notes      TEXT,
  created_at TEXT,
  updated_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_contacts_client ON contacts(client_id);

CREATE TABLE IF NOT EXISTS follow_ups (
  id          TEXT PRIMARY KEY,
  client_id   TEXT REFERENCES clients(id) ON DELETE CASCADE,
  contact_id  TEXT,
  due_date    TEXT,
  channel     TEXT DEFAULT 'email',
  direction   TEXT DEFAULT 'out',
  summary     TEXT,
  next_action TEXT,
  next_date   TEXT,
  status      TEXT DEFAULT 'planned',
  created_at  TEXT,
  updated_at  TEXT
);
CREATE INDEX IF NOT EXISTS idx_followups_client ON follow_ups(client_id, due_date);

/* ---------------- 第二阶段：产品与报价 ---------------- */
CREATE TABLE IF NOT EXISTS products (
  id              TEXT PRIMARY KEY,
  sku             TEXT,
  name            TEXT NOT NULL,
  name_en         TEXT,
  hs_code         TEXT,
  unit            TEXT DEFAULT 'pc',
  unit_cost       REAL DEFAULT 0,
  packaging_cost  REAL DEFAULT 0,
  moq             INTEGER DEFAULT 0,
  lead_time_days  INTEGER DEFAULT 0,
  net_weight      REAL DEFAULT 0,
  gross_weight    REAL DEFAULT 0,
  volume          REAL DEFAULT 0,
  currency        TEXT DEFAULT 'CNY',
  supplier        TEXT,
  notes           TEXT,
  created_at      TEXT,
  updated_at      TEXT
);

CREATE TABLE IF NOT EXISTS quotes (
  id             TEXT PRIMARY KEY,
  quote_no       TEXT,
  client_id      TEXT,
  incoterm       TEXT DEFAULT 'FOB',
  incoterm_place TEXT,
  currency       TEXT DEFAULT 'USD',
  fx_rate        REAL DEFAULT 7.1,
  margin_rate    REAL DEFAULT 15,
  valid_until    TEXT,
  payment_terms  TEXT,
  delivery_time  TEXT,
  status         TEXT DEFAULT 'draft',
  notes          TEXT,
  assumptions    TEXT,
  unconfirmed    TEXT,
  insurance_rate REAL DEFAULT 0.3,
  duty_rate      REAL DEFAULT 0,
  vat_rate       REAL DEFAULT 0,
  total_qty      REAL DEFAULT 0,
  total_amount   REAL DEFAULT 0,
  calc_json      TEXT,
  created_at     TEXT,
  updated_at     TEXT
);
CREATE INDEX IF NOT EXISTS idx_quotes_client ON quotes(client_id);

CREATE TABLE IF NOT EXISTS quote_lines (
  id             TEXT PRIMARY KEY,
  quote_id       TEXT REFERENCES quotes(id) ON DELETE CASCADE,
  product_id     TEXT,
  name           TEXT NOT NULL,
  spec           TEXT,
  qty            REAL DEFAULT 1,
  unit           TEXT DEFAULT 'pc',
  unit_cost      REAL DEFAULT 0,
  packaging_cost REAL DEFAULT 0,
  other_cost     REAL DEFAULT 0,
  margin_rate    REAL,
  weight_kg      REAL DEFAULT 0,
  volume_cbm     REAL DEFAULT 0,
  sort           INTEGER DEFAULT 0,
  created_at     TEXT,
  updated_at     TEXT
);
CREATE INDEX IF NOT EXISTS idx_quote_lines_quote ON quote_lines(quote_id);

CREATE TABLE IF NOT EXISTS quote_costs (
  id         TEXT PRIMARY KEY,
  quote_id   TEXT REFERENCES quotes(id) ON DELETE CASCADE,
  stage      TEXT DEFAULT 'fob',
  category   TEXT DEFAULT 'other',
  label      TEXT NOT NULL,
  amount     REAL DEFAULT 0,
  note       TEXT,
  sort       INTEGER DEFAULT 0,
  created_at TEXT,
  updated_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_quote_costs_quote ON quote_costs(quote_id);

/* ---------------- 第二阶段：商务文档 ---------------- */
CREATE TABLE IF NOT EXISTS documents (
  id         TEXT PRIMARY KEY,
  kind       TEXT DEFAULT 'quotation',
  title      TEXT NOT NULL,
  client_id  TEXT,
  quote_id   TEXT,
  language   TEXT DEFAULT 'en',
  body       TEXT,
  status     TEXT DEFAULT 'draft',
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS video_log (
  id         TEXT PRIMARY KEY,
  bvid       TEXT NOT NULL,
  date       TEXT,
  status     TEXT DEFAULT 'watched',
  note       TEXT,
  created_at TEXT,
  updated_at TEXT,
  UNIQUE(bvid, date)
);
`;

/** 轻量迁移：给旧库补列 */
export const MIGRATIONS = [
  ['daily_log', 'auto_english', 'INTEGER DEFAULT 0'],
  ['daily_log', 'auto_trade', 'INTEGER DEFAULT 0'],
];

/* ------------------------------------------------------------------ */
/* 通用表定义：字段白名单 + 默认值，供 API 做安全写入                    */
/* ------------------------------------------------------------------ */
export const TABLES = {
  goals: {
    table: 'goals',
    fields: ['title', 'category', 'horizon', 'target_date', 'status', 'progress', 'why', 'metric', 'sort'],
    required: ['title'],
    numbers: ['progress', 'sort'],
    defaults: { status: 'active', progress: 0, sort: 0, category: 'career', horizon: 'mid' },
    order: 'sort ASC, created_at ASC',
  },
  milestones: {
    table: 'milestones',
    fields: ['goal_id', 'title', 'due_date', 'status', 'note', 'sort'],
    required: ['title'],
    numbers: ['sort'],
    defaults: { status: 'open', sort: 0 },
    order: 'due_date ASC NULLS LAST, sort ASC',
  },
  projects: {
    table: 'projects',
    fields: ['name', 'kind', 'goal_id', 'goal', 'background', 'status', 'start_date', 'due_date',
      'progress', 'decisions', 'risks', 'result', 'retro'],
    required: ['name'],
    numbers: ['progress'],
    defaults: { status: 'active', progress: 0, kind: 'practice' },
    order: 'created_at ASC',
  },
  tasks: {
    table: 'tasks',
    fields: ['title', 'detail', 'category', 'priority', 'status', 'plan_date', 'due_date',
      'estimate_min', 'goal_id', 'project_id', 'template_id', 'done_criteria', 'recurrence', 'sort'],
    required: ['title'],
    numbers: ['estimate_min', 'sort'],
    defaults: { category: 'study', priority: 'P1', status: 'todo', estimate_min: 30, sort: 0 },
    order: 'CASE priority WHEN \'P0\' THEN 0 WHEN \'P1\' THEN 1 WHEN \'P2\' THEN 2 ELSE 3 END, sort ASC, created_at ASC',
  },
  templates: {
    table: 'task_templates',
    fields: ['title', 'detail', 'category', 'priority', 'estimate_min', 'cadence', 'weekday_mask',
      'goal_id', 'done_criteria', 'active', 'sort'],
    required: ['title'],
    numbers: ['estimate_min', 'active', 'sort'],
    defaults: { category: 'study', priority: 'P1', estimate_min: 30, cadence: 'daily', active: 1, sort: 0 },
    order: 'sort ASC, created_at ASC',
  },
  knowledge: {
    table: 'knowledge',
    fields: ['title', 'category', 'stage', 'plain', 'pro', 'scenario', 'example', 'pitfalls',
      'checklist', 'tags', 'source_name', 'source_url', 'verified_on', 'trust', 'mastery',
      'my_notes', 'sort'],
    required: ['title'],
    numbers: ['mastery', 'sort'],
    defaults: { category: '流程', trust: 'principle', mastery: 0, sort: 0 },
    order: 'sort ASC, created_at ASC',
  },
  sessions: {
    table: 'english_sessions',
    fields: ['scenario', 'scenario_key', 'goal', 'context', 'user_answer', 'notes',
      'self_check', 'ai_feedback', 'status'],
    required: ['scenario'],
    numbers: [],
    defaults: { status: 'draft' },
    order: 'created_at DESC',
  },
  errors: {
    table: 'error_log',
    fields: ['kind', 'wrong', 'correct', 'rule', 'session_id', 'hits'],
    required: ['wrong'],
    numbers: ['hits'],
    defaults: { kind: 'grammar', hits: 1 },
    order: 'hits DESC, created_at DESC',
  },
  expressions: {
    table: 'expressions',
    fields: ['category', 'en', 'zh', 'note', 'session_id'],
    required: ['en'],
    numbers: [],
    defaults: { category: 'general' },
    order: 'created_at DESC',
  },
  reviews: {
    table: 'reviews',
    fields: ['kind', 'period', 'title', 'goal_text', 'result_text', 'worked', 'problems',
      'info_gap', 'my_share', 'external', 'changes', 'rule_text', 'mood'],
    required: ['title'],
    numbers: ['mood'],
    defaults: { kind: 'weekly' },
    order: 'created_at DESC',
  },
  clients: {
    table: 'clients',
    fields: ['company', 'country', 'region', 'website', 'source', 'stage', 'level', 'kind',
      'products_interest', 'facts', 'guesses', 'pending', 'notes', 'last_contact_on', 'next_follow_up'],
    required: ['company'],
    numbers: [],
    defaults: { source: 'other', stage: 'lead', level: 'B', kind: 'sim' },
    order: 'next_follow_up IS NULL, next_follow_up ASC, created_at DESC',
  },
  contacts: {
    table: 'contacts',
    fields: ['client_id', 'name', 'title', 'email', 'phone', 'whatsapp', 'language',
      'is_primary', 'notes'],
    required: ['name'],
    numbers: ['is_primary'],
    defaults: { language: 'en', is_primary: 0 },
    order: 'is_primary DESC, created_at ASC',
  },
  followups: {
    table: 'follow_ups',
    fields: ['client_id', 'contact_id', 'due_date', 'channel', 'direction', 'summary',
      'next_action', 'next_date', 'status'],
    required: [],
    numbers: [],
    defaults: { channel: 'email', direction: 'out', status: 'planned' },
    order: 'due_date ASC, created_at DESC',
  },
  products: {
    table: 'products',
    fields: ['sku', 'name', 'name_en', 'hs_code', 'unit', 'unit_cost', 'packaging_cost', 'moq',
      'lead_time_days', 'net_weight', 'gross_weight', 'volume', 'currency', 'supplier', 'notes'],
    required: ['name'],
    numbers: ['moq', 'lead_time_days'],
    floats: ['unit_cost', 'packaging_cost', 'net_weight', 'gross_weight', 'volume'],
    defaults: { unit: 'pc', currency: 'CNY', unit_cost: 0, packaging_cost: 0, moq: 0, lead_time_days: 0 },
    order: 'created_at DESC',
  },
  quotes: {
    table: 'quotes',
    fields: ['quote_no', 'client_id', 'incoterm', 'incoterm_place', 'currency', 'fx_rate',
      'margin_rate', 'valid_until', 'payment_terms', 'delivery_time', 'status', 'notes',
      'assumptions', 'unconfirmed', 'insurance_rate', 'duty_rate', 'vat_rate', 'total_qty',
      'total_amount', 'calc_json'],
    required: [],
    numbers: [],
    floats: ['fx_rate', 'margin_rate', 'insurance_rate', 'duty_rate', 'vat_rate', 'total_qty', 'total_amount'],
    defaults: { incoterm: 'FOB', currency: 'USD', fx_rate: 7.1, margin_rate: 15, insurance_rate: 0.3,
      duty_rate: 0, vat_rate: 0, status: 'draft', total_qty: 0, total_amount: 0 },
    order: 'created_at DESC',
  },
  quote_lines: {
    table: 'quote_lines',
    fields: ['quote_id', 'product_id', 'name', 'spec', 'qty', 'unit', 'unit_cost',
      'packaging_cost', 'other_cost', 'margin_rate', 'weight_kg', 'volume_cbm', 'sort'],
    required: ['name'],
    numbers: ['sort'],
    floats: ['qty', 'unit_cost', 'packaging_cost', 'other_cost', 'margin_rate', 'weight_kg', 'volume_cbm'],
    defaults: { qty: 1, unit: 'pc', unit_cost: 0, packaging_cost: 0, other_cost: 0, sort: 0 },
    order: 'sort ASC, created_at ASC',
  },
  quote_costs: {
    table: 'quote_costs',
    fields: ['quote_id', 'stage', 'category', 'label', 'amount', 'note', 'sort'],
    required: ['label'],
    numbers: ['sort'],
    floats: ['amount'],
    defaults: { stage: 'fob', category: 'other', amount: 0, sort: 0 },
    order: 'sort ASC, created_at ASC',
  },
  documents: {
    table: 'documents',
    fields: ['kind', 'title', 'client_id', 'quote_id', 'language', 'body', 'status'],
    required: ['title'],
    numbers: [],
    defaults: { kind: 'quotation', language: 'en', status: 'draft' },
    order: 'created_at DESC',
  },
};

/** 导出/导入涉及的全部表（顺序敏感：先父表后子表） */
export const ALL_TABLES = [
  'meta', 'goals', 'milestones', 'projects', 'tasks', 'task_templates',
  'knowledge', 'knowledge_links', 'english_sessions', 'error_log', 'expressions',
  'reviews', 'daily_log',
  'clients', 'contacts', 'follow_ups', 'products', 'quotes', 'quote_lines',
  'quote_costs', 'documents', 'video_log',
];

export function nowIso() {
  return new Date().toISOString();
}

export function newId(prefix = '') {
  const id = globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  return prefix ? `${prefix}_${id}` : id;
}

/** 本地日期 YYYY-MM-DD（不依赖 UTC，避免晚上变前一天） */
export function todayStr(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function addDays(dateStr, n) {
  const [y, m, d] = String(dateStr).split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + n);
  return todayStr(dt);
}
