import { api } from '../api.js';
import { esc, toast, icon, fmtMoney, fmtNumber, todayStr, hydrateIcons } from '../dom.js';

const STATUS = { draft: ['line', '草稿'], sent: ['blue', '已发出'], negotiating: ['amber', '议价中'], won: ['green', '已成交'], lost: ['red', '已丢单'], expired: ['red', '已过期'] };

export default async function render(root) {
  const [data, clientsRes] = await Promise.all([api('/api/quotes/overview'), api('/api/clients')]);
  const items = data.items;
  const clients = clientsRes.items;
  const stats = data.stats;
  const totalOpen = items.filter((q) => ['draft', 'sent', 'negotiating'].includes(q.status))
    .reduce((sum, q) => sum + (Number(q.total_amount) || 0), 0);

  root.innerHTML = `
    <div class="page-head">
      <div>
        <div class="eyebrow">QUOTE · EXW / FOB / CIF / DAP / DDP</div>
        <h1>报价与利润</h1>
        <p class="sub">每个价格都要能拆回成本与假设。运费、汇率、关税不是"大概"，是你必须核实的数字。</p>
      </div>
      <div class="head-actions">
        <a class="btn" href="#/docs">${icon('file', 14)} 报价单模板</a>
        <a class="btn primary" href="#/quotes/new">${icon('plus', 14)} 新建报价</a>
      </div>
    </div>

    <div class="grid c4" style="margin-bottom:16px">
      ${stat('报价总数', items.length, `${stats.draft?.n || 0} 个草稿`)}
      ${stat('进行中金额', fmtMoney('USD', totalOpen), '草稿/已发出/议价中，币种未统一时仅供概览')}
      ${stat('已成交', stats.won?.n || 0, fmtMoney('USD', stats.won?.amount || 0))}
      ${stat('平均毛利', avgMargin(items), '按报价行加权前毛利率的简单平均')}
    </div>

    ${items.length ? `<div class="quote-list">
      ${items.map((q) => {
        const [cls, label] = STATUS[q.status] || STATUS.draft;
        const expired = q.valid_until && q.valid_until < todayStr() && !['won', 'lost'].includes(q.status);
        return `<a class="quote-row" href="#/quotes/${esc(q.id)}">
          <div class="quote-main">
            <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
              <span class="mono" style="font-size:13px">${esc(q.quote_no || '未编号')}</span>
              <span class="chip ${cls}">${label}</span>
              ${expired ? '<span class="chip red">已过有效期</span>' : ''}
            </div>
            <div class="quote-client">${esc(q.company || '未关联客户')}${q.country ? ` · ${esc(q.country)}` : ''}</div>
          </div>
          <div class="quote-cell"><span class="faint small">术语</span><strong>${esc(q.incoterm)}</strong></div>
          <div class="quote-cell"><span class="faint small">金额</span><strong>${fmtMoney(q.currency, q.total_amount)}</strong></div>
          <div class="quote-cell"><span class="faint small">数量</span><strong>${fmtNumber(q.total_qty, 0)}</strong></div>
          <div class="quote-cell"><span class="faint small">毛利率</span><strong>${fmtNumber(q.margin_rate, 1)}%</strong></div>
          <div class="quote-cell"><span class="faint small">有效期</span><strong class="${expired ? 'text-danger' : ''}">${esc(q.valid_until || '未填')}</strong></div>
        </a>`;
      }).join('')}
    </div>` : `<div class="empty">
      <p style="margin-bottom:10px">还没有报价。第一份报价建议用「模拟客户 + 模拟产品」走完整流程，练习成本拆解。</p>
      <a class="btn primary" href="#/quotes/new">${icon('plus', 14)} 建第一份报价</a>
    </div>`}

    <section class="card" style="margin-top:16px">
      <div class="card-head"><h2>报价纪律（每次发出去前自检）</h2></div>
      <div class="card-body grid c2">
        <div class="list-plain">
          <div><strong style="font-size:13.4px">1. 成本有没有漏项</strong><p class="small muted">包装、内陆运费、报关、港杂、单证、银行费、保险、目的港费用。</p></div>
          <div><strong style="font-size:13.4px">2. 汇率写的是哪一天</strong><p class="small muted">报价有效期内的汇率波动谁承担？超过 3% 要不要重谈？</p></div>
          <div><strong style="font-size:13.4px">3. 运费有效期</strong><p class="small muted">货代报价通常 7–30 天有效；报价单有效期不能长过运费有效期。</p></div>
        </div>
        <div class="list-plain">
          <div><strong style="font-size:13.4px">4. 术语与地点写全</strong><p class="small muted">"FOB" 不完整，必须写 "FOB Shenzhen"；CIF 要写目的港。</p></div>
          <div><strong style="font-size:13.4px">5. 未确认项显式标出</strong><p class="small muted">关税、认证、包装、验货标准没确认，就写进「报价假设」。</p></div>
          <div><strong style="font-size:13.4px">6. 毛利不是净利</strong><p class="small muted">退税、佣金、坏账、售后、资金占用都要从毛利里再扣。</p></div>
        </div>
      </div>
    </section>
  `;

  hydrateIcons(root);
}

function stat(label, value, foot) {
  return `<div class="stat"><span class="label">${esc(label)}</span><span class="value" style="font-size:22px">${value}</span><span class="foot">${esc(foot)}</span></div>`;
}

function avgMargin(items) {
  const list = items.map((q) => Number(q.margin_rate)).filter((n) => Number.isFinite(n));
  if (!list.length) return '—';
  return `${fmtNumber(list.reduce((a, b) => a + b, 0) / list.length, 1)}%`;
}