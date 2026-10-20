/**
 * HTTP API。设计原则：
 * - 不引入框架，用极小的路由表，避免依赖升级问题。
 * - 每个写操作都经过 TABLES 白名单，防止任意字段写入。
 * - 需要"跨表计算"的逻辑（驾驶舱、统计）放在这里，前端只渲染。
 */
import { TABLES, todayStr, addDays, nowIso } from './schema.mjs';
import { calcQuote, round, CLIENT_STAGES, QUOTE_STATUS } from './quote.mjs';
import { generateDoc, DOC_KINDS, findKind } from './docs.mjs';
import { JOB_PROFILE, CAREER_GOALS, getPersonality, analyzeJd } from './career.mjs';
import { VIDEOS, DOUYIN_SEARCHES, SALES_PRINCIPLES, dailyPicks, videoById } from './videos.mjs';

const PRIORITY_ORDER = { P0: 0, P1: 1, P2: 2, P3: 3 };

const byteLength = (s) => new TextEncoder().encode(s).length;

function json(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': byteLength(body),
  });
  res.end(body);
}

function bad(res, message, status = 400) {
  json(res, status, { ok: false, error: message });
}

function isoDay(dateStr) {
  const [y, m, d] = String(dateStr).split('-').map(Number);
  return new Date(y, m - 1, d).getDay(); // 0=周日
}

export function createApi(store, appRoot) {
  /* -------------------- 驾驶舱聚合 -------------------- */
  function knowledgeStats() {
    const rows = store.all('SELECT mastery, COUNT(*) AS n FROM knowledge GROUP BY mastery');
    const byMastery = [0, 0, 0, 0, 0];
    for (const r of rows) byMastery[Math.min(4, Math.max(0, r.mastery))] += r.n;
    const total = byMastery.reduce((a, b) => a + b, 0);
    const mastered = byMastery[3] + byMastery[4];
    const stale = store.get(
      `SELECT COUNT(*) AS n FROM knowledge
       WHERE trust IN ('dynamic','unverified')
          OR (verified_on IS NOT NULL AND verified_on <> '' AND verified_on < ?)`,
      [addDays(todayStr(), -180)]
    ).n;
    return { total, byMastery, mastered, stale };
  }

  function streak() {
    let n = 0;
    let day = todayStr();
    // 今天没记录时，从昨天开始算，避免早上一打开就显示 0
    const hasToday = store.get('SELECT 1 AS x FROM daily_log WHERE date = ?', [day]);
    if (!hasToday) day = addDays(day, -1);
    for (let i = 0; i < 400; i += 1) {
      const row = store.get(
        `SELECT COALESCE(english_min,0)+COALESCE(auto_english,0) AS en,
                COALESCE(trade_min,0)+COALESCE(auto_trade,0) AS tr
         FROM daily_log WHERE date = ?`, [day]
      );
      if (!row || (row.en ?? 0) + (row.tr ?? 0) <= 0) break;
      n += 1;
      day = addDays(day, -1);
    }
    return n;
  }

  /** 已完成任务按分类折算学习分钟：英语只算 english，外贸/项目算 trade */
  function recomputeDay(date) {
    if (!date) return;
    const rows = store.all(
      `SELECT category, COALESCE(SUM(estimate_min),0) AS m FROM tasks
       WHERE plan_date = ? AND status = 'done' GROUP BY category`, [date]
    );
    let en = 0;
    let tr = 0;
    for (const r of rows) {
      if (r.category === 'english') en += r.m;
      else if (r.category === 'trade' || r.category === 'project') tr += r.m;
    }
    const exists = store.get('SELECT 1 AS x FROM daily_log WHERE date = ?', [date]);
    if (exists) {
      store.run('UPDATE daily_log SET auto_english = ?, auto_trade = ?, updated_at = ? WHERE date = ?',
        [en, tr, nowIso(), date]);
    } else if (en || tr) {
      store.run(
        `INSERT INTO daily_log (date, english_min, trade_min, auto_english, auto_trade, note, created_at, updated_at)
         VALUES (?,0,0,?,?,'',?,?)`,
        [date, en, tr, nowIso(), nowIso()]
      );
    }
  }

  function taskSummary(date) {
    const rows = store.all('SELECT status, estimate_min FROM tasks WHERE plan_date = ?', [date]);
    const total = rows.length;
    const done = rows.filter((r) => r.status === 'done').length;
    const minutes = rows.reduce((a, r) => a + (r.estimate_min ?? 0), 0);
    const doneMinutes = rows.filter((r) => r.status === 'done')
      .reduce((a, r) => a + (r.estimate_min ?? 0), 0);
    return { total, done, minutes, doneMinutes };
  }

  function weekRange(date) {
    const dow = isoDay(date) === 0 ? 7 : isoDay(date);
    const start = addDays(date, -(dow - 1));
    return { start, end: addDays(start, 6) };
  }

  function bootstrap(date) {
    const day = /^\d{4}-\d{2}-\d{2}$/.test(date || '') ? date : todayStr();
    const goals = store.all('SELECT * FROM goals ORDER BY sort ASC');
    const milestones = store.all('SELECT * FROM milestones ORDER BY due_date ASC');
    const projects = store.all('SELECT * FROM projects ORDER BY created_at ASC');
    const tasks = store.all(
      `SELECT * FROM tasks WHERE plan_date = ? ORDER BY
        CASE priority WHEN 'P0' THEN 0 WHEN 'P1' THEN 1 WHEN 'P2' THEN 2 ELSE 3 END,
        sort ASC, created_at ASC`,
      [day]
    );
    const overdue = store.all(
      `SELECT * FROM tasks WHERE status IN ('todo','doing') AND plan_date < ?
        ORDER BY plan_date ASC LIMIT 30`,
      [day]
    );
    const week = weekRange(day);
    const weekTasks = store.all(
      `SELECT * FROM tasks WHERE plan_date BETWEEN ? AND ? ORDER BY plan_date ASC, sort ASC`,
      [week.start, week.end]
    );
    const reviews = store.all('SELECT * FROM reviews ORDER BY created_at DESC LIMIT 5');
    const logs = store.all(
      `SELECT date,
              COALESCE(english_min,0)+COALESCE(auto_english,0) AS english_min,
              COALESCE(trade_min,0)+COALESCE(auto_trade,0) AS trade_min,
              COALESCE(auto_english,0) AS auto_english,
              COALESCE(auto_trade,0) AS auto_trade,
              note
       FROM daily_log WHERE date >= ? ORDER BY date ASC`,
      [addDays(day, -13)]
    );
    const todayLog = store.get(
      `SELECT COALESCE(english_min,0) AS english_min, COALESCE(trade_min,0) AS trade_min,
              COALESCE(auto_english,0) AS auto_english, COALESCE(auto_trade,0) AS auto_trade,
              note
       FROM daily_log WHERE date = ?`, [day]
    ) || null;
    const recentSessions = store.all(
      'SELECT id, scenario, status, created_at FROM english_sessions ORDER BY created_at DESC LIMIT 5'
    );
    const unverified = store.all(
      `SELECT id, title, trust, verified_on FROM knowledge
       WHERE trust IN ('dynamic','unverified')
          OR (verified_on IS NOT NULL AND verified_on <> '' AND verified_on < ?)
       ORDER BY verified_on ASC LIMIT 12`,
      [addDays(day, -180)]
    );

    const stats = knowledgeStats();
    const todayTasks = taskSummary(day);
    const weekDone = weekTasks.filter((t) => t.status === 'done').length;

    const followupsDue = store.all(
      `SELECT f.id, f.due_date, f.channel, f.summary, f.next_action, f.client_id,
              c.company, c.stage AS client_stage, c.level, c.kind AS client_kind
       FROM follow_ups f JOIN clients c ON c.id = f.client_id
       WHERE f.status = 'planned' AND f.due_date IS NOT NULL AND f.due_date <= ?
       ORDER BY f.due_date ASC LIMIT 8`, [day]
    );
    const quotesAttention = store.all(
      `SELECT q.id, q.quote_no, q.incoterm, q.currency, q.total_amount, q.status, q.valid_until,
              c.company
       FROM quotes q LEFT JOIN clients c ON c.id = q.client_id
       WHERE q.status IN ('draft','sent','negotiating')
         AND (q.valid_until IS NULL OR q.valid_until = '' OR q.valid_until <= ?)
       ORDER BY q.valid_until ASC LIMIT 6`, [addDays(day, 7)]
    );
    const quoteStats = store.all('SELECT status, COUNT(*) AS n, COALESCE(SUM(total_amount),0) AS amount FROM quotes GROUP BY status');

    return {
      ok: true,
      date: day,
      week,
      profile: JSON.parse(store.meta.get('profile') || '{}'),
      goals,
      milestones,
      projects,
      tasks,
      overdue,
      weekTasks,
      stats: {
        ...stats,
        today: todayTasks,
        week: { total: weekTasks.length, done: weekDone },
        streak: streak(),
        sessions: store.get('SELECT COUNT(*) AS n FROM english_sessions').n,
        weekSessions: store.get(
          `SELECT COUNT(*) AS n FROM english_sessions WHERE created_at >= ?`, [week.start]
        ).n,
        errors: store.get('SELECT COUNT(*) AS n FROM error_log').n,
        minutes14: logs.reduce((a, l) => a + (l.english_min ?? 0) + (l.trade_min ?? 0), 0),
        englishMinutes14: logs.reduce((a, l) => a + (l.english_min ?? 0), 0),
        tradeMinutes14: logs.reduce((a, l) => a + (l.trade_min ?? 0), 0),
        clients: store.get('SELECT COUNT(*) AS n FROM clients').n,
        followupsDue: store.get(
          `SELECT COUNT(*) AS n FROM follow_ups WHERE status = 'planned' AND due_date <= ?`, [day]
        ).n,
        quotes: Object.fromEntries(quoteStats.map((q) => [q.status, { n: q.n, amount: q.amount }])),
        wonAmount: quoteStats.find((q) => q.status === 'won')?.amount ?? 0,
      },
      reviews,
      logs,
      todayLog,
      recentSessions,
      unverified,
      followupsDue,
      quotesAttention,
      templates: store.all('SELECT * FROM task_templates WHERE active = 1 ORDER BY sort ASC'),
    };
  }

  /* -------------------- 任务计划生成 -------------------- */
  function generatePlan(date) {
    const day = /^\d{4}-\d{2}-\d{2}$/.test(date || '') ? date : todayStr();
    const iso = isoDay(day) === 0 ? 7 : isoDay(day);
    const templates = store.all('SELECT * FROM task_templates WHERE active = 1 ORDER BY sort ASC');
    const existing = new Set(
      store.all('SELECT template_id FROM tasks WHERE plan_date = ? AND template_id IS NOT NULL', [day])
        .map((r) => r.template_id)
    );
    const created = [];
    store.tx(() => {
      for (const t of templates) {
        const mask = String(t.weekday_mask || '').split(',').map((s) => s.trim()).filter(Boolean);
        const applies = t.cadence === 'daily' ? (mask.length === 0 || mask.includes(String(iso))) : mask.includes(String(iso));
        if (!applies || existing.has(t.id)) continue;
        const id = store.create('tasks', {
          title: t.title,
          detail: t.detail,
          category: t.category,
          priority: t.priority,
          estimate_min: t.estimate_min,
          plan_date: day,
          goal_id: t.goal_id,
          template_id: t.id,
          done_criteria: t.done_criteria,
          recurrence: t.cadence,
          sort: created.length,
        });
        created.push(id);
      }
    });
    return { date: day, created: created.length, tasks: store.all(
      `SELECT * FROM tasks WHERE plan_date = ? ORDER BY
        CASE priority WHEN 'P0' THEN 0 WHEN 'P1' THEN 1 WHEN 'P2' THEN 2 ELSE 3 END, sort ASC`, [day]
    ) };
  }

  /* -------------------- 客户 CRM -------------------- */
  function crmData() {
    const day = todayStr();
    const clients = store.all(
      `SELECT c.*,
        (SELECT COUNT(*) FROM contacts WHERE client_id = c.id) AS contact_count,
        (SELECT COUNT(*) FROM follow_ups WHERE client_id = c.id AND status = 'planned') AS open_followups,
        (SELECT COUNT(*) FROM quotes WHERE client_id = c.id) AS quote_count,
        (SELECT MAX(created_at) FROM quotes WHERE client_id = c.id) AS last_quote_at
       FROM clients c
       ORDER BY CASE WHEN c.next_follow_up IS NULL OR c.next_follow_up = '' THEN 1 ELSE 0 END,
                c.next_follow_up ASC, c.created_at DESC`
    );
    const due = store.all(
      `SELECT f.*, c.company, c.country, c.stage AS client_stage, c.level
       FROM follow_ups f JOIN clients c ON c.id = f.client_id
       WHERE f.status = 'planned' AND f.due_date IS NOT NULL AND f.due_date <= ?
       ORDER BY f.due_date ASC, f.created_at ASC LIMIT 50`, [day]
    );
    const upcoming = store.all(
      `SELECT f.*, c.company FROM follow_ups f JOIN clients c ON c.id = f.client_id
       WHERE f.status = 'planned' AND f.due_date > ? ORDER BY f.due_date ASC LIMIT 20`, [day]
    );
    const stages = {};
    for (const c of clients) stages[c.stage] = (stages[c.stage] || 0) + 1;
    const quotes = store.all('SELECT status, COUNT(*) AS n FROM quotes GROUP BY status');
    return {
      clients,
      due,
      upcoming,
      stats: {
        total: clients.length,
        real: clients.filter((c) => c.kind === 'real').length,
        sim: clients.filter((c) => c.kind === 'sim').length,
        due: due.length,
        overdue: due.filter((f) => f.due_date < day).length,
        stages,
        quotes: Object.fromEntries(quotes.map((q) => [q.status, q.n])),
      },
    };
  }

  function clientFull(id) {
    const client = store.find('clients', id);
    if (!client) return null;
    const contacts = store.all('SELECT * FROM contacts WHERE client_id = ? ORDER BY is_primary DESC, created_at ASC', [id]);
    const followups = store.all(
      `SELECT * FROM follow_ups WHERE client_id = ? ORDER BY
        CASE status WHEN 'planned' THEN 0 ELSE 1 END, due_date DESC, created_at DESC`, [id]
    );
    const quotes = store.all(
      `SELECT id, quote_no, incoterm, currency, total_amount, total_qty, margin_rate, status,
              valid_until, updated_at, created_at
       FROM quotes WHERE client_id = ? ORDER BY created_at DESC`, [id]
    );
    const documents = store.all(
      'SELECT id, kind, title, status, created_at FROM documents WHERE client_id = ? ORDER BY created_at DESC LIMIT 20', [id]
    );
    return { client, contacts, followups, quotes, documents };
  }

  function syncClientFollowup(clientId) {
    if (!clientId) return;
    const next = store.get(
      `SELECT due_date FROM follow_ups WHERE client_id = ? AND status = 'planned'
       ORDER BY due_date ASC LIMIT 1`, [clientId]
    );
    const last = store.get(
      `SELECT due_date FROM follow_ups WHERE client_id = ? AND status = 'done'
       ORDER BY due_date DESC LIMIT 1`, [clientId]
    );
    store.run(
      'UPDATE clients SET next_follow_up = ?, last_contact_on = COALESCE(?, last_contact_on), updated_at = ? WHERE id = ?',
      [next?.due_date ?? null, last?.due_date ?? null, nowIso(), clientId]
    );
  }

  /* -------------------- 报价 -------------------- */
  function quoteBundle(id) {
    const quote = store.find('quotes', id);
    if (!quote) return null;
    const lines = store.all('SELECT * FROM quote_lines WHERE quote_id = ? ORDER BY sort ASC, created_at ASC', [id]);
    const costs = store.all('SELECT * FROM quote_costs WHERE quote_id = ? ORDER BY sort ASC, created_at ASC', [id]);
    const client = quote.client_id ? store.find('clients', quote.client_id) : null;
    const calc = calcQuote({ quote, lines, costs });
    return { quote, lines, costs, client, calc };
  }

  function nextQuoteNo() {
    const day = todayStr();
    const prefix = `QT-${day.replace(/-/g, '')}-`;
    const key = `quote_seq_${day}`;
    let seq = Number(store.meta.get(key) || 0);
    if (!seq) {
      const row = store.get(
        `SELECT quote_no FROM quotes WHERE quote_no LIKE ? ORDER BY quote_no DESC LIMIT 1`, [`${prefix}%`]
      );
      seq = row?.quote_no ? Number(String(row.quote_no).slice(prefix.length)) || 0 : 0;
    }
    const next = seq + 1;
    store.meta.set(key, next);
    return `${prefix}${String(next).padStart(3, '0')}`;
  }

  function saveQuote(body = {}) {
    const id = body.id || null;
    const input = body.quote || {};
    const lines = Array.isArray(body.lines) ? body.lines : [];
    const costs = Array.isArray(body.costs) ? body.costs : [];

    const calc = calcQuote({ quote: input, lines, costs });
    const quoteData = {
      ...input,
      quote_no: input.quote_no || (id ? store.find('quotes', id)?.quote_no : '') || nextQuoteNo(),
      total_qty: calc.totalQty,
      total_amount: calc.price.total,
      calc_json: calc,
    };
    delete quoteData.id;

    let saved;
    store.tx(() => {
      if (id && store.find('quotes', id)) {
        saved = store.update('quotes', id, quoteData);
        store.run('DELETE FROM quote_lines WHERE quote_id = ?', [id]);
        store.run('DELETE FROM quote_costs WHERE quote_id = ?', [id]);
      } else {
        saved = store.create('quotes', quoteData);
      }
      lines.forEach((line, index) => {
        if (!line || (!line.name && !Number(line.qty))) return;
        store.create('quote_lines', {
          quote_id: saved.id,
          product_id: line.product_id || null,
          name: line.name || '未命名产品',
          spec: line.spec || '',
          qty: line.qty ?? 1,
          unit: line.unit || 'pc',
          unit_cost: line.unit_cost ?? 0,
          packaging_cost: line.packaging_cost ?? 0,
          other_cost: line.other_cost ?? 0,
          margin_rate: line.margin_rate === '' || line.margin_rate === undefined ? null : line.margin_rate,
          weight_kg: line.weight_kg ?? 0,
          volume_cbm: line.volume_cbm ?? 0,
          sort: index,
        });
      });
      costs.forEach((cost, index) => {
        if (!cost || !cost.label) return;
        store.create('quote_costs', {
          quote_id: saved.id,
          stage: cost.stage || 'fob',
          category: cost.category || 'other',
          label: cost.label,
          amount: cost.amount ?? 0,
          note: cost.note || '',
          sort: index,
        });
      });
    });
    return quoteBundle(saved.id);
  }

  /* -------------------- 岗位能力 / 每日推荐 -------------------- */
  function careerData(date) {
    const day = /^\d{4}-\d{2}-\d{2}$/.test(date || '') ? date : todayStr();
    const personality = getPersonality(store);
    const scores = Object.fromEntries(personality.traits.map((t) => [t.key, t.score]));
    let self = {};
    try { self = JSON.parse(store.meta.get('career_self') || '{}'); } catch { self = {}; }

    const careerGoalIds = new Set(CAREER_GOALS.map((g) => g.id).concat(['goal_job']));
    const goals = store.all(`SELECT * FROM goals ORDER BY sort ASC`).filter((g) => careerGoalIds.has(g.id));
    const goalIds = goals.map((g) => g.id);
    const milestones = goalIds.length
      ? store.all(`SELECT * FROM milestones WHERE goal_id IN (${goalIds.map(() => '?').join(',')}) ORDER BY due_date ASC`, goalIds)
      : [];

    const watchedRows = store.all('SELECT * FROM video_log WHERE date = ?', [day]);
    const watched = Object.fromEntries(watchedRows.map((r) => [r.bvid, r]));
    const picks = dailyPicks(day, scores);

    const allItems = JOB_PROFILE.groups.flatMap((g) => g.items);
    const target = { must: 3, high: 2, plus: 1 };
    const gaps = allItems.filter((item) => Number(self[item.id] || 0) < (target[item.level] || 2));
    const dayIndex = Math.floor(Date.parse(`${day}T00:00:00+08:00`) / 86400000);
    const principle = SALES_PRINCIPLES[((dayIndex % SALES_PRINCIPLES.length) + SALES_PRINCIPLES.length) % SALES_PRINCIPLES.length];
    const watchedTotal = store.get('SELECT COUNT(*) AS n FROM video_log').n;
    const watched14 = store.get('SELECT COUNT(*) AS n FROM video_log WHERE date >= ?', [addDays(day, -13)]).n;
    let jd = null;
    try {
      const savedJd = JSON.parse(store.meta.get('career_jd') || 'null');
      if (savedJd?.analysis) jd = savedJd;
    } catch { jd = null; }

    return {
      date: day,
      profile: JOB_PROFILE,
      personality,
      self,
      goals,
      milestones,
      picks,
      watched,
      principle,
      douyin: DOUYIN_SEARCHES[dayIndex % DOUYIN_SEARCHES.length],
      library: VIDEOS,
      jd,
      stats: {
        items: allItems.length,
        must: allItems.filter((i) => i.level === 'must').length,
        gaps: gaps.length,
        mustGaps: gaps.filter((i) => i.level === 'must').length,
        watchedTotal,
        watched14,
        goalProgress: goals.length ? Math.round(goals.reduce((s, g) => s + (g.progress || 0), 0) / goals.length) : 0,
      },
    };
  }

  function markVideo(id, body = {}) {
    const video = videoById(id);
    if (!video) throw new Error('视频不在推荐库中');
    const day = /^\d{4}-\d{2}-\d{2}$/.test(body.date || '') ? body.date : todayStr();
    const status = body.status === 'saved' ? 'saved' : 'watched';
    const note = String(body.note || '').slice(0, 2000);
    store.run(
      `INSERT INTO video_log (id, bvid, date, status, note, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(bvid, date) DO UPDATE SET status = excluded.status, note = excluded.note,
         updated_at = excluded.updated_at`,
      [`vid_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, id, day, status, note, nowIso(), nowIso()]
    );
    return { bvid: id, date: day, status };
  }

  /* -------------------- 商务文档 -------------------- */
  function documentContext(body = {}) {
    const profile = JSON.parse(store.meta.get('profile') || '{}');
    const client = body.client_id ? store.find('clients', body.client_id) : null;
    const contact = body.contact_id
      ? store.find('contacts', body.contact_id)
      : (client ? store.get('SELECT * FROM contacts WHERE client_id = ? ORDER BY is_primary DESC, created_at ASC LIMIT 1', [client.id]) : null);
    const bundle = body.quote_id ? quoteBundle(body.quote_id) : null;
    return {
      profile,
      client: client || {},
      contact: contact || {},
      quote: bundle?.quote || {},
      lines: bundle?.lines || [],
      calc: bundle?.calc || {},
      params: body.params || {},
    };
  }

  function generateDocument(body = {}) {
    const kind = findKind(body.kind);
    if (!kind) throw new Error('未知文档类型');
    const ctx = documentContext(body);
    const doc = generateDoc({ kind: body.kind, ...ctx });
    return { ...doc, kind: body.kind, label: kind.label };
  }

  /* -------------------- 知识库检索 -------------------- */
  function knowledgeList(query) {
    const { q = '', category = '', trust = '', mastery = '' } = query;
    const where = [];
    const params = [];
    if (q) {
      where.push('(title LIKE ? OR plain LIKE ? OR pro LIKE ? OR tags LIKE ? OR scenario LIKE ?)');
      const like = `%${q}%`;
      params.push(like, like, like, like, like);
    }
    if (category) { where.push('category = ?'); params.push(category); }
    if (trust) { where.push('trust = ?'); params.push(trust); }
    if (mastery !== '') { where.push('mastery = ?'); params.push(Number(mastery)); }
    const items = store.all(
      `SELECT id,title,category,stage,plain,tags,trust,mastery,verified_on,source_name
       FROM knowledge ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
       ORDER BY sort ASC, created_at ASC`,
      params
    );
    const categories = store.all('SELECT category, COUNT(*) AS n FROM knowledge GROUP BY category ORDER BY n DESC');
    return { items, categories };
  }

  function knowledgeDetail(id) {
    const item = store.find('knowledge', id);
    if (!item) return null;
    const links = store.all(
      `SELECT l.id AS link_id, l.rel, k.id, k.title, k.category, k.mastery
       FROM knowledge_links l JOIN knowledge k ON k.id = l.to_id WHERE l.from_id = ?
       UNION
       SELECT l.id AS link_id, l.rel, k.id, k.title, k.category, k.mastery
       FROM knowledge_links l JOIN knowledge k ON k.id = l.from_id WHERE l.to_id = ?`,
      [id, id]
    );
    return { item, links };
  }

  /* -------------------- 路由 -------------------- */
  return async function handle(req, res, url, body) {
    const p = url.pathname;
    const m = req.method;
    const seg = p.split('/').filter(Boolean); // ['api','tasks','xxx']

    try {
      if (m === 'GET' && p === '/api/health') return json(res, 200, { ok: true, ts: nowIso() });

      if (m === 'GET' && p === '/api/bootstrap') return json(res, 200, bootstrap(url.searchParams.get('date')));

      if (m === 'POST' && p === '/api/tasks/generate') {
        return json(res, 200, { ok: true, ...generatePlan(body?.date) });
      }

      /* -------------------- 客户 CRM -------------------- */
      if (m === 'GET' && p === '/api/crm') return json(res, 200, { ok: true, ...crmData() });

      if (m === 'GET' && seg[1] === 'clients' && seg[3] === 'full' && seg.length === 4) {
        const data = clientFull(seg[2]);
        if (!data) return bad(res, '客户不存在', 404);
        return json(res, 200, { ok: true, ...data, stages: CLIENT_STAGES });
      }

      /* -------------------- 报价 -------------------- */
      if (m === 'GET' && p === '/api/quotes/overview') {
        const day = todayStr();
        const items = store.all(
          `SELECT q.*, c.company, c.country FROM quotes q
           LEFT JOIN clients c ON c.id = q.client_id
           ORDER BY q.created_at DESC`
        ).map((q) => ({ ...q, expired: Boolean(q.valid_until && q.valid_until < day) }));
        const stats = {};
        for (const q of items) {
          stats[q.status] = stats[q.status] || { n: 0, amount: 0 };
          stats[q.status].n += 1;
          stats[q.status].amount += Number(q.total_amount) || 0;
        }
        return json(res, 200, { ok: true, items, stats, statuses: QUOTE_STATUS });
      }

      if (m === 'POST' && p === '/api/quotes/calc') {
        return json(res, 200, { ok: true, calc: calcQuote(body || {}) });
      }

      if (m === 'POST' && p === '/api/quotes/save') {
        const saved = saveQuote(body || {});
        return json(res, 200, { ok: true, ...saved });
      }

      if (m === 'GET' && seg[1] === 'quotes' && seg[3] === 'full' && seg.length === 4) {
        const bundle = quoteBundle(seg[2]);
        if (!bundle) return bad(res, '报价不存在', 404);
        return json(res, 200, { ok: true, ...bundle });
      }

      if (m === 'POST' && seg[1] === 'quotes' && seg[3] === 'duplicate' && seg.length === 4) {
        const bundle = quoteBundle(seg[2]);
        if (!bundle) return bad(res, '报价不存在', 404);
        const copy = {
          ...bundle.quote,
          quote_no: '',
          status: 'draft',
          total_qty: 0,
          total_amount: 0,
          calc_json: null,
        };
        const saved = saveQuote({ quote: copy, lines: bundle.lines, costs: bundle.costs });
        return json(res, 200, { ok: true, ...saved });
      }

      /* -------------------- 商务文档 -------------------- */
      if (m === 'GET' && p === '/api/docs/templates') {
        return json(res, 200, {
          ok: true,
          kinds: DOC_KINDS,
          profile: JSON.parse(store.meta.get('profile') || '{}'),
        });
      }
      if (m === 'POST' && p === '/api/docs/generate') {
        return json(res, 200, { ok: true, ...generateDocument(body || {}) });
      }

      /* -------------------- 岗位能力 / 每日推荐 -------------------- */
      if (m === 'GET' && p === '/api/career') {
        return json(res, 200, { ok: true, ...careerData(url.searchParams.get('date')) });
      }
      if (m === 'POST' && p === '/api/career/personality') {
        const current = getPersonality(store);
        const traits = { ...Object.fromEntries(current.traits.map((t) => [t.key, t.score])) };
        for (const trait of current.traits) {
          if (body?.traits?.[trait.key] !== undefined) {
            traits[trait.key] = Math.min(5, Math.max(1, Math.round(Number(body.traits[trait.key]) || trait.score)));
          }
        }
        const note = body?.note !== undefined ? String(body.note).slice(0, 1000) : current.note;
        store.meta.set('career_personality', JSON.stringify({ note, traits }));
        return json(res, 200, { ok: true, ...careerData() });
      }
      if (m === 'POST' && p === '/api/career/self') {
        const key = String(body?.key || '');
        const valid = JOB_PROFILE.groups.some((g) => g.items.some((i) => i.id === key));
        if (!valid) return bad(res, '未知能力项');
        let self = {};
        try { self = JSON.parse(store.meta.get('career_self') || '{}'); } catch { self = {}; }
        self[key] = Math.min(4, Math.max(0, Math.round(Number(body?.level) || 0)));
        store.meta.set('career_self', JSON.stringify(self));
        return json(res, 200, { ok: true, self });
      }
      if (m === 'POST' && p === '/api/career/jd') {
        const text = String(body?.text || '').slice(0, 20000).trim();
        if (text.length < 40) return bad(res, 'JD 太短：至少粘贴一段完整的岗位职责/任职要求');
        const jd = { text, analysis: analyzeJd(text), at: nowIso() };
        store.meta.set('career_jd', JSON.stringify(jd));
        return json(res, 200, { ok: true, jd });
      }
      if (m === 'POST' && seg[1] === 'videos' && seg[3] === 'seen' && seg.length === 4) {
        return json(res, 200, { ok: true, ...markVideo(seg[2], body || {}), ...careerData(body?.date) });
      }
      if (m === 'DELETE' && seg[1] === 'videos' && seg[3] === 'seen' && seg.length === 4) {
        const day = /^\d{4}-\d{2}-\d{2}$/.test(url.searchParams.get('date') || '')
          ? url.searchParams.get('date') : todayStr();
        store.run('DELETE FROM video_log WHERE bvid = ? AND date = ?', [seg[2], day]);
        return json(res, 200, { ok: true });
      }

      /* 通用资源 CRUD：/api/:resource[/:id]（限制层级，避免误吃掉 /link 子路由） */
      if (seg[0] === 'api' && TABLES[seg[1]] && seg.length <= 3) {
        const name = seg[1];
        const id = seg[2];

        if (m === 'GET' && !id) {
          if (name === 'knowledge') return json(res, 200, { ok: true, ...knowledgeList(Object.fromEntries(url.searchParams)) });
          const filters = {};
          for (const [k, v] of url.searchParams) if (k === 'id' || TABLES[name].fields.includes(k)) filters[k] = v;
          return json(res, 200, { ok: true, items: store.list(name, filters) });
        }
        if (m === 'GET' && id) {
          if (name === 'knowledge') {
            const detail = knowledgeDetail(id);
            if (!detail) return bad(res, '条目不存在', 404);
            return json(res, 200, { ok: true, ...detail });
          }
          const item = store.find(name, id);
          if (!item) return bad(res, '记录不存在', 404);
          return json(res, 200, { ok: true, item });
        }
        if (m === 'POST' && !id) {
          const created = store.create(name, body || {});
          if (name === 'milestones' && created.goal_id) syncGoalProgress(created.goal_id);
          if (name === 'followups' && created.client_id) syncClientFollowup(created.client_id);
          return json(res, 200, { ok: true, item: created });
        }
        if ((m === 'PATCH' || m === 'PUT') && id) {
          const patch = { ...(body || {}) };
          if (name === 'tasks' && patch.status) {
            patch.completed_at = patch.status === 'done' ? nowIso() : null;
          }
          if (name === 'milestones' && patch.status === 'done') patch.status = 'done';
          const before = store.find(name, id);
          const item = store.update(name, id, patch);
          if (!item) return bad(res, '记录不存在', 404);
          // 目标进度 = 已完成里程碑 / 全部里程碑（不使用手填数字，避免口径不一致）
          if (name === 'milestones' && item.goal_id) syncGoalProgress(item.goal_id);
          // 完成/取消完成/改期时，重算当天学习分钟（用于打卡与连续天数）
          if (name === 'tasks') {
            if (item.plan_date) recomputeDay(item.plan_date);
            if (before?.plan_date && before.plan_date !== item.plan_date) recomputeDay(before.plan_date);
          }
          if (name === 'followups') {
            // 标记完成且写了下次日期：自动生成下一条待跟进，避免"完成后就断线"
            if (item.status === 'done' && item.next_date && item.client_id) {
              const exists = store.get(
                `SELECT 1 AS x FROM follow_ups WHERE client_id = ? AND status = 'planned' AND due_date = ?`,
                [item.client_id, item.next_date]
              );
              if (!exists) {
                store.create('followups', {
                  client_id: item.client_id,
                  contact_id: item.contact_id || null,
                  due_date: item.next_date,
                  channel: item.channel || 'email',
                  direction: 'out',
                  summary: item.next_action || '按上次沟通计划跟进',
                  next_action: '',
                  status: 'planned',
                });
              }
            }
            syncClientFollowup(item.client_id);
          }
          return json(res, 200, { ok: true, item });
        }
        if (m === 'DELETE' && id) {
          const item = store.find(name, id);
          if (name === 'quotes') {
            store.run('DELETE FROM quote_lines WHERE quote_id = ?', [id]);
            store.run('DELETE FROM quote_costs WHERE quote_id = ?', [id]);
          }
          const ok = store.remove(name, id);
          if (name === 'milestones' && item?.goal_id) syncGoalProgress(item.goal_id);
          if (name === 'tasks' && item?.plan_date) recomputeDay(item.plan_date);
          if (name === 'followups' && item?.client_id) syncClientFollowup(item.client_id);
          return json(res, ok ? 200 : 404, { ok });
        }
        return bad(res, '不支持的请求', 405);
      }

      /* 知识关联 */
      if (m === 'POST' && seg[1] === 'knowledge' && seg[3] === 'link') {
        const from = seg[2];
        const to = String(body?.to_id || '');
        if (!store.find('knowledge', from) || !store.find('knowledge', to)) return bad(res, '条目不存在', 404);
        if (from === to) return bad(res, '不能关联自己');
        store.run('INSERT OR IGNORE INTO knowledge_links (id,from_id,to_id,rel) VALUES (?,?,?,?)',
          [`lnk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, from, to, body?.rel || 'related']);
        return json(res, 200, { ok: true, ...knowledgeDetail(from) });
      }
      if (m === 'DELETE' && seg[1] === 'knowledge' && seg[3] === 'link') {
        store.run('DELETE FROM knowledge_links WHERE id = ?', [seg[4]]);
        return json(res, 200, { ok: true });
      }

      /* 打卡 */
      if (m === 'POST' && p === '/api/checkin') {
        const date = body?.date || todayStr();
        const row = store.get('SELECT * FROM daily_log WHERE date = ?', [date]);
        const english = Math.max(0, Number(body?.english_min ?? row?.english_min ?? 0) | 0);
        const trade = Math.max(0, Number(body?.trade_min ?? row?.trade_min ?? 0) | 0);
        const note = body?.note ?? row?.note ?? '';
        if (row) {
          store.run('UPDATE daily_log SET english_min=?, trade_min=?, note=?, updated_at=? WHERE date=?',
            [english, trade, note, nowIso(), date]);
        } else {
          store.run('INSERT INTO daily_log (date,english_min,trade_min,note,created_at,updated_at) VALUES (?,?,?,?,?,?)',
            [date, english, trade, note, nowIso(), nowIso()]);
        }
        return json(res, 200, { ok: true, log: store.get('SELECT * FROM daily_log WHERE date = ?', [date]), streak: streak() });
      }

      /* 个人档案 */
      if (p === '/api/profile' && m === 'GET') {
        return json(res, 200, { ok: true, profile: JSON.parse(store.meta.get('profile') || '{}') });
      }
      if (p === '/api/profile' && m === 'POST') {
        const current = JSON.parse(store.meta.get('profile') || '{}');
        const allowed = ['name', 'stage', 'target_city', 'target_date', 'cet4', 'cet6_plan',
          'company', 'company_en', 'address', 'email', 'phone', 'website', 'bank_info'];
        for (const key of allowed) {
          if (body?.[key] !== undefined) current[key] = String(body[key]).slice(0, 200);
        }
        store.meta.set('profile', JSON.stringify(current));
        return json(res, 200, { ok: true, profile: current });
      }

      /* 复习答案 / 训练评分：只做结构化保存，不假装有 AI 评分 */
      if (m === 'GET' && p === '/api/stats') {
        return json(res, 200, {
          ok: true,
          stats: knowledgeStats(),
          tasks: store.all(`SELECT plan_date, status, COUNT(*) AS n FROM tasks GROUP BY plan_date, status`),
          sessions: store.all('SELECT created_at FROM english_sessions'),
          errors: store.all('SELECT kind, COUNT(*) AS n FROM error_log GROUP BY kind'),
        });
      }

      if (m === 'GET' && p === '/api/export') {
        const payload = store.exportAll();
        const name = `trade-os-backup-${todayStr()}.json`;
        const text = JSON.stringify(payload, null, 2);
        res.writeHead(200, {
          'content-type': 'application/json; charset=utf-8',
          'content-disposition': `attachment; filename="${name}"`,
          'content-length': byteLength(text),
        });
        return res.end(text);
      }

      if (m === 'POST' && p === '/api/import') {
        // 导入前先留一份快照：误导入时还能回到上一版
        let backup = null;
        try { backup = store.backup(); } catch { /* 快照失败不阻断导入 */ }
        const result = store.importAll(body);
        return json(res, 200, { ok: true, backup, ...result });
      }

      if (m === 'POST' && p === '/api/backup') {
        const file = store.backup();
        return json(res, 200, { ok: true, file });
      }

      return bad(res, '接口不存在', 404);
    } catch (err) {
      console.error('[api]', p, err);
      return bad(res, err.message || '服务器错误', 500);
    }
  };

  function syncGoalProgress(goalId) {
    const g = store.find('goals', goalId);
    if (!g) return;
    const total = store.get('SELECT COUNT(*) AS n FROM milestones WHERE goal_id = ?', [goalId]).n;
    if (!total) return;
    const done = store.get('SELECT COUNT(*) AS n FROM milestones WHERE goal_id = ? AND status = ?', [goalId, 'done']).n;
    store.run('UPDATE goals SET progress = ?, updated_at = ? WHERE id = ?',
      [Math.round((done / total) * 100), nowIso(), goalId]);
  }
}

export { PRIORITY_ORDER };