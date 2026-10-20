import { api } from '../api.js';
import { esc, toast, icon, fmtMoney, fmtNumber, hydrateIcons, todayStr } from '../dom.js';

const INCOTERMS = ['EXW', 'FOB', 'CIF', 'DAP', 'DDP'];
const CURRENCIES = ['USD', 'EUR', 'CNY', 'GBP', 'JPY'];
const STAGES = [
  ['fob', 'FOB 装运港前'],
  ['cif', 'CIF 海运/保险'],
  ['dap', 'DAP 目的地送货'],
  ['ddp', 'DDP 目的港/关税'],
];

const DEFAULT_COSTS = [
  { stage: 'fob', category: 'inland', label: '内陆运输到港', amount: 0, note: '工厂 → 装运港' },
  { stage: 'fob', category: 'customs', label: '报关 / 港杂 / 单证', amount: 0, note: '按票计' },
  { stage: 'fob', category: 'bank', label: '银行费用', amount: 0, note: '' },
  { stage: 'cif', category: 'freight', label: '海运费', amount: 0, note: '货代报价有效期？' },
  { stage: 'dap', category: 'delivery', label: '目的地送货费', amount: 0, note: '' },
  { stage: 'ddp', category: 'other', label: '目的港其他费用', amount: 0, note: '清关代理、仓储等' },
];

