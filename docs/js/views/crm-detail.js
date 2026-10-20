import { api } from '../api.js';
import { esc, toast, icon, openModal, closeModal, relDay, fmtDate, fmtMoney, todayStr, hydrateIcons } from '../dom.js';
import { STAGE, KIND, SOURCE, editClient } from './crm.js';

const CHANNEL = { email: '邮件', whatsapp: 'WhatsApp', call: '电话', meeting: '会议', linkedin: 'LinkedIn', other: '其他' };
const QUOTE_STATUS = { draft: '草稿', sent: '已发出', negotiating: '议价中', won: '已成交', lost: '已丢单', expired: '已过期' };

export default async function render(root, id) {
  const data = await api(`/api/clients/${id}/full`);
  const { client, contacts, followups, quotes, documents } = data;
  const [kcls, klabel] = KIND[client.kind] || KIND.sim;
  const [scls, slabel] = STAGE[client.stage] || STAGE.lead;
  const planned = followups.filter((f) => f.status === 'planned');
  const history = followups.filter((f) => f.status !== 'planned');

  root.innerHTML = `
    <div class="page-head">
      <div>
        <div class="eyebrow"><a href="#/crm" style="color:inherit">← 客户 CRM</a> · ${esc([client.region, client.country].filter(Boolean).join(' · ') || '未填国家')}</div>
        <h1>${esc(client.company)}</h1>
        <p class="sub">
          <span class="chip ${kcls}">${klabel}</span>
          <span class="chip ${scls}">${slabel}</span>
          <span class="chip line">${esc(client.level || 'B')} 级</span>
          <span class="chip line">来源：${esc(SOURCE[client.source] || client.source || '未填')}</span>
          ${client.website ? ` <a href="${esc(client.website)}" target="_blank" rel="noreferrer" style="color:#0a5c43">${icon('external', 12)} 官网</a>` : ''}
        </p>
      </div>
      <div class="head-actions">
        <a class="btn" href="#/docs?client=${esc(client.id)}">${icon('file', 14)} 写文档</a>
        <button class="btn" id="edit-client">${icon('edit', 14)} 编辑</button>
        <button class="btn danger" id="delete-client">${icon('trash', 14)}</button>
      </div>
    </div>

    <div class="split">
      <div class="main-col grid" style="gap:16px">
        <section class="card">
          <div class="card-head">
            <h2>联系人</h2>
            <button class="btn sm" id="add-contact">${icon('plus', 13)} 添加</button>
          </div>
          <div class="card-body">
            ${contacts.length ? `<div class="contact-list">${contacts.map((c) => `
              <div class="contact-row">
                <div class="avatar">${esc((c.name || '?').slice(0, 1).toUpperCase())}</div>
                <div style="flex:1;min-width:0">
                  <div style="display:flex;gap:7px;align-items:center;flex-wrap:wrap">
                    <strong style="font-size:13.5px">${esc(c.name)}</strong>
                    ${c.is_primary ? '<span class="chip green">主要联系人</span>' : ''}
                    ${c.title ? `<span class="small faint">${esc(c.title)}</span>` : ''}
                  </div>
                  <div class="contact-links">
                    ${c.email ? `<a href="mailto:${esc(c.email)}">${icon('mail', 12)} ${esc(c.email)}</a>` : ''}
                    ${c.phone ? `<span>${icon('phone', 12)} ${esc(c.phone)}</span>` : ''}
                    ${c.whatsapp ? `<span>${icon('chat', 12)} ${esc(c.whatsapp)}</span>` : ''}
                    ${c.language ? `<span class="chip line">${esc(c.language)}</span>` : ''}
                  </div>
                  ${c.notes ? `<div class="small faint" style="margin-top:3px">${esc(c.notes)}</div>` : ''}
                </div>
                <button class="btn sm ghost" data-edit-contact="${esc(c.id)}">${icon('edit', 12)}</button>
              </div>`).join('')}</div>`
              : `<div class="empty">还没有联系人。至少记下决策人姓名和邮箱，否则"跟进"无从谈起。</div>`}
          </div>
        </section>

        <section class="card">
          <div class="card-head">
            <h2>跟进计划</h2>
            <button class="btn sm primary" id="add-followup">${icon('plus', 13)} 记录跟进</button>
          </div>
          <div class="card-body">
            ${planned.length ? `<div class="list-plain">${planned.map((f) => `
              <div class="followup-row">
                <div class="followup-date ${f.due_date && f.due_date < todayStr() ? 'overdue' : ''}">
                  <strong>${esc((f.due_date || '').slice(5) || '未定')}</strong>
                  <small>${esc(relDay(f.due_date))}</small>
                </div>
                <div style="flex:1;min-width:0">
                  <div style="font-size:13.4px;font-weight:540">${esc(f.summary || '按计划跟进')}</div>
                  <div class="small faint" style="margin-top:2px">
                    ${esc(CHANNEL[f.channel] || f.channel)} · ${f.direction === 'in' ? '客户来信' : '我方发出'}
                    ${f.next_action ? ` · 下一步：${esc(f.next_action)}` : ''}
                  </div>
                </div>
                <div class="row" style="flex:0 0 auto;gap:4px">
                  <button class="btn sm" data-done="${esc(f.id)}">${icon('check', 12)} 完成</button>
                  <button class="btn sm ghost" data-del-followup="${esc(f.id)}">${icon('trash', 12)}</button>
                </div>
              </div>`).join('')}</div>`
              : `<div class="empty">没有待办跟进。记录一次沟通并设定下次日期——没有下一步的客户会自然冷掉。</div>`}

            ${history.length ? `
              <div class="sep"></div>
              <details>
                <summary>历史沟通（${history.length}）</summary>
                <div class="list-plain" style="margin-top:6px">
                  ${history.map((f) => `
                    <div style="display:flex;gap:10px;align-items:flex-start">
                      <span class="small faint" style="flex:0 0 78px">${esc(f.due_date || '')}</span>
                      <div style="flex:1;min-width:0">
                        <div class="small">${esc(f.summary || '')}</div>
                        <div class="small faint">${esc(CHANNEL[f.channel] || f.channel)}${f.next_action ? ` · 下一步：${esc(f.next_action)}` : ''}</div>
                      </div>
                      <span class="chip ${f.status === 'done' ? 'green' : 'line'}">${f.status === 'done' ? '已完成' : f.status}</span>
                    </div>`).join('')}
                </div>
              </details>` : ''}
          </div>
        </section>

        <section class="card">
          <div class="card-head">
            <h2>这个客户的报价</h2>
            <a class="hint" href="#/quotes/new?client=${esc(client.id)}">新建报价 →</a>
          </div>
          <div class="card-body">
            ${quotes.length ? `<div class="list-plain">${quotes.map((q) => `
              <a href="#/quotes/${esc(q.id)}" style="display:flex;gap:10px;align-items:center">
                <span class="mono" style="flex:1">${esc(q.quote_no || '未编号')}</span>
                <span class="chip line">${esc(q.incoterm)}</span>
                <span class="small">${fmtMoney(q.currency, q.total_amount)}</span>
                <span class="chip ${q.status === 'won' ? 'green' : q.status === 'lost' ? 'red' : 'line'}">${esc(QUOTE_STATUS[q.status] || q.status)}</span>
              </a>`).join('')}</div>`
              : `<div class="empty">还没有报价。报价前先把这个客户的事实和待确认项写清楚。</div>`}
          </div>
        </section>
      </div>

      <div class="side-col grid" style="gap:16px">
        <section class="card">
          <div class="card-head"><h2>情报分层</h2></div>
          <div class="card-body">
            ${intel('确定的事实', client.facts, 'good', '客户明确说过的、可引用的内容。')}
            ${intel('我的推测', client.guesses, 'warn', '未证实。写在这里，避免当成事实用。')}
            ${intel('待确认', client.pending, '', '下次沟通要问清楚的。')}
          </div>
        </section>

        <section class="card">
          <div class="card-head"><h2>备注与来源</h2></div>
          <div class="card-body">
            <dl class="kv">
              <dt>需求</dt><dd>${esc(client.products_interest || '未填')}</dd>
              <dt>来源</dt><dd>${esc(SOURCE[client.source] || client.source || '未填')}</dd>
              <dt>最后联系</dt><dd>${esc(client.last_contact_on || '—')}</dd>
              <dt>下次跟进</dt><dd>${esc(client.next_follow_up || '—')}${client.next_follow_up ? `（${esc(relDay(client.next_follow_up))}）` : ''}</dd>
              <dt>创建</dt><dd>${esc((client.created_at || '').slice(0, 10))}</dd>
            </dl>
            ${client.notes ? `<div class="sep"></div><p class="small muted" style="white-space:pre-wrap">${esc(client.notes)}</p>` : ''}
          </div>
        </section>

        ${documents.length ? `<section class="card">
          <div class="card-head"><h2>文档</h2></div>
          <div class="card-body list-plain">
            ${documents.slice(0, 6).map((d) => `<a href="#/docs?doc=${esc(d.id)}" class="small">${esc(d.title)}</a>`).join('')}
          </div>
        </section>` : ''}
      </div>
    </div>
  `;

  root.querySelector('#edit-client').onclick = () => editClient(client, () => render(root, id));
  root.querySelector('#delete-client').onclick = async () => {
    if (!confirm(`删除「${client.company}」及其联系人、跟进记录？报价不会被删除。`)) return;
    try {
      await api(`/api/clients/${id}`, { method: 'DELETE' });
      toast('客户已删除');
      location.hash = '#/crm';
    } catch (err) { toast(err.message, 'err'); }
  };

  root.querySelector('#add-contact').onclick = () => editContact(client.id, null, () => render(root, id));
  root.querySelectorAll('[data-edit-contact]').forEach((btn) => {
    btn.onclick = () => editContact(client.id, contacts.find((c) => c.id === btn.dataset.editContact), () => render(root, id));
  });

  root.querySelector('#add-followup').onclick = () => editFollowup(client.id, contacts, null, () => render(root, id));
  root.querySelectorAll('[data-done]').forEach((btn) => {
    btn.onclick = async () => {
      btn.disabled = true;
      try {
        await api(`/api/followups/${btn.dataset.done}`, { method: 'PATCH', body: { status: 'done' } });
        toast('跟进已记录');
        await render(root, id);
      } catch (err) { toast(err.message, 'err'); btn.disabled = false; }
    };
  });
  root.querySelectorAll('[data-del-followup]').forEach((btn) => {
    btn.onclick = async () => {
      if (!confirm('删除这条跟进？')) return;
      try {
        await api(`/api/followups/${btn.dataset.delFollowup}`, { method: 'DELETE' });
        await render(root, id);
      } catch (err) { toast(err.message, 'err'); }
    };
  });

  hydrateIcons(root);
}

