import { api } from '../api.js';
import { esc, toast, icon, fmtNumber, todayStr, hydrateIcons } from '../dom.js';

const LEVEL_LABEL = { must: ['red', '必备'], high: ['amber', '高频'], plus: ['line', '加分'] };
const SELF_LABEL = ['没接触', '知道', '能解释', '能应用', '能教人'];

export default async function render(root) {
  const params = new URLSearchParams(location.hash.split('?')[1] || '');
  const tab = ['today', 'profile', 'goals', 'personality'].includes(params.get('tab')) ? params.get('tab') : 'today';
  const data = await api('/api/career');
  const { profile, personality, self, goals, milestones, picks, watched, principle, douyin, stats, jd } = data;

  root.innerHTML = `
    <div class="page-head">
      <div>
        <div class="eyebrow">CAREER · BOSS 岗位要求 · 能力 · 每日输入</div>
        <h1>岗位能力与每日推荐</h1>
        <p class="sub">${esc(profile.title)} · ${esc(profile.city)} · ${esc(profile.target)}。${esc(profile.summary)}</p>
      </div>
      <div class="head-actions">
        <a class="btn" href="#/plan">${icon('target', 14)} 全部目标</a>
        <a class="btn" href="#/crm">${icon('users', 14)} 去练客户</a>
      </div>
    </div>

    <div class="grid c4" style="margin-bottom:16px">
      ${stat('能力项', stats.items, `必备 ${stats.must} 项`)}
      ${stat('必备缺口', stats.mustGaps, `总共 ${stats.gaps} 项待补`, stats.mustGaps ? 'warn' : '')}
      ${stat('岗位目标进度', `${stats.goalProgress}%`, '按里程碑完成数计算')}
      ${stat('近 14 天输入', `${stats.watched14} 条`, `累计已看 ${stats.watchedTotal} 条`)}
    </div>

    <div class="pill-nav" id="tab-nav" style="margin-bottom:16px">
      ${[['today', `今日推荐 ${Object.keys(watched).length}/3`], ['profile', '岗位画像'], ['goals', '详细目标'], ['personality', '性格校准']]
        .map(([k, label]) => `<button data-tab="${k}" class="${tab === k ? 'on' : ''}">${label}</button>`).join('')}
    </div>

    <div id="career-body"></div>
  `;

  const body = root.querySelector('#career-body');
  root.querySelectorAll('#tab-nav button').forEach((btn) => {
    btn.onclick = () => { location.hash = `#/career?tab=${btn.dataset.tab}`; };
  });

  if (tab === 'today') {
    body.innerHTML = renderToday({ picks, watched, principle, douyin, personality, stats });
    bindToday();
  } else if (tab === 'profile') {
    body.innerHTML = renderProfile({ profile, self, stats, jd });
    bindProfile();
  } else if (tab === 'goals') {
    body.innerHTML = renderGoals({ goals, milestones });
    bindGoals();
  } else {
    body.innerHTML = renderPersonality(personality);
    bindPersonality();
  }

  function rerender() { render(root); }

  function bindToday() {
    body.querySelectorAll('[data-seen]').forEach((btn) => {
      btn.onclick = async () => {
        const id = btn.dataset.seen;
        const isWatched = Boolean(watched[id]);
        btn.disabled = true;
        try {
          if (isWatched) {
            await api(`/api/videos/${id}/seen?date=${todayStr()}`, { method: 'DELETE' });
          } else {
            await api(`/api/videos/${id}/seen`, { method: 'POST', body: { date: todayStr() } });
            toast('已记录，看完记得做那个动作');
          }
          await rerender();
        } catch (err) { toast(err.message, 'err'); btn.disabled = false; }
      };
    });
  }

  function bindProfile() {
    body.querySelectorAll('[data-self]').forEach((btn) => {
      btn.onclick = async () => {
        try {
          await api('/api/career/self', {
            method: 'POST',
            body: { key: btn.dataset.self, level: Number(btn.dataset.level) },
          });
          await rerender();
        } catch (err) { toast(err.message, 'err'); }
      };
    });
    body.querySelector('#jd-analyze')?.addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      const text = body.querySelector('#jd-text').value.trim();
      btn.disabled = true;
      try {
        const res = await api('/api/career/jd', { method: 'POST', body: { text } });
        body.querySelector('#jd-result').innerHTML = renderJdResult(res.jd);
        toast('已分析，往下看命中和缺口');
      } catch (err) {
        toast(err.message, 'err');
      } finally { btn.disabled = false; }
    });
  }

  function bindGoals() {
    body.querySelectorAll('[data-ms]').forEach((btn) => {
      btn.onclick = async () => {
        btn.disabled = true;
        try {
          await api(`/api/milestones/${btn.dataset.ms}`, {
            method: 'PATCH',
            body: { status: btn.dataset.next },
          });
          await rerender();
        } catch (err) { toast(err.message, 'err'); btn.disabled = false; }
      };
    });
  }

  function bindPersonality() {
    body.querySelectorAll('[data-trait]').forEach((group) => {
      const key = group.dataset.trait;
      group.querySelectorAll('button[data-score]').forEach((btn) => {
        btn.onclick = () => {
          group.querySelectorAll('button[data-score]').forEach((b) => b.classList.toggle('on', b === btn));
          group.dataset.value = btn.dataset.score;
        };
      });
    });
    body.querySelector('#save-traits').onclick = async () => {
      const traits = {};
      body.querySelectorAll('[data-trait]').forEach((g) => { traits[g.dataset.trait] = Number(g.dataset.value); });
      const note = body.querySelector('#trait-note').value;
      try {
        await api('/api/career/personality', { method: 'POST', body: { traits, note } });
        toast('已保存，推荐会按新的性格假设调整');
        await rerender();
      } catch (err) { toast(err.message, 'err'); }
    };
  }

  hydrateIcons(root);
}

