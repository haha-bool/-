import { getBootstrap, createTask, updateTask, deleteTask, generatePlan } from '../api.js';
import {
  esc, fmtDate, relDay, toast, icon, openModal, closeModal, todayStr, addDays, priorityChip,
} from '../dom.js';
import { hashQuery } from '../app.js';

const CATEGORY = {
  english: '英语', trade: '外贸', project: '项目', review: '复盘', admin: '事务',
};

export default async function render(root) {
  const q = hashQuery();
  const date = q.get('d') || todayStr();
  const state = await getBootstrap(date);
  const { tasks, goals, projects, overdue } = state;
  const goalTitle = Object.fromEntries(goals.map((g) => [g.id, g.title]));
  const projectName = Object.fromEntries(projects.map((p) => [p.id, p.name]));
  const done = tasks.filter((t) => t.status === 'done').length;
  const minutes = tasks.reduce((a, t) => a + (t.estimate_min || 0), 0);
  const doneMinutes = tasks.filter((t) => t.status === 'done').reduce((a, t) => a + (t.estimate_min || 0), 0);
  const isToday = date === todayStr();

  root.innerHTML = `
    <div class="page-head">
      <div>
        <div class="eyebrow">TASKS · 每日执行</div>
        <h1>${esc(fmtDate(date))}${isToday ? ' · 今天' : ''}</h1>
        <p class="sub">${tasks.length ? `共 ${tasks.length} 项，已完成 ${done} 项，剩 ${minutes - doneMinutes} 分钟。` : '还没有任务，先生成今天的节奏。'}</p>
      </div>
      <div class="head-actions">
        <button class="btn" id="t-new">${icon('plus', 15)} 添加任务</button>
        <button class="btn primary" id="t-gen">${icon('spark', 15)} 生成计划</button>
      </div>
    </div>

    <div class="card" style="margin-bottom:16px">
      <div class="card-body" style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:12px 18px">
        <button class="btn sm" id="t-prev">${icon('arrowLeft', 14)} 前一天</button>
        <input type="date" id="t-date" value="${esc(date)}" style="max-width:160px">
        <button class="btn sm" id="t-next">后一天 ${icon('arrowRight', 14)}</button>
        <button class="btn sm ghost" id="t-today">回到今天</button>
        <span class="right small muted">完成 ${done}/${tasks.length} · 计划 ${minutes} 分钟</span>
      </div>
    </div>

    ${overdue.length ? `<div class="callout warn" style="margin-bottom:16px">
      有 ${overdue.length} 项逾期未完成（最早 ${esc(overdue[0].plan_date)}）。可以逐个移到今天，或直接放弃不重要的。
    </div>` : ''}

    <div id="task-list">
      ${['P0', 'P1', 'P2', 'P3'].map((p) => {
        const group = tasks.filter((t) => (t.priority || 'P1') === p);
        if (!group.length) return '';
        return `<div class="divider-label">${p} · ${p === 'P0' ? '今天必须推进' : p === 'P1' ? '重要' : p === 'P2' ? '可安排' : '可选'}</div>
          <section class="card" style="margin-bottom:14px"><div class="card-body" style="padding:6px 18px">
          ${group.map((t) => taskRow(t, goalTitle, projectName)).join('')}
          </div></section>`;
      }).join('') || `<div class="empty">这一天没有任务。点「生成计划」按模板排一天，或手动添加。</div>`}
    </div>
  `;

  /* 日期导航 */
  root.querySelector('#t-prev').onclick = () => { location.hash = `#/tasks?d=${addDays(date, -1)}`; };
  root.querySelector('#t-next').onclick = () => { location.hash = `#/tasks?d=${addDays(date, 1)}`; };
  root.querySelector('#t-today').onclick = () => { location.hash = '#/tasks'; };
  root.querySelector('#t-date').onchange = (e) => { location.hash = `#/tasks?d=${e.target.value}`; };

  /* 生成 */
  root.querySelector('#t-gen').onclick = async (e) => {
    const btn = e.currentTarget;
    btn.disabled = true;
    try {
      const res = await generatePlan(date);
      toast(res.created ? `已生成 ${res.created} 项任务` : '这一天已经生成过计划了');
      await render(root);
    } catch (err) {
      toast(err.message, 'err');
      btn.disabled = false;
    }
  };

  /* 新建 */
  root.querySelector('#t-new').onclick = () => openEditor({ date, goals, projects, onSaved: () => render(root) });

  /* 完成 / 展开 / 编辑 / 删除 / 顺延 */
  root.querySelectorAll('[data-toggle]').forEach((btn) => {
    btn.onclick = async () => {
      btn.disabled = true;
      try {
        await updateTask(btn.dataset.toggle, { status: btn.dataset.next });
        await render(root);
      } catch (err) {
        toast(err.message, 'err');
        btn.disabled = false;
      }
    };
  });

  root.querySelectorAll('[data-expand]').forEach((el) => {
    el.onclick = () => {
      const panel = root.querySelector(`[data-panel="${el.dataset.expand}"]`);
      if (panel) panel.hidden = !panel.hidden;
    };
  });

  root.querySelectorAll('[data-edit]').forEach((btn) => {
    btn.onclick = () => {
      const task = tasks.find((t) => t.id === btn.dataset.edit);
      if (task) openEditor({ date, task, goals, projects, onSaved: () => render(root) });
    };
  });

  root.querySelectorAll('[data-del]').forEach((btn) => {
    btn.onclick = async () => {
      if (!confirm('删除这个任务？')) return;
      try {
        await deleteTask(btn.dataset.del);
        toast('已删除');
        await render(root);
      } catch (err) { toast(err.message, 'err'); }
    };
  });

  root.querySelectorAll('[data-tomorrow]').forEach((btn) => {
    btn.onclick = async () => {
      try {
        await updateTask(btn.dataset.tomorrow, { plan_date: addDays(date, 1) });
        toast('已移到明天');
        await render(root);
      } catch (err) { toast(err.message, 'err'); }
    };
  });
}