function intel(label, text, tone, hint) {
  return `<div class="intel ${tone}">
    <div class="intel-label">${esc(label)}</div>
    <div class="intel-body">${text ? esc(text) : `<span class="faint">${esc(hint)}</span>`}</div>
  </div>`;
}

export function editContact(clientId, contact, onSaved) {
  const modal = openModal({
    title: contact ? '编辑联系人' : '添加联系人',
    body: `<form>
      <div class="form-grid">
        <div class="field"><label>姓名 *</label><input name="name" required value="${esc(contact?.name || '')}" placeholder="Anna Lind"></div>
        <div class="field"><label>职位</label><input name="title" value="${esc(contact?.title || '')}" placeholder="Purchasing Manager"></div>
        <div class="field"><label>邮箱</label><input name="email" type="email" value="${esc(contact?.email || '')}"></div>
        <div class="field"><label>电话</label><input name="phone" value="${esc(contact?.phone || '')}"></div>
        <div class="field"><label>WhatsApp</label><input name="whatsapp" value="${esc(contact?.whatsapp || '')}"></div>
        <div class="field"><label>沟通语言</label><input name="language" value="${esc(contact?.language || 'en')}"></div>
      </div>
      <label class="check"><input type="checkbox" name="is_primary" value="1" ${contact?.is_primary ? 'checked' : ''}> 主要联系人</label>
      <div class="field"><label>备注</label><textarea name="notes" rows="2">${esc(contact?.notes || '')}</textarea></div>
      <div class="modal-actions"><button class="btn primary" type="submit">保存</button></div>
    </form>`,
  });
  modal.querySelector('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = Object.fromEntries(new FormData(form).entries());
    data.is_primary = form.querySelector('[name="is_primary"]').checked ? 1 : 0;
    try {
      if (contact) await api(`/api/contacts/${contact.id}`, { method: 'PATCH', body: data });
      else await api('/api/contacts', { method: 'POST', body: { ...data, client_id: clientId } });
      closeModal();
      await onSaved?.();
    } catch (err) { toast(err.message, 'err'); }
  });
}

