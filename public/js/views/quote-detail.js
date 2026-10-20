import { api } from '../api.js';
import { esc, toast, icon, fmtMoney, fmtNumber, hydrateIcons } from '../dom.js';

const STATUS = { draft: '草稿', sent: '已发出', negotiating: '议价中', won: '已成交', lost: '已丢单', expired: '已过期' };
const COST_LABEL = { freight: '海运费', delivery: '送货', customs: '报关', inland: '内陆', bank: '银行', duty: '关税', other: '其他' };

export default async function render(root, id) {
  const data = await api(`/api/quotes/${id}/full`);
  const { quote, lines, costs, client, calc } = data;
  const currency = quote.currency || 'USD';

  root.innerHTML = `
    <div class="page-head">
      <div>
        <div class="eyebrow"><a href="#/quotes" style="color:inherit">← 报价管理</a> · ${esc(quote.incoterm)}${quote.incoterm_place ? ` ${esc(quote.incoterm_place)}` : ''}</div>
        <h1>${esc(quote.quote_no || '未编号报价')}</h1>
        <p class="sub">
          ${client ? `<a href="#/crm/${esc(client.id)}" style="color:var(--accent-ink)">${esc(client.company)}</a>` : '未关联客户'}
          · 有效期 ${esc(quote.valid_until || '未填')}
          · 更新于 ${esc((quote.updated_at || '').slice(0, 10))}
        </p>
      </div>
      <div class="head-actions">
        <select id="status" style="max-width:130px">
          ${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${quote.status === k ? 'selected' : ''}>${v}</option>`).join('')}
        </select>
        <a class="btn" href="#/docs?quote=${esc(quote.id)}">${icon('file', 14)} 生成文档</a>
        <button class="btn" id="duplicate">${icon('copy', 14)} 复制</button>
        <button class="btn" id="edit">${icon('edit', 14)} 编辑</button>
        <button class="btn danger" id="delete">${icon('trash', 14)}</button>
      </div>
    </div>

    <div class="quote-detail-grid">
      <div class="grid" style="gap:16px;min-width:0">
        <section class="card">
          <div class="card-body">
            <div class="quote-hero">
              <div>
                <div class="small faint">单价（${esc(currency)}）</div>
                <div class="quote-hero-price">${fmtMoney(currency, calc.price.unit)}</div>
                <div class="small muted">≈ ¥${fmtNumber(calc.price.unitCny, 2)} / 件 · ${calc.totalQty} 件</div>
              </div>
              <div style="text-align:right">
                <div class="small faint">总金额</div>
                <div style="font-size:22px;font-weight:680">${fmtMoney(currency, calc.price.total)}</div>
                <div class="small muted">毛利率（占售价）${fmtNumber(calc.marginOnPrice, 1)}%</div>
              </div>
            </div>
            <div class="sep"></div>
            <div class="term-compare">
              ${Object.entries({ EXW: calc.cny.exwUnit, FOB: calc.cny.fobUnit, CIF: calc.cny.cifUnit, DAP: calc.cny.dapUnit, DDP: calc.cny.ddpUnit })
                .map(([term, value]) => `<div class="${term === quote.incoterm ? 'on' : ''}"><span>${term}</span><strong>¥${fmtNumber(value, 2)}</strong></div>`).join('')}
            </div>
          </div>
        </section>

        <section class="card">
          <div class="card-head"><h2>产品明细</h2><span class="hint">${lines.length} 行</span></div>
          <div class="card-body" style="overflow-x:auto">
            <table class="data-table">
              <thead><tr><th>产品 / 规格</th><th>数量</th><th>单位</th><th>成本</th><th>包装</th><th>其他</th><th>毛利率</th><th>EXW 小计</th></tr></thead>
              <tbody>
                ${lines.map((line, i) => {
                  const row = calc.lines[i];
                  return `<tr>
                    <td><strong>${esc(line.name)}</strong>${line.spec ? `<div class="small faint">${esc(line.spec)}</div>` : ''}</td>
                    <td>${fmtNumber(line.qty, 0)}</td>
                    <td>${esc(line.unit)}</td>
                    <td>¥${fmtNumber(line.unit_cost, 2)}</td>
                    <td>¥${fmtNumber(line.packaging_cost, 2)}</td>
                    <td>¥${fmtNumber(line.other_cost, 2)}</td>
                    <td>${fmtNumber(line.margin_rate ?? quote.margin_rate, 1)}%</td>
                    <td class="mono">¥${fmtNumber(row?.lineTotalCny || 0, 2)}</td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
        </section>

        <section class="card">
          <div class="card-head"><h2>价格是怎么算出来的</h2></div>
          <div class="card-body">
            <div class="formula-list">
              ${calc.steps.map((s) => `
                <div class="formula-row">
                  <div class="formula-label">${esc(s.label)}</div>
                  <div class="formula-text">${esc(s.formula)}</div>
                  <div class="formula-value">¥${fmtNumber(s.unitCny, 2)} / 件<br><span class="faint">${fmtMoney(currency, s.unit)}</span></div>
                </div>`).join('')}
            </div>
            <div class="sep"></div>
            <div class="small muted" style="white-space:pre-wrap">${esc(quote.assumptions || '没有填写报价假设。')}</div>
          </div>
        </section>

        <section class="card">
          <div class="card-head"><h2>费用明细</h2><span class="hint">人民币 / 整票</span></div>
          <div class="card-body">
            ${costs.length ? `<table class="data-table">
              <thead><tr><th>阶段</th><th>类别</th><th>费用</th><th>金额</th><th>备注</th></tr></thead>
              <tbody>${costs.map((c) => `<tr>
                <td>${esc(String(c.stage).toUpperCase())}</td>
                <td>${esc(COST_LABEL[c.category] || c.category)}</td>
                <td>${esc(c.label)}</td>
                <td>¥${fmtNumber(c.amount, 2)}</td>
                <td class="small faint">${esc(c.note || '')}</td>
              </tr>`).join('')}</tbody>
            </table>` : '<div class="empty">没有登记固定费用。FOB/CIF/DAP/DDP 报价不应只有产品成本。</div>'}
            <div class="sep"></div>
            <div class="kv">
              <dt>保险费率</dt><dd>${fmtNumber(quote.insurance_rate, 2)}%</dd>
              <dt>DDP 关税率</dt><dd>${fmtNumber(quote.duty_rate, 2)}%</dd>
              <dt>DDP 增值税率</dt><dd>${fmtNumber(quote.vat_rate, 2)}%</dd>
              <dt>汇率</dt><dd>1 ${esc(currency)} = ${fmtNumber(quote.fx_rate, 4)} CNY</dd>
            </div>
          </div>
        </section>
      </div>

      <aside class="grid" style="gap:16px">
        <section class="card">
          <div class="card-head"><h2>风险与待确认</h2></div>
          <div class="card-body">
            ${calc.warnings.length ? calc.warnings.map((w) => `<div class="mini-warn">${esc(w)}</div>`).join('') : '<div class="mini-ok">计算层面没有明显缺项。发出前仍需核对客户、条款与单证。</div>'}
            ${quote.unconfirmed ? `<div class="sep"></div><div class="small muted">待客户确认：</div><p class="small" style="white-space:pre-wrap">${esc(quote.unconfirmed)}</p>` : ''}
          </div>
        </section>

        <section class="card">
          <div class="card-head"><h2>条款</h2></div>
          <div class="card-body">
            <dl class="kv">
              <dt>贸易术语</dt><dd>${esc(quote.incoterm)}${quote.incoterm_place ? ` ${esc(quote.incoterm_place)}` : ''}</dd>
              <dt>付款方式</dt><dd>${esc(quote.payment_terms || '未填')}</dd>
              <dt>交货期</dt><dd>${esc(quote.delivery_time || '未填')}</dd>
              <dt>币种</dt><dd>${esc(currency)}</dd>
              <dt>有效期</dt><dd>${esc(quote.valid_until || '未填')}</dd>
            </dl>
            <div class="sep"></div>
            <div class="small faint">内部备注</div>
            <p class="small muted" style="white-space:pre-wrap">${esc(quote.notes || '—')}</p>
          </div>
        </section>
      </aside>
    </div>
  `;

  root.querySelector('#status').onchange = async (e) => {
    try {
      await api(`/api/quotes/${id}`, { method: 'PATCH', body: { status: e.target.value } });
      toast(`状态已改为「${STATUS[e.target.value]}」`);
    } catch (err) { toast(err.message, 'err'); }
  };

  root.querySelector('#edit').onclick = () => { location.hash = `#/quotes/${id}/edit`; };
  root.querySelector('#duplicate').onclick = async (e) => {
    e.currentTarget.disabled = true;
    try {
      const res = await api(`/api/quotes/${id}/duplicate`, { method: 'POST', body: {} });
      toast('已复制为新草稿');
      location.hash = `#/quotes/${res.quote.id}/edit`;
    } catch (err) { toast(err.message, 'err'); e.currentTarget.disabled = false; }
  };
  root.querySelector('#delete').onclick = async () => {
    if (!confirm('删除这份报价？产品行和费用会一起删除，无法恢复。')) return;
    try {
      await api(`/api/quotes/${id}`, { method: 'DELETE' });
      toast('报价已删除');
      location.hash = '#/quotes';
    } catch (err) { toast(err.message, 'err'); }
  };

  hydrateIcons(root);
}