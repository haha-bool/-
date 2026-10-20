import { api } from '../api.js';
import { esc, toast, icon, hydrateIcons } from '../dom.js';
import { SCENARIO_MAP } from '../scenarios.js';

const KIND_LABEL = { grammar: '语法', word: '用词', tone: '语气', structure: '结构' };

export default async function render(root, id) {
  const res = await api(`/api/sessions/${id}`);
  const s = res.item;
  const sc = SCENARIO_MAP[s.scenario_key];
  let checked = {};
  try { checked = JSON.parse(s.self_check || '{}'); } catch { checked = {}; }
  const answered = (s.user_answer || '').trim().length > 0;

  const [errors, expressions] = await Promise.all([api('/api/errors'), api('/api/expressions')]);
  const myErrors = errors.items.filter((e) => e.session_id === s.id);
  const myExps = expressions.items.filter((e) => e.session_id === s.id);

  const rubric = sc?.rubric || [
    ['task', '是否完成了题目要求'],
    ['structure', '结构是否清楚'],
    ['accuracy', '术语与数字是否准确'],
    ['tone', '语气是否得体'],
    ['clarity', '是否简洁易读'],
  ];

  root.innerHTML = `
    <div class="page-head">
      <div style="max-width:78ch">
        <a class="small muted" href="#/english" style="display:inline-flex;align-items:center;gap:5px;margin-bottom:8px">
          ${icon('arrowLeft', 13)} 训练室
        </a>
        <h1>${esc(s.scenario)}</h1>
        <p class="sub">${esc(s.goal || sc?.goal || '')}</p>
      </div>
      <div class="head-actions">
        <span class="chip ${s.status === 'reviewed' ? 'green' : 'line'}">${s.status === 'reviewed' ? '已自检' : '草稿'}</span>
      </div>
    </div>

    <div class="split">
      <div class="main-col grid" style="gap:16px">
        <section class="card">
          <div class="card-head"><h2>业务背景</h2></div>
          <div class="card-body"><div style="white-space:pre-wrap;font-size:13.8px;color:#33463d;line-height:1.75">${esc(s.context || sc?.context || '')}</div>
            ${sc ? `<div class="sep"></div><div class="callout good"><strong>任务：</strong>${esc(sc.task)}</div>` : ''}
          </div>
        </section>

        <section class="card">
          <div class="card-head">
            <h2>你的作答</h2>
            <span class="hint" id="wc">${countWords(s.user_answer)} 词</span>
          </div>
          <div class="card-body">
            <textarea id="answer" class="speak-box" placeholder="先自己写。写不出来就先列提纲，再逐句展开。">${esc(s.user_answer || '')}</textarea>
            <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px;flex-wrap:wrap">
              <button class="btn" id="save-draft">保存草稿</button>
              <button class="btn primary" id="submit">保存并自检</button>
            </div>
          </div>
        </section>

        ${answered ? `
        <section class="card">
          <div class="card-head"><h2>本地检查</h2><span class="hint">启发式规则，不是评分</span></div>
          <div class="card-body" id="lint"></div>
        </section>

        <section class="card">
          <div class="card-head"><h2>自检对照</h2><span class="hint">勾选你已经做到的</span></div>
          <div class="card-body">
            <div class="selfcheck">
              ${rubric.map(([key, label]) => `
                <label class="check">
                  <input type="checkbox" data-rubric="${esc(key)}" ${checked[key] ? 'checked' : ''}>
                  <span>${esc(label)}</span>
                </label>`).join('')}
            </div>
            ${sc ? `<div class="sep"></div>
              <div class="small muted" style="margin-bottom:6px">结构对照（不是范文，是骨架）</div>
              <div class="small" style="color:#33463d">${sc.structure.map((x) => `· ${esc(x)}`).join('<br>')}</div>` : ''}
            ${sc ? `<div class="sep"></div>
              <div class="small muted" style="margin-bottom:6px">这类写作最常见的错误</div>
              <div class="small" style="color:#b45309">${sc.pitfalls.map((x) => `· ${esc(x)}`).join('<br>')}</div>` : ''}
          </div>
        </section>

        ${sc ? `<section class="card">
          <div class="card-head">
            <h2>AI 反馈包</h2>
            <button class="btn sm" id="copy-prompt">${icon('copy', 13)} 复制</button>
          </div>
          <div class="card-body">
            <p class="small muted" style="margin-bottom:8px">本系统不内置 AI 自动评分。把下面这段复制到任意 AI 对话里，能拿到逐句修改与解释。</p>
            <pre class="prompt-box" id="prompt-text">${esc(buildPrompt(s, sc, rubric))}</pre>
          </div>
        </section>` : ''}

        <section class="card">
          <div class="card-head"><h2>错误记录</h2><span class="hint">${myErrors.length} 条</span></div>
          <div class="card-body">
            ${myErrors.map((e) => `<div style="margin-bottom:8px">
              <span class="chip line">${KIND_LABEL[e.kind] || esc(e.kind)}</span>
              <div class="small" style="text-decoration:line-through;color:#b42318;margin-top:3px">${esc(e.wrong)}</div>
              <div class="small" style="color:#0a5c43">→ ${esc(e.correct)}</div>
              ${e.rule ? `<div class="small faint">${esc(e.rule)}</div>` : ''}
            </div>`).join('')}
            <details>
              <summary>记一条错误</summary>
              <form id="err-form" style="margin-top:8px">
                <div class="row">
                  <div class="field"><label>类型</label>
                    <select name="kind">${Object.entries(KIND_LABEL).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select>
                  </div>
                  <div class="field" style="flex:2"><label>我原本写的 / 想说的</label><input name="wrong" required></div>
                </div>
                <div class="field"><label>更准确的表达</label><input name="correct" required></div>
                <div class="field"><label>规则 / 为什么</label><input name="rule" placeholder="例如：正式邮件不用缩写 I'm，用 I am"></div>
                <button class="btn sm primary" type="submit">保存</button>
              </form>
            </details>
          </div>
        </section>

        <section class="card">
          <div class="card-head"><h2>可复用表达</h2><span class="hint">${myExps.length} 条</span></div>
          <div class="card-body">
            ${myExps.map((x) => `<div style="margin-bottom:6px"><div class="small" style="font-weight:550">${esc(x.en)}</div>
              <div class="small faint">${esc(x.zh || '')}</div></div>`).join('')}
            <details>
              <summary>存一条表达</summary>
              <form id="exp-form" style="margin-top:8px">
                <div class="field"><label>英文句子</label><input name="en" required placeholder="Please confirm the target port so we can quote accurately."></div>
                <div class="field"><label>中文</label><input name="zh" placeholder="请确认目的港，以便准确报价。"></div>
                <div class="field"><label>分类</label><input name="category" placeholder="开发信 / 报价 / 售后" value="general"></div>
                <button class="btn sm primary" type="submit">保存</button>
              </form>
            </details>
          </div>
        </section>
        ` : `<div class="empty">写完并提交后，这里会出现本地检查、自检清单、结构对照和 AI 反馈包。</div>`}
      </div>

      <div class="side-col grid" style="gap:16px">
        ${sc ? `<section class="card">
          <div class="card-head"><h2>写作要点</h2></div>
          <div class="card-body">
            ${sc.hints.map((h) => `<div class="small" style="margin-bottom:6px;color:#33463d">· ${esc(h)}</div>`).join('')}
          </div>
        </section>` : ''}
        <section class="card">
          <div class="card-head"><h2>提交前问自己</h2></div>
          <div class="card-body">
            <p class="small muted">1. 客户看完，知道下一步做什么吗？</p>
            <p class="small muted">2. 有没有一句是"模板话"，换成任何公司都成立？</p>
            <p class="small muted">3. 数字、术语、日期，是否经得起追问？</p>
          </div>
        </section>
      </div>
    </div>
  `;

  const answerEl = root.querySelector('#answer');
  const wcEl = root.querySelector('#wc');
  answerEl?.addEventListener('input', () => {
    wcEl.textContent = `${countWords(answerEl.value)} 词`;
  });

  if (answered) renderLint(root, s, sc, rubric, checked);

  root.querySelector('#save-draft')?.addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    btn.disabled = true;
    try {
      await api(`/api/sessions/${s.id}`, { method: 'PATCH', body: { user_answer: answerEl.value, status: 'draft' } });
      toast('草稿已保存');
      await render(root, s.id);
    } catch (err) {
      toast(err.message, 'err');
      btn.disabled = false;
    }
  });

  root.querySelector('#submit')?.addEventListener('click', async (e) => {
    if (countWords(answerEl.value) < 20) return toast('先写够 20 词再提交，太短看不出问题', 'err');
    const btn = e.currentTarget;
    btn.disabled = true;
    try {
      await api(`/api/sessions/${s.id}`, {
        method: 'PATCH',
        body: { user_answer: answerEl.value, self_check: JSON.stringify(collectChecks(root)), status: 'reviewed' },
      });
      toast('已保存，下面是检查结果');
      await render(root, s.id);
    } catch (err) {
      toast(err.message, 'err');
      btn.disabled = false;
    }
  });

  root.querySelectorAll('[data-rubric]').forEach((cb) => {
    cb.addEventListener('change', async () => {
      try {
        await api(`/api/sessions/${s.id}`, { method: 'PATCH', body: { self_check: JSON.stringify(collectChecks(root)) } });
      } catch { /* 静默失败，不打断写作 */ }
    });
  });

  root.querySelector('#copy-prompt')?.addEventListener('click', async () => {
    const text = root.querySelector('#prompt-text').textContent;
    try {
      await navigator.clipboard.writeText(text);
      toast('已复制，去 AI 对话里粘贴');
    } catch {
      toast('复制失败，请手动选中复制', 'err');
    }
  });

  root.querySelector('#err-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    try {
      await api('/api/errors', { method: 'POST', body: { ...data, session_id: s.id } });
      toast('已记录');
      await render(root, s.id);
    } catch (err) { toast(err.message, 'err'); }
  });

  root.querySelector('#exp-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    try {
      await api('/api/expressions', { method: 'POST', body: { ...data, session_id: s.id } });
      toast('已保存');
      await render(root, s.id);
    } catch (err) { toast(err.message, 'err'); }
  });

  hydrateIcons(root);
}

