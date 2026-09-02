// Regenerate the home-page card thumbnails: for each algorithm page, drive it
// to a mid-walkthrough frame and screenshot it in both colour schemes. Output
// lands in src/assets/thumbs/ as WebP (falls back to PNG if `cwebp` is missing).
//
//   node scripts/gen-thumbnails.mjs
//
// Uses the locally installed Chrome via puppeteer-core (no browser download).
// Override the binary with PUPPETEER_EXECUTABLE_PATH if detection fails.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import puppeteer from 'puppeteer-core';

const here = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(here, '..');
const outDir = join(appRoot, 'src/assets/thumbs');

const CHROME_CANDIDATES = [
  process.env.PUPPETEER_EXECUTABLE_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);
const chrome = CHROME_CANDIDATES.find((p) => existsSync(p));
if (!chrome) {
  console.error('No Chrome/Chromium found. Set PUPPETEER_EXECUTABLE_PATH.');
  process.exit(1);
}

const VIEWPORT = { width: 1440, height: 880 };
const CLIP = { x: 0, y: 0, width: 1440, height: 760 };
const SCHEMES = ['light', 'dark'];

const clickText = (selector, text) => `
  [...document.querySelectorAll(${JSON.stringify(selector)})]
    .find((el) => el.textContent.trim() === ${JSON.stringify(text)})?.click();
`;

/** Each target drives its page to the frame we want to advertise. */
const TARGETS = [
  {
    name: 'manacher',
    path: '/manacher',
    async prepare(page) {
      await page.type('input[aria-label="string"]', 'ABACABACABB');
      await page.click('button[type="submit"]');
      await page.waitForSelector('g[role="button"]');
      // Centre 15 — a diff-border case that shows the reflection-chain proof.
      await page.evaluate(() => {
        const cell = [...document.querySelectorAll('g[role="button"]')].find(
          (g) => g.querySelector('text')?.textContent.trim() === '15',
        );
        cell?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });
      await page.waitForSelector('.step-controller');
      await advance(page, 7);
    },
  },
  {
    name: 'floyd',
    path: '/floyd',
    async prepare(page) {
      // labels + entrance are pre-filled; step into the meeting / derivation.
      await page.waitForSelector('.step-controller');
      await advance(page, 9);
    },
  },
  {
    name: 'kmp',
    path: '/kmp',
    async prepare(page) {
      await page.waitForSelector('.algo__tab');
      await page.evaluate(clickText('.algo__tab', 'Animation'));
      await page.waitForSelector('.step-controller');
      await advance(page, 3);
    },
  },
];

async function advance(page, times) {
  for (let i = 0; i < times; i++) {
    await page.evaluate(clickText('.step-controller button', 'Next'));
    await sleep(220);
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const server = await createServer({ root: appRoot, logLevel: 'warn' });
await server.listen();
const base = server.resolvedUrls.local[0].replace(/\/$/, '');
console.log(`dev server: ${base}`);

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: true,
  defaultViewport: VIEWPORT,
  protocolTimeout: 60000,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
});

mkdirSync(outDir, { recursive: true });
const haveCwebp = (() => {
  try {
    execFileSync('cwebp', ['-version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
})();

for (const target of TARGETS) {
  for (const scheme of SCHEMES) {
    const page = await browser.newPage();
    page.setDefaultTimeout(20000);
    await page.emulateMediaFeatures([
      { name: 'prefers-color-scheme', value: scheme },
    ]);
    // `domcontentloaded` + a settle sleep, not `networkidle0` — vite keeps an
    // HMR websocket open, so the network is never idle.
    await page.goto(`${base}${target.path}`, { waitUntil: 'domcontentloaded' });
    await sleep(400);
    await target.prepare(page);
    await sleep(1000); // let CSS transitions / the step-intro flash settle
    const png = join(outDir, `${target.name}-${scheme}.png`);
    await page.screenshot({ path: png, clip: CLIP });
    await page.close();

    if (haveCwebp) {
      const webp = png.replace(/\.png$/, '.webp');
      execFileSync('cwebp', ['-quiet', '-q', '82', png, '-o', webp]);
      rmSync(png);
      console.log(`  ${target.name}-${scheme}.webp`);
    } else {
      console.log(`  ${target.name}-${scheme}.png (install cwebp for WebP)`);
    }
  }
}

await browser.close();
await server.close();
console.log('done');
