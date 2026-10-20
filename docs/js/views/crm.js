import { api } from '../api.js';
import { esc, toast, icon, openModal, closeModal, relDay, todayStr, hydrateIcons } from '../dom.js';

export const STAGE = {
  lead: ['line', '线索'],
  contacted: ['blue', '已联系'],
  replied: ['blue', '已回复'],
  quoted: ['amber', '已报价'],
  negotiating: ['amber', '议价中'],
  sample: ['violet', '样品阶段'],
  won: ['green', '已成交'],
  lost: ['red', '已丢单'],
};

export const KIND = {
  real: ['amber', '真实客户'],
  sim: ['violet', '模拟客户'],
  practice: ['blue', '练习'],
};

export const SOURCE = {
  alibaba: '阿里国际站',
  website: '官网询盘',
  referral: '老客户/朋友介绍',
  cold_email: '主动开发（邮件/LinkedIn）',
  expo: '展会',
  social: '社媒（TikTok/Facebook）',
  other: '其他',
};

const LEVEL = { A: 'A · 高优先', B: 'B · 正常', C: 'C · 培养' };

export default async function render(root) {
  const data = await api('/api/crm');
  const { clients, due, stats } = data;
  let stage = 'all';
  let keyword = '';

  root.innerHTML = `
    <div class="page-head">
      <div>
        <div class="eyebrow">CRM · 线索 · 跟进 · 状态机</div>
        <h1>客户 CRM</h1>
        <p class="sub">客户信息必须区分「事实 / 推测 / 待确认」。模拟客户会一直带标记，不会变成求职作品里的真实业绩。</p>
      </div>
      <div class="head-actions">
        <a class="btn" href="#/quotes">${icon('calculator', 15)} 报价管理</a>
        <button class="btn primary" id="add-client">${icon('plus', 15)} 新客户</button>
      </div>
    </div>

    <div class="grid c4" style="margin-bottom:16px">
      ${stat('客户总数', stats.total, `真实 ${stats.real} · 模拟 ${stats.sim}`)}
      ${stat('待跟进', stats.due, stats.overdue ? `其中逾期 ${stats.overdue} 项` : '全部在计划内', stats.overdue ? 'warn' : '')}
      ${stat('已报价 / 议价', (stats.stages.quoted || 0) + (stats.stages.negotiating || 0), `报价中客户`, '')}
      ${stat('已成交', stats.stages.won || 0, '只统计真实成交，模拟不算', '')}
    </div>

    ${due.length ? `
      <section class="card" style="margin-bottom:16px">
        <div class="card-head">
          <h2>今天要跟进</h2>
          <span class="hint">${due.length} 项 · 逾期也在这里</span>
        </div>
        <div class="card-body list-plain">
          ${due.map((f) => `
            <div style="display:flex;gap:10px;align-items:flex-start;flex-wrap:wrap">
              <div style="flex:1;min-width:200px">
                <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
                  <a href="#/crm/${esc(f.client_id)}" style="font-weight:600;font-size:13.6px">${esc(f.company)}</a>
                  <span class="chip ${f.due_date < todayStr() ? 'red' : 'amber'}">${esc(relDay(f.due_date))}</span>
                  ${(STAGE[f.client_stage] || STAGE.lead)[0] ? `<span class="chip ${STAGE[f.client_stage]?.[0] || 'line'}">${STAGE[f.client_stage]?.[1] || f.client_stage}</span>` : ''}
                </div>
                <div class="small muted" style="margin-top:2px">${esc(f.summary || f.next_action || '按计划跟进')}</div>
              </div>
              <button class="btn sm" data-done-followup="${esc(f.id)}">${icon('check', 12)} 完成</button>
            </div>`).join('')}
        </div>
      </section>` : ''}

    <div class="crm-toolbar">
      <input type="search" id="crm-search" placeholder="搜索公司 / 国家 / 产品">
      <select id="crm-stage">
        <option value="all">全部阶段</option>
        ${Object.entries(STAGE).map(([k, [, label]]) => `<option value="${k}">${label}</option>`).join('')}
      </select>
      <span class="small faint" id="crm-count">${clients.length} 个客户</span>
    </div>

    <div class="grid c2" id="crm-grid"></div>
  `;

  const grid = root.querySelector('#crm-grid');
  const countEl = root.querySelector('#crm-count');

  function paint() {
    const kw = keyword.trim().toLowerCase();
    const list = clients.filter((c) => {
      if (stage !== 'all' && c.stage !== stage) return false;
      if (!kw) return true;
      return [c.company, c.country, c.region, c.products_interest, c.website]
        .filter(Boolean).some((v) => String(v).toLowerCase().includes(kw));
    });
    countEl.textContent = `${list.length} 个客户`;
    grid.innerHTML = list.length ? list.map(clientCard).join('') : `
      <div class="empty-hero" style="grid-column:1/-1">
        <div class="empty-icon">${icon('users', 22)}</div>
        <h3>${clients.length ? '没有匹配的客户' : '从一个模拟客户开始'}</h3>
        <p>${clients.length
          ? '换个关键词或阶段试试。'
          : '用「模拟客户」走一遍：建档 → 联系人 → 跟进计划 → 报价 → 文档。界面会一直标着「模拟」，不会混进真实业绩。'}</p>
        <div class="empty-steps">
          <span><i>01</i> 公司画像</span>
          <span><i>02</i> 关键人</span>
          <span><i>03</i> 下一步</span>
        </div>
        <button class="btn primary" data-empty-add>${icon('plus', 14)} 新建第一个模拟客户</button>
      </div>`;
    const emptyAdd = grid.querySelector('[data-empty-add]');
    if (emptyAdd) emptyAdd.onclick = () => editClient(null, () => render(root));
  }

  root.querySelector('#crm-search').addEventListener('input', (e) => {
    keyword = e.target.value;
    paint();
  });
  root.querySelector('#crm-stage').addEventListener('change', (e) => {
    stage = e.target.value;
    paint();
  });

  root.querySelector('#add-client').onclick = () => editClient(null, () => render(root));

  root.querySelectorAll('[data-done-followup]').forEach((btn) => {
    btn.onclick = async () => {
      btn.disabled = true;
      try {
        await api(`/api/followups/${btn.dataset.doneFollowup}`, { method: 'PATCH', body: { status: 'done' } });
        toast('已记录跟进');
        await render(root);
      } catch (err) {
        toast(err.message, 'err');
        btn.disabled = false;
      }
    };
  });

  paint();
  hydrateIcons(root);
}