function countWords(text) {
  return (text || '').trim().split(/\s+/).filter(Boolean).length;
}

function collectChecks(root) {
  const out = {};
  root.querySelectorAll('[data-rubric]').forEach((cb) => { out[cb.dataset.rubric] = cb.checked; });
  return out;
}

function renderLint(root, s, sc, rubric, checked) {
  const text = s.user_answer || '';
  const words = countWords(text);
  const lower = text.toLowerCase();
  const sentences = text.split(/[.!?]+/).map((x) => x.trim()).filter(Boolean);
  const avgLen = sentences.length ? Math.round(words / sentences.length) : 0;
  const hasGreeting = /^[ \t]*(dear|hi|hello)\b/im.test(text);
  const hasClose = /(best regards|kind regards|regards|sincerely|best wishes|looking forward)/i.test(lower);
  const hasSubject = /^subject:/im.test(text);
  const banned = ['leading manufacturer', 'best price', 'lowest price', 'just following up', 'any update',
    'we are a professional', 'please kindly', 'hope you are doing well'];
  const hits = banned.filter((b) => lower.includes(b));
  const isEmail = ['dev_email', 'inquiry_reply', 'quotation', 'followup', 'negotiation', 'delay', 'complaint', 'payment_terms', 'spec_clarify'].includes(s.scenario_key);
  const checkedCount = Object.values(checked).filter(Boolean).length;

  const items = [
    [words >= 60 && words <= 200, `篇幅 ${words} 词${words < 60 ? '，偏短，信息可能不够' : words > 200 ? '，偏长，客户可能不看完' : '，在合理区间'}`],
    [hasGreeting || !isEmail, hasGreeting ? '有称呼' : '没有称呼（Dear / Hi + 名字）'],
    [hasClose || !isEmail, hasClose ? '有结尾语' : '没有结尾（Best regards 等）'],
    [hasSubject || !isEmail, hasSubject ? '有主题行' : '没有主题行（Subject: …）'],
    [avgLen <= 22, `平均句长 ${avgLen} 词${avgLen > 22 ? '，偏长，拆短一点' : ''}`],
    [hits.length === 0, hits.length ? `出现模板化表达：${hits.join('、')}` : '没有明显模板化表达'],
    [checkedCount >= 3, `自检通过 ${checkedCount}/${rubric.length} 项`],
  ];

  root.querySelector('#lint').innerHTML = `
    <div class="list-plain">
      ${items.map(([ok, label]) => `<div style="display:flex;gap:9px;align-items:flex-start;padding:7px 0">
        <span style="color:${ok ? '#0e7c5a' : '#b45309'};margin-top:2px">${icon(ok ? 'check' : 'alert', 14)}</span>
        <span class="small" style="color:${ok ? '#33463d' : '#b45309'}">${esc(label)}</span>
      </div>`).join('')}
    </div>
    <p class="small faint" style="margin-top:8px">这些只是最低限度检查。语法是否地道、逻辑是否成立，仍需 AI 复核或老师反馈。</p>`;
  hydrateIcons(root.querySelector('#lint'));
}

function buildPrompt(s, sc, rubric) {
  return `你是外贸商务英语写作教练。请批改下面这封英文商务邮件/口语稿。

【场景】${s.scenario}
【业务背景】
${s.context || sc?.context || ''}
【任务要求】
${sc?.task || s.goal || ''}
【我的作答】
${s.user_answer || ''}

请按以下结构输出，不要泛泛而谈：
1. 逐句诊断：引用原句 → 问题类型（语法/用词/语气/结构/事实）→ 修改后 → 一句为什么。
2. 重写版本：保留我的信息与立场，不要新增我没提供的事实或数字。
3. 三个可复用表达：英文 + 中文 + 适用场合。
4. 事实与风险检查：我写的价格、交期、付款条件、承诺，是否有前后矛盾或过度承诺。
5. 下一次只练一个点：指出我最需要改的一个问题。

评分维度（1-5 分，并说明扣分原因）：${rubric.map(([, label]) => label).join('；')}。
要求：严格但具体；不要用 "good job" 这类空话；如果我的表达已经正确但不够自然，指出来并给更自然的版本。`;
}