import { Link } from 'react-router-dom';
import './about.css';

const REPO = 'https://github.com/Lucas1114/Visual-Algorithms';

interface Row {
  aspect: string;
  before: string;
  after: string;
}

const ROWS: Row[] = [
  {
    aspect: 'Dependencies',
    before: 'jQuery + jQuery UI + fullPage.js (GPL)',
    after: 'React + react-router only — no UI or animation library',
  },
  {
    aspect: 'Rendering model',
    before: 'Imperative: clear the container, loop over createElementNS',
    after: 'Declarative components driven by a state object',
  },
  {
    aspect: 'Animation',
    before:
      'Nested setTimeout / setInterval chains mutating transform frame by frame',
    after: 'Precomputed frame array (useMemo) + CSS transitions',
  },
  {
    aspect: 'Stepping backward',
    before: 'Hand-written cross-phase rollback (~100 lines in Hare & Tortoise)',
    after: 'setStep(s - 1) — every frame is a complete snapshot',
  },
  {
    aspect: 'Flowcharts',
    before:
      '~600 lines of hard-coded coordinates and concatenated <tspan> text',
    after: 'Data-driven NODES / EDGES arrays rendered by small components',
  },
  {
    aspect: 'Layout maths',
    before: 'Magic numbers scattered through the draw code',
    after: 'Pure functions in layout / geometry modules',
  },
  {
    aspect: 'Tests',
    before: 'None',
    after:
      'vitest — algorithm cores as pure functions, checked against brute force',
  },
  {
    aspect: 'Types',
    before: 'None',
    after: 'TypeScript in strict mode',
  },
];

interface Highlight {
  name: string;
  to: string;
  points: string[];
}

const HIGHLIGHTS: Highlight[] = [
  {
    name: 'Manacher',
    to: '/manacher',
    points: [
      'The 600-line hand-placed flowchart was redrawn as a data-driven node/edge graph.',
      'Restored the step 8–13 proof ("why the reversed substring needs no outside comparison") that the original never reached because of an off-by-one in the step counter.',
    ],
  },
  {
    name: 'Hare & Tortoise',
    to: '/floyd',
    points: [
      'Implicit globals from a mistyped drag handler (tmpX vs tmpY) — a hard error under strict mode — removed with a controlled input.',
      'The whole cross-phase step_back() rollback deleted; backward stepping falls out of the frame model for free.',
    ],
  },
  {
    name: 'Knuth–Morris–Pratt',
    to: '/kmp',
    points: [
      '100+ lines of hand-rolled tab hover / selected state collapsed into CSS.',
      'Fixed a latent bug: module-level rec / sgn / back arrays were only ever pushed to, never reset, so a second click on the Animation tab corrupted the run. Gone once the frame builder became a pure function.',
    ],
  },
];

export function About() {
  return (
    <main className="about">
      <p className="about__back">
        <Link to="/">&larr; Visual Algorithms</Link>
      </p>

      <h1>About this project</h1>

      <p className="about__lead">
        The animations here were hand-built in 2020–2021 in plain vanilla
        JavaScript and SVG — no framework, no build tool, no AI assistance,
        which did not exist yet. In 2026 they were migrated, with AI assistance,
        to React 19 + TypeScript + Vite.
      </p>

      <p>
        Both versions are deployed side by side.{' '}
        <a href="/legacy/">Open the original 2021 build →</a>
      </p>

      <h2>Provenance</h2>
      <p>
        The 2020–2021 commits sit untouched at the base of{' '}
        <a href={`${REPO}/commits/main`}>the same repository</a>; the 2026
        rebuild is the series of commits layered on top. The before and the
        after are both on the record, in one history. (The original commits are
        authored under <code>seanwelz</code>, an earlier GitHub account of
        mine.)
      </p>

      <h2>What changed</h2>
      <div className="about__table-wrap">
        <table className="about__table">
          <thead>
            <tr>
              <th>Aspect</th>
              <th>2021 — vanilla JS + SVG</th>
              <th>2026 — React + TypeScript</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.aspect}>
                <th scope="row">{r.aspect}</th>
                <td>{r.before}</td>
                <td>{r.after}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Per algorithm</h2>
      <ul className="about__highlights">
        {HIGHLIGHTS.map((h) => (
          <li key={h.to}>
            <h3>
              <Link to={h.to}>{h.name}</Link>
            </h3>
            <ul>
              {h.points.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>

      <h2>Links</h2>
      <ul className="about__links">
        <li>
          <a href="/legacy/">The original 2021 site</a>
        </li>
        <li>
          <a href={REPO}>GitHub repository</a>
        </li>
        <li>
          <a href="https://www.linkedin.com/in/lucas-z-b71a3a217/">LinkedIn</a>
        </li>
      </ul>
    </main>
  );
}
