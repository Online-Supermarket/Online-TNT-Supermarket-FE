import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const target = process.argv[2] || 'dist';
const remote = /^https?:\/\//.test(target);
const base = new URL(remote ? target : 'https://build.invalid/');
base.pathname = '/';
base.search = '';
base.hash = '';

async function readAsset(path, javascript = false) {
  if (!remote) return readFile(resolve(target, '.' + path), 'utf8');
  const response = await fetch(new URL(path, base), {
    cache: 'no-store',
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(path + ' returned HTTP ' + response.status);
  if (javascript) {
    const mime = (response.headers.get('content-type') || '').split(';')[0].trim();
    if (!['text/javascript', 'application/javascript'].includes(mime)) {
      throw new Error(path + ' has invalid JavaScript MIME type: ' + mime);
    }
  }
  return response.text();
}

try {
  const html = await readAsset('/index.html');
  const modules = [...html.matchAll(/<script\b[^>]*>/gi)]
    .map(([tag]) => tag)
    .filter(tag => /\btype\s*=\s*["']module["']/i.test(tag))
    .map(tag => tag.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1]);
  if (!modules.length) throw new Error('No compiled module entry found in index.html.');

  for (const src of modules) {
    if (!src) throw new Error('Expected an external Vite module entry.');
    const url = new URL(src, base);
    if (url.origin !== base.origin || !/^\/assets\/.+\.(?:m?js)$/.test(url.pathname)) {
      throw new Error('Expected a compiled /assets/*.js entry; found ' + src +
        '. Build with Vite and upload dist, not the source directory.');
    }
    const body = await readAsset(url.pathname, true);
    if (!body.trim() || /^\s*<!doctype html/i.test(body)) {
      throw new Error(url.pathname + ' is empty or contains fallback HTML.');
    }
  }
  if (!remote) JSON.parse(await readAsset('/staticwebapp.config.json'));
  console.log('Verified compiled JavaScript entries' + (remote ? ' and live MIME types' : ' and SWA config') + ': ' + target);
} catch (error) {
  console.error('Frontend deployment check failed: ' + error.message);
  process.exitCode = 1;
}
