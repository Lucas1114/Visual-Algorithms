import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { AlgorithmLayout, Canvas } from '../../components/AlgorithmLayout';
import { Cell } from '../../components/Cell';
import { manacher, DEFAULT_INPUT } from '../../algorithms/manacher';
import { cellCenterX, cellX, SIDE } from '../../layout';
import { ManacherView } from './ManacherView';
import './manacher.css';

const MAX_LEN = 11;
const LABEL_W = 96;
const sanitize = (raw: string) =>
  raw
    .replace(/[^a-zA-Z]/g, '')
    .toUpperCase()
    .slice(0, MAX_LEN);

export function ManacherPage() {
  const [draft, setDraft] = useState(DEFAULT_INPUT);
  const [input, setInput] = useState<string | null>(null);
  const [centerIndex, setCenterIndex] = useState<number | null>(null);

  return (
    <AlgorithmLayout
      title="Manacher"
      tabs={[]}
      activeTab=""
      onTabChange={() => {}}
    >
      <div className="manacher-page">
        <ol className="manacher-steps">
          <li>
            <span>Input a string (letters only, up to {MAX_LEN}):</span>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (draft) {
                  setInput(draft);
                  setCenterIndex(null);
                }
              }}
            >
              <input
                aria-label="string"
                value={draft}
                onChange={(e) => setDraft(sanitize(e.target.value))}
                placeholder="ABACABACABB"
              />
              <button type="submit" disabled={!draft}>
                Start
              </button>
            </form>
          </li>
          <li className={input ? undefined : 'is-disabled'}>
            <span>
              Click an index of the transformed string to choose the palindrome
              center:
            </span>
            {input && (
              <CenterPicker
                input={input}
                selected={centerIndex}
                onSelect={setCenterIndex}
              />
            )}
          </li>
          <li className={centerIndex != null ? undefined : 'is-disabled'}>
            <span>Step through how the radius at that center is found.</span>
          </li>
        </ol>

        {input && centerIndex != null && (
          <ManacherView
            key={`${input}:${centerIndex}`}
            input={input}
            centerIndex={centerIndex}
          />
        )}
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

  const lens = s.length;
  const width = LABEL_W + lens * SIDE + 24;
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
