# Visual-Algorithms — migration brief

> **Working notes and session hand-off logs live in a local `HANDOFF.md` (not
> committed). Every new session: read this file first, then `HANDOFF.md`.**
> This file is written to a "an interviewer can read it" standard — keep out
> internal asides, personal information, session-by-session logs, and meta
> decisions about how the repo is presented publicly. Those go in `HANDOFF.md`.

## Background

A 2021 algorithm-visualisation project, hand-written in plain vanilla
JavaScript + SVG: interactive, animated walkthroughs of three algorithms. The
original code has no framework and no build tool; it depends on jQuery and
fullPage.js.

**Goal of this migration:** move to React + TypeScript + Vite, deploy to
Vercel, present it as a portfolio piece. A thin Spring Boot backend for sharing
configurations may follow later.

**Important:** the original commit history (2020–2021) is part of what makes
this project worth showing — it is the evidence that the animations were
hand-written before AI coding tools existed. That history must not be touched:
no rebase, no rewrite, no repo rebuild. The migration is committed normally on
a separate branch and squash-merged into `main` at the end (see "Git
workflow").

## The three algorithms

| Directory | Algorithm | Difficulty | Order |
|---|---|---|---|
| `KMP/` | Knuth–Morris–Pratt string matching | low | Phase 1 |
| `Manachar/` | Manacher longest palindromic substring | medium | Phase 2 |
| `hare-tortoise/` | Floyd cycle detection (tortoise and hare) | high | Phase 3 |

**Do them strictly in order, one at a time.** Phase 1 produces a set of shared
components; the other two are filled in on top of that skeleton. Do not start
all three in parallel.

## Core migration principles

### 1. Keep the algorithm logic as-is

Pure computation functions like `kmp_pmt()` and `palindrome()` are the core
asset of this project. **Do not change a line of their logic** — only add
TypeScript types. If you think something in an algorithm is wrong, stop and
ask; do not fix it yourself.

### 2. Move from "imperative drawing" to "state-driven rendering"

The original pattern: clear the container, then loop `build_string()`, pushing
elements into the SVG one `createElementNS` at a time.

```js
function reset(){ document.getElementById('rp_1').innerHTML='' }
```

That is already immediate-mode rendering, which matches React's mental model.
The migration turns each view function into a component:

```tsx
function PmtView({ pat, nxt }: { pat: string; nxt: number[] }) {
  return <g>{pat.split('').map((c, j) => <Cell key={j} char={c} /* ... */ />)}</g>;
}
```

The near-identical `build_string` / `build` / `build_center` functions collapse
into one `<Cell>` component.

### 3. Animation: precomputed frames + CSS transitions

The original uses deeply nested `setTimeout` plus per-frame `setInterval` to
mutate `transform`. That cannot be carried over to React as-is (timers go out
of control on re-render); it has to be rewritten.

The good news is the original author already split out the structure. Inside
KMP's `Animation()`:

```js
var rec=[0]   // text-pointer position at each step
var sgn=[0]   // match or backtrack
var back=[0]  // where it backtracks to
```

Those three arrays are the precomputed frame sequence. Standardise on:

```ts
type Frame = { /* the full visible state at this step */ };
const frames: Frame[] = useMemo(() => runAlgorithm(input), [input]);
const [step, setStep] = useState(0);
```

- Manual step forward = `setStep(s => s + 1)`
- **Step backward = `setStep(s => s - 1)`** (the whole cross-phase `step_back()`
  rollback in H&T can be deleted)
- Autoplay = one interval in a `useEffect`, cleaned up on unmount

Positional animation is all handed to CSS:

```tsx
<g style={{ transform: `translateX(${pos * SIDE}px)`, transition: 'transform .5s' }}>
```

The per-frame `setInterval`s in `tp_move` / `pp_move` / `pattern_move` /
`preprocessing` (~30–40 lines each) are all deleted.

### 4. Extract layout maths into pure functions

Coordinate maths in the original is scattered everywhere, with a lot of
hard-coded magic numbers (`x+170`, `y+100+2*side_len+20`, `fx+625`, …). Extract
it into pure functions in `layout.ts` and define named constants. The same goes
for Manacher's polar-coordinate maths
(`x-200*Math.cos(interval*(i-cycle))`) — once extracted it can be unit-tested.

## Per-phase tasks

### Phase 1: scaffold + KMP

**Scaffold**
- Vite + React 19 + TypeScript (React 18 was the original plan; by the time it
  was set up in Sept 2026 the official Vite template already defaulted to
  React 19, and the migration mental model is unchanged, so 19 it is)
- No UI framework, no animation library (framer-motion etc.) — CSS transitions
  are enough
- Remove jQuery, jQuery UI, fullPage.js. Full-screen scrolling is done with CSS
  `scroll-snap` (fullPage.js is dual GPLv3/commercial — cleaner to drop it)
- ESLint + Prettier + `strict: true`

**Shared components** (reused by the other two phases)
- `<Cell>` — a bordered box with centred text; supports fill/stroke/dash/transform
- `<Arrow>` — pointer arrow + label (the original `arrow()`; note it mutated
  coordinates via `points.getItem(i)` point by point — compute the points
  string directly instead)
- `<StepController>` — forward / back / play / reset, owns the `step` state
- `<AlgorithmLayout>` — left-hand tab menu + right-hand canvas

**KMP page**
- Four tabs: Introduction / Pre-Suffix / PMT / Animation (the 100+ lines of
  hand-rolled hover and selected state in `build_button` become CSS, leaving a
  dozen lines of JSX)
- Four views → four components, translated from `generate()` / `pre_suf()` /
  `pmt()` / `Animation()`
- Known bug that must be fixed: `rec` / `sgn` / `back` are global arrays that
  are only pushed to, never reset — **clicking the Animation tab again
  desyncs the animation**. It disappears once the frame builder is a pure
  function behind `useMemo`.

### Phase 2: Manacher

- Main animation is migrated the same way as KMP
- `step3()`'s flip: each cell's target position is a pure function
  `targetX = (2*C - i) * SIDE` — hand it to a CSS transition and delete the
  200-frame `setInterval`
- **Do not migrate the flowchart one-to-one — redraw it.** The original
  `draw_flowchart()` has 27 blocks plus a tangle of `direction()` arrows, all
  coordinates like `fx+625, fy+770`, text built from concatenated `<tspan>`
  strings — about 600 lines total. Make it data-driven:

```ts
const FLOW_NODES = [{ id: 18, text: '...', pos: {...} }, ...];
const FLOW_EDGES = [{ from: 5, to: 11, label: '' }, ...];
```

  The three highlight functions `fc_track` / `fc_process` / `di_process` → one
  `activeNodeId` state.
- **Known dead code:** `step_cnt=14` in `case 7` of `stepforward()` means
  `step8()` through `step13()` are never reached. That block (~200 lines) is
  the proof animation for "why you don't need to compare the elements outside
  the reversed substring" — the hardest part of Manacher to explain. **Migrate
  the rest as-is first; reconnecting this is a separate task once the main body
  is done.**

### Phase 3: Hare & Tortoise

- The drag slider (`eventHandler`): replace with `<input type="range">` or a
  controlled React drag. **Note the bug in the original:** `case "mousedown"`
  assigns `tmpX` / `mouseX`, but the declarations at the top say `tmpY` /
  `mouseY` — the first two are implicit globals and are a hard error under
  strict mode
- The linked-list + ring polar-coordinate layout is extracted into pure
  functions
- Two-way stepping: the cross-phase rollback in the original `step_back()`
  (stepping from "hare slows to 1" back to "the meeting", restoring
  `merge_cx` / `merge_cy`) is deleted wholesale — `frames[step-1]` handles it
- `track_draw()`'s five-case derivation diagram: redrawn data-driven, same
  approach as the Manacher flowchart

### Phase 4: Spring Boot backend (optional, undecided)

One endpoint + one table, storing "algorithm + input string + chosen centre"
and returning a short link. The frontend serialises state into the URL. Confirm
the design before starting.

## Git workflow

This repo's commit history is itself part of the portfolio (people will click
in and read through the refactor), so commits should be professional and
sensibly scoped:

