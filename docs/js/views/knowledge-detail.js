import { api } from '../api.js';
import { esc, toast, icon, openModal, closeModal, masteryDots, todayStr, hydrateIcons } from '../dom.js';

const TRUST = {
  verified: ['green', '已核实'],
  principle: ['blue', '原则型（长期稳定）'],
  dynamic: ['amber', '动态信息 · 必须核实'],
  unverified: ['line', '待核实'],
};

const MASTERY = ['未学', '知道', '能解释', '能应用', '能教人'];

export default async function render(root, id) {
  if (!id || id === 'new') return renderForm(root, null);

  const data = await api(`/api/knowledge/${id}`);
  const { item, links } = data;
  const [tCls, tLabel] = TRUST[item.trust] || TRUST.unverified;

  root.innerHTML = `
    <div class="page-head">
      <div style="max-width:75ch">
        <a class="small muted" href="#/knowledge" style="display:inline-flex;align-items:center;gap:5px;margin-bottom:8px">
          ${icon('arrowLeft', 13)} 知识库
        </a>
        <h1>${esc(item.title)}</h1>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:9px;align-items:center">
          <span class="chip line">${esc(item.category)}</span>
          ${item.stage ? `<span class="chip line">${esc(item.stage)}</span>` : ''}
          <span class="chip ${tCls}">${tLabel}</span>
          ${item.verified_on ? `<span class="small faint">核实日期 ${esc(item.verified_on)}</span>` : ''}
          ${masteryDots(item.mastery)}
        </div>
      </div>
      <div class="head-actions">
        <button class="btn" id="kb-edit">${icon('edit', 14)} 编辑</button>
        <button class="btn" id="kb-verify">标记已核实</button>
        <button class="btn danger" id="kb-del">${icon('trash', 14)}</button>
      </div>
    </div>

    <div class="split">
      <div class="main-col grid" style="gap:16px">
        ${section('通俗解释', item.plain, 'plain')}
        ${section('专业解释', item.pro)}
        ${section('在真实业务里怎么用', item.scenario)}
        ${section('示例', item.example)}
        ${item.pitfalls ? `<div class="callout warn"><strong style="display:block;margin-bottom:4px">常见错误</strong>${esc(item.pitfalls)}</div>` : ''}
        ${item.checklist ? `<div class="callout good"><strong style="display:block;margin-bottom:4px">操作检查清单</strong>${esc(item.checklist)}</div>` : ''}
        <section class="card">
          <div class="card-head"><h2>我的笔记</h2><span class="hint">只有你自己看</span></div>
          <div class="card-body">
            <textarea id="kb-notes" rows="5" placeholder="用自己的话复述一遍；写下一个还不确定的点；记下和哪个订单/项目有关">${esc(item.my_notes || '')}</textarea>
            <div style="display:flex;justify-content:flex-end;margin-top:8px">
              <button class="btn sm primary" id="kb-notes-save">保存笔记</button>
            </div>
          </div>
        </section>
      </div>

      <div class="side-col grid" style="gap:16px">
        <section class="card">
          <div class="card-head"><h2>掌握程度</h2></div>
          <div class="card-body">
            <div id="kb-mastery" style="display:flex;flex-wrap:wrap;gap:5px">
              ${MASTERY.map((m, i) => `<button class="chip ${item.mastery === i ? 'green' : 'line'}" data-m="${i}" style="cursor:pointer">${m}</button>`).join('')}
            </div>
            <p class="small faint" style="margin-top:8px">3 = 能用在真实订单里；4 = 能讲给别人听。别急着点 4。</p>
          </div>
        </section>

        <section class="card">
          <div class="card-head"><h2>来源与有效期</h2></div>
          <div class="card-body">
            <dl class="kv">
              <dt>来源</dt><dd>${esc(item.source_name || '—')}</dd>
              <dt>链接</dt><dd>${item.source_url ? `<a href="${esc(item.source_url)}" target="_blank" rel="noopener" style="color:#0a5c43;word-break:break-all">${esc(item.source_url)}</a>` : '—'}</dd>
              <dt>核实日期</dt><dd>${esc(item.verified_on || '—')}</dd>
              <dt>信息类型</dt><dd>${tLabel}</dd>
            </dl>
            ${item.trust === 'dynamic' ? `<p class="small" style="color:#b45309;margin-top:10px">这条涉及会变的信息。用之前重新查一次官方来源，并更新核实日期。</p>` : ''}
          </div>
        </section>

        <section class="card">
          <div class="card-head"><h2>关联条目</h2></div>
          <div class="card-body">
            <div class="link-list" id="kb-links">
              ${links.length ? links.map((l) => `
                <div style="display:flex;gap:6px;align-items:center">
                  <a href="#/knowledge/${esc(l.id)}" style="flex:1">↳ ${esc(l.title)}</a>
                  <button class="btn sm ghost" data-unlink="${esc(l.link_id)}" title="取消关联">${icon('x', 12)}</button>
                </div>`).join('') : '<span class="small faint">还没有关联。把相关概念连起来，复习时能顺着链条想起来。</span>'}
            </div>
            <div class="sep"></div>
            <div class="field" style="margin:0">
              <select id="kb-link-select"><option value="">选择要关联的条目…</option></select>
            </div>
            <button class="btn sm" id="kb-link-add" style="margin-top:6px">${icon('plus', 13)} 添加关联</button>
          </div>
        </section>

        ${item.tags ? `<section class="card"><div class="card-body"><div class="row" style="gap:5px">${String(item.tags).split(/[,，]/).filter(Boolean).map((t) => `<span class="tag">${esc(t.trim())}</span>`).join('')}</div></div></section>` : ''}
      </div>
    </div>
  `;

  root.querySelector('#kb-edit').onclick = () => openEditor(item, () => render(root, item.id));
  root.querySelector('#kb-del').onclick = async () => {
    if (!confirm(`删除「${item.title}」？该操作不可撤销。`)) return;
    await api(`/api/knowledge/${item.id}`, { method: 'DELETE' });
    toast('已删除');
    location.hash = '#/knowledge';
  };

  root.querySelector('#kb-verify').onclick = async () => {
    await api(`/api/knowledge/${item.id}`, {
      method: 'PATCH',
      body: { verified_on: todayStr(), trust: item.trust === 'unverified' ? 'verified' : item.trust },
    });
    toast('已记录核实日期');
    await render(root, item.id);
  };

  root.querySelectorAll('[data-m]').forEach((b) => {
    b.onclick = async () => {
      await api(`/api/knowledge/${item.id}`, { method: 'PATCH', body: { mastery: Number(b.dataset.m) } });
      await render(root, item.id);
    };
  });

  root.querySelector('#kb-notes-save').onclick = async () => {
    const notes = root.querySelector('#kb-notes').value;
    await api(`/api/knowledge/${item.id}`, { method: 'PATCH', body: { my_notes: notes } });
    toast('笔记已保存');
  };

  const select = root.querySelector('#kb-link-select');
  const all = await api('/api/knowledge?');
  all.items.filter((k) => k.id !== item.id && !links.some((l) => l.id === k.id)).forEach((k) => {
    const opt = document.createElement('option');
    opt.value = k.id;
    opt.textContent = k.title;
    select.appendChild(opt);
  });
  root.querySelector('#kb-link-add').onclick = async () => {
    if (!select.value) return;
    await api(`/api/knowledge/${item.id}/link`, { method: 'POST', body: { to_id: select.value } });
    await render(root, item.id);
  };
  root.querySelectorAll('[data-unlink]').forEach((b) => {
    b.onclick = async () => {
      await api(`/api/knowledge/${item.id}/link/${b.dataset.unlink}`, { method: 'DELETE' });
      await render(root, item.id);
    };
  });
  hydrateIcons(root);
}

