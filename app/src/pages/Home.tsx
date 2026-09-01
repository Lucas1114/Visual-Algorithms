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
      <h1>Visual Algorithms</h1>
      <p className="home__lead">
        Interactive, step-by-step walkthroughs of three classic algorithms.
        Hand-built in vanilla JS + SVG in 2021, rebuilt in React + TypeScript in
        2026.
      </p>
      <p className="home__meta">
        <Link to="/about">About this project</Link>
        <span aria-hidden="true"> · </span>
        <a href="/legacy/">See the original 2021 version →</a>
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