- **Commit often, push once.** Split commits along the natural structure of the
  refactor (one logical change per commit: a rename, the scaffold, a shared
  component, a view, …); batch up a handful (roughly 5–6) or a small phase, then
  `git push` once. No single giant commit, and no push per line changed.
- Commit messages say what changed and why, in English, matching the repo's
  existing style.
- Push at least once whenever a major phase (KMP / Manacher / H&T) is done.
- **The 2020–2021 commits on `main` do not change by one byte** — no rebase, no
  rewrite, no force-push of published history. The migration is done on the
  `react-migration` branch and, once everything is complete, **squash-merged
  into `main` in one step**, as a set of carefully organised commits (rename /
  scaffold / shared components / KMP / Manacher / H&T / deploy / About); the
  migration branch is then deleted. This step is by design and does not
  conflict with "keep the original history."
- Before pushing: `npm run lint` + `npx tsc -b` + `npm test` + `npm run build`
  all green.

## Deployment

**Sequencing (decided by the owner, 2026-09-01):** finish Manacher, then finish
Hare & Tortoise, and only **after all three algorithms are migrated** do the
deployment + About page together. Do not set up deployment early (the
before/after table is only complete with all three present).

- Vercel connected to the GitHub repo, auto-deploy on push. Root Directory set
  to `app/`, framework Vite. `app/vercel.json` (SPA rewrite) is in place.
