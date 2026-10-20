import { hydrateIcons } from './dom.js';
import dashboard from './views/dashboard.js';
import tasks from './views/tasks.js';
import knowledgeList from './views/knowledge-list.js';
import knowledgeDetail from './views/knowledge-detail.js';
import englishHome from './views/english-home.js';
import englishSession from './views/english-session.js';
import plan from './views/plan.js';
import review from './views/review.js';
import settings from './views/settings.js';
import crm from './views/crm.js';
import crmDetail from './views/crm-detail.js';
import quotes from './views/quotes.js';
import quoteEditor from './views/quote-editor.js';
import quoteDetail from './views/quote-detail.js';
import docs from './views/docs.js';
import career from './views/career.js';

const ROUTES = [
  [/^\/$/, dashboard, '/'],
  [/^\/tasks$/, tasks, '/tasks'],
  [/^\/knowledge$/, knowledgeList, '/knowledge'],
  [/^\/knowledge\/([^/]+)$/, knowledgeDetail, '/knowledge'],
  [/^\/english$/, englishHome, '/english'],
  [/^\/english\/([^/]+)$/, englishSession, '/english'],
  [/^\/crm$/, crm, '/crm'],
  [/^\/crm\/([^/]+)$/, crmDetail, '/crm'],
  [/^\/quotes$/, quotes, '/quotes'],
  [/^\/quotes\/new$/, quoteEditor, '/quotes'],
  [/^\/quotes\/([^/]+)\/edit$/, quoteEditor, '/quotes'],
  [/^\/quotes\/([^/]+)$/, quoteDetail, '/quotes'],
  [/^\/docs$/, docs, '/docs'],
  [/^\/career$/, career, '/career'],
  [/^\/plan$/, plan, '/plan'],
  [/^\/review$/, review, '/review'],
  [/^\/settings$/, settings, '/settings'],
];

const view = document.getElementById('view');

const SECTION_LABEL = {
  '/': '驾驶舱',
  '/tasks': '今日任务',
  '/knowledge': '知识库',
  '/english': '英语训练',
  '/crm': '客户 CRM',
  '/quotes': '报价与利润',
  '/docs': '商务文档',
  '/career': '岗位与每日推荐',
  '/plan': '目标与项目',
  '/review': '复盘',
  '/settings': '设置与数据',
};

function setActive(section) {
  document.querySelectorAll('.nav-item').forEach((item) => {
    item.classList.toggle('active', item.dataset.route === section);
  });
  const crumb = document.getElementById('crumb-label');
  if (crumb) crumb.textContent = SECTION_LABEL[section] || '工作台';
}

export function hashQuery() {
  const raw = location.hash.replace(/^#/, '');
  const q = raw.includes('?') ? raw.slice(raw.indexOf('?') + 1) : '';
  return new URLSearchParams(q);
}

function currentPath() {
  const raw = decodeURIComponent(location.hash.replace(/^#/, '')) || '/';
  const path = raw.split('?')[0];
  return path.startsWith('/') ? path : `/${path}`;
}

async function route() {
  const path = currentPath();
  const match = ROUTES.find(([re]) => re.test(path));
  if (!match) {
    view.innerHTML = `<div class="empty">页面不存在：${path} <br><a href="#/" style="color:#0e7c5a">回到驾驶舱</a></div>`;
    return;
  }
  const [re, renderFn, section] = match;
  const params = path.match(re).slice(1);
  setActive(section);
  view.innerHTML = `<div class="boot"><div class="spin"></div><p>载入中…</p></div>`;
  try {
    await renderFn(view, ...params);
    view.focus({ preventScroll: true });
    hydrateIcons(view);
  } catch (err) {
    console.error(err);
    view.innerHTML = `<div class="empty">加载失败：${err.message}<br><br>
      <button class="btn" onclick="location.reload()">重新载入</button></div>`;
  }
}

window.addEventListener('hashchange', () => {
  route();
  window.scrollTo({ top: 0 });
});

let started = false;
function start() {
  if (started) return;
  started = true;
  hydrateIcons(document);
  const dateEl = document.getElementById('top-date');
  if (dateEl) {
    const now = new Date();
    const week = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][now.getDay()];
    dateEl.textContent = `${now.getMonth() + 1}月${now.getDate()}日 · ${week}`;
  }
  if (!location.hash) location.hash = '#/';
  else route();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start);
} else {
  start();
}