import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { AlgorithmLayout, Canvas } from '../../components/AlgorithmLayout';
import { Cell } from '../../components/Cell';
import { manacher, DEFAULT_INPUT } from '../../algorithms/manacher';
import { cellCenterX, cellX, SIDE } from '../../layout';
import { ManacherView } from './ManacherView';
import './manacher.css';

const MAX_LEN = 11;
/** Transformed-string length for the longest allowed input — the index picker
 * is always drawn to this width so a cell stays the same size whatever the
 * string length (it only scales with the page). */
const MAX_S = 2 * MAX_LEN + 1;
const LABEL_W = 96;
/** Default palindrome centre for the string that loads first — a diff-border
 * case, so the walkthrough opens on the proof animation (the page's highlight). */
const DEFAULT_CENTER = 9;

const sanitize = (raw: string) =>
  raw
    .replace(/[^a-zA-Z]/g, '')
    .toUpperCase()
    .slice(0, MAX_LEN);

export function ManacherPage() {
  const [draft, setDraft] = useState(DEFAULT_INPUT);
  const [input, setInput] = useState(DEFAULT_INPUT);
  const [centerIndex, setCenterIndex] = useState(DEFAULT_CENTER);

  const build = () => {
    if (!draft) return;
    setInput(draft);
    // old centre may not exist in the new transformed string — land on its middle
    setCenterIndex(draft.length);
  };

  const restoreDefault = () => {
    setDraft(DEFAULT_INPUT);
    setInput(DEFAULT_INPUT);
    setCenterIndex(DEFAULT_CENTER);
  };

  return (
    <AlgorithmLayout title="Manacher">
      <div className="manacher-page">
        <div className="manacher-setup">
          <div className="manacher-setup__top">
            <div className="manacher-setup__form">
              <p className="manacher-step">
                <b className="manacher-step__n">Step 1</b> Type a string (letters
                only, up to {MAX_LEN}) and click Start — or click Default to
                restore the original.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  build();
                }}
              >
                <input
                  aria-label="string"
                  value={draft}
                  onChange={(e) => setDraft(sanitize(e.target.value))}
                  placeholder={DEFAULT_INPUT}
                />
                <button type="submit" disabled={!draft}>
                  Start
                </button>
                <button type="button" onClick={restoreDefault}>
                  Default
                </button>
              </form>
            </div>

            <div className="manacher-setup__picker">
              <p className="manacher-step">
                <b className="manacher-step__n">Step 2</b>{' '}
                <mark className="manacher-cta">Click an index</mark> of the
                transformed string to pick the palindrome centre. Different
                centres take different paths through the flowchart — the default
                string can reach every one, so try a few.
              </p>
              <CenterPicker
                input={input}
                selected={centerIndex}
                onSelect={setCenterIndex}
              />
            </div>
          </div>

          <p className="manacher-step">
            <b className="manacher-step__n">Step 3</b> Step through the walk with
            the controls below.
          </p>
        </div>

        <ManacherView
          key={`${input}:${centerIndex}`}
          input={input}
          centerIndex={centerIndex}
        />
      </div>
    </AlgorithmLayout>
  );
}

/**
 * The `#`-insertion reveal (light version of the 2021 `preprocessing()` — a
 * single CSS transition instead of two 200-frame `setInterval`s) plus the
 * clickable index row that replaces `build_center()` / `select()`.
 */
function CenterPicker({
  input,
  selected,
  onSelect,
}: {
  input: string;
  selected: number | null;
  onSelect: (i: number) => void;
}) {
  const { s } = useMemo(() => manacher(input), [input]);

  // Fixed to the longest allowed string so the cells never resize with the
  // input length; short strings just leave the right of the strip empty.
  const width = LABEL_W + MAX_S * SIDE + 24;
  const height = SIDE * 2 + 48;
  const col = (i: number) => LABEL_W + cellX(i);

  // `key={input}` remounts this group on every Start, replaying the CSS
  // keyframes: original characters slide apart, then `#` and the index row fade
  // in (light replacement for the 2021 `preprocessing()` frame loops).
  return (
    <Canvas width={width} height={height}>
      <g key={input}>
        {/* original characters slide from tight packing to their odd slots */}
        {input.split('').map((ch, k) => (
          <g
            key={`o-${k}`}
            className="manacher-spread-cell"
            style={{ '--spread-dx': `${(k + 1) * SIDE}px` } as CSSProperties}
          >
            <Cell char={ch} x={col(k)} y={4} />
          </g>
        ))}

        {/* separators fade in */}
        {s.split('').map((ch, i) =>
          ch === '#' ? (
            <g key={`h-${i}`} className="manacher-fade-cell">
              <Cell char="#" x={col(i)} y={4} textColor="var(--cell-stroke)" />
            </g>
          ) : null,
        )}

        {/* clickable index row */}
        <g className="manacher-fade-cell manacher-fade-delayed">
          {s.split('').map((_, i) => {
            const isSel = i === selected;
            return (
              <g
                key={`p-${i}`}
                role="button"
                tabIndex={0}
                onClick={() => onSelect(i)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(i);
                  }
                }}
                style={{ cursor: 'pointer' }}
              >
                <rect
                  x={col(i) + 2}
                  y={SIDE + 16}
                  width={SIDE - 4}
                  height={SIDE - 8}
                  rx={4}
                  fill={isSel ? 'var(--tab-active)' : 'var(--tab-bg)'}
                  stroke={isSel ? 'var(--tab-active)' : 'var(--cell-stroke)'}
                />
                <text
                  x={LABEL_W + cellCenterX(i)}
                  y={SIDE + 16 + (SIDE - 8) / 2}
                  fontSize={13}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={isSel ? 'var(--tab-active-text)' : 'var(--cell-text)'}
                >
                  {i}
                </text>
              </g>
            );
          })}
        </g>
      </g>
    </Canvas>
  );
}
