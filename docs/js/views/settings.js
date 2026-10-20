import { api } from '../api.js';
import { esc, toast, icon, openModal, closeModal, hydrateIcons } from '../dom.js';

export default async function render(root) {
  const [profileRes, tplRes] = await Promise.all([api('/api/profile'), api('/api/templates')]);
  const profile = profileRes.profile || {};
  const templates = tplRes.items;

  root.innerHTML = `
    <div class="page-head">
      <div>
        <div class="eyebrow">SETTINGS · 数据与配置</div>
        <h1>设置与数据</h1>
        <p class="sub">所有数据保存在本机 SQLite 文件里，不上传任何服务器。定期导出备份，换电脑时才不会丢。</p>
      </div>
    </div>

    <div class="grid c2">
      <section class="card">
        <div class="card-head"><h2>个人档案</h2></div>
        <div class="card-body">
          <form id="profile-form">
            <div class="field"><label>当前阶段</label><input name="stage" value="${esc(profile.stage || '')}" placeholder="2026 能力建设期 · 英语与外贸基础"></div>
            <div class="form-grid">
              <div class="field"><label>目标城市</label><input name="target_city" value="${esc(profile.target_city || '')}"></div>
              <div class="field"><label>目标入职时间</label><input name="target_date" value="${esc(profile.target_date || '')}" placeholder="2028-07"></div>
              <div class="field"><label>四级成绩</label><input name="cet4" value="${esc(profile.cet4 || '')}" placeholder="425+"></div>
              <div class="field"><label>六级计划</label><input name="cet6_plan" value="${esc(profile.cet6_plan || '')}" placeholder="2026-12"></div>
            </div>
            <div class="divider-label" style="margin-top:4px">文档署名（报价单 / PI / 合同会用到）</div>
            <div class="form-grid">
              <div class="field"><label>你的姓名</label><input name="name" value="${esc(profile.name || '')}" placeholder="Zhang San"></div>
              <div class="field"><label>公司英文名</label><input name="company_en" value="${esc(profile.company_en || '')}" placeholder="Guangzhou XX Co., Ltd."></div>
              <div class="field"><label>公司中文名</label><input name="company" value="${esc(profile.company || '')}"></div>
              <div class="field"><label>邮箱</label><input name="email" value="${esc(profile.email || '')}" placeholder="sales@example.com"></div>
              <div class="field"><label>电话</label><input name="phone" value="${esc(profile.phone || '')}"></div>
              <div class="field"><label>网址</label><input name="website" value="${esc(profile.website || '')}"></div>
            </div>
            <div class="field"><label>公司地址</label><input name="address" value="${esc(profile.address || '')}" placeholder="Room ..., Guangzhou, China"></div>
            <p class="small faint" style="margin-bottom:10px">没有公司就留空，文档里会用 [[ ]] 标出，不会编造。</p>
            <div style="display:flex;justify-content:flex-end"><button class="btn primary" type="submit">保存档案</button></div>
          </form>
        </div>
      </section>

      <section class="card">
        <div class="card-head"><h2>数据与备份</h2></div>
        <div class="card-body">
          <p class="small muted" style="margin-bottom:12px">
            数据库：<span class="mono">data/trade-os.db</span><br>
            自动快照：<span class="mono">data/backups/</span>（每次启动 + 关闭时各一份，保留最近 30 份）
          </p>
          <div class="row" style="gap:8px">
            <a class="btn" href="/api/export" download>${icon('download', 14)} 导出全部数据</a>
            <button class="btn" id="backup-now">${icon('layers', 14)} 立即快照</button>
            <label class="btn" style="cursor:pointer">
              ${icon('upload', 14)} 导入备份
              <input type="file" id="import-file" accept="application/json,.json" hidden>
            </label>
          </div>
          <p class="small faint" style="margin-top:12px">导入会<strong>覆盖当前全部数据</strong>，导入前建议先导出一次。</p>
          <div class="sep"></div>
          <p class="small muted">建议节奏：每周日导出一次，存到网盘或 U 盘。文件名带日期。</p>
        </div>
      </section>
    </div>

    <section class="card" style="margin-top:16px">
      <div class="card-head">
        <h2>每日任务模板</h2>
        <button class="btn sm" id="add-tpl">${icon('plus', 13)} 新增模板</button>
      </div>
      <div class="card-body">
        <p class="small muted" style="margin-bottom:10px">「生成计划」会按这些模板排任务。改模板不会影响已生成的任务。</p>
        <div class="list-plain">
          ${templates.map((t) => `
            <div style="display:flex;gap:10px;align-items:center">
              <div style="flex:1;min-width:0">
                <div style="font-size:13.4px;font-weight:540">${esc(t.title)}</div>
                <div class="small faint">
                  ${esc({ english: '英语', trade: '外贸', project: '项目', review: '复盘', admin: '事务' }[t.category] || t.category)}
                  · ${t.estimate_min} 分钟 · ${t.priority}
                  · ${t.cadence === 'daily' ? '每天' : `每周 ${esc(t.weekday_mask || '')}`}
                </div>
              </div>
              <label class="check" style="padding:0;flex:0 0 auto">
                <input type="checkbox" data-tpl-active="${esc(t.id)}" ${t.active ? 'checked' : ''}>
                <span class="small faint">启用</span>
              </label>
            </div>`).join('')}
        </div>
      </div>
    </section>

    <section class="card" style="margin-top:16px">
      <div class="card-head"><h2>能力边界（请务必了解）</h2></div>
      <div class="card-body">
        <div class="list-plain">
          <div><strong style="font-size:13.4px">不会自动联网核实</strong>
            <p class="small muted">关税、平台费率、政策这类动态信息，系统只提供框架和核实提示，具体数字必须你自己去官方来源查，并更新核实日期。</p></div>
          <div><strong style="font-size:13.4px">不会替你写英语</strong>
            <p class="small muted">训练室只提供题目、结构、自检和 AI 提示词。你要先写，再拿反馈。这是为了让你在真实谈判里能自己说。</p></div>
          <div><strong style="font-size:13.4px">不会编造业务数据</strong>
            <p class="small muted">报价、客户、成交数据都必须由你录入。系统里没有"自动生成业绩"这种功能，也不会把模拟项目标成真实项目。</p></div>
          <div><strong style="font-size:13.4px">第一阶段未包含</strong>
            <p class="small muted">客户 CRM、报价计算器、业务文档库、Shopee 实验区、求职中心，在第二、三阶段接入。现在导航里没有，就是还没做，不是隐藏功能。</p></div>
        </div>
      </div>
    </section>
  `;

  root.querySelector('#profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    try {
      await api('/api/profile', { method: 'POST', body: data });
      toast('档案已保存');
    } catch (err) { toast(err.message, 'err'); }
  });

  root.querySelector('#backup-now').onclick = async (e) => {
    const btn = e.currentTarget;
    btn.disabled = true;
    try {
      const res = await api('/api/backup', { method: 'POST', body: {} });
      toast(`已快照：${res.file.split(/[\\/]/).pop()}`);
    } catch (err) { toast(err.message, 'err'); }
    btn.disabled = false;
  };

  root.querySelector('#import-file').onchange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm('导入会覆盖当前全部数据，确定继续？')) { e.target.value = ''; return; }
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      await api('/api/import', { method: 'POST', body: payload });
      toast('导入完成，正在刷新');
      setTimeout(() => location.reload(), 600);
    } catch (err) {
      toast(`导入失败：${err.message}`, 'err');
    }
    e.target.value = '';
  };

  root.querySelectorAll('[data-tpl-active]').forEach((cb) => {
    cb.onchange = async () => {
      try {
        await api(`/api/templates/${cb.dataset.tplActive}`, { method: 'PATCH', body: { active: cb.checked ? 1 : 0 } });
        toast(cb.checked ? '已启用' : '已停用');
      } catch (err) { toast(err.message, 'err'); }
    };
  });

  root.querySelector('#add-tpl').onclick = () => {
    const modal = openModal({
      title: '新增任务模板',
      subtitle: '模板会在每天「生成计划」时自动加入当天任务。',
      body: `<form>
        <div class="field"><label>标题</label><input name="title" required placeholder="例如：复盘 1 个模拟客户"></div>
        <div class="field"><label>说明</label><textarea name="detail" rows="2"></textarea></div>
        <div class="form-grid">
          <div class="field"><label>分类</label><select name="category">
            <option value="english">英语</option><option value="trade">外贸</option>
            <option value="project">项目</option><option value="review">复盘</option>
          </select></div>
          <div class="field"><label>优先级</label><select name="priority">
            <option>P0</option><option selected>P1</option><option>P2</option><option>P3</option>
          </select></div>
          <div class="field"><label>预计分钟</label><input type="number" name="estimate_min" value="30" min="5" step="5"></div>
          <div class="field"><label>频率</label><select name="cadence">
            <option value="daily">每天</option><option value="weekly">每周</option>
          </select></div>
          <div class="field"><label>星期（周一=1 … 周日=7）</label><input name="weekday_mask" placeholder="1,3,5 或留空=每天"></div>
          <div class="field"><label>完成标准</label><input name="done_criteria"></div>
        </div>
        <div class="modal-actions"><button class="btn primary" type="submit">添加</button></div>
      </form>`,
    });
    modal.querySelector('form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(e.target).entries());
      try {
        await api('/api/templates', { method: 'POST', body: data });
        closeModal();
        await render(root);
      } catch (err) { toast(err.message, 'err'); }
    });
  };

  hydrateIcons(root);
}