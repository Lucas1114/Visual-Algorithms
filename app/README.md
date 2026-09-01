# Visual Algorithms — React app

The 2026 React + TypeScript + Vite rebuild of the 2021 vanilla-JS animations.
See the [repository README](../README.md) for the full before/after story.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check, build to `dist/`, then stage the 2021 site into `dist/legacy/` (`scripts/copy-legacy.mjs`) |
| `npm test` | vitest — the algorithm cores (`src/algorithms/`) as pure functions |
| `npm run lint` | ESLint |
| `npm run thumbnails` | Regenerate the home-page card thumbnails (`scripts/gen-thumbnails.mjs`; drives the pages with the system Chrome via puppeteer-core) |

## Layout

- `src/algorithms/` — the ported algorithm logic (`kmp`, `manacher`, `floyd`), each with a frame-builder and tests
- `src/components/` — shared SVG primitives (`Cell`, `Arrow`) and the step player
- `src/pages/` — one folder per algorithm, plus `Home` and `About`
- `src/layout.ts` — the coordinate constants and pure layout helpers

## Deployment

One Vercel project, root directory `app/`. `vercel.json` routes `/legacy/`
around the SPA rewrite and redirects the old capitalised algorithm paths.
