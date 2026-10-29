// Servidor local que imita a Vercel: sirve dist/ con URLs limpias, aplica las
// cabeceras de vercel.json, comprime (br/gzip) y ejecuta las funciones de /api.
// Uso: npm run dev   (o npm run serve si ya está hecho el build)
// Las variables de entorno se leen de .env.local si existe (ver .env.example).

import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { gzipSync, brotliCompressSync } from 'node:zlib';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.resolve(root, process.env.DIST || 'dist');
const port = Number(process.env.PORT || 3000);

const envFile = path.join(root, '.env.local');
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const config = JSON.parse(readFileSync(path.join(root, 'vercel.json'), 'utf8'));
const rules = config.headers.map((h) => ({ re: new RegExp(`^${h.source.replace(/\(\.\*\)/g, '.*')}$`), headers: h.headers }));
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.txt': 'text/plain; charset=utf-8',
};
const COMPRESS = /^(text\/|application\/(json|manifest)|image\/svg)/;
const handlers = {};

// En local se sirve por http: se quita upgrade-insecure-requests (WebKit lo
// aplica también a localhost). El resto de la CSP es idéntica a producción.
function applyHeaders(res, urlPath) {
  for (const r of rules) {
    if (!r.re.test(urlPath)) continue;
    for (const h of r.headers) {
      res.setHeader(h.key, h.key === 'Content-Security-Policy' ? h.value.replace(/;\s*upgrade-insecure-requests/, '') : h.value);
    }
  }
}

async function resolveFile(urlPath) {
  const clean = path.normalize(decodeURIComponent(urlPath)).replace(/^(\.\.[/\\])+/, '');
  const candidates = clean.endsWith('/') ? [path.join(clean, 'index.html')] : [clean, `${clean}.html`];
  for (const c of candidates) {
    const file = path.join(dist, c);
    if (!file.startsWith(dist)) continue;
    try {
      if ((await stat(file)).isFile()) return file;
    } catch {}
  }
  return null;
}

async function serveApi(req, res, name) {
  if (!handlers[name]) {
    const file = path.join(root, 'api', `${name}.js`);
    if (!existsSync(file)) return false;
    handlers[name] = (await import(pathToFileURL(file).href)).default;
  }
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) if (typeof v === 'string') headers.set(k, v);
  headers.set('x-forwarded-for', req.socket.remoteAddress || '127.0.0.1');
  const request = new Request(`http://${req.headers.host}${req.url}`, {
    method: req.method,
    headers,
    body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks),
  });
  const response = await handlers[name].fetch(request);
  applyHeaders(res, req.url.split('?')[0]);
  res.writeHead(response.status, Object.fromEntries(response.headers));
  res.end(Buffer.from(await response.arrayBuffer()));
  return true;
}

const server = http.createServer(async (req, res) => {
  const urlPath = req.url.split('?')[0];
  try {
    const api = urlPath.match(/^\/api\/([a-z]+)$/);
    if (api && (await serveApi(req, res, api[1]))) return;

    // URLs limpias como en Vercel: /privacidad.html → /privacidad
    if (urlPath.endsWith('.html')) {
      res.writeHead(308, { location: urlPath.replace(/(index)?\.html$/, '') || '/' });
      return res.end();
    }
    let file = await resolveFile(urlPath === '/' ? '/index.html' : urlPath);
    let status = 200;
    if (!file) {
      file = path.join(dist, '404.html');
      status = 404;
    }
    const type = TYPES[path.extname(file)] || 'application/octet-stream';
    let body = await readFile(file);
    applyHeaders(res, urlPath);
    res.setHeader('content-type', type);
    res.setHeader('accept-ranges', 'bytes');
    // Safari pide los vídeos por rangos (Range: bytes=0-1); Vercel también lo hace así.
    const range = String(req.headers.range || '').match(/^bytes=(\d*)-(\d*)$/);
    if (range && status === 200) {
      const start = range[1] ? Number(range[1]) : Math.max(0, body.length - Number(range[2]));
      const end = range[1] && range[2] ? Math.min(Number(range[2]), body.length - 1) : body.length - 1;
      res.writeHead(206, { 'content-range': `bytes ${start}-${end}/${body.length}`, 'content-length': end - start + 1 });
      return res.end(req.method === 'HEAD' ? undefined : body.subarray(start, end + 1));
    }
    const accept = String(req.headers['accept-encoding'] || '');
    if (COMPRESS.test(type) && body.length > 1024) {
      if (accept.includes('br')) {
        body = brotliCompressSync(body);
        res.setHeader('content-encoding', 'br');
      } else if (accept.includes('gzip')) {
        body = gzipSync(body);
        res.setHeader('content-encoding', 'gzip');
      }
      res.setHeader('vary', 'Accept-Encoding');
    }
    res.writeHead(status);
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch (err) {
    console.error(err);
    res.writeHead(500);
    res.end('Error');
  }
});

server.listen(port, () => console.log(`Landing en http://localhost:${port}`));
