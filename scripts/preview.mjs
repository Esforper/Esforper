/**
 * Local preview server. Dev-only -- nothing here ships to GitHub.
 *
 * Renders README.md through GitHub's *own* Markdown API and wraps it in
 * GitHub's *own* stylesheet, so what you see locally is what the profile page
 * will show. Guessing at GitHub's renderer is how people ship a README that
 * looks broken only in production.
 *
 *   npm run preview   serve, reload on change
 *   npm run dev       same, but rebuild assets on change first
 *
 * The two network calls (markdown render, stylesheet) are cached on disk under
 * .cache/. Offline, it degrades to passing the file through nearly verbatim --
 * which works better than it sounds, because this README is mostly raw HTML.
 */

import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, readdir, stat } from 'node:fs/promises';
import { watch } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, extname, resolve, relative, sep } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(join(fileURLToPath(import.meta.url), '..', '..'));
const CACHE = join(ROOT, '.cache');
const PORT = Number(process.env.PORT ?? 4000);
const REBUILD = process.argv.includes('--rebuild');

const MIME = {
  '.svg': 'image/svg+xml; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
};

const sha = (s) => createHash('sha256').update(s).digest('hex').slice(0, 16);

// Declared up here, not at the bottom: the stylesheet fetch runs at module load
// and would hit the temporal dead zone if this lived below it.
const FALLBACK_CSS = `.markdown-body{font-family:-apple-system,Segoe UI,sans-serif;line-height:1.6;color:#e6edf3}
.markdown-body img{max-width:100%}.markdown-body a{color:#58a6ff}
.markdown-body table{border-collapse:collapse}.markdown-body td,.markdown-body th{border:1px solid #30363d;padding:6px 13px}`;

async function cached(key, produce) {
  const file = join(CACHE, key);
  try {
    return await readFile(file, 'utf8');
  } catch {
    const value = await produce();
    await mkdir(CACHE, { recursive: true });
    await writeFile(file, value, 'utf8');
    return value;
  }
}

/** GitHub's stylesheet, so local and production styling cannot drift. */
async function stylesheet(variant) {
  return cached(`github-markdown-${variant}.css`, async () => {
    const res = await fetch(`https://cdn.jsdelivr.net/npm/github-markdown-css@5/github-markdown-${variant}.css`);
    if (!res.ok) throw new Error(`stylesheet ${variant}: HTTP ${res.status}`);
    return res.text();
  }).catch(() => FALLBACK_CSS);
}

/**
 * GitHub's Markdown API is the ground truth for GFM. Unauthenticated it allows
 * 60 requests/hour, which the content hash cache makes plenty; set GITHUB_TOKEN
 * to raise it if you are iterating hard on prose.
 */
async function renderMarkdown(markdown) {
  return cached(`md-${sha(markdown)}.html`, async () => {
    const res = await fetch('https://api.github.com/markdown', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/vnd.github+json',
        ...(process.env.GITHUB_TOKEN ? { authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
      },
      body: JSON.stringify({ text: markdown, mode: 'gfm' }),
    });
    if (!res.ok) throw new Error(`markdown API: HTTP ${res.status} ${await res.text()}`);
    return res.text();
  }).catch((err) => {
    console.warn(`  ! markdown API unavailable (${err.message}); showing raw HTML`);
    return `<div class="offline-note">Rendered locally without GitHub's Markdown API &mdash; raw HTML only.</div>${markdown}`;
  });
}

/**
 * Rewrites runtime-branch asset URLs to local paths.
 *
 * README.md points at raw.githubusercontent so the published profile reads
 * assets from the runtime branch. Locally that would show whatever is already
 * on GitHub -- including nothing at all, before the first push -- so the
 * preview swaps in the SVGs you just built.
 */
function localise(markdown) {
  return markdown.replace(
    /https:\/\/raw\.githubusercontent\.com\/[^/]+\/[^/]+\/[^/]+\//g,
    '/assets/',
  );
}

async function assetGallery() {
  let files = [];
  try {
    files = (await readdir(join(ROOT, 'assets'))).filter((f) => f.endsWith('.svg')).sort();
  } catch { /* no assets yet */ }
  if (!files.length) return '<p>No SVGs in <code>assets/</code> yet. Run <code>npm run build</code>.</p>';
  return files
    .map((f) => `<figure><figcaption>${f} <a href="/assets/${f}" target="_blank">open</a></figcaption>
<img src="/assets/${f}?t=${Date.now()}" alt="${f}"></figure>`)
    .join('');
}

