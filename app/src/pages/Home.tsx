import { Link } from 'react-router-dom';
import './home.css';

const ALGOS = [
  {
    to: '/manacher',
    name: 'Manacher',
    blurb: 'Longest palindromic substring in linear time.',
    ready: true,
  },
  {
    to: '/floyd',
    name: 'Hare & Tortoise',
    blurb: "Floyd's cycle detection with two pointers.",
    ready: true,
  },
  {
    to: '/kmp',
    name: 'Knuth–Morris–Pratt',
    blurb: 'Linear-time string matching with a partial-match table.',
    ready: true,
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
            {a.ready ? (
              <Link to={a.to} className="home__card">
                <span className="home__card-name">{a.name}</span>
                <span className="home__card-blurb">{a.blurb}</span>
              </Link>
            ) : (
              <span className="home__card home__card--soon">
                <span className="home__card-name">{a.name}</span>
                <span className="home__card-blurb">{a.blurb}</span>
                <span className="home__badge">coming soon</span>
              </span>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