export function editFollowup(clientId, contacts, followup, onSaved) {
  const modal = openModal({
    title: followup ? '编辑跟进' : '记录一次跟进 / 安排下次',
    subtitle: '写清楚事实和下一步。没有下一步的跟进等于没跟进。',
    body: `<form>
      <div class="form-grid">
        <div class="field"><label>日期</label><input type="date" name="due_date" value="${esc(followup?.due_date || todayStr())}"></div>
        <div class="field"><label>渠道</label><select name="channel">
          ${Object.entries(CHANNEL).map(([k, v]) => `<option value="${k}" ${followup?.channel === k ? 'selected' : ''}>${v}</option>`).join('')}
        </select></div>
        <div class="field"><label>方向</label><select name="direction">
          <option value="out" ${followup?.direction === 'out' ? 'selected' : ''}>我方发出</option>
          <option value="in" ${followup?.direction === 'in' ? 'selected' : ''}>客户来信</option>
        </select></div>
        <div class="field"><label>联系人</label><select name="contact_id">
          <option value="">不指定</option>
          ${contacts.map((c) => `<option value="${esc(c.id)}" ${followup?.contact_id === c.id ? 'selected' : ''}>${esc(c.name)}${c.email ? ` · ${esc(c.email)}` : ''}</option>`).join('')}
        </select></div>
      </div>
      <div class="field"><label>本次沟通内容（事实）</label><textarea name="summary" rows="3" placeholder="客户问了什么、你回复了什么、对方的原话要点。">${esc(followup?.summary || '')}</textarea></div>
      <div class="form-grid">
        <div class="field"><label>下一步动作</label><input name="next_action" value="${esc(followup?.next_action || '')}" placeholder="例如：周二前发 FOB 报价 + 样品图"></div>
        <div class="field"><label>下次跟进日期</label><input type="date" name="next_date" value="${esc(followup?.next_date || '')}"></div>
      </div>
      <p class="small faint">标记「完成」时，如果填了下次日期，系统会自动生成一条新的待跟进。</p>
      <div class="modal-actions"><button class="btn primary" type="submit">保存</button></div>
    </form>`,
  });
  modal.querySelector('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    if (!data.contact_id) delete data.contact_id;
    try {
      if (followup) await api(`/api/followups/${followup.id}`, { method: 'PATCH', body: data });
      else await api('/api/followups', { method: 'POST', body: { ...data, client_id: clientId, status: 'planned' } });
      closeModal();
      await onSaved?.();
    } catch (err) { toast(err.message, 'err'); }
  });
}