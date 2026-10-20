import { api } from '../api.js';
import { esc, toast, icon, todayStr, fmtDate, hydrateIcons } from '../dom.js';

const KIND = { daily: ['green', '日复盘'], weekly: ['blue', '周复盘'], project: ['violet', '项目复盘'] };

const QUESTIONS = [
  ['goal_text', '原本的目标是什么？', '当时想达成什么，写具体。'],
  ['result_text', '实际结果是什么？', '能用数字就用数字：收入、成本、损失、人数、天数。'],
  ['worked', '哪些做法有效？', '可复用的动作，而不是"我很努力"。'],
  ['problems', '哪些地方出了问题？', '事实，不是情绪。'],
  ['info_gap', '当时掌握的信息是否充分？', '缺了什么信息？本可以在哪一步拿到？'],
  ['my_share', '哪些是我的责任？', '决策责任 vs 结果责任的边界。'],
  ['external', '哪些是合作方或外部因素？', '对方未披露、市场变化、政策等。'],
  ['changes', '如果重做一次，我会改变什么？', '具体到动作顺序。'],
  ['rule_text', '这次经验沉淀成什么规则？', '一条能写进检查清单的规则。'],
];

export default async function render(root) {
  const res = await api('/api/reviews');
  const reviews = res.items;

  root.innerHTML = `
    <div class="page-head">
      <div>
        <div class="eyebrow">REVIEW · 成长记录</div>
        <h1>复盘</h1>
        <p class="sub">复盘的目的不是给自己打分，而是把一次经历变成下次能用的规则。写完必须落到一条可执行的话。</p>
      </div>
      <div class="head-actions">
        <button class="btn primary" id="open-form">${icon('plus', 14)} 写一次复盘</button>
      </div>
    </div>

    <div class="split">
      <div class="main-col">
        <section class="card" id="form-card" hidden>
          <div class="card-head"><h2>新复盘</h2><span class="hint">不确定的可以先留空</span></div>
          <div class="card-body">
            <form id="review-form">
              <div class="form-grid">
                <div class="field">
                  <label>类型</label>
                  <select name="kind">
                    ${Object.entries(KIND).map(([k, [, v]]) => `<option value="${k}">${v}</option>`).join('')}
                  </select>
                </div>
                <div class="field"><label>标题</label><input name="title" required value="${esc(fmtDate(todayStr()))} 复盘"></div>
              </div>
              <div class="field"><label>周期 / 项目</label><input name="period" placeholder="例如：2026 第 43 周 / 劳务项目"></div>
              ${QUESTIONS.map(([name, q, hint]) => `
                <div class="field">
                  <label>${esc(q)}</label>
                  <textarea name="${name}" rows="2" placeholder="${esc(hint)}"></textarea>
                </div>`).join('')}
              <div class="field" style="max-width:220px">
                <label>整体状态（1 差 – 5 好，可不填）</label>
                <input type="number" name="mood" min="1" max="5">
              </div>
              <div style="display:flex;justify-content:flex-end;gap:8px">
                <button type="button" class="btn" id="cancel-form">取消</button>
                <button type="submit" class="btn primary">保存复盘</button>
              </div>
            </form>
          </div>
        </section>

        <div class="divider-label">历史复盘</div>
        ${reviews.length ? reviews.map((r) => {
          const [cls, label] = KIND[r.kind] || KIND.daily;
          return `<section class="card" style="margin-bottom:12px">
            <div class="card-body">
              <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
                <span class="chip ${cls}">${label}</span>
                <h3 style="font-size:14.2px;flex:1">${esc(r.title)}</h3>
                <span class="small faint">${esc((r.created_at || '').slice(0, 10))}</span>
              </div>
              ${r.period ? `<div class="small faint" style="margin-top:3px">${esc(r.period)}</div>` : ''}
              ${r.rule_text ? `<div class="callout good" style="margin-top:9px"><strong>沉淀规则：</strong>${esc(r.rule_text)}</div>` : ''}
              <details style="margin-top:8px">
                <summary>展开完整复盘</summary>
                <dl class="kv" style="margin-top:8px;grid-template-columns:130px 1fr">
                  ${QUESTIONS.filter(([k]) => r[k]).map(([k, q]) => `<dt>${esc(q.replace('？', ''))}</dt><dd>${esc(r[k])}</dd>`).join('')}
                </dl>
              </details>
            </div>
          </section>`;
        }).join('') : `<div class="empty">还没有复盘记录。第一次建议写「劳务项目」——把当时的信息缺口和责任边界写清楚。
          <div style="margin-top:10px"><button class="btn sm" id="empty-new">写第一次复盘</button></div></div>`}
      </div>

      <div class="side-col grid" style="gap:16px">
        <section class="card">
          <div class="card-head"><h2>复盘四条纪律</h2></div>
          <div class="card-body">
            <p class="small muted" style="margin-bottom:7px">1. 先事实，后评价。</p>
            <p class="small muted" style="margin-bottom:7px">2. 区分"我的决策责任"和"别人的行为责任"。</p>
            <p class="small muted" style="margin-bottom:7px">3. 至少产出一条可执行规则。</p>
            <p class="small muted">4. 规则要能被下次直接拿来用，不是"以后要小心"。</p>
          </div>
        </section>
        <section class="card">
          <div class="card-head"><h2>规则写到哪</h2></div>
          <div class="card-body">
            <p class="small muted">复盘产出的规则，建议同时写进知识库的「操作检查清单」，否则三个月后就忘了。</p>
          </div>
        </section>
      </div>
    </div>
  `;

  const card = root.querySelector('#form-card');
  root.querySelector('#open-form').onclick = () => {
    card.hidden = false;
    card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    card.querySelector('input[name="title"]')?.focus();
  };
  root.querySelector('#cancel-form').onclick = () => { card.hidden = true; };
  root.querySelector('#empty-new')?.addEventListener('click', () => root.querySelector('#open-form').click());

  root.querySelector('#review-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    try {
      await api('/api/reviews', { method: 'POST', body: data });
      toast('复盘已保存');
      await render(root);
    } catch (err) { toast(err.message, 'err'); }
  });

  hydrateIcons(root);
}