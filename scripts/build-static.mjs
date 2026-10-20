/**
 * 生成 GitHub Pages 静态版（docs/）。
 *
 * 用法：node scripts/build-static.mjs
 *
 * - 复用 public/ 的前端与 lib/ 的纯逻辑（不复制 node:sqlite 的 db.mjs）
 * - 给 docs/js/api.js 注入静态 API 开关
 * - 保留 docs/vendor（sql.js）与 docs/data/seed.json，不覆盖线上数据快照
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const docs = path.join(root, 'docs');
const pub = path.join(root, 'public');

fs.mkdirSync(path.join(docs, 'js'), { recursive: true });
fs.mkdirSync(path.join(docs, 'lib'), { recursive: true });
fs.mkdirSync(path.join(docs, 'data'), { recursive: true });
fs.mkdirSync(path.join(docs, 'vendor'), { recursive: true });

// 1. 前端资源
fs.cpSync(path.join(pub, 'js'), path.join(docs, 'js'), { recursive: true });
fs.copyFileSync(path.join(pub, 'styles.css'), path.join(docs, 'styles.css'));

// 2. 浏览器可用的纯逻辑模块（不要复制 db.mjs）
for (const file of ['api.mjs', 'schema.mjs', 'quote.mjs', 'docs.mjs', 'career.mjs', 'videos.mjs']) {
  fs.copyFileSync(path.join(root, 'lib', file), path.join(docs, 'lib', file));
}

// 3. 静态 API 开关
const apiPath = path.join(docs, 'js', 'api.js');
let apiJs = fs.readFileSync(apiPath, 'utf8');
if (!apiJs.includes('__TRADEOS_STATIC__')) {
  apiJs = apiJs.replace(
    'export async function api(path, { method = \'GET\', body } = {}) {',
    `export async function api(path, { method = 'GET', body } = {}) {
  // GitHub Pages 静态版：不经过网络，直接调用浏览器内的 SQLite + 同一套 API 路由
  if (window.__TRADEOS_STATIC__) {
    return window.__TRADEOS_STATIC__(path, { method, body });
  }`
  );
}
fs.writeFileSync(apiPath, apiJs, 'utf8');

// 4. 入口 HTML：相对路径 + sql.js + 静态启动器
let html = fs.readFileSync(path.join(pub, 'index.html'), 'utf8');
html = html
  .replace('href="/styles.css"', 'href="./styles.css"')
  .replace(
    '<script type="module" src="/js/app.js"></script>',
    '<script src="./vendor/sql-wasm.js"></script>\n  <script type="module" src="./js/static-boot.js"></script>'
  )
  .replace('<span class="topbar-live"><span class="dot-live"></span>本地运行</span>', '')
  .replace('正在载入你的工作台…', '正在载入静态工作台（首次需要下载约 660KB 数据库引擎）…');
fs.writeFileSync(path.join(docs, 'index.html'), html, 'utf8');

console.log('静态版已生成：docs/');
console.log('提示：docs/data/seed.json 是首次打开时的初始数据，不会随本机数据库自动变化。');