function shell({ body, dark, light, tab }) {
  const nav = (href, label) =>
    `<a href="${href}" class="${tab === label ? 'on' : ''}">${label}</a>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>esforper.runtime — preview</title>
<style id="gh-dark">${dark}</style>
<style id="gh-light">${light}</style>
<style>
  :root{color-scheme:dark}
  body{margin:0;background:#0d1117;transition:background .15s}
  body.light{background:#fff}
  .bar{position:sticky;top:0;z-index:10;display:flex;gap:14px;align-items:center;
    padding:10px 18px;background:#161b22;border-bottom:1px solid #30363d;
    font:13px ui-monospace,SFMono-Regular,Consolas,monospace;color:#8b949e}
  body.light .bar{background:#f6f8fa;border-color:#d0d7de;color:#656d76}
  .bar a{color:inherit;text-decoration:none;padding:3px 9px;border-radius:6px}
  .bar a.on{background:#30363d;color:#e6edf3}
  body.light .bar a.on{background:#dfe3e8;color:#1f2328}
  .bar button{margin-left:auto;font:inherit;cursor:pointer;padding:4px 12px;border-radius:6px;
    border:1px solid #30363d;background:#21262d;color:#c9d1d9}
  body.light .bar button{border-color:#d0d7de;background:#fff;color:#24292f}
  .wrap{max-width:1012px;margin:0 auto;padding:32px 16px 96px}
  .markdown-body{padding:26px 32px;border:1px solid #30363d;border-radius:10px;background:#0d1117}
  body.light .markdown-body{border-color:#d0d7de;background:#fff}
  figure{margin:0 0 28px}
  figcaption{font:12px ui-monospace,monospace;color:#8b949e;margin-bottom:6px}
  figcaption a{color:#58a6ff}
  figure img{max-width:100%;display:block;border:1px solid #30363d;border-radius:8px}
  .offline-note{padding:8px 12px;margin-bottom:16px;border-radius:6px;
    background:#3d2c00;color:#e3b341;font:12px ui-monospace,monospace}
</style></head><body>
<div class="bar">
  <strong>esforper.runtime</strong>
  ${nav('/', 'readme')} ${nav('/assets', 'assets')}
  <button id="t">theme: dark</button>
</div>
<div class="wrap"><article class="markdown-body">${body}</article></div>
<script>
  const dark = document.getElementById('gh-dark');
  const light = document.getElementById('gh-light');
  const btn = document.getElementById('t');

  function apply(mode) {
    const isLight = mode === 'light';
    document.body.classList.toggle('light', isLight);
    document.documentElement.style.colorScheme = mode;
    dark.disabled = isLight;
    light.disabled = !isLight;
    btn.textContent = 'theme: ' + mode;
    localStorage.setItem('preview-theme', mode);
    // <picture> follows the OS, not this toggle, so pick the source by hand.
    for (const pic of document.querySelectorAll('picture')) {
      const src = pic.querySelector('source[media*="' + mode + '"]');
      const img = pic.querySelector('img');
      if (src && img) img.src = src.getAttribute('srcset');
    }
  }
  apply(localStorage.getItem('preview-theme') || 'dark');
  btn.onclick = () => apply(document.body.classList.contains('light') ? 'dark' : 'light');

  new EventSource('/events').onmessage = () => location.reload();
</script></body></html>`;
}

// ---- change watching -------------------------------------------------------

const clients = new Set();
let building = null;
let debounce;

function runBuild() {
  return new Promise((done) => {
    const p = spawn(process.execPath, [join(ROOT, 'scripts', 'build.mjs')], { cwd: ROOT, stdio: 'inherit' });
    p.on('exit', done);
  });
}

async function onChange(file) {
  clearTimeout(debounce);
  debounce = setTimeout(async () => {
    console.log(`~ ${file}`);
    if (REBUILD && !file.startsWith(`assets${sep}`)) {
      building = runBuild();
      await building;
      building = null;
    }
    for (const res of clients) res.write('data: reload\n\n');
  }, 120);
}

for (const dir of ['assets', 'scripts', 'data', 'templates']) {
  try {
    watch(join(ROOT, dir), { recursive: true }, (_e, name) => name && onChange(join(dir, name)));
  } catch { /* directory may not exist yet */ }
}
try {
  watch(join(ROOT, 'README.md'), () => onChange('README.md'));
} catch { /* not generated yet */ }

// ---- server ----------------------------------------------------------------

const [dark, light] = await Promise.all([stylesheet('dark'), stylesheet('light')]);

createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = decodeURIComponent(url.pathname);

  if (path === '/events') {
    res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache', connection: 'keep-alive' });
    res.write(': connected\n\n');
    clients.add(res);
    req.on('close', () => clients.delete(res));
    return;
  }

  if (path === '/assets') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    return res.end(shell({ body: await assetGallery(), dark, light, tab: 'assets' }));
  }

  if (path === '/') {
    if (building) await building;
    let markdown;
    try {
      markdown = await readFile(join(ROOT, 'README.md'), 'utf8');
    } catch {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      return res.end(shell({
        body: '<h2>No README.md yet</h2><p>Run <code>npm run build</code>, or head to <a href="/assets">assets</a>.</p>',
        dark, light, tab: 'readme',
      }));
    }
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    return res.end(shell({ body: await renderMarkdown(localise(markdown)), dark, light, tab: 'readme' }));
  }

  // Static files, confined to ROOT.
  const target = resolve(join(ROOT, path));
  if (relative(ROOT, target).startsWith('..')) {
    res.writeHead(403).end('forbidden');
    return;
  }
  try {
    if (!(await stat(target)).isFile()) throw new Error('not a file');
    res.writeHead(200, {
      'content-type': MIME[extname(target)] ?? 'application/octet-stream',
      'cache-control': 'no-store',
    });
    res.end(await readFile(target));
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain' }).end('404');
  }
}).listen(PORT, () => {
  console.log(`\n  preview  http://localhost:${PORT}`);
  console.log(`  assets   http://localhost:${PORT}/assets`);
  console.log(REBUILD ? '  watching + rebuilding on change\n' : '  watching for changes\n');
});
