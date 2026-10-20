import { api } from '../api.js';
import { esc, toast, icon, openModal, closeModal, hydrateIcons } from '../dom.js';

const PARAM_FIELDS = {
  dev_letter: [
    ['product', '产品名称', '例如：竹制厨房用品'],
    ['reason', '为什么找这家客户', '他们经营的产品 / 市场 / 渠道'],
    ['value', '你能给的具体价值 1', '例如：FSC 认证 + 15 天交期'],
    ['offer_2', '具体价值 2', 'MOQ / 交期 / 认证 / 定制'],
    ['offer_3', '具体价值 3', ''],
    ['next_step', '你建议的下一步', '例如：发 FOB 报价 + 样品图'],
  ],
  followup: [
    ['subject', '邮件主题（与上次一致）', 'Re: ...'],
    ['last_summary', '上次沟通的事实', '客户问了什么、你答了什么'],
    ['body_note', '这次带来的新信息', '新价格 / 排期 / 样品 / 认证'],
    ['next_action', '希望对方做的下一步', '确认数量 / 视频验厂 / 寄样'],
    ['timeline', '时间点', '例如：本周五前'],
  ],
  quotation: [
    ['product', '产品描述（若不希望用明细行名称）', ''],
    ['packing', '包装说明', '标准出口纸箱 / 托盘'],
    ['shipping', '装运说明', ''],
  ],
  pi: [
    ['shipping', '装运信息', '装运港 / 目的港 / 是否允许分批'],
    ['packing', '包装', ''],
  ],
  contract: [
    ['quality', '质量标准', '参数 / 样品 / 认证'],
    ['packing', '包装与唛头', ''],
    ['inspection', '验货标准', '时间、标准、费用承担'],
    ['signature_name', '你的签字名', ''],
    ['signature_title', '职位', 'Sales Manager'],
  ],
};

