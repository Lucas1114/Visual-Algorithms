import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import manacherLight from '../assets/thumbs/manacher-light.webp';
import manacherDark from '../assets/thumbs/manacher-dark.webp';
import floydLight from '../assets/thumbs/floyd-light.webp';
import floydDark from '../assets/thumbs/floyd-dark.webp';
import kmpLight from '../assets/thumbs/kmp-light.webp';
import kmpDark from '../assets/thumbs/kmp-dark.webp';
import './home.css';

const ALGOS = [
  {
    to: '/manacher',
    name: 'Manacher',
    blurb: 'Longest palindromic substring in linear time.',
    thumb: { light: manacherLight, dark: manacherDark },
  },
  {
    to: '/floyd',
    name: 'Hare & Tortoise',
    blurb: "Floyd's cycle detection with two pointers.",
    thumb: { light: floydLight, dark: floydDark },
  },
  {
    to: '/kmp',
    name: 'Knuth–Morris–Pratt',
    blurb: 'Linear-time string matching with a partial-match table.',
    thumb: { light: kmpLight, dark: kmpDark },
  },
];

export function Home() {
  return (
    <main className="home">
      <a className="home__banner" href="/legacy/">
        <span>
          You&rsquo;re viewing the{' '}
          <strong>2026 React&nbsp;+&nbsp;TypeScript</strong> rebuild.
        </span>
        <span className="home__banner-cta">
          See the original 2021 build&nbsp;&rarr;
        </span>
      </a>

      <div className="home__head">
        <h1>Visual Algorithms</h1>
        <a
          className="home__chip"
          href="https://github.com/Lucas1114/Visual-Algorithms"
        >
          <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
            <path
              fill="currentColor"
              d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8Z"
            />
          </svg>
          Source on GitHub
        </a>
      </div>

      <p className="home__lead">
        Interactive, step-by-step walkthroughs of three classic algorithms.
        Hand-built in vanilla JS + SVG in 2021, rebuilt in React + TypeScript in
        2026.
      </p>
      <p className="home__meta">
        <Link to="/about">About this project &rarr;</Link>
      </p>
      <ul className="home__list">
        {ALGOS.map((a) => (
          <li key={a.to}>
            <Link to={a.to} className="home__card">
              <span
                className="home__card-thumb"
                style={
                  {
                    '--thumb-light': `url(${a.thumb.light})`,
                    '--thumb-dark': `url(${a.thumb.dark})`,
                  } as CSSProperties
                }
              />
              <span className="home__card-name">{a.name}</span>
              <span className="home__card-blurb">{a.blurb}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
