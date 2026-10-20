import { api } from '../api.js';
import { esc, toast, icon, openModal, closeModal, fmtDate, hydrateIcons } from '../dom.js';

const KIND = { real: ['amber', '真实经历'], sim: ['violet', '模拟项目'], practice: ['blue', '练习'], study: ['blue', '学习'] };
const STATUS = { active: '进行中', planned: '待启动', done: '已完成', paused: '已暂停' };

export default async function render(root) {
  const [goalsRes, msRes, prjRes] = await Promise.all([
    api('/api/goals'), api('/api/milestones'), api('/api/projects'),
  ]);
  const goals = goalsRes.items;
  const milestones = msRes.items;
  const projects = prjRes.items;

  root.innerHTML = `
    <div class="page-head">
      <div>
        <div class="eyebrow">PLAN · 目标 · 里程碑 · 项目</div>
        <h1>目标与项目</h1>
        <p class="sub">目标要能被拆成里程碑，里程碑要能被拆成任务。做不到这一步的"目标"，只是愿望。</p>
      </div>
      <div class="head-actions">
        <button class="btn" id="add-goal">${icon('plus', 14)} 新目标</button>
        <button class="btn primary" id="add-project">${icon('plus', 14)} 新项目</button>
      </div>
    </div>

    <div class="divider-label">长期目标</div>
    <div class="grid" style="gap:14px;margin-bottom:26px">
      ${goals.map((g) => {
        const ms = milestones.filter((m) => m.goal_id === g.id);
        const doneCount = ms.filter((m) => m.status === 'done').length;
        return `<section class="card">
          <div class="card-body">
            <div style="display:flex;gap:14px;align-items:flex-start">
              <div style="flex:1;min-width:0">
                <div style="display:flex;gap:9px;align-items:center;flex-wrap:wrap">
                  <h2 style="font-size:15.5px">${esc(g.title)}</h2>
                  ${g.target_date ? `<span class="chip line">${esc(g.target_date)}</span>` : ''}
                  <span class="chip green">${g.progress}%</span>
                </div>
                ${g.why ? `<p class="small muted" style="margin-top:5px;max-width:80ch">${esc(g.why)}</p>` : ''}
                ${g.metric ? `<p class="small faint" style="margin-top:3px">衡量：${esc(g.metric)}</p>` : ''}
                <div class="progress" style="margin:10px 0 4px"><i style="width:${Math.min(100, g.progress)}%"></i></div>
                <div class="small faint">里程碑 ${doneCount}/${ms.length}</div>
              </div>
              <button class="btn sm ghost" data-edit-goal="${esc(g.id)}">${icon('edit', 13)}</button>
            </div>
            <div style="margin-top:10px">
              ${ms.map((m) => `
                <div class="milestone ${m.status === 'done' ? 'done' : ''}">
                  <button class="task-check" data-ms="${esc(m.id)}" data-next="${m.status === 'done' ? 'open' : 'done'}"
                    aria-label="切换里程碑">${icon('check', 12)}</button>
                  <div style="flex:1">
                    <div class="m-title">${esc(m.title)}</div>
                    ${m.due_date ? `<div class="small faint">${esc(m.due_date)}${m.due_date < new Date().toISOString().slice(0, 10) && m.status !== 'done' ? ' · 已过期' : ''}</div>` : ''}
                  </div>
                </div>`).join('')}
              <button class="btn sm ghost" data-add-ms="${esc(g.id)}" style="margin-top:6px">${icon('plus', 12)} 添加里程碑</button>
            </div>
          </div>
        </section>`;
      }).join('')}
    </div>

    <div class="divider-label">项目（真实 / 模拟 / 练习）</div>
    <div class="grid c2">
      ${projects.map((p) => {
        const [kcls, klabel] = KIND[p.kind] || KIND.practice;
        return `<section class="card">
          <div class="card-body">
            <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
              <span class="chip ${kcls}">${klabel}</span>
              <span class="chip line">${esc(STATUS[p.status] || p.status)}</span>
              <h3 style="font-size:14.5px;flex:1;min-width:0">${esc(p.name)}</h3>
              <button class="btn sm ghost" data-edit-project="${esc(p.id)}">${icon('edit', 13)}</button>
            </div>
            ${p.goal ? `<p class="small muted" style="margin-top:6px">${esc(p.goal)}</p>` : ''}
            ${p.background ? `<p class="small faint" style="margin-top:3px">${esc(p.background)}</p>` : ''}
            <div style="display:flex;align-items:center;gap:10px;margin-top:10px">
              <div class="progress" style="flex:1"><i style="width:${p.progress || 0}%"></i></div>
              <span class="small faint">${p.progress || 0}%</span>
            </div>
            <div class="small faint" style="margin-top:6px">${[p.start_date, p.due_date].filter(Boolean).join(' → ')}</div>
            ${p.risks ? `<div class="callout warn" style="margin-top:9px;font-size:12.6px">风险：${esc(p.risks)}</div>` : ''}
            ${p.result ? `<div class="callout good" style="margin-top:9px;font-size:12.6px">结果：${esc(p.result)}</div>` : ''}
          </div>
        </section>`;
      }).join('')}
    </div>
  `;

  root.querySelectorAll('[data-ms]').forEach((b) => {
    b.onclick = async () => {
      b.disabled = true;
      try {
        await api(`/api/milestones/${b.dataset.ms}`, { method: 'PATCH', body: { status: b.dataset.next } });
        await render(root);
      } catch (err) { toast(err.message, 'err'); b.disabled = false; }
    };
  });

  root.querySelectorAll('[data-add-ms]').forEach((b) => {
    b.onclick = () => addMilestone(b.dataset.addMs, () => render(root));
  });

  root.querySelector('#add-goal').onclick = () => editGoal(null, () => render(root));
  root.querySelectorAll('[data-edit-goal]').forEach((b) => {
    b.onclick = () => editGoal(goals.find((g) => g.id === b.dataset.editGoal), () => render(root));
  });

  root.querySelector('#add-project').onclick = () => editProject(null, () => render(root));
  root.querySelectorAll('[data-edit-project]').forEach((b) => {
    b.onclick = () => editProject(projects.find((p) => p.id === b.dataset.editProject), () => render(root));
  });

  hydrateIcons(root);
}