function stat(label, value, foot, tone = '') {
  return `<div class="stat ${tone === 'warn' ? 'stat-warn' : ''}">
    <span class="label">${esc(label)}</span>
    <span class="value">${value}</span>
    <span class="foot">${esc(foot)}</span>
  </div>`;
}

function clientCard(c) {
  const [kcls, klabel] = KIND[c.kind] || KIND.sim;
  const [scls, slabel] = STAGE[c.stage] || STAGE.lead;
  const overdue = c.next_follow_up && c.next_follow_up < todayStr();
  return `<a class="client-card" href="#/crm/${esc(c.id)}">
    <div class="client-card-top">
      <span class="chip ${kcls}">${klabel}</span>
      <span class="chip ${scls}">${slabel}</span>
      <span class="chip line">${esc(c.level || 'B')} 级</span>
      ${overdue ? '<span class="chip red">跟进逾期</span>' : ''}
    </div>
    <h3>${esc(c.company)}</h3>
    <div class="client-meta">
      ${c.country || c.region ? `<span>${icon('globe', 12)} ${esc([c.region, c.country].filter(Boolean).join(' · '))}</span>` : ''}
      ${c.products_interest ? `<span>${icon('layers', 12)} ${esc(c.products_interest)}</span>` : ''}
      <span>${icon('users', 12)} 联系人 ${c.contact_count}</span>
      <span>${icon('calculator', 12)} 报价 ${c.quote_count}</span>
    </div>
    <div class="client-foot">
      <span class="${overdue ? 'text-danger' : 'faint'}">
        ${c.next_follow_up ? `下次跟进：${esc(c.next_follow_up)}（${esc(relDay(c.next_follow_up))}）` : '还没有安排下次跟进'}
      </span>
      <span class="small faint">${c.open_followups ? `${c.open_followups} 项待办` : ''}</span>
    </div>
  </a>`;
}