/* ------------------------------------------------------------------ */

function stat(label, value, foot, tone = '') {
  return `<div class="stat ${tone === 'warn' ? 'stat-warn' : ''}">
    <span class="label">${esc(label)}</span><span class="value">${value}</span><span class="foot">${esc(foot)}</span>
  </div>`;
}

function renderToday({ picks, watched, principle, douyin, personality, stats }) {
  const done = picks.filter((p) => watched[p.id]).length;
  return `
    <div class="career-today">
      <div class="grid" style="gap:16px;min-width:0">
        <section class="principle-card">
          <div class="eyebrow" style="color:#8fd9be">TODAY'S PRINCIPLE · 销售的本质</div>
          <h2>${esc(principle.title)}</h2>
          <p>${esc(principle.body)}</p>
          <div class="principle-drill"><strong>今天练：</strong>${esc(principle.drill)}</div>
        </section>

        <div style="display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin-top:4px">
          <div class="divider-label" style="margin:0">今天看这 3 条 · ${done}/3</div>
          <span class="small faint">按日期轮换 · 看完做动作，不追求"刷完"</span>
        </div>

        ${picks.map((video, i) => videoCard(video, watched[video.id], i)).join('')}

        ${douyinCard(douyin)}
      </div>

      <aside class="grid" style="gap:16px">
        <section class="card">
          <div class="card-head"><h2>为什么推这些给你</h2></div>
          <div class="card-body">
            <p class="small muted">根据你的经历推断：${personality.traits.slice(0, 4).map((t) => `${t.label} ${t.score}/5`).join(' · ')}。</p>
            <div class="sep"></div>
            <ul class="why-list">
              <li><strong>销售本质优先</strong>：你容易"先做再说"，需要先把"客户为什么买"想清楚。</li>
              <li><strong>补流程短板</strong>：你的流程细节耐心偏低，所以每周至少 1 条报价/单证/流程内容。</li>
              <li><strong>短 + 长搭配</strong>：短的可当天练，长的周末整块看，避免只收藏不消化。</li>
              <li><strong>不推荐"三句话成交"</strong>：你的客户是 B2B 采购，不是街边冲动消费。</li>
            </ul>
            <div class="sep"></div>
            <a class="btn sm" href="#/career?tab=personality">调整我的性格假设 →</a>
          </div>
        </section>

        <section class="card">
          <div class="card-head"><h2>这周输入记录</h2></div>
          <div class="card-body">
            <div class="stat" style="border:0;box-shadow:none;padding:0">
              <span class="value">${stats.watched14}<small> 条 / 14 天</small></span>
              <span class="foot">推荐节奏：工作日 1 短 + 周末 1 长，别每天刷 5 条。</span>
            </div>
            <div class="sep"></div>
            <p class="small muted">看视频不算能力。判断标准只有一个：有没有产生一个动作（改一封邮件、加一条检查、练一次提问）。</p>
          </div>
        </section>

        <section class="card">
          <div class="card-head"><h2>岗位要求来源</h2></div>
          <div class="card-body">
            <p class="small muted">${esc(JOB_SOURCE)}</p>
            <div class="sep"></div>
            <p class="small faint">视频 BV 号、标题、UP 主与播放量在 2026-10-20 通过 B 站公开接口核对；平台内容会变，链接失效时按标题搜索。</p>
          </div>
        </section>
      </aside>
    </div>`;
}

