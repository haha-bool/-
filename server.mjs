/**
 * 本地服务：零依赖 HTTP 服务器
 * - 静态资源：public/
 * - API：/api/*
 * - 启动时自动做一次数据快照（data/backups）
 * - 端口被占用时自动顺延
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { Store } from './lib/db.mjs';
import { seedIfEmpty } from './lib/seed.mjs';
import { seedCareer } from './lib/career.mjs';
import { createApi } from './lib/api.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(ROOT, 'public');
const DATA = path.join(ROOT, 'data');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
};

const store = new Store(DATA);
const firstSeed = seedIfEmpty(store);
try {
  seedCareer(store);
} catch (err) {
  console.warn('[career seed] 跳过：', err.message);
}
try {
  store.backup();
} catch (err) {
  console.warn('[backup] 跳过：', err.message);
}

const api = createApi(store, ROOT);

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > 30 * 1024 * 1024) {
        reject(new Error('请求体过大'));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) return resolve(null);
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('请求体不是合法 JSON'));
      }
    });
    req.on('error', reject);
  });
}

function serveStatic(req, res, pathname) {
  let rel = decodeURIComponent(pathname);
  if (rel === '/' || rel === '') rel = '/index.html';
  const filePath = path.normalize(path.join(PUBLIC, rel));
  if (!filePath.startsWith(PUBLIC)) {
    res.writeHead(403).end('Forbidden');
    return;
  }
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('Not found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'content-type': MIME[ext] || 'application/octet-stream',
      'cache-control': ext === '.html' ? 'no-store' : 'no-cache',
      'content-length': stat.size,
    });
    fs.createReadStream(filePath).pipe(res);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname.startsWith('/api/')) {
    let body = null;
    if (req.method === 'POST' || req.method === 'PATCH' || req.method === 'PUT') {
      try {
        body = await readBody(req);
      } catch (err) {
        res.writeHead(400, { 'content-type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
        return;
      }
    }
    return api(req, res, url, body);
  }
  return serveStatic(req, res, url.pathname);
});

const BASE_PORT = Number(process.env.PORT || 7788);

function listen(port, attempt = 0) {
  server.once('error', (err) => {
    if (err.code === 'EADDRINUSE' && attempt < 20) {
      listen(port + 1, attempt + 1);
    } else {
      console.error('启动失败：', err.message);
      process.exit(1);
    }
  });
  server.listen(port, '127.0.0.1', () => {
    const url = `http://127.0.0.1:${port}`;
    console.log('');
    console.log('  个人外贸操作系统  Personal Foreign Trade OS');
    console.log('  ------------------------------------------');
    console.log(`  地址:  ${url}`);
    console.log(`  数据:  ${path.join(DATA, 'trade-os.db')}`);
    console.log(`  备份:  ${path.join(DATA, 'backups')}`);
    console.log(`  状态:  ${firstSeed ? '已写入初始数据' : '使用已有数据'}`);
    console.log('');
    console.log('  关闭：在此窗口按 Ctrl+C');
    console.log('');
    if (process.argv.includes('--open')) {
      try {
        if (process.platform === 'win32') {
          spawn('cmd', ['/c', 'start', '', url], { detached: true, stdio: 'ignore' }).unref();
        } else if (process.platform === 'darwin') {
          spawn('open', [url], { detached: true, stdio: 'ignore' }).unref();
        } else {
          spawn('xdg-open', [url], { detached: true, stdio: 'ignore' }).unref();
        }
      } catch {
        /* 打不开浏览器时用户可手动访问 */
      }
    }
    store.meta.set('last_started_at', new Date().toISOString());
  });
}

listen(BASE_PORT);

process.on('SIGINT', () => {
  try { store.backup(); } catch { /* ignore */ }
  console.log('\n已退出，数据已保存。');
  process.exit(0);
});