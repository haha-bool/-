import { api, getBootstrap, updateTask, generatePlan } from '../api.js';
import { esc, fmtDate, fmtShort, relDay, toast, icon, masteryDots, todayStr, addDays } from '../dom.js';

export default async function render(root) {
  const [state, career] = await Promise.all([getBootstrap(), api('/api/career')]);
  const { tasks, overdue, goals, milestones, projects, stats, reviews, logs, unverified, profile,
    followupsDue, quotesAttention } = state;
  const hour = new Date().getHours();
  const hello = hour < 6 ? '凌晨好' : hour < 12 ? '早上好' : hour < 18 ? '下午好' : '晚上好';
  const doneCount = tasks.filter((t) => t.status === 'done').length;
  const openTasks = tasks.filter((t) => t.status !== 'done');
  const focus = openTasks.slice(0, 5);
  const minutesLeft = openTasks.reduce((a, t) => a + (t.estimate_min || 0), 0);
  const goalTitle = Object.fromEntries(goals.map((g) => [g.id, g.title]));
  const pct = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0;

  root.innerHTML = `
    <div class="page-head">
      <div>
        <div class="eyebrow">${esc(fmtDate(state.date))} · ${esc(profile.stage || '能力建设期')}</div>
        <h1>${hello}${doneCount ? `，今天已完成 ${doneCount} 项` : '，先定下今天最重要的一件事'}</h1>
        <p class="sub">${esc(profile.target_city || '广州')} · 目标 ${esc(profile.target_date || '2028-07')} 入职 · 剩下约 ${minutesLeft} 分钟的计划任务</p>
      </div>
      <div class="head-actions">
        <a class="btn" href="#/review">写一次复盘</a>
        <button class="btn primary" id="dash-gen">${icon('spark', 15)} 生成今日计划</button>
      </div>
    </div>

    <section class="focus-banner">
      <div class="focus-copy">
        <span class="focus-kicker">FOCUS OF THE DAY</span>
        <h2>${esc(focus[0]?.title || '今天还没有任务，先生成一份计划')}</h2>
        <p>${openTasks.length} 项待办 · 预计 ${minutesLeft} 分钟${overdue.length ? ` · ${overdue.length} 项逾期` : ' · 节奏正常'}</p>
      </div>
      <div class="focus-side">
        <div class="focus-ring" style="--value:${pct}"><strong>${pct}%</strong></div>
        <div class="focus-meta">
          <span>今日完成</span>
          <strong>${doneCount}<small> / ${tasks.length}</small></strong>
        </div>
      </div>
    </section>

    <div class="grid c4" style="margin-bottom:16px">
      ${statCard('今日任务', `${stats.today.done}<small> / ${stats.today.total}</small>`, `计划 ${stats.today.minutes} 分钟 · 已完成 ${stats.today.doneMinutes}`, `${stats.today.done}/${stats.today.total || 1}`)}
      ${statCard('连续打卡', `${stats.streak}<small> 天</small>`, '每天有记录即算，中断不归零焦虑', '')}
      ${statCard('知识库', `${stats.total}<small> 条</small>`, `已掌握 ${stats.mastered} 条 · 掌握度 3 以上`, '')}
      ${statCard('近 14 天', `${Math.round(stats.minutes14 / 60)}<small> 小时</small>`, `英语 ${Math.round(stats.englishMinutes14 / 60)}h · 外贸 ${Math.round(stats.tradeMinutes14 / 60)}h`, '')}
    </div>

    <div class="dash-grid">
      <div class="grid" style="gap:16px">
        <section class="card">
          <div class="card-head">
            <h2>今日重点</h2>
            <a class="hint" href="#/tasks">全部任务 →</a>
          </div>
          <div class="card-body">
            ${focus.length ? focus.map((t) => taskRow(t, goalTitle)).join('') : `
              <div class="empty" style="margin-bottom:10px">
                今天还没有任务。点「生成今日计划」，系统会按你的每日节奏排好。
              </div>`}
            ${overdue.length ? `
              <div class="divider-label">待处理 · 逾期 ${overdue.length} 项</div>
              ${overdue.slice(0, 4).map((t) => `
                <div class="task">
                  <div style="flex:1;min-width:0">
                    <div class="task-title">${esc(t.title)}</div>
                    <div class="task-meta"><span>${esc(t.plan_date)}</span><span class="chip red">过期待办</span></div>
                  </div>
                  <a class="btn sm ghost" href="#/tasks?d=${esc(t.plan_date)}">去处理</a>
                </div>`).join('')}` : ''}
          </div>
        </section>

        <section class="card">
          <div class="card-head">
            <h2>学习进度</h2>
            <span class="hint">近 14 天</span>
          </div>
          <div class="card-body">
            ${renderBars(logs)}
            <div class="sep"></div>
            <div class="small muted" style="margin-bottom:8px">知识掌握分布</div>
            ${renderMasteryBar(stats)}
            <div class="sep"></div>
            <form id="checkin-form">
              <div class="small muted" style="margin-bottom:6px">今日记录</div>
              <div class="row" style="gap:8px">
                <div class="field" style="margin:0">
                  <label>英语补记（分钟）</label>
                  <input type="number" name="english_min" min="0" step="5" value="${state.todayLog?.english_min ?? 0}">
                </div>
                <div class="field" style="margin:0">
                  <label>外贸补记（分钟）</label>
                  <input type="number" name="trade_min" min="0" step="5" value="${state.todayLog?.trade_min ?? 0}">
                </div>
              </div>
              <div style="display:flex;align-items:center;gap:8px;margin-top:8px;flex-wrap:wrap">
                <button class="btn sm" type="submit">保存</button>
                <span class="small faint">任务自动计入：英语 ${state.todayLog?.auto_english ?? 0}′ · 外贸 ${state.todayLog?.auto_trade ?? 0}′</span>
              </div>
            </form>
          </div>
        </section>

        <section class="card">
          <div class="card-head">
            <h2>最近复盘</h2>
            <a class="hint" href="#/review">全部 →</a>
          </div>
          <div class="card-body">
            ${reviews.length ? reviews.slice(0, 3).map((r) => `
              <div class="review-item">
                <div style="display:flex;gap:8px;align-items:center">
                  <span class="chip ${r.kind === 'weekly' ? 'blue' : r.kind === 'project' ? 'violet' : 'green'}">${r.kind === 'weekly' ? '周复盘' : r.kind === 'project' ? '项目复盘' : '日复盘'}</span>
                  <h3 style="flex:1">${esc(r.title)}</h3>
                  <span class="small faint">${esc((r.created_at || '').slice(0, 10))}</span>
                </div>
                <p class="small muted" style="margin-top:4px">${esc((r.rule_text || r.result_text || r.worked || '').slice(0, 110))}</p>
              </div>`).join('')
              : `<div class="empty">还没有复盘。第一次可以从「劳务项目」开始，把教训变成规则。</div>`}
          </div>
        </section>
      </div>

      <div class="grid" style="gap:16px">
        ${followupsDue.length ? `<section class="card">
          <div class="card-head">
            <h2>今天要跟进</h2>
            <a class="hint" href="#/crm">客户 CRM →</a>
          </div>
          <div class="card-body list-plain">
            ${followupsDue.slice(0, 4).map((f) => `
              <div>
                <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
                  <a href="#/crm/${esc(f.client_id)}" style="font-weight:600;font-size:13.3px">${esc(f.company)}</a>
                  <span class="chip ${f.due_date < state.date ? 'red' : 'amber'}">${esc(f.due_date === state.date ? '今天' : f.due_date)}</span>
                </div>
                <p class="small muted" style="margin-top:2px">${esc((f.summary || f.next_action || '按计划跟进').slice(0, 70))}</p>
              </div>`).join('')}
          </div>
        </section>` : ''}

        <section class="card">
          <div class="card-head">
            <h2>今天看这 3 条</h2>
            <a class="hint" href="#/career">岗位与推荐 →</a>
          </div>
          <div class="card-body list-plain">
            ${career.picks.map((v) => `
              <div>
                <a href="${esc(v.url || `https://www.bilibili.com/video/${v.bvid}`)}" target="_blank" rel="noreferrer"
                  style="font-weight:570;font-size:13.2px;display:block">${esc(v.title)}</a>
                <p class="small faint" style="margin-top:2px">${esc(v.author)} · ${esc(v.duration)} · ${esc(v.skills.slice(0, 2).join(' / '))}</p>
              </div>`).join('')}
            <div style="padding-top:8px">
              <a class="btn sm" href="#/career">${icon('spark', 12)} 看今天的推荐与动作</a>
            </div>
          </div>
        </section>

        <section class="card">
          <div class="card-head">
            <h2>长期目标</h2>
            <a class="hint" href="#/plan">管理 →</a>
          </div>
          <div class="card-body">
            ${goals.slice(0, 6).map((g) => {
              const ms = milestones.filter((m) => m.goal_id === g.id);
              const done = ms.filter((m) => m.status === 'done').length;
              return `
                <div class="goal">
                  <div class="goal-top">
                    <span class="goal-title">${esc(g.title)}</span>
                    <span class="small faint">${g.progress}%</span>
                  </div>
                  <div class="progress" style="margin:7px 0 5px"><i style="width:${Math.min(100, g.progress)}%"></i></div>
                  <div class="goal-meta">${ms.length ? `里程碑 ${done}/${ms.length}` : '尚未设置里程碑'}${g.target_date ? ` · 目标 ${esc(g.target_date)}` : ''}</div>
                </div>`;
            }).join('')}
            ${goals.length > 6 ? `<div class="small faint" style="padding-top:8px">还有 ${goals.length - 6} 个目标未显示</div>` : ''}
          </div>
        </section>

        <section class="card">
          <div class="card-head">
            <h2>报价提醒</h2>
            <a class="hint" href="#/quotes">报价管理 →</a>
          </div>
          <div class="card-body list-plain">
            ${quotesAttention.length ? quotesAttention.map((q) => `
              <div>
                <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
                  <a href="#/quotes/${esc(q.id)}" class="mono" style="font-size:12.5px">${esc(q.quote_no || '未编号')}</a>
                  <span class="chip ${q.valid_until && q.valid_until < state.date ? 'red' : 'line'}">${q.valid_until ? (q.valid_until < state.date ? '已过有效期' : `有效期 ${q.valid_until}`) : '未填有效期'}</span>
                </div>
                <p class="small muted" style="margin-top:2px">${esc(q.company || '未关联客户')} · ${esc(q.incoterm)} · ${esc(q.currency)} ${Number(q.total_amount || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
              </div>`).join('') : '<div class="empty">没有待处理报价。</div>'}
          </div>
        </section>

        <section class="card">
          <div class="card-head">
            <h2>进行中的项目</h2>
            <a class="hint" href="#/plan">全部 →</a>
          </div>
          <div class="card-body list-plain">
            ${projects.filter((p) => p.status === 'active').map((p) => `
              <div>
                <div style="display:flex;align-items:center;gap:8px">
                  <span class="chip ${p.kind === 'real' ? 'amber' : p.kind === 'sim' ? 'violet' : 'blue'}">${p.kind === 'real' ? '真实' : p.kind === 'sim' ? '模拟' : '练习'}</span>
                  <strong style="font-size:13.5px">${esc(p.name)}</strong>
                </div>
                <p class="small muted" style="margin-top:3px">${esc((p.goal || '').slice(0, 80))}</p>
                <div class="progress" style="margin-top:6px"><i style="width:${p.progress || 0}%"></i></div>
              </div>`).join('') || '<div class="empty">暂无进行中项目</div>'}
          </div>
        </section>

        <section class="card">
          <div class="card-head">
            <h2>待核实 / 风险</h2>
            <span class="hint">${unverified.length} 项</span>
          </div>
          <div class="card-body">
            ${unverified.length ? `
              <p class="small muted" style="margin-bottom:8px">这些内容涉及动态信息或久未核实，不要直接拿去报价。</p>
              <div class="list-plain">
                ${unverified.slice(0, 5).map((k) => `
                  <div style="display:flex;gap:8px;align-items:flex-start">
                    <span class="chip ${k.trust === 'dynamic' ? 'amber' : 'line'}">${k.trust === 'dynamic' ? '动态' : '待核实'}</span>
                    <a href="#/knowledge/${esc(k.id)}" style="flex:1;font-size:13px">${esc(k.title)}</a>
                    <span class="small faint">${esc(k.verified_on || '')}</span>
                  </div>`).join('')}
              </div>` : '<div class="empty">没有需要额外核实的内容。</div>'}
            ${projects.some((p) => p.risks) ? `
              <div class="sep"></div>
              <div class="small muted" style="margin-bottom:6px">项目风险</div>
              ${projects.filter((p) => p.risks).slice(0, 3).map((p) => `
                <div style="font-size:12.8px;margin-bottom:6px">
                  <strong style="font-size:12.8px">${esc(p.name)}</strong>
                  <div class="faint">${esc(p.risks)}</div>
                </div>`).join('')}` : ''}
          </div>
        </section>
      </div>
    </div>
  `;

  root.querySelectorAll('[data-toggle-task]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.toggleTask;
      const next = btn.dataset.next;
      btn.disabled = true;
      try {
        await updateTask(id, { status: next });
        await render(root);
      } catch (err) {
        toast(err.message, 'err');
        btn.disabled = false;
      }
    });
  });

  root.querySelector('#dash-gen')?.addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    btn.disabled = true;
    try {
      const res = await generatePlan(todayStr());
      toast(res.created ? `已生成 ${res.created} 项任务` : '今天的任务已经生成过了');
      await render(root);
    } catch (err) {
      toast(err.message, 'err');
      btn.disabled = false;
    }
  });

  root.querySelector('#checkin-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = Object.fromEntries(new FormData(form).entries());
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    try {
      await api('/api/checkin', {
        method: 'POST',
        body: { date: state.date, english_min: Number(data.english_min || 0), trade_min: Number(data.trade_min || 0) },
      });
      toast('今日记录已保存');
      await render(root);
    } catch (err) {
      toast(err.message, 'err');
      btn.disabled = false;
    }
  });
}

