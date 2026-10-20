import { api } from '../api.js';
import { esc, toast, icon, masteryDots, hydrateIcons } from '../dom.js';
import { hashQuery } from '../app.js';

const TRUST = {
  verified: ['green', '已核实'],
  principle: ['blue', '原则型'],
  dynamic: ['amber', '动态 · 需核实'],
  unverified: ['line', '待核实'],
};

export default async function render(root) {
  const q = hashQuery();
  let keyword = q.get('q') || '';
  let category = q.get('cat') || '';

  root.innerHTML = `
    <div class="page-head">
      <div>
        <div class="eyebrow">KNOWLEDGE · 结构化知识库</div>
        <h1>外贸知识库</h1>
        <p class="sub">每条知识都要能回答：在哪个环节用、怎么用、容易错在哪。动态信息（费率、关税、政策）标注核实日期。</p>
      </div>
      <div class="head-actions">
        <a class="btn primary" href="#/knowledge/new">${icon('plus', 15)} 新建条目</a>
      </div>
    </div>

    <div class="kb-toolbar">
      <input type="search" id="kb-q" placeholder="搜索标题、解释、场景、标签…" value="${esc(keyword)}">
      <div class="row" id="kb-cats" style="gap:6px;flex:1 1 100%"></div>
      <span class="right small faint" id="kb-count"></span>
    </div>

    <div class="grid c2" id="kb-list"></div>
  `;

  const listEl = root.querySelector('#kb-list');
  const catsEl = root.querySelector('#kb-cats');
  const countEl = root.querySelector('#kb-count');
  const searchEl = root.querySelector('#kb-q');

  async function load() {
    listEl.innerHTML = '<div class="empty">搜索中…</div>';
    try {
      const params = new URLSearchParams();
      if (keyword) params.set('q', keyword);
      if (category) params.set('category', category);
      const data = await api(`/api/knowledge?${params.toString()}`);
      const items = data.items;

      catsEl.innerHTML = `
        <button class="chip ${category ? 'line' : 'green'}" data-cat="">全部</button>
        ${data.categories.map((c) => `<button class="chip ${category === c.category ? 'green' : 'line'}"
          data-cat="${esc(c.category)}">${esc(c.category)} ${c.n}</button>`).join('')}`;
      catsEl.querySelectorAll('[data-cat]').forEach((b) => {
        b.onclick = () => { category = b.dataset.cat; load(); };
      });

      countEl.textContent = `${items.length} 条`;
      listEl.innerHTML = items.length ? items.map((k) => {
        const [cls, label] = TRUST[k.trust] || TRUST.unverified;
        return `<a class="kb-card" href="#/knowledge/${esc(k.id)}">
          <div style="display:flex;gap:8px;align-items:flex-start">
            <h3 style="flex:1">${esc(k.title)}</h3>
            <span class="chip ${cls}">${label}</span>
          </div>
          <p class="excerpt">${esc(k.plain || k.pro || '')}</p>
          <div class="meta">
            <span class="chip line">${esc(k.category)}</span>
            ${k.stage ? `<span class="small faint">${esc(k.stage)}</span>` : ''}
            ${masteryDots(k.mastery)}
            ${k.verified_on ? `<span class="small faint" style="margin-left:auto">核实 ${esc(k.verified_on)}</span>` : ''}
          </div>
        </a>`;
      }).join('') : `<div class="empty" style="grid-column:1/-1">没有匹配的条目。换个关键词，或新建一条。</div>`;
      hydrateIcons(listEl);
    } catch (err) {
      listEl.innerHTML = `<div class="empty">加载失败：${esc(err.message)}</div>`;
    }
  }

  let timer;
  searchEl.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      keyword = searchEl.value.trim();
      load();
    }, 220);
  });

  await load();
}