- Keep the three algorithm sub-paths (`/kmp`, `/manacher`, `/floyd`); try not
  to let old links die.
- **The old and new sites deployed together, one URL** (the owner wants this,
  as proof the old version predates the AI era):
  - Approach: one Vercel deployment; after `vite build`, a small build script
    copies the repo-root 2021 files (`index.html` / `KMP/` / `Manachar/` /
    `hare-tortoise/` / `dist/` / `imgs/` / `examples.js`) into `dist/legacy/`.
    The old files stay at the repo root, untouched — only copied at build time.
  - Result: `domain/` = the React version, `domain/legacy/` = the 2021 version
    as-is
  - Cross-links: a "See the original 2021 version →" line on the new home page;
    a banner at the top of the old `index.html` linking back to `/`
- **About page** (React `/about` route, built once all three algorithms are
  done): an intro (2021 hand-written / 2026 AI-assisted rebuild) + the
  before/after table + a link to `/legacy/` + a link to the GitHub repo.
  Provenance evidence: the 2020–2021 commits in the same repo are untouched,
  and the 2026 rebuild is a set of commits layered on top.

## Miscellaneous

- ~~The original `index.html` About section had a plaintext email that
  crawlers would scrape~~ removed (2026-09-01 — a school alumni address the
  owner no longer uses; the whole line was dropped. Contact goes through
  LinkedIn from now on; the link was added when the React About page was built,
  using a URL the owner provided).
- The README states plainly: the 2021 original was hand-written vanilla
  JS + SVG; in 2026 it was migrated to React + TypeScript. The original commit
  history is preserved in the same repo.
- Run each phase and show the result before moving on; do not do all three in
  one go.
- The wrap-up checklist after the project / deployment is done (interview
  notes, git-history clean-up, etc.) is in `HANDOFF.md`.

## Working style

- **The first thing in every new conversation: name the session with
  `set_session_title`**, format `Phase N: short description` (e.g. `Phase 1:
  KMP animation tab`, `Phase 2: Manacher flowchart`, `Misc: fix Vercel
  deploy`), so the several conversations for this project can be found by
  phase later. Rename once more if the conversation's scope clearly shifts.
- On "I can't follow the original logic" or "this looks like a bug", stop and
  ask — do not infer and then change it.
- Technical explanations: give a small concrete example first, then the
  abstract principle.
- When the owner needs to understand the flow of an unfamiliar piece of code,
  use a function-level flowchart (one node per function).
- The directory `Hare&Tortoise/` is renamed to `hare-tortoise/`. `&` is a
  special character in the shell and in URLs, and the original
  `href="Hare&Tortoise/..."` in index.html was never well-formed. Use `git mv`
  so file history is preserved.
  - Done (2026-09-01): `git mv Hare&Tortoise/ hare-tortoise/`, all three files
    (`.css` / `.html` / `.js`) renamed together; the `Hare&Tortoise.*` inside
    the filenames is left for now (replaced wholesale during the React
    migration). `index.html`'s `href="Hare&Tortoise/..."` updated to
    `href="hare-tortoise/..."`; the sidebar cross-links pointing at
    `../Hare&Tortoise/...` in `KMP/KMP.html`, `Manachar/Manachar.html` and
    `hare-tortoise/Hare&Tortoise.html` updated too. Reason: `&` is a
    background operator in the shell and a query separator in URLs — leaving it
    bare breaks both links and command-line work.

## Progress

- [x] Phase 1: scaffold + KMP (2026-09-01, all four tabs working)
- [x] Phase 2: Manacher (2026-09-01 — main animation + data-driven flowchart +
  the "why no outside comparison is needed" proof animation, all done)
- [x] Phase 3: Hare & Tortoise (2026-09-01 — two-phase Floyd walkthrough +
  along-the-ring animation + distance-identity derivation; ρ modelled as a
  successor function running textbook Floyd, input a letter string + click the
  cycle entrance)
- [x] Deployment + About page (2026-09-02 — one Vercel deployment: `/` the
  React version, `/legacy/` the 2021 version as-is, build script copies the old
  files on demand; the `/about` route covers before/after + provenance; the
  home-card walkthrough thumbnails are produced by the `npm run thumbnails`
  script)
- [ ] Phase 4: Spring Boot backend (undecided)