function section(title, text, cls = '') {
  if (!text) return '';
  return `<section class="card">
    <div class="card-body">
      <h3 style="font-size:12.5px;letter-spacing:.09em;text-transform:uppercase;color:#0e7c5a;margin-bottom:7px">${esc(title)}</h3>
      <div class="body ${cls}" style="white-space:pre-wrap;font-size:14px;color:${cls === 'plain' ? '#14211c' : '#33463d'};line-height:1.72">${esc(text)}</div>
    </div>
  </section>`;
}

const FIELDS = [
  ['title', '标题', 'input'],
  ['category', '分类', 'input'],
  ['stage', '适用业务阶段', 'input'],
  ['tags', '标签（逗号分隔）', 'input'],
  ['plain', '通俗解释', 'textarea'],
  ['pro', '专业解释', 'textarea'],
  ['scenario', '实际应用场景', 'textarea'],
  ['example', '示例', 'textarea'],
  ['pitfalls', '常见错误', 'textarea'],
  ['checklist', '操作检查清单', 'textarea'],
  ['source_name', '信息来源', 'input'],
  ['source_url', '来源链接', 'input'],
  ['verified_on', '最后核实日期', 'date'],
];

function formHtml(item) {
  return `<form>
    ${FIELDS.map(([name, label, type]) => {
      const val = item?.[name] ?? (name === 'verified_on' ? todayStr() : '');
      if (type === 'textarea') {
        return `<div class="field"><label>${label}</label>
          <textarea name="${name}" rows="${name === 'plain' || name === 'pro' ? 3 : 2}">${esc(val)}</textarea></div>`;
      }
      return `<div class="field"><label>${label}</label>
        <input type="${type}" name="${name}" value="${esc(val)}"></div>`;
    }).join('')}
    <div class="field">
      <label>信息类型</label>
      <select name="trust">
        ${Object.entries(TRUST).map(([k, [, label]]) => `<option value="${k}" ${item?.trust === k ? 'selected' : ''}>${label}</option>`).join('')}
      </select>
      <span class="hint">费率、关税、平台政策这类会变的信息，选"动态信息"，并写清来源与核实日期。</span>
    </div>
    <div class="modal-actions">
      <button type="submit" class="btn primary">${item ? '保存' : '创建条目'}</button>
    </div>
  </form>`;
}

function openEditor(item, onSaved) {
  const modal = openModal({
    title: '编辑知识条目',
    subtitle: '别只抄定义。写下它在哪个环节改变你的决策。',
    body: formHtml(item),
  });
  modal.querySelector('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    try {
      await api(`/api/knowledge/${item.id}`, { method: 'PATCH', body: data });
      closeModal();
      toast('已保存');
      await onSaved();
    } catch (err) {
      toast(err.message, 'err');
    }
  });
}

async function renderForm(root, item) {
  root.innerHTML = `
    <div class="page-head">
      <div>
        <a class="small muted" href="#/knowledge" style="display:inline-flex;align-items:center;gap:5px;margin-bottom:8px">
          ${icon('arrowLeft', 13)} 知识库
        </a>
        <h1>新建知识条目</h1>
        <p class="sub">一条好的条目至少包含：一句话通俗解释、一个真实使用场景、一条常见错误、一份检查清单。</p>
      </div>
    </div>
    <section class="card"><div class="card-body">${formHtml(item)}</div></section>
  `;
  hydrateIcons(root);
  root.querySelector('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    if (!data.title) return toast('标题不能为空', 'err');
    try {
      const res = await api('/api/knowledge', { method: 'POST', body: data });
      toast('已创建');
      location.hash = `#/knowledge/${res.item.id}`;
    } catch (err) {
      toast(err.message, 'err');
    }
  });
}