import { api } from '../api.js';
import { esc, toast, icon, fmtShort } from '../dom.js';
import { SCENARIOS } from '../scenarios.js';

export default async function render(root) {
  const [sessions, errors, expressions] = await Promise.all([
    api('/api/sessions'),
    api('/api/errors'),
    api('/api/expressions'),
  ]);

  const errList = errors.items;
  const expList = expressions.items;
  const done = sessions.items.filter((s) => s.status === 'reviewed').length;

  root.innerHTML = `
    <div class="page-head">
      <div>
        <div class="eyebrow">ENGLISH · 商务英语训练室</div>
        <h1>商务英语训练室</h1>
        <p class="sub">先自己写完，再看要点和修改建议。系统不会替你写，也不会假装给你打分——反馈来自你的自检 + 可选的 AI 复核。</p>
      </div>
      <div class="head-actions">
        <span class="chip green">已完成 ${done} 次练习</span>
      </div>
    </div>

    <div class="grid c4" style="margin-bottom:18px">
      <div class="stat"><span class="label">练习次数</span><span class="value">${sessions.items.length}</span><span class="foot">已提交自检 ${done} 次</span></div>
      <div class="stat"><span class="label">错误记录</span><span class="value">${errList.length}</span><span class="foot">重复出现的才值得背</span></div>
      <div class="stat"><span class="label">表达库</span><span class="value">${expList.length}</span><span class="foot">可直接复用的句子</span></div>
      <div class="stat"><span class="label">场景</span><span class="value">${SCENARIOS.length}</span><span class="foot">覆盖开发、报价、交付、售后</span></div>
    </div>

    <div class="pill-nav" id="eng-tabs" style="margin-bottom:14px">
      <button class="on" data-tab="scenes">场景库</button>
      <button data-tab="history">练习记录</button>
      <button data-tab="errors">错误本</button>
      <button data-tab="expressions">表达库</button>
    </div>

    <div data-view="scenes">
      <div class="grid c2">
        ${SCENARIOS.map((s) => `
          <div class="scenario-card">
            <div style="display:flex;gap:8px;align-items:center">
              <span class="chip ${s.level === '核心' ? 'green' : s.level === '进阶' ? 'violet' : 'blue'}">${esc(s.level)}</span>
              <span class="chip line">${esc(s.tag)}</span>
              <span class="right"></span>
            </div>
            <h3>${esc(s.title)}</h3>
            <p class="ctx">${esc(s.goal)}</p>
            <div style="display:flex;justify-content:flex-end;margin-top:auto;padding-top:10px">
              <button class="btn sm" data-start="${esc(s.key)}">开始练习 ${icon('arrowRight', 13)}</button>
            </div>
          </div>`).join('')}
      </div>
    </div>

    <div data-view="history" hidden>
      <section class="card"><div class="card-body">
        ${sessions.items.length ? `<div class="list-plain">${sessions.items.map((s) => {
          const sc = SCENARIOS.find((x) => x.key === s.scenario_key);
          return `<div style="display:flex;gap:10px;align-items:center">
            <div style="flex:1;min-width:0">
              <a href="#/english/${esc(s.id)}" style="font-weight:560">${esc(s.scenario)}</a>
              <div class="small faint">${esc((s.created_at || '').slice(0, 16).replace('T', ' '))} · ${(s.user_answer || '').trim().split(/\s+/).filter(Boolean).length} 词</div>
            </div>
            <span class="chip ${s.status === 'reviewed' ? 'green' : 'line'}">${s.status === 'reviewed' ? '已自检' : '草稿'}</span>
            <a class="btn sm ghost" href="#/english/${esc(s.id)}">继续</a>
          </div>`;
        }).join('')}</div>` : `<div class="empty">还没有练习记录。从场景库里选一个开始。</div>`}
      </div></section>
    </div>

    <div data-view="errors" hidden>
      <section class="card"><div class="card-body">
        ${errList.length ? `<div class="list-plain">${errList.map((e) => `
          <div>
            <div style="display:flex;gap:8px;align-items:center">
              <span class="chip ${e.kind === 'grammar' ? 'blue' : e.kind === 'word' ? 'violet' : e.kind === 'tone' ? 'amber' : 'line'}">${{
                grammar: '语法', word: '用词', tone: '语气', structure: '结构',
              }[e.kind] || e.kind}</span>
              <span class="small faint">出现 ${e.hits} 次</span>
              <button class="btn sm ghost right" data-del-err="${esc(e.id)}">${icon('trash', 12)}</button>
            </div>
            <div class="small" style="margin-top:5px;text-decoration:line-through;color:#b42318">${esc(e.wrong)}</div>
            <div class="small" style="color:#0a5c43">→ ${esc(e.correct)}</div>
            ${e.rule ? `<div class="small faint" style="margin-top:2px">规则：${esc(e.rule)}</div>` : ''}
          </div>`).join('')}</div>` : `<div class="empty">错误本还是空的。练习时把"想说但没说出来"的地方记下来。</div>`}
      </div></section>
    </div>

    <div data-view="expressions" hidden>
      <section class="card"><div class="card-body">
        ${expList.length ? `<div class="list-plain">${expList.map((x) => `
          <div>
            <div style="display:flex;gap:8px;align-items:flex-start">
              <div style="flex:1">
                <div style="font-weight:550;font-size:13.6px">${esc(x.en)}</div>
                ${x.zh ? `<div class="small muted">${esc(x.zh)}</div>` : ''}
                ${x.note ? `<div class="small faint">${esc(x.note)}</div>` : ''}
              </div>
              <span class="chip line">${esc(x.category)}</span>
            </div>
          </div>`).join('')}</div>` : `<div class="empty">把改好的句子存进来，下次直接复用。</div>`}
      </div></section>
    </div>
  `;

  root.querySelectorAll('#eng-tabs button').forEach((b) => {
    b.onclick = () => {
      root.querySelectorAll('#eng-tabs button').forEach((x) => x.classList.toggle('on', x === b));
      root.querySelectorAll('[data-view]').forEach((v) => { v.hidden = v.dataset.view !== b.dataset.tab; });
    };
  });

  root.querySelectorAll('[data-start]').forEach((b) => {
    b.onclick = async () => {
      const sc = SCENARIOS.find((x) => x.key === b.dataset.start);
      if (!sc) return;
      b.disabled = true;
      try {
        const res = await api('/api/sessions', {
          method: 'POST',
          body: {
            scenario: sc.title,
            scenario_key: sc.key,
            goal: sc.goal,
            context: sc.context,
            status: 'draft',
          },
        });
        location.hash = `#/english/${res.item.id}`;
      } catch (err) {
        toast(err.message, 'err');
        b.disabled = false;
      }
    };
  });

  root.querySelectorAll('[data-del-err]').forEach((b) => {
    b.onclick = async () => {
      await api(`/api/errors/${b.dataset.delErr}`, { method: 'DELETE' });
      await render(root);
    };
  });
}