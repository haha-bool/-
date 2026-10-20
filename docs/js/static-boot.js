/**
 * GitHub Pages 静态版入口。
 *
 * 没有 Node 服务时，用 sql.js 在浏览器里跑同一个 SQLite schema，
 * 再把 lib/api.mjs 的同一个路由器接到内存数据库上。
 * 数据写入 localStorage，因此每台设备各自独立、离线也能用。
 */
import { createApi } from '../lib/api.mjs';
import { BrowserStore, loadStoredDb, persistStore } from '../lib/store-browser.mjs';

const SQL = await initSqlJs({ locateFile: (file) => `./vendor/${file}` });
const seed = await (await fetch('./data/seed.json')).json();
const bytes = loadStoredDb();

let timer = null;
let store;
const schedulePersist = () => {
  clearTimeout(timer);
  timer = setTimeout(() => {
    try {
      persistStore(store);
    } catch (err) {
      console.warn('本地保存失败：', err);
    }
  }, 350);
};

store = BrowserStore.create(SQL, { seed, bytes, onDirty: schedulePersist });
window.__TRADEOS_STORE__ = store;

const handle = createApi(store, '.');
const call = async (path, { method = 'GET', body } = {}) => {
  const url = new URL(path, 'https://tradeos.static');
  let status = 200;
  let payload = '';
  const res = {
    writeHead(code) { status = code; return res; },
    end(chunk = '') { payload = chunk; return res; },
  };
  try {
    await handle({ method }, res, url, body ?? null);
  } catch (err) {
    throw new Error(err.message || '本地数据处理失败');
  }
  const data = payload ? JSON.parse(payload) : {};
  if (status >= 400 || data.ok === false) {
    throw new Error(data.error || `请求失败（HTTP ${status}）`);
  }
  return data;
};

window.__TRADEOS_STATIC__ = call;

// 首次打开或换了日期时，自动补齐当天的计划任务
const today = new Date();
const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
const hasTasks = store.get('SELECT 1 AS x FROM tasks WHERE due_date = ? LIMIT 1', [dateStr]);
if (!hasTasks) {
  try {
    await call('/api/tasks/generate', { method: 'POST', body: { date: dateStr } });
  } catch (err) {
    console.warn('自动生成今日任务失败：', err);
  }
}

// 顶部标注：这是静态版，数据只在本机浏览器
const badge = document.createElement('span');
badge.className = 'topbar-live static-badge';
badge.title = 'GitHub Pages 静态版：数据保存在当前浏览器的 localStorage';
badge.textContent = '静态版 · 本机存储';
const right = document.querySelector('.topbar-right');
if (right) right.insertBefore(badge, right.firstChild);

window.addEventListener('pagehide', () => {
  clearTimeout(timer);
  try { persistStore(store); } catch { /* ignore */ }
});

await import('./app.js');