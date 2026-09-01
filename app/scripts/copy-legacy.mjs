// Stage the original 2021 site under dist/legacy/ after `vite build`, so one
// deployment serves the current React app at `/` and the untouched hand-built
// version at `/legacy/`. The repo-root files are never modified — they are only
// read and copied here at build time.
import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '../..');
const legacyDir = resolve(here, '../dist/legacy');

// Copied wholesale — every internal link in these trees is relative, so they
// keep working unchanged under /legacy/.
const DIRS = ['KMP', 'Manachar', 'hare-tortoise', 'dist'];

// Loose files that index.html and the sub-pages pull in.
const FILES = ['examples.js', 'examples.css', 'hp.css'];

// The only images the legacy pages actually render. The rest of imgs/ is unused
// fullPage.js demo-site material (device mockups, sample videos, ~13 MB).
const IMAGES = [
  'bg1.jpg',
  'bg3.jpg',
  'bg-kmp.jpeg',
  'bg-manachar.png',
  'bg-hare.jpeg',
];

mkdirSync(legacyDir, { recursive: true });

for (const d of DIRS) {
  cpSync(join(repoRoot, d), join(legacyDir, d), { recursive: true });
}
for (const f of FILES) {
  cpSync(join(repoRoot, f), join(legacyDir, f));
}
mkdirSync(join(legacyDir, 'imgs'), { recursive: true });
for (const img of IMAGES) {
  cpSync(join(repoRoot, 'imgs', img), join(legacyDir, 'imgs', img));
}

// The vendored fullpage.js has carried two stray non-breaking spaces (U+00A0)
// since the 2021 upload. They are valid ECMAScript whitespace only when the file
// is decoded as UTF-8, so the landing page breaks on any host that serves .js
// without `charset=utf-8`. Normalise them to plain spaces in the copy — the
// repo-root file is left exactly as it was.
const fullpagePath = join(legacyDir, 'dist', 'fullpage.js');
writeFileSync(
  fullpagePath,
  readFileSync(fullpagePath, 'utf8').replace(/\u00A0/g, ' '),
);

// Inject a banner linking back to the current version. The repo-root index.html
// is left untouched; the banner only lands in the copied file.
const BANNER = `
    <div style="position:fixed;top:0;left:0;right:0;z-index:99999;background:#101014;color:#f3f4f6;font:14px/1.5 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;text-align:center;padding:8px 14px;box-shadow:0 1px 6px rgba(0,0,0,.35)">
      You're viewing the original 2021 build (hand-written vanilla JS + SVG).
      <a href="/" style="color:#8ab4ff;font-weight:600">Back to the 2026 React version &rarr;</a>
    </div>`;
const html = readFileSync(join(repoRoot, 'index.html'), 'utf8');
writeFileSync(
  join(legacyDir, 'index.html'),
  html.replace('<body>', `<body>${BANNER}`),
);

console.log('Staged the 2021 site -> dist/legacy/');