export default async function render(root) {
  const params = new URLSearchParams(location.hash.split('?')[1] || '');
  const [tplRes, clientsRes, quotesRes, docsRes] = await Promise.all([
    api('/api/docs/templates'), api('/api/clients'), api('/api/quotes/overview'), api('/api/documents'),
  ]);
  const kinds = tplRes.kinds;
  const clients = clientsRes.items;
  const quotes = quotesRes.items;
  const docs = docsRes.items;

  root.innerHTML = `
    <div class="page-head">
      <div>
        <div class="eyebrow">DOCS · 开发信 · 报价单 · PI · 合同</div>
        <h1>商务文档</h1>
        <p class="sub">这里生成的是草稿：数字来自报价器，事实来自客户档案。带 [[ ]] 的地方必须由你补全，系统不会替你编。</p>
      </div>
      <div class="head-actions">
        <span class="chip line">${docs.length} 份已保存</span>
      </div>
    </div>

    <div class="pill-nav" id="kind-nav" style="margin-bottom:14px">
      ${kinds.map((k) => `<button data-kind="${k.key}" class="${k.key === (params.get('kind') || 'quotation') ? 'on' : ''}">${k.label}</button>`).join('')}
    </div>

    <div class="doc-grid">
      <section class="card">
        <div class="card-head"><h2 id="doc-kind-title">报价单</h2><span class="hint" id="doc-kind-desc"></span></div>
        <div class="card-body">
          <form id="doc-form">
            <div class="form-grid">
              <div class="field"><label>客户</label>
                <select name="client_id" id="doc-client">
                  <option value="">不关联</option>
                  ${clients.map((c) => `<option value="${esc(c.id)}" ${params.get('client') === c.id ? 'selected' : ''}>${esc(c.company)}${c.kind === 'sim' ? ' · 模拟' : ''}</option>`).join('')}
                </select>
              </div>
              <div class="field"><label>报价</label>
                <select name="quote_id" id="doc-quote">
                  <option value="">不关联</option>
                  ${quotes.map((q) => `<option value="${esc(q.id)}" ${params.get('quote') === q.id ? 'selected' : ''}>${esc(q.quote_no || '未编号')} · ${esc(q.company || '无客户')} · ${esc(q.incoterm)}</option>`).join('')}
                </select>
              </div>
            </div>
            <div id="param-fields"></div>
            <div class="modal-actions" style="justify-content:flex-start">
              <button class="btn primary" type="submit">${icon('spark', 14)} 生成草稿</button>
              <button class="btn" type="button" id="copy-doc">${icon('copy', 14)} 复制</button>
              <button class="btn" type="button" id="download-doc">${icon('download', 14)} 下载 .txt</button>
              <button class="btn" type="button" id="save-doc">${icon('file', 14)} 保存到系统</button>
            </div>
          </form>
        </div>
      </section>

      <section class="card">
        <div class="card-head"><h2>预览（可直接编辑）</h2><span class="hint" id="doc-missing"></span></div>
        <div class="card-body">
          <textarea id="doc-body" class="doc-body" rows="26" placeholder="选择客户/报价，点「生成草稿」。"></textarea>
          <p class="small faint" style="margin-top:8px">[[ ]] 内是必须替换的内容。带 [Internal check] 的提醒是给你看的，发给客户前删除。</p>
        </div>
      </section>
    </div>

    <section class="card" style="margin-top:16px">
      <div class="card-head"><h2>已保存文档</h2><a class="hint" href="#/docs">刷新 →</a></div>
      <div class="card-body">
        ${docs.length ? `<div class="list-plain">${docs.map((d) => `
          <div style="display:flex;gap:10px;align-items:center">
            <span class="chip line">${esc(kinds.find((k) => k.key === d.kind)?.label || d.kind)}</span>
            <a href="#/docs?doc=${esc(d.id)}" style="flex:1;font-size:13.4px">${esc(d.title)}</a>
            <span class="small faint">${esc((d.created_at || '').slice(0, 10))}</span>
            <button class="btn sm ghost" data-del-doc="${esc(d.id)}">${icon('trash', 12)}</button>
          </div>`).join('')}</div>` : '<div class="empty">还没有保存的文档。生成后点「保存到系统」，方便以后在客户页回看。</div>'}
      </div>
    </section>
  `;

  let kind = params.get('kind') || 'quotation';
  let lastGenerated = null;
  const form = root.querySelector('#doc-form');
  const bodyEl = root.querySelector('#doc-body');
  const titleEl = root.querySelector('#doc-kind-title');
  const descEl = root.querySelector('#doc-kind-desc');

  function paintKind() {
    const meta = kinds.find((k) => k.key === kind);
    titleEl.textContent = meta.label;
    descEl.textContent = meta.desc;
    root.querySelectorAll('#kind-nav button').forEach((b) => b.classList.toggle('on', b.dataset.kind === kind));
    const fields = PARAM_FIELDS[kind] || [];
    root.querySelector('#param-fields').innerHTML = fields.map(([name, label, ph]) => `
      <div class="field"><label>${esc(label)}</label>
      ${name === 'last_summary' || name === 'reason' ? `<textarea name="p_${name}" rows="2" placeholder="${esc(ph)}"></textarea>` : `<input name="p_${name}" placeholder="${esc(ph)}">`}
      </div>`).join('');
  }

  function currentParams() {
    const data = Object.fromEntries(new FormData(form).entries());
    const out = {};
    for (const [key, value] of Object.entries(data)) {
      if (key.startsWith('p_')) out[key.slice(2)] = value;
    }
    return out;
  }

  root.querySelectorAll('#kind-nav button').forEach((btn) => {
    btn.onclick = () => { kind = btn.dataset.kind; paintKind(); };
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      const res = await api('/api/docs/generate', {
        method: 'POST',
        body: {
          kind,
          client_id: data.client_id || null,
          quote_id: data.quote_id || null,
          contact_id: null,
          params: currentParams(),
        },
      });
      lastGenerated = res;
      bodyEl.value = res.body;
      root.querySelector('#doc-missing').textContent = res.missing?.length ? `缺少：${res.missing.join('、')}` : '数据齐全';
      if (res.missing?.length) toast(`还缺：${res.missing.join('、')}`, 'err');
      else toast('草稿已生成，检查 [[ ]] 后保存');
    } catch (err) { toast(err.message, 'err'); }
  });

  root.querySelector('#copy-doc').onclick = async () => {
    if (!bodyEl.value.trim()) return toast('还没有内容', 'err');
    try {
      await navigator.clipboard.writeText(bodyEl.value);
      toast('已复制');
    } catch { toast('复制失败，请手动选择文本', 'err'); }
  };

  root.querySelector('#download-doc').onclick = () => {
    if (!bodyEl.value.trim()) return toast('还没有内容', 'err');
    const name = (lastGenerated?.title || 'document').replace(/[\\/:*?"<>|]/g, '-');
    const blob = new Blob([bodyEl.value], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${name}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  root.querySelector('#save-doc').onclick = async () => {
    if (!bodyEl.value.trim()) return toast('还没有内容', 'err');
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      await api('/api/documents', {
        method: 'POST',
        body: {
          kind,
          title: lastGenerated?.title || `${kinds.find((k) => k.key === kind)?.label || '文档'} · ${new Date().toISOString().slice(0, 10)}`,
          client_id: data.client_id || null,
          quote_id: data.quote_id || null,
          body: bodyEl.value,
          language: 'en',
          status: 'draft',
        },
      });
      toast('已保存');
      await render(root);
    } catch (err) { toast(err.message, 'err'); }
  };

  root.querySelectorAll('[data-del-doc]').forEach((btn) => {
    btn.onclick = async () => {
      if (!confirm('删除这份文档？')) return;
      try {
        await api(`/api/documents/${btn.dataset.delDoc}`, { method: 'DELETE' });
        await render(root);
      } catch (err) { toast(err.message, 'err'); }
    };
  });

  // client 改变时过滤报价
  root.querySelector('#doc-client').onchange = (e) => {
    const clientId = e.target.value;
    root.querySelectorAll('#doc-quote option').forEach((opt) => {
      if (!opt.value) return;
      const q = quotes.find((x) => x.id === opt.value);
      opt.hidden = Boolean(clientId) && q?.client_id !== clientId;
    });
  };

  // 直接打开已保存文档
  const docId = params.get('doc');
  if (docId) {
    try {
      const res = await api(`/api/documents/${docId}`);
      kind = res.item.kind || kind;
      paintKind();
      root.querySelector('#doc-kind-title').textContent = res.item.title;
      bodyEl.value = res.item.body || '';
      lastGenerated = { title: res.item.title };
    } catch (err) {
      toast(err.message, 'err');
      paintKind();
    }
  } else {
    paintKind();
  }

  hydrateIcons(root);
}