export default async function render(root, id) {
  const [clientsRes, productsRes] = await Promise.all([api('/api/clients'), api('/api/products')]);
  const clients = clientsRes.items;
  const products = productsRes.items;
  const isNew = !id;
  const bundle = isNew ? null : await api(`/api/quotes/${id}/full`);
  const q = bundle?.quote || {};

  const state = {
    id: isNew ? null : id,
    quote: {
      quote_no: q.quote_no || '',
      client_id: q.client_id || new URLSearchParams(location.hash.split('?')[1] || '').get('client') || '',
      incoterm: q.incoterm || 'FOB',
      incoterm_place: q.incoterm_place || '',
      currency: q.currency || 'USD',
      fx_rate: q.fx_rate ?? 7.1,
      margin_rate: q.margin_rate ?? 15,
      valid_until: q.valid_until || '',
      payment_terms: q.payment_terms || '30% T/T deposit, balance before shipment',
      delivery_time: q.delivery_time || '',
      insurance_rate: q.insurance_rate ?? 0.3,
      duty_rate: q.duty_rate ?? 0,
      vat_rate: q.vat_rate ?? 0,
      status: q.status || 'draft',
      notes: q.notes || '',
      assumptions: q.assumptions || '',
      unconfirmed: q.unconfirmed || '',
    },
    lines: bundle?.lines?.length ? bundle.lines.map((l) => ({ ...l })) : [emptyLine()],
    costs: bundle?.costs?.length ? bundle.costs.map((c) => ({ ...c })) : DEFAULT_COSTS.map((c) => ({ ...c })),
  };

  root.innerHTML = `
    <div class="page-head">
      <div>
        <div class="eyebrow"><a href="#/quotes" style="color:inherit">← 报价管理</a> · ${isNew ? '新建' : esc(state.quote.quote_no || '编辑')}</div>
        <h1>${isNew ? '新建报价' : '编辑报价'}</h1>
        <p class="sub">所有成本按人民币录入；报价币种按汇率换算。带 * 的数字都是需要你核实的假设，不是系统查来的实时数据。</p>
      </div>
      <div class="head-actions">
        <button class="btn" id="save-draft">${icon('check', 14)} 保存报价</button>
        <button class="btn primary" id="save-close">保存并查看</button>
      </div>
    </div>

    <div class="quote-editor">
      <div class="grid" style="gap:16px;min-width:0">
        <section class="card">
          <div class="card-head"><h2>基本信息</h2><span class="hint">术语必须带地点，例如 FOB Shenzhen</span></div>
          <div class="card-body">
            <div class="form-grid">
              <div class="field"><label>客户</label>
                <select data-meta="client_id">
                  <option value="">（暂不关联）</option>
                  ${clients.map((c) => `<option value="${esc(c.id)}" ${state.quote.client_id === c.id ? 'selected' : ''}>${esc(c.company)}${c.kind === 'sim' ? ' · 模拟' : ''}</option>`).join('')}
                </select>
              </div>
              <div class="field"><label>报价编号</label><input value="${esc(state.quote.quote_no || '保存时自动生成')}" disabled></div>
              <div class="field"><label>贸易术语</label>
                <select data-meta="incoterm">${INCOTERMS.map((t) => `<option ${state.quote.incoterm === t ? 'selected' : ''}>${t}</option>`).join('')}</select>
              </div>
              <div class="field"><label>地点 / 港口</label><input data-meta="incoterm_place" value="${esc(state.quote.incoterm_place)}" placeholder="Shenzhen / Hamburg"></div>
              <div class="field"><label>报价币种</label>
                <select data-meta="currency">${CURRENCIES.map((c) => `<option ${state.quote.currency === c ? 'selected' : ''}>${c}</option>`).join('')}</select>
              </div>
              <div class="field"><label>汇率：1 ${esc(state.quote.currency)} = ? CNY *</label>
                <input type="number" step="0.0001" data-meta="fx_rate" value="${state.quote.fx_rate}">
                <span class="hint">每天变，按你实际结汇/银行牌价填，别用固定 7。</span>
              </div>
              <div class="field"><label>默认毛利率（%）*</label><input type="number" step="0.5" data-meta="margin_rate" value="${state.quote.margin_rate}"></div>
              <div class="field"><label>报价有效期</label><input type="date" data-meta="valid_until" value="${esc(state.quote.valid_until || todayStr())}"></div>
              <div class="field"><label>付款方式</label><input data-meta="payment_terms" value="${esc(state.quote.payment_terms)}" placeholder="30% T/T deposit, balance before shipment"></div>
              <div class="field"><label>交货期</label><input data-meta="delivery_time" value="${esc(state.quote.delivery_time)}" placeholder="25-30 days after deposit"></div>
            </div>
          </div>
        </section>

        <section class="card">
          <div class="card-head">
            <h2>产品与成本</h2>
            <div style="display:flex;gap:6px;align-items:center">
              <select id="product-pick" style="max-width:180px"><option value="">从产品库带入…</option>
                ${products.map((p) => `<option value="${esc(p.id)}">${esc(p.name)}${p.sku ? ` (${esc(p.sku)})` : ''}</option>`).join('')}
              </select>
              <button class="btn sm" id="add-line">${icon('plus', 12)} 加一行</button>
            </div>
          </div>
          <div class="card-body" style="overflow-x:auto">
            <table class="data-table" id="line-table">
              <thead><tr><th style="min-width:180px">产品 / 规格</th><th>数量</th><th>单位</th><th>产品成本</th><th>包装</th><th>其他</th><th>毛利率%</th><th>小计(CNY)</th><th></th></tr></thead>
              <tbody id="line-body"></tbody>
            </table>
            <p class="small faint" style="margin-top:8px">成本为人民币/件。毛利率留空则用默认毛利率。小计 = 数量 ×（成本+包装+其他）×（1+毛利率）。</p>
          </div>
        </section>

        <section class="card">
          <div class="card-head">
            <h2>费用与税率</h2>
            <button class="btn sm" id="add-cost">${icon('plus', 12)} 加费用</button>
          </div>
          <div class="card-body" id="cost-body"></div>
        </section>

        <section class="card">
          <div class="card-head"><h2>报价假设（会显示在报价单里）</h2></div>
          <div class="card-body">
            <div class="field"><label>已确认的假设 / 条件</label><textarea data-meta="assumptions" rows="2" placeholder="例：含标准出口包装；不含目的港滞箱费；汇率按 7.10 计算。">${esc(state.quote.assumptions)}</textarea></div>
            <div class="field"><label>未确认 / 需客户确认</label><textarea data-meta="unconfirmed" rows="2" placeholder="例：关税税率待查；是否需要 CE 认证；订单量低于 500 时价格另议。">${esc(state.quote.unconfirmed)}</textarea></div>
            <div class="field"><label>内部备注（不会发给客户）</label><textarea data-meta="notes" rows="2">${esc(state.quote.notes)}</textarea></div>
          </div>
        </section>
      </div>

      <aside class="quote-preview">
        <div class="preview-card">
          <div class="small faint">按当前输入实时试算</div>
          <div class="preview-price" id="pv-unit">—</div>
          <div class="small muted" id="pv-sub">—</div>
          <div class="sep"></div>
          <div class="preview-total">
            <div><span class="small faint">总金额</span><strong id="pv-total">—</strong></div>
            <div><span class="small faint">毛利率（占售价）</span><strong id="pv-margin">—</strong></div>
          </div>
          <div class="sep"></div>
          <div class="small muted" style="margin-bottom:6px">各术语单价（CNY）</div>
          <div class="term-compare" id="pv-terms"></div>
          <div class="sep"></div>
          <div id="pv-warnings"></div>
          <details style="margin-top:10px">
            <summary>公式与步骤</summary>
            <div id="pv-steps" class="formula-list"></div>
          </details>
        </div>
      </aside>
    </div>
  `;

  /* ---------------- 产品行 ---------------- */
  const lineBody = root.querySelector('#line-body');
  function paintLines() {
    lineBody.innerHTML = state.lines.map((line, i) => `
      <tr>
        <td>
          <input data-line="${i}" data-field="name" value="${esc(line.name || '')}" placeholder="产品名">
          <input data-line="${i}" data-field="spec" value="${esc(line.spec || '')}" placeholder="规格 / 型号" style="margin-top:4px;font-size:12px">
        </td>
        <td><input type="number" min="0" step="1" data-line="${i}" data-field="qty" value="${line.qty ?? 1}"></td>
        <td><input data-line="${i}" data-field="unit" value="${esc(line.unit || 'pc')}" style="width:56px"></td>
        <td><input type="number" min="0" step="0.01" data-line="${i}" data-field="unit_cost" value="${line.unit_cost ?? 0}"></td>
        <td><input type="number" min="0" step="0.01" data-line="${i}" data-field="packaging_cost" value="${line.packaging_cost ?? 0}"></td>
        <td><input type="number" min="0" step="0.01" data-line="${i}" data-field="other_cost" value="${line.other_cost ?? 0}"></td>
        <td><input type="number" step="1" data-line="${i}" data-field="margin_rate" value="${line.margin_rate ?? ''}" placeholder="${state.quote.margin_rate}"></td>
        <td class="mono" id="line-total-${i}">—</td>
        <td><button class="btn sm ghost" data-del-line="${i}" title="删除">${icon('trash', 12)}</button></td>
      </tr>`).join('');
    lineBody.querySelectorAll('[data-del-line]').forEach((btn) => {
      btn.onclick = () => {
        state.lines.splice(Number(btn.dataset.delLine), 1);
        if (!state.lines.length) state.lines.push(emptyLine());
        paintLines();
        recalc();
      };
    });
    lineBody.querySelectorAll('input').forEach((input) => {
      input.oninput = () => {
        const i = Number(input.dataset.line);
        const field = input.dataset.field;
        state.lines[i][field] = input.type === 'number' ? input.value : input.value;
        schedule();
      };
    });
  }

  root.querySelector('#add-line').onclick = () => {
    state.lines.push(emptyLine());
    paintLines();
    recalc();
  };
  root.querySelector('#product-pick').onchange = (e) => {
    const product = products.find((p) => p.id === e.target.value);
    if (!product) return;
    const line = state.lines[state.lines.length - 1];
    if (line.name || line.unit_cost) state.lines.push(emptyLine());
    const target = state.lines[state.lines.length - 1];
    target.product_id = product.id;
    target.name = product.name;
    target.spec = product.name_en || '';
    target.unit = product.unit || 'pc';
    target.unit_cost = product.unit_cost || 0;
    target.packaging_cost = product.packaging_cost || 0;
    paintLines();
    recalc();
    e.target.value = '';
  };

  /* ---------------- 费用 ---------------- */
  const costBody = root.querySelector('#cost-body');
  function paintCosts() {
    const groups = STAGES.map(([stage, label]) => {
      const rows = state.costs.map((c, i) => ({ ...c, i })).filter((c) => c.stage === stage);
      return `<div class="cost-group">
        <div class="cost-group-head">${label}<span class="faint small">按整票金额（CNY）</span></div>
        ${rows.length ? rows.map((c) => `
          <div class="cost-row">
            <input data-cost="${c.i}" data-field="label" value="${esc(c.label)}" placeholder="费用名称">
            <select data-cost="${c.i}" data-field="stage" style="max-width:110px">
              ${STAGES.map(([stage, name]) => `<option value="${stage}" ${c.stage === stage ? 'selected' : ''}>${name.split(' ')[0]}</option>`).join('')}
            </select>
            <select data-cost="${c.i}" data-field="category" style="max-width:92px">
              ${['freight', 'delivery', 'customs', 'inland', 'bank', 'duty', 'other'].map((cat) => `<option value="${cat}" ${c.category === cat ? 'selected' : ''}>${({ freight: '海运费', delivery: '送货', customs: '报关', inland: '内陆', bank: '银行', duty: '关税', other: '其他' })[cat]}</option>`).join('')}
            </select>
            <input type="number" step="0.01" min="0" data-cost="${c.i}" data-field="amount" value="${c.amount ?? 0}" style="max-width:110px">
            <button class="btn sm ghost" data-del-cost="${c.i}">${icon('trash', 11)}</button>
          </div>`).join('') : '<div class="small faint" style="padding:4px 0">暂无</div>'}
      </div>`;
    }).join('');

    costBody.innerHTML = `${groups}
      <div class="form-grid" style="margin-top:14px;padding-top:12px;border-top:1px solid var(--line-2)">
        <div class="field"><label>保险费率（% of CIF×110%）</label><input type="number" step="0.01" data-meta="insurance_rate" value="${state.quote.insurance_rate}"></div>
        <div class="field"><label>DDP 关税率（%）</label><input type="number" step="0.01" data-meta="duty_rate" value="${state.quote.duty_rate}"></div>
        <div class="field"><label>DDP 增值税率（%）</label><input type="number" step="0.01" data-meta="vat_rate" value="${state.quote.vat_rate}"></div>
      </div>`;

    costBody.querySelectorAll('[data-del-cost]').forEach((btn) => {
      btn.onclick = () => {
        state.costs.splice(Number(btn.dataset.delCost), 1);
        paintCosts();
        recalc();
      };
    });
    costBody.querySelectorAll('input, select').forEach((input) => {
      input.oninput = input.onchange = () => {
        const i = Number(input.dataset.cost);
        if (input.dataset.cost !== undefined) {
          state.costs[i][input.dataset.field] = input.type === 'number' ? input.value : input.value;
          if (input.dataset.field === 'stage') {
            paintCosts();
            recalc();
            return;
          }
        } else if (input.dataset.meta) {
          state.quote[input.dataset.meta] = input.value;
        }
        schedule();
      };
    });
  }
  root.querySelector('#add-cost').onclick = () => {
    state.costs.push({ stage: 'fob', category: 'other', label: '', amount: 0, note: '' });
    paintCosts();
    recalc();
  };

  /* ---------------- 元数据输入 ---------------- */
  root.querySelectorAll('[data-meta]').forEach((input) => {
    input.oninput = input.onchange = () => {
      state.quote[input.dataset.meta] = input.value;
      if (input.dataset.meta === 'currency') {
        const currencyLabel = root.querySelector('[data-meta="fx_rate"]')?.closest('.field')?.querySelector('label');
        if (currencyLabel) currencyLabel.textContent = `汇率：1 ${state.quote.currency} = ? CNY *`;
      }
      schedule();
    };
  });

  /* ---------------- 试算 ---------------- */
  let timer = null;
  let lastCalc = null;
  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(recalc, 260);
  }
  async function recalc() {
    try {
      const data = await api('/api/quotes/calc', {
        method: 'POST',
        body: { quote: state.quote, lines: state.lines, costs: state.costs },
      });
      lastCalc = data.calc;
      paintPreview(lastCalc);
    } catch (err) {
      console.error(err);
    }
  }

  function paintPreview(calc) {
    const cur = state.quote.currency;
    root.querySelector('#pv-unit').textContent = calc.totalQty ? fmtMoney(cur, calc.price.unit) : '—';
    root.querySelector('#pv-sub').textContent = `${calc.incoterm} · 每 ${state.lines[0]?.unit || '单位'} · 汇率 ${calc.fxRate || '未填'} · 共 ${fmtNumber(calc.totalQty, 0)} 件`;
    root.querySelector('#pv-total').textContent = fmtMoney(cur, calc.price.total);
    root.querySelector('#pv-margin').textContent = `${fmtNumber(calc.marginOnPrice, 1)}%`;
    root.querySelector('#pv-terms').innerHTML = Object.entries({
      EXW: calc.cny.exwUnit, FOB: calc.cny.fobUnit, CIF: calc.cny.cifUnit,
      DAP: calc.cny.dapUnit, DDP: calc.cny.ddpUnit,
    }).map(([term, value]) => `<div class="${term === calc.incoterm ? 'on' : ''}"><span>${term}</span><strong>¥${fmtNumber(value, 2)}</strong></div>`).join('');
    root.querySelector('#pv-warnings').innerHTML = calc.warnings.length
      ? calc.warnings.map((w) => `<div class="mini-warn">${esc(w)}</div>`).join('')
      : '<div class="mini-ok">没有发现明显缺项。发出前仍要人工核对。</div>';
    root.querySelector('#pv-steps').innerHTML = calc.steps.map((s) => `
      <div class="formula-row">
        <div class="formula-label">${esc(s.label)}</div>
        <div class="formula-text">${esc(s.formula)}</div>
        <div class="formula-value">¥${fmtNumber(s.unitCny, 2)} / 件<br><span class="faint">${fmtMoney(cur, s.unit)}</span></div>
      </div>`).join('');
    state.lines.forEach((line, i) => {
      const result = calc.lines[i];
      const cell = root.querySelector(`#line-total-${i}`);
      if (cell) cell.textContent = result ? `¥${fmtNumber(result.lineTotalCny, 2)}` : '—';
    });
  }

  function collect() {
    return {
      id: state.id,
      quote: { ...state.quote },
      lines: state.lines.map((l, i) => ({ ...l, sort: i })),
      costs: state.costs.map((c, i) => ({ ...c, sort: i })),
    };
  }

  async function save(goDetail) {
    const buttons = [root.querySelector('#save-draft'), root.querySelector('#save-close')];
    buttons.forEach((b) => { b.disabled = true; });
    try {
      const res = await api('/api/quotes/save', { method: 'POST', body: collect() });
      toast('报价已保存');
      if (goDetail && res.quote?.id) location.hash = `#/quotes/${res.quote.id}`;
      else {
        state.id = res.quote.id;
        state.quote.quote_no = res.quote.quote_no;
        buttons.forEach((b) => { b.disabled = false; });
      }
    } catch (err) {
      toast(err.message, 'err');
      buttons.forEach((b) => { b.disabled = false; });
    }
  }
  root.querySelector('#save-draft').onclick = () => save(false);
  root.querySelector('#save-close').onclick = () => save(true);

  paintLines();
  paintCosts();
  hydrateIcons(root);
  await recalc();
}

function emptyLine() {
  return { name: '', spec: '', qty: 1, unit: 'pc', unit_cost: 0, packaging_cost: 0, other_cost: 0, margin_rate: null };
}