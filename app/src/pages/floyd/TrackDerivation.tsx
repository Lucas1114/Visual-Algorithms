/**
 * The distance-equation derivation (2021 `track_draw()` cases A–E, `<p id="track0..4">`).
 *
 * The 2021 version drew the equation *as pictures* in a side panel — a short
 * segment for the tail, small arcs for the cycle portions, joined by `+` / `=` /
 * `×` glyphs, with cancelled terms greyed across five stacked rows. That intent
 * is kept here: each row is a compact schematic of one algebra step, built from
 * the same term glyphs and driven by μ / λ / n / x. Rows accumulate, the current
 * one emphasised (the Manacher proof-panel treatment). The word-for-word version
 * of each step is the caption under the canvas.
 */

import { createContext, useContext } from 'react';

type TermKind = 'mu' | 'x' | 'rest' | 'lambda';

/** The real x / λ split, so the x and λ−x glyphs are drawn to scale (2021
 * `track()` computed `arc1` from the actual angle `interval*(merge_idx-cycle)`). */
const XFracContext = createContext(1 / 3);

const CX = 23;
const CY = 15;
const R = 12;

/** Glyph circle geometry mirrors the main ρ figure: the entrance sits at the
 * left point and travel runs clockwise from there, so the x / λ−x arcs point the
 * same way as the arcs drawn on the ring. */
const ENTRANCE_DEG = 270;

/** A point on the glyph circle at `deg` (0° = top, growing clockwise). */
function ringPoint(deg: number) {
  const a = ((deg - 90) * Math.PI) / 180;
  return { x: CX + R * Math.cos(a), y: CY + R * Math.sin(a) };
}

/** Arc of the glyph circle from `startDeg`, spanning `spanDeg` clockwise.
 * A zero span (x = 0) collapses to a solid dot; a full span is the whole ring. */
function ArcGlyph({
  startDeg,
  spanDeg,
  stroke,
  dashed,
}: {
  startDeg: number;
  spanDeg: number;
  stroke: string;
  dashed?: boolean;
}) {
  if (spanDeg <= 1) {
    const p = ringPoint(startDeg);
    return <circle cx={p.x} cy={p.y} r={3.5} fill={stroke} />;
  }
  const common = {
    fill: 'none',
    stroke,
    strokeWidth: 4,
    strokeLinecap: 'round' as const,
    strokeDasharray: dashed ? '2,4' : undefined,
  };
  if (spanDeg >= 359) {
    return <circle cx={CX} cy={CY} r={R} {...common} />;
  }
  const p0 = ringPoint(startDeg);
  const p1 = ringPoint(startDeg + spanDeg);
  const largeArc = spanDeg > 180 ? 1 : 0;
  return (
    <path
      d={`M ${p0.x} ${p0.y} A ${R} ${R} 0 ${largeArc} 1 ${p1.x} ${p1.y}`}
      {...common}
    />
  );
}

/** One equation term as a little icon: a bar for a straight run, an arc for a
 * cycle portion (drawn to the real x / λ scale), a ring for a whole loop. */
function Term({ kind, dim }: { kind: TermKind; dim?: boolean }) {
  const xFrac = useContext(XFracContext);
  const label =
    kind === 'mu' ? 'μ' : kind === 'x' ? 'x' : kind === 'rest' ? 'λ−x' : 'λ';
  return (
    <span className={`floyd-term${dim ? ' is-dim' : ''}`}>
      <svg viewBox="0 0 46 30" aria-hidden="true">
        {/* x and λ−x are complementary arcs of the same circle (the λ ring),
            so the two pieces visibly add up to one full loop. */}
        {kind === 'mu' && (
          <rect
            x={5}
            y={11}
            width={36}
            height={6}
            rx={3}
            fill="var(--floyd-tail)"
          />
        )}
        {kind === 'x' && (
          <ArcGlyph
            startDeg={ENTRANCE_DEG}
            spanDeg={360 * xFrac}
            stroke="var(--floyd-arc-x)"
          />
        )}
        {kind === 'rest' && (
          <ArcGlyph
            startDeg={ENTRANCE_DEG + 360 * xFrac}
            spanDeg={360 * (1 - xFrac)}
            stroke="var(--floyd-arc-rest)"
            dashed
          />
        )}
        {kind === 'lambda' && (
          <circle
            cx={CX}
            cy={CY}
            r={R}
            fill="none"
            stroke="var(--floyd-node-dim)"
            strokeWidth={4}
          />
        )}
      </svg>
      <em>{label}</em>
    </span>
  );
}