/* 供详情页复用 */
export function editClient(client, onSaved) {
  const modal = openModal({
    title: client ? '编辑客户' : '新客户',
    subtitle: '公司、决策人、需求、下一步，缺一项都不算完整线索。',
    body: `<form>
      <div class="field"><label>公司名称 *</label><input name="company" required value="${esc(client?.company || '')}" placeholder="例如：Nordic Home AB"></div>
      <div class="form-grid">
        <div class="field"><label>国家 / 地区</label><input name="country" value="${esc(client?.country || '')}" placeholder="Sweden"></div>
        <div class="field"><label>城市 / 州</label><input name="region" value="${esc(client?.region || '')}"></div>
        <div class="field"><label>客户类型</label>
          <select name="kind">${Object.entries(KIND).map(([k, [, label]]) => `<option value="${k}" ${client?.kind === k ? 'selected' : ''}>${label}</option>`).join('')}</select>
        </div>
        <div class="field"><label>阶段</label>
          <select name="stage">${Object.entries(STAGE).map(([k, [, label]]) => `<option value="${k}" ${client?.stage === k ? 'selected' : ''}>${label}</option>`).join('')}</select>
        </div>
        <div class="field"><label>优先级</label>
          <select name="level">${Object.entries(LEVEL).map(([k, label]) => `<option value="${k}" ${client?.level === k ? 'selected' : ''}>${label}</option>`).join('')}</select>
        </div>
        <div class="field"><label>来源</label>
          <select name="source">${Object.entries(SOURCE).map(([k, label]) => `<option value="${k}" ${client?.source === k ? 'selected' : ''}>${label}</option>`).join('')}</select>
        </div>
      </div>
      <div class="form-grid">
        <div class="field"><label>网站</label><input name="website" value="${esc(client?.website || '')}" placeholder="https://"></div>
        <div class="field"><label>下次跟进日期</label><input type="date" name="next_follow_up" value="${esc(client?.next_follow_up || '')}"></div>
      </div>
      <div class="field"><label>感兴趣的产品 / 需求</label><input name="products_interest" value="${esc(client?.products_interest || '')}" placeholder="例如：竹制厨房用品，MOQ 500"></div>
      <div class="field"><label>确定的事实（客户明确说过的）</label><textarea name="facts" rows="2" placeholder="例：他们在找 FSC 认证供应商；现有供应商交期 60 天。">${esc(client?.facts || '')}</textarea></div>
      <div class="field"><label>我的推测（未证实）</label><textarea name="guesses" rows="2" placeholder="例：可能在做自有品牌；对价格敏感。">${esc(client?.guesses || '')}</textarea></div>
      <div class="field"><label>待确认（下次要问的）</label><textarea name="pending" rows="2" placeholder="例：年采购量？目标价？谁负责验货？">${esc(client?.pending || '')}</textarea></div>
      <div class="field"><label>备注</label><textarea name="notes" rows="2">${esc(client?.notes || '')}</textarea></div>
      <div class="modal-actions"><button class="btn primary" type="submit">保存客户</button></div>
    </form>`,
  });
  modal.querySelector('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    try {
      if (client) await api(`/api/clients/${client.id}`, { method: 'PATCH', body: data });
      else await api('/api/clients', { method: 'POST', body: data });
      closeModal();
      await onSaved?.();
    } catch (err) {
      toast(err.message, 'err');
    }
  });
}