function addMilestone(goalId, onSaved) {
  const modal = openModal({
    title: '添加里程碑',
    subtitle: '里程碑要能被验证：有日期、有可交付物。',
    body: `<form>
      <div class="field"><label>内容</label><input name="title" required placeholder="例如：完成 6 套六级真题"></div>
      <div class="field"><label>截止日期</label><input type="date" name="due_date"></div>
      <div class="modal-actions"><button class="btn primary" type="submit">添加</button></div>
    </form>`,
  });
  modal.querySelector('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    try {
      await api('/api/milestones', { method: 'POST', body: { ...data, goal_id: goalId } });
      closeModal();
      await onSaved();
    } catch (err) { toast(err.message, 'err'); }
  });
}

function editGoal(goal, onSaved) {
  const modal = openModal({
    title: goal ? '编辑目标' : '新建目标',
    body: `<form>
      <div class="field"><label>目标</label><input name="title" required value="${esc(goal?.title || '')}" placeholder="例如：2027 年能独立完成一单 B2B 出口"></div>
      <div class="field"><label>为什么要这个目标</label><textarea name="why" rows="2">${esc(goal?.why || '')}</textarea></div>
      <div class="field"><label>衡量标准</label><input name="metric" value="${esc(goal?.metric || '')}" placeholder="可验证的结果，不是'变强'"></div>
      <div class="form-grid">
        <div class="field"><label>目标日期</label><input type="date" name="target_date" value="${esc(goal?.target_date || '')}"></div>
        <div class="field"><label>进度</label><input value="按里程碑完成情况自动计算" disabled></div>
      </div>
      <div class="modal-actions"><button class="btn primary" type="submit">保存</button></div>
    </form>`,
  });
  modal.querySelector('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    try {
      if (goal) await api(`/api/goals/${goal.id}`, { method: 'PATCH', body: data });
      else await api('/api/goals', { method: 'POST', body: data });
      closeModal();
      await onSaved();
    } catch (err) { toast(err.message, 'err'); }
  });
}

function editProject(project, onSaved) {
  const modal = openModal({
    title: project ? '编辑项目' : '新建项目',
    subtitle: '真实项目、模拟项目、练习项目必须分开标记，避免把模拟结果当成业绩。',
    body: `<form>
      <div class="field"><label>项目名称</label><input name="name" required value="${esc(project?.name || '')}"></div>
      <div class="form-grid">
        <div class="field"><label>类型</label>
          <select name="kind">${Object.entries(KIND).map(([k, [, v]]) => `<option value="${k}" ${project?.kind === k ? 'selected' : ''}>${v}</option>`).join('')}</select>
        </div>
        <div class="field"><label>状态</label>
          <select name="status">${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${project?.status === k ? 'selected' : ''}>${v}</option>`).join('')}</select>
        </div>
      </div>
      <div class="field"><label>项目目标</label><textarea name="goal" rows="2">${esc(project?.goal || '')}</textarea></div>
      <div class="field"><label>背景</label><textarea name="background" rows="2">${esc(project?.background || '')}</textarea></div>
      <div class="form-grid">
        <div class="field"><label>开始</label><input type="date" name="start_date" value="${esc(project?.start_date || '')}"></div>
        <div class="field"><label>截止</label><input type="date" name="due_date" value="${esc(project?.due_date || '')}"></div>
      </div>
      <div class="field"><label>进度（%）</label><input type="number" name="progress" min="0" max="100" value="${project?.progress ?? 0}"></div>
      <div class="field"><label>风险清单</label><textarea name="risks" rows="2">${esc(project?.risks || '')}</textarea></div>
      <div class="field"><label>结果</label><textarea name="result" rows="2">${esc(project?.result || '')}</textarea></div>
      <div class="modal-actions"><button class="btn primary" type="submit">保存</button></div>
    </form>`,
  });
  modal.querySelector('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    try {
      if (project) await api(`/api/projects/${project.id}`, { method: 'PATCH', body: data });
      else await api('/api/projects', { method: 'POST', body: data });
      closeModal();
      await onSaved();
    } catch (err) { toast(err.message, 'err'); }
  });
}