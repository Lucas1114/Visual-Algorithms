# Visual Algorithms

**[Live demo](https://visual-algorithms-sandy.vercel.app)** &nbsp;·&nbsp;
[the original 2021 build](https://visual-algorithms-sandy.vercel.app/legacy/)

Interactive, step-by-step animations that explain three classic algorithms:

| Algorithm | Problem |
| --- | --- |
| Knuth–Morris–Pratt | Linear-time string matching |
| Manacher | Longest palindromic substring in linear time |
| Floyd (Hare & Tortoise) | Cycle detection with two pointers |

## Two implementations, one repository

**2020–2021 — original.** Hand-written vanilla JavaScript + SVG. No framework,
no build tool, no AI assistance (which did not exist yet). Dependencies were
jQuery, jQuery UI and fullPage.js. This code still lives at the repository root
(`index.html`, `KMP/`, `Manachar/`, `hare-tortoise/`); its commits sit
untouched at the base of the history.

**2026 — migration.** Rebuilt with AI assistance as a React 19 + TypeScript +
Vite single-page app in [`app/`](app/), layered on top as a fresh series of
commits. The imperative "clear the container and re-run the draw loop" model
became state-driven components; the nested `setTimeout` / `setInterval`
animation chains became precomputed frame arrays plus CSS transitions; the
algorithm cores were ported verbatim, typed, and covered with tests.

Both versions are deployed together: the React app at `/`, the original at
`/legacy/`. The in-app `/about` page has the full before/after breakdown.

## Running the React app

```bash
cd app
npm install
npm run dev
```

Other scripts: `npm run build`, `npm test`, `npm run lint`.

## Viewing the original locally

The 2021 site is plain static files — open `index.html` in a browser, or serve
the repository root with any static file server.

## License

The code in this repository is MIT-licensed (see [`LICENSE`](LICENSE)). The
2021 site kept under `/legacy/` vendors third-party libraries — jQuery, jQuery
UI and fullPage.js (the last GPLv3 / commercial dual-licensed) — each under its
own license; those files are retained only as an unaltered historical archive
and the 2026 React app does not use them.