function taskRow(t, goalTitle, projectName) {
  const done = t.status === 'done';
  return `<div class="task ${done ? 'done' : ''}">
    <button class="task-check" data-toggle="${esc(t.id)}" data-next="${done ? 'todo' : 'done'}"
      aria-label="${done ? '标记未完成' : '标记完成'}">${icon('check', 12)}</button>
    <div class="task-main">
      <div class="task-title" data-expand="${esc(t.id)}" style="cursor:pointer">
        ${priorityChip(t.priority)}
        <span>${esc(t.title)}</span>
        <span class="chip line">${esc(CATEGORY[t.category] || t.category || '其他')}</span>
      </div>
      <div class="task-meta">
        <span>${icon('clock', 12)} ${t.estimate_min || 0} 分钟</span>
        ${t.goal_id && goalTitle[t.goal_id] ? `<span>↳ ${esc(goalTitle[t.goal_id])}</span>` : ''}
        ${t.project_id && projectName[t.project_id] ? `<span>· ${esc(projectName[t.project_id])}</span>` : ''}
      </div>
      <div class="task-detail" data-panel="${esc(t.id)}" hidden>
        ${t.detail ? `<div>${esc(t.detail)}</div>` : '<div class="faint">没有补充说明</div>'}
        ${t.done_criteria ? `<div class="criteria"><strong>完成标准：</strong>${esc(t.done_criteria)}</div>` : ''}
        <div class="row" style="margin-top:10px">
          <button class="btn sm" data-edit="${esc(t.id)}">${icon('edit', 13)} 编辑</button>
          ${t.status !== 'done' ? `<button class="btn sm" data-tomorrow="${esc(t.id)}">移到明天</button>` : ''}
          <button class="btn sm danger" data-del="${esc(t.id)}">${icon('trash', 13)} 删除</button>
        </div>
      </div>
    </div>
  </div>`;
}

function openEditor({ date, task = null, goals, projects, onSaved }) {
  const body = `
    <form>
      <div class="field">
        <label>任务标题</label>
        <input type="text" name="title" required value="${esc(task?.title || '')}" placeholder="例如：精听 30 分钟（六级听力）">
      </div>
      <div class="form-grid">
        <div class="field">
          <label>优先级</label>
          <select name="priority">
            ${['P0', 'P1', 'P2', 'P3'].map((p) => `<option value="${p}" ${task?.priority === p ? 'selected' : (!task && p === 'P1' ? 'selected' : '')}>${p} · ${p === 'P0' ? '必须推进' : p === 'P1' ? '重要' : p === 'P2' ? '可安排' : '可选'}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label>预计耗时（分钟）</label>
          <input type="number" name="estimate_min" min="5" step="5" value="${task?.estimate_min ?? 30}">
        </div>
        <div class="field">
          <label>日期</label>
          <input type="date" name="plan_date" value="${esc(task?.plan_date || date)}">
        </div>
        <div class="field">
          <label>分类</label>
          <select name="category">
            ${Object.entries(CATEGORY).map(([k, v]) => `<option value="${k}" ${task?.category === k ? 'selected' : ''}>${v}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label>关联目标</label>
          <select name="goal_id">
            <option value="">不关联</option>
            ${goals.map((g) => `<option value="${esc(g.id)}" ${task?.goal_id === g.id ? 'selected' : ''}>${esc(g.title)}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label>关联项目</label>
          <select name="project_id">
            <option value="">不关联</option>
            ${projects.map((p) => `<option value="${esc(p.id)}" ${task?.project_id === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="field">
        <label>说明 / 怎么做</label>
        <textarea name="detail" rows="3" placeholder="具体动作、材料、注意点">${esc(task?.detail || '')}</textarea>
      </div>
      <div class="field">
        <label>完成标准</label>
        <input type="text" name="done_criteria" value="${esc(task?.done_criteria || '')}" placeholder="例如：产出 1 条听写笔记，记录 3 个音变现象">
        <span class="hint">没有完成标准的任务，很容易变成"做了但没效果"。</span>
      </div>
      <div class="modal-actions" style="margin-top:6px">
        <button type="submit" class="btn primary">${task ? '保存修改' : '添加任务'}</button>
      </div>
    </form>`;

  const modal = openModal({
    title: task ? '编辑任务' : '添加任务',
    subtitle: '任务要具体到"做什么"，而不是"努力一下"。',
    body,
  });

  modal.querySelector('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    try {
      if (task) await updateTask(task.id, data);
      else await createTask(data);
      closeModal();
      toast(task ? '已保存' : '已添加');
      await onSaved();
    } catch (err) {
      toast(err.message, 'err');
    }
  });
}