function Op({ children }: { children: string }) {
  return <span className="floyd-op">{children}</span>;
}

/** `n·λ`, or just `λ` when n = 1. */
function Loops({ n, dim }: { n: number; dim?: boolean }) {
  return (
    <>
      {n > 1 && <Op>{`${n}·`}</Op>}
      <Term kind="lambda" dim={dim} />
    </>
  );
}

function rowContent(c: number, n: number) {
  switch (c) {
    case 0:
      return (
        <>
          <span className="floyd-eq-tag">tortoise</span>
          <Term kind="mu" />
          <Op>+</Op>
          <Term kind="x" />
          <span className="floyd-eq-tag floyd-eq-tag--gap">hare</span>
          <Op>2·(</Op>
          <Term kind="mu" />
          <Op>+</Op>
          <Term kind="x" />
          <Op>)</Op>
        </>
      );
    case 1:
      return (
        <>
          <Op>2·(</Op>
          <Term kind="mu" />
          <Op>+</Op>
          <Term kind="x" />
          <Op>)</Op>
          <Op>=</Op>
          <Term kind="mu" />
          <Op>+</Op>
          <Term kind="x" />
          <Op>+</Op>
          <Loops n={n} />
        </>
      );
    case 2:
      return (
        <>
          <Term kind="mu" />
          <Op>+</Op>
          <Term kind="mu" />
          <Op>+</Op>
          <Term kind="x" />
          <Op>+</Op>
          <Term kind="x" />
          <Op>=</Op>
          <Term kind="mu" />
          <Op>+</Op>
          <Term kind="x" />
          <Op>+</Op>
          <Loops n={n} />
        </>
      );
    case 3:
      return (
        <>
          <Term kind="mu" dim />
          <Op>+</Op>
          <Term kind="mu" />
          <Op>+</Op>
          <Term kind="x" dim />
          <Op>+</Op>
          <Term kind="x" />
          <Op>=</Op>
          <Term kind="mu" dim />
          <Op>+</Op>
          <Term kind="x" dim />
          <Op>+</Op>
          <Loops n={n} />
        </>
      );
    case 4:
      return (
        <>
          <Term kind="mu" />
          <Op>=</Op>
          <Term kind="rest" />
          {n > 1 && (
            <>
              <Op>+</Op>
              <Loops n={n - 1} />
            </>
          )}
        </>
      );
  }
  return null;
}

export function TrackDerivation({
  deriveCase,
  mu,
  lambda,
  loops,
  offset,
}: {
  deriveCase: number;
  mu: number;
  lambda: number;
  loops: number;
  offset: number;
}) {
  return (
    <XFracContext.Provider value={lambda > 0 ? offset / lambda : 0}>
      <div className="floyd-derivation">
        <span className="floyd-derivation__label">
          Why the tortoise and a fresh pointer meet at the entrance
        </span>
        <p className="floyd-derivation__givens">
          μ&nbsp;=&nbsp;{mu} (tail) · λ&nbsp;=&nbsp;{lambda} (cycle) ·
          n&nbsp;=&nbsp;{loops} (hare's extra loops) · x&nbsp;=&nbsp;{offset}{' '}
          (entrance → meeting)
        </p>
        <dl className="floyd-legend">
          <div>
            <Term kind="mu" />
            <span>tail: start → entrance</span>
          </div>
          <div>
            <Term kind="x" />
            <span>x: entrance → meeting point</span>
          </div>
          <div>
            <Term kind="rest" />
            <span>λ − x: meeting → entrance (rest of the loop)</span>
          </div>
          <div>
            <Term kind="lambda" />
            <span>λ: one whole loop</span>
          </div>
        </dl>
        <ol>
          {Array.from({ length: deriveCase + 1 }, (_, c) => (
            <li key={c} className={c === deriveCase ? 'is-current' : undefined}>
              <span className="floyd-eq-row">{rowContent(c, loops)}</span>
            </li>
          ))}
        </ol>
      </div>
    </XFracContext.Provider>
  );
}