const JOB_SOURCE = '按 BOSS 直聘外贸业务员/海外客户开发岗位公开要求结构归纳：平台操作、客户开发、报价核算、单证物流、英语邮件口语、沟通谈判、抗压执行。具体公司要求以你投递的 JD 为准。';

function videoCard(video, seen, index) {
  return `<article class="video-card ${seen ? 'seen' : ''}">
    <a class="video-thumb" href="${esc(video.url || `https://www.bilibili.com/video/${video.bvid}`)}" target="_blank" rel="noreferrer">
      ${video.pic ? `<img src="${esc(video.pic)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display='none'">` : '<div class="video-thumb-fallback"></div>'}
      <span class="video-duration">${esc(video.duration)}</span>
      <span class="video-platform">B站</span>
    </a>
    <div class="video-body">
      <div class="video-top">
        <span class="video-index">0${index + 1}</span>
        <span class="chip line">${esc(video.level)}</span>
        ${video.skills.slice(0, 2).map((s) => `<span class="chip green">${esc(s)}</span>`).join('')}
        ${seen ? '<span class="chip green">已看</span>' : ''}
      </div>
      <a class="video-title" href="${esc(video.url || `https://www.bilibili.com/video/${video.bvid}`)}" target="_blank" rel="noreferrer">${esc(video.title)}</a>
      <div class="video-meta">${esc(video.author)} · ${esc(video.play)}播放 · ${esc(video.duration)}</div>
      <div class="video-why"><strong>为什么给你：</strong>${esc(video.why)}</div>
      <div class="video-task"><strong>看完做：</strong>${esc(video.task)}</div>
      <div class="video-actions">
        <a class="btn sm" href="${esc(video.url || `https://www.bilibili.com/video/${video.bvid}`)}" target="_blank" rel="noreferrer">${icon('external', 12)} 打开 B 站</a>
        <button class="btn sm ${seen ? 'ghost' : 'primary'}" data-seen="${esc(video.id)}">${icon('check', 12)} ${seen ? '取消已看' : '标记已看'}</button>
      </div>
    </div>
  </article>`;
}

function douyinCard(douyin) {
  if (!douyin) return '';
  return `<article class="douyin-card">
    <div class="douyin-badge">抖音 · 补充</div>
    <div style="flex:1;min-width:0">
      <div style="font-weight:620;font-size:14px">${esc(douyin.title)}</div>
      <p class="small muted" style="margin-top:4px">${esc(douyin.why)}</p>
      <p class="small" style="margin-top:4px"><strong>看完做：</strong>${esc(douyin.task)}</p>
    </div>
    <a class="btn sm" href="${esc(douyin.url)}" target="_blank" rel="noreferrer">${icon('search', 12)} 搜索</a>
  </article>`;
}

function renderProfile({ profile, self, stats, jd }) {
  return `
    <section class="card" style="margin-bottom:16px">
      <div class="card-body">
        <p class="small muted">${esc(profile.sourceNote)}</p>
        <p class="small faint" style="margin-top:6px">自评标准：0 没接触 / 1 知道 / 2 能解释 / 3 能应用（在真实订单里做过）/ 4 能教人。必须达到 3 才算"能拿去面试"。必备项目标 3，高频 2，加分 1。</p>
      </div>
    </section>

    <section class="card" style="margin-bottom:16px">
      <div class="card-head">
        <div>
          <h2>粘贴一条 BOSS 直聘 JD</h2>
          <p class="small muted" style="margin-top:2px">用你真正想投的岗位，看看它在要什么、你还缺什么。分析只做关键词命中，不替代你读原文。</p>
        </div>
      </div>
      <div class="card-body" style="padding-top:4px">
        <div class="field">
          <textarea id="jd-text" rows="5" placeholder="把 BOSS 上的岗位职责 + 任职要求整段粘进来（至少 40 字）…">${esc(jd?.text || '')}</textarea>
        </div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <button class="btn primary" id="jd-analyze">${icon('search', 13)} 分析这条 JD</button>
          ${jd?.at ? `<span class="small faint">上次分析：${esc(jd.at.slice(0, 10))}</span>` : ''}
        </div>
        <div id="jd-result" style="margin-top:12px">${jd ? renderJdResult(jd) : ''}</div>
      </div>
    </section>
    ${profile.groups.map((group) => `
      <section class="card" style="margin-bottom:16px">
        <div class="card-head">
          <div>
            <h2>${esc(group.name)} <span class="faint" style="font-weight:400;font-size:12px">· ${esc(group.tagline)}</span></h2>
            <p class="small muted" style="margin-top:2px">${esc(group.summary)}</p>
          </div>
          <span class="chip line">${group.items.length} 项</span>
        </div>
        <div class="card-body" style="padding-top:4px">
          ${group.items.map((item) => {
            const [lcls, llabel] = LEVEL_LABEL[item.level] || LEVEL_LABEL.high;
            const score = Number(self[item.id] || 0);
            const target = item.level === 'must' ? 3 : item.level === 'high' ? 2 : 1;
            return `<div class="cap-row">
              <div class="cap-main">
                <div class="cap-title">
                  <strong>${esc(item.name)}</strong>
                  <span class="chip ${lcls}">${llabel}</span>
                  <span class="chip line">目标 ${target}/4</span>
                  ${score >= target ? '<span class="chip green">达标</span>' : ''}
                </div>
                <div class="cap-detail"><span class="cap-label">BOSS 常见写法</span>${esc(item.boss)}</div>
                <div class="cap-detail"><span class="cap-label">面试会问</span>${esc(item.interview)}</div>
                <div class="cap-detail"><span class="cap-label">你要拿出的证据</span>${esc(item.evidence)}</div>
              </div>
              <div class="cap-side">
                <div class="self-dots" role="group" aria-label="自评">
                  ${[0, 1, 2, 3, 4].map((n) => `<button data-self="${esc(item.id)}" data-level="${n}"
                    class="${n <= score ? 'on' : ''}" title="${SELF_LABEL[n]}">${n}</button>`).join('')}
                </div>
                <div class="small faint">${SELF_LABEL[score]}</div>
                <a class="small" style="color:var(--accent-ink)" href="#/plan">关联目标 →</a>
              </div>
            </div>`;
          }).join('')}
        </div>
      </section>`).join('')}
  `;
}

function renderJdResult(jd) {
  const a = jd?.analysis;
  if (!a) return '';
  const max = a.top[0]?.count || 1;
  return `
    <div class="jd-result">
      <div class="jd-summary">
        <span class="chip green">命中 ${a.hitCount} 项能力</span>
        <span class="chip ${a.mustHit === a.mustTotal ? 'green' : 'amber'}">必备命中 ${a.mustHit}/${a.mustTotal}</span>
        <span class="small faint">${a.chars} 字</span>
      </div>
      <div class="jd-bars">
        ${a.top.map((m) => `
          <div class="jd-bar-row">
            <span class="jd-bar-name">${esc(m.name)}</span>
            <div class="jd-bar"><i style="width:${Math.max(6, Math.round((m.count / max) * 100))}%"></i></div>
            <span class="jd-bar-count">${m.count}</span>
          </div>`).join('')}
      </div>
      ${a.missingMust.length ? `
        <div class="jd-missing">
          <div class="small faint" style="margin-bottom:4px">按词典未命中的必备项（可能只是 JD 没写，不代表不重要）</div>
          <div style="display:flex;gap:4px;flex-wrap:wrap">
            ${a.missingMust.slice(0, 12).map((n) => `<span class="chip line">${esc(n)}</span>`).join('')}
            ${a.missingMust.length > 12 ? `<span class="small faint">+${a.missingMust.length - 12}</span>` : ''}
          </div>
        </div>` : ''}
      <p class="small faint" style="margin-top:8px">关键词分析只说明 JD 提到了什么，不说明要求多高。真正判断要回到原文：这个岗位是"要你独立开发"，还是"只要跟单"？</p>
    </div>
  `;
}

function renderGoals({ goals, milestones }) {
  return `
    <div class="callout good" style="margin-bottom:16px">
      <strong>目标不是愿望，必须能被验证。</strong> 下面 4 个新目标 + 原有求职目标，共 ${milestones.length} 个里程碑。每个里程碑都对应一个可交付物；完成一个就在系统里勾掉，进度自动重算。
    </div>
    ${goals.map((goal) => {
      const list = milestones.filter((m) => m.goal_id === goal.id);
      const done = list.filter((m) => m.status === 'done').length;
      return `<section class="card" style="margin-bottom:16px">
        <div class="card-head">
          <div style="min-width:0">
            <h2>${esc(goal.title)}</h2>
            <p class="small muted" style="margin-top:3px">${esc(goal.why)}</p>
            <p class="small faint" style="margin-top:3px">衡量：${esc(goal.metric)}${goal.target_date ? ` · 截止 ${esc(goal.target_date)}` : ''}</p>
          </div>
          <div style="text-align:right;flex:0 0 auto">
            <div style="font-size:22px;font-weight:680">${goal.progress}%</div>
            <div class="small faint">${done}/${list.length}</div>
          </div>
        </div>
        <div class="card-body" style="padding-top:4px">
          <div class="progress" style="margin-bottom:10px"><i style="width:${goal.progress}%"></i></div>
          ${list.map((m) => `
            <div class="milestone ${m.status === 'done' ? 'done' : ''}">
              <button class="task-check" data-ms="${esc(m.id)}" data-next="${m.status === 'done' ? 'open' : 'done'}">${icon('check', 12)}</button>
              <div style="flex:1;min-width:0">
                <div class="m-title">${esc(m.title)}</div>
                ${m.due_date ? `<div class="small faint">${esc(m.due_date)}${m.status !== 'done' && m.due_date < todayStr() ? ' · 已过期' : ''}</div>` : ''}
              </div>
            </div>`).join('')}
        </div>
      </section>`;
    }).join('')}
  `;
}

function renderPersonality(personality) {
  return `
    <section class="card" style="margin-bottom:16px">
      <div class="card-body">
        <p class="small muted">${esc(personality.note)}</p>
        <p class="small faint" style="margin-top:4px">调整后，每日推荐的侧重点会变：流程分低 → 多排报价/单证；关系分高 → 多排倾听/信任；反馈需求高 → 多排短案例。</p>
      </div>
    </section>
    <div class="grid c2">
      ${personality.traits.map((trait) => `
        <section class="card trait-card" data-trait="${trait.key}" data-value="${trait.score}">
          <div class="card-body">
            <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
              <h2 style="font-size:15px;flex:1">${esc(trait.label)}</h2>
              <div class="score-picker">
                ${[1, 2, 3, 4, 5].map((n) => `<button data-score="${n}" class="${n === trait.score ? 'on' : ''}">${n}</button>`).join('')}
              </div>
            </div>
            <div class="trait-block"><span class="cap-label">这是你的优势</span>${esc(trait.strength)}</div>
            <div class="trait-block risk"><span class="cap-label">可能反咬你的地方</span>${esc(trait.risk)}</div>
            <div class="trait-block"><span class="cap-label">系统怎么帮你</span>${esc(trait.counter)}</div>
            <div class="trait-block faint"><span class="cap-label">推荐偏好</span>${esc(trait.content)}</div>
          </div>
        </section>`).join('')}
    </div>
    <section class="card" style="margin-top:16px">
      <div class="card-body">
        <div class="field"><label>补充说明（你的自我观察 / 别人对你的评价）</label>
          <textarea id="trait-note" rows="3">${esc(personality.note)}</textarea></div>
        <button class="btn primary" id="save-traits">保存性格假设</button>
      </div>
    </section>
  `;
}