function statCard(label, value, foot) {
  return `<div class="stat">
    <span class="label">${esc(label)}</span>
    <span class="value">${value}</span>
    <span class="foot">${esc(foot)}</span>
  </div>`;
}

function taskRow(t, goalTitle) {
  const done = t.status === 'done';
  return `<div class="task ${done ? 'done' : ''}">
    <button class="task-check" data-toggle-task="${esc(t.id)}" data-next="${done ? 'todo' : 'done'}"
      aria-label="${done ? '标记未完成' : '标记完成'}">${icon('check', 12)}</button>
    <div class="task-main">
      <div class="task-title">
        <span class="prio ${esc(t.priority)}">${esc(t.priority)}</span>
        <span>${esc(t.title)}</span>
      </div>
      <div class="task-meta">
        <span>${icon('clock', 12)} ${t.estimate_min || 0} 分钟</span>
        ${t.goal_id && goalTitle[t.goal_id] ? `<span class="chip line">${esc(goalTitle[t.goal_id])}</span>` : ''}
      </div>
    </div>
  </div>`;
}

function renderBars(logs) {
  const map = Object.fromEntries((logs || []).map((l) => [l.date, (l.english_min || 0) + (l.trade_min || 0)]));
  const days = [];
  for (let i = 13; i >= 0; i -= 1) {
    const d = addDays(todayStr(), -i);
    days.push({ d, v: map[d] || 0 });
  }
  const max = Math.max(60, ...days.map((x) => x.v));
  return `<div class="bar-chart">
    ${days.map(({ d, v }) => `
      <div class="bar ${v >= 60 ? 'hot' : ''}" style="height:${Math.max(4, Math.round((v / max) * 56))}px"
        title="${esc(d)}：${v} 分钟"></div>`).join('')}
  </div>
  <div style="display:flex;justify-content:space-between;margin-top:6px" class="small faint">
    <span>${esc(fmtShort(days[0].d))}</span><span>每天 ≥60 分钟算达标</span><span>${esc(fmtShort(days[13].d))}</span>
  </div>`;
}

function renderMasteryBar(stats) {
  const labels = ['未学', '知道', '能解释', '能应用', '能教人'];
  const colors = ['#e6ebe8', '#9ec9b8', '#5fae92', '#1c8a68', '#0a5c43'];
  const total = Math.max(1, stats.total);
  return `
    <div style="display:flex;height:10px;border-radius:99px;overflow:hidden;background:#eef1ee">
      ${stats.byMastery.map((n, i) => n ? `<div style="width:${(n / total) * 100}%;background:${colors[i]}" title="${labels[i]} ${n} 条"></div>` : '').join('')}
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:8px">
      ${stats.byMastery.map((n, i) => `<span class="small faint"><span style="display:inline-block;width:7px;height:7px;border-radius:2px;background:${colors[i]};margin-right:4px"></span>${labels[i]} ${n}</span>`).join('')}
    </div>`;
}