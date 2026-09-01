import { useMemo } from 'react';
import { Arrow } from '../../components/Arrow';
import { Canvas } from '../../components/AlgorithmLayout';
import { Cell } from '../../components/Cell';
import { StepController } from '../../components/StepController';
import { useStepPlayer } from '../../components/useStepPlayer';
import { manacher, manacherFrames } from '../../algorithms/manacher';
import { cellCenterX, cellX, SIDE } from '../../layout';
import { Flowchart } from './Flowchart';

const LABEL_W = 96;
const IDX_Y = 52;
const S_Y = 64;
// Gap leaves room for the up-pointing C / M arrows and their labels below the
// s-row before the Palindrome 2 strip starts.
const PAL2_Y = S_Y + SIDE + 84;
const PAL1_Y = PAL2_Y + SIDE + 12;
const PAL34_Y = PAL1_Y + SIDE + 12;
const RAD_LABEL_Y = PAL34_Y + SIDE + 30;
const RAD_Y = RAD_LABEL_Y + 8;

const col = (i: number) => LABEL_W + cellX(i);
const center = (i: number) => LABEL_W + cellCenterX(i);

export function ManacherView({
  input,
  centerIndex,
}: {
  input: string;
  centerIndex: number;
}) {
  const { s, p } = useMemo(() => manacher(input), [input]);
  const run = useMemo(
    () => manacherFrames(input, centerIndex),
    [input, centerIndex],
  );
  const player = useStepPlayer(run.frames.length, 1400);
  const frame = run.frames[player.step];

  const { C, M, outside } = run;
  const cur = centerIndex;
  const border0 = run.frames[0].rightmostBorder;

  // The flip is CSS-driven: each cell rests at `translateX(2C - 2i)` and a
  // keyframe animation replays that slide from 0 whenever the flip phase mounts
  // (owner decision: replace the 2021 200-frame setInterval).
  const flipViz = frame.flipped;

  const lens = s.length;
  const width = LABEL_W + lens * SIDE + 24;
  const height = RAD_Y + SIDE + 20;

  const flipStrip =
    frame.pal3 ??
    (frame.pal4
      ? { left: 2 * C - frame.pal4.right, right: 2 * C - frame.pal4.left }
      : null);

  const confirmed = new Set(frame.confirmed);
  const proofResolved = new Set(frame.proofResolved);
  const proofPair = new Set(frame.proofPair ?? []);
  const proofQuery = new Set(frame.proofQuery);
  const proofCross = new Set(frame.proofCross);
  const inProof = frame.derivationLines.length > 0;

  const radiusCellChar = (j: number): string | number => {
    if (j < cur) return p[j];
    if (j === cur) return frame.radiusValue ?? '?';
    return '?';
  };

  return (
    <div className="manacher-view">
      <div className="manacher-flow-wrap">
        <Flowchart
          activeNodes={frame.flowNodes}
          activeEdges={frame.flowEdges}
        />
      </div>

      <div className="manacher-stage">
        <Canvas width={width} height={height}>
          {/* row labels */}
          <text
            x={0}
            y={S_Y + SIDE / 2}
            fontSize={15}
            dominantBaseline="central"
          >
            s
          </text>
          <text
            x={0}
            y={RAD_Y + SIDE / 2}
            fontSize={15}
            dominantBaseline="central"
          >
            radius
          </text>

          {/* index numbers */}
          {s.split('').map((_, i) => (
            <text
              key={`i-${i}`}
              x={center(i)}
              y={IDX_Y}
              fontSize={12}
              textAnchor="middle"
              opacity={0.55}
            >
              {i}
            </text>
          ))}

          {/* main s row */}
          {s.split('').map((ch, i) => {
            const isConfirmed = confirmed.has(i) || proofResolved.has(i);
            const isCross = proofCross.has(i);
            const isCur = i === cur;
            return (
              <Cell
                key={`s-${i}`}
                char={ch}
                x={col(i)}
                y={S_Y}
                fill={
                  isCross
                    ? 'var(--mismatch-fill)'
                    : isCur
                      ? 'var(--highlight-fill)'
                      : isConfirmed
                        ? 'var(--match-fill)'
                        : 'var(--cell-fill)'
                }
                stroke={
                  isCross
                    ? 'var(--mismatch)'
                    : isConfirmed
                      ? 'var(--match)'
                      : isCur
                        ? 'var(--tab-active)'
                        : 'var(--cell-stroke)'
                }
              />
            );
          })}

          {/* proof: outline the pair being compared this hop */}
          {[...proofPair].map((i) => (
            <rect
              key={`pp-${i}`}
              x={col(i) - 2}
              y={S_Y - 2}
              width={SIDE + 4}
              height={SIDE + 4}
              fill="none"
              stroke="var(--proof-accent)"
              strokeWidth={3}
            />
          ))}

          {/* proof: relation symbol between the compared pair */}
          {frame.proofPair && frame.proofRelation && (
            <text
              x={(center(frame.proofPair[0]) + center(frame.proofPair[1])) / 2}
              y={S_Y - 12}
              fontSize={18}
              fontWeight={700}
              textAnchor="middle"
              fill={
                frame.proofRelation === '≠' ? 'var(--mismatch)' : 'var(--match)'
              }
            >
              {frame.proofRelation}
            </text>
          )}

          {/* proof: "?" / "×" corner badges */}
          {[...proofQuery].map((i) => (
            <ProofBadge key={`q-${i}`} x={col(i)} symbol="?" tone="query" />
          ))}
          {[...proofCross].map((i) => (
            <ProofBadge key={`x-${i}`} x={col(i)} symbol="×" tone="cross" />
          ))}

          {/* Cur arrow (down, above the row) */}
          <Arrow
            tipX={center(cur)}
            tipY={S_Y}
            direction="down"
            label="Cur"
            color="var(--tab-active)"
          />

          {/* C / M arrows (up, below the row) */}
          {!outside && (
            <Arrow
              tipX={center(C)}
              tipY={S_Y + SIDE}
              direction="up"
              label="C"
            />
          )}
          {!outside && frame.phase !== 'select' && frame.phase !== 'pal2' && (
            <Arrow
              tipX={center(M)}
              tipY={S_Y + SIDE}
              direction="up"
              label="M"
            />
          )}

          {/* rightmost-border marker — slides when it advances */}
          <g
            className="algo-move"
            style={{
              transform: `translateX(${(frame.rightmostBorder - border0) * SIDE}px)`,
            }}
          >
            <line
              x1={col(border0) + SIDE}
              y1={S_Y}
              x2={col(border0) + SIDE}
              y2={PAL34_Y + SIDE}
              stroke="var(--match)"
              strokeWidth={2}
              strokeDasharray="5,4"
            />
            <text
              x={col(border0) + SIDE}
              y={IDX_Y - 18}
              fontSize={11}
              textAnchor="middle"
              fill="var(--match)"
            >
              right border
            </text>
          </g>

          {/* palindrome 2 (centered C) */}
          {frame.pal2 && (
            <StripRow
              s={s}
              y={PAL2_Y}
              left={frame.pal2.left}
              right={frame.pal2.right}
              markCenter={frame.pal2.center}
              label="Palindrome 2"
              color="var(--cell-stroke)"
            />
          )}

          {/* palindrome 1 (centered M) */}
          {frame.pal1 && (
            <StripRow
              s={s}
              y={PAL1_Y}
              left={frame.pal1.left}
              right={frame.pal1.right}
              markCenter={frame.pal1.center}
              label="Palindrome 1"
              color="var(--cell-stroke)"
            />
          )}

          {/* palindrome 3 -> 4: each cell slides to its reflection 2C - i */}
          {flipStrip && (
            <g>
              <text
                x={LABEL_W - 8}
                y={PAL34_Y + SIDE / 2}
                fontSize={13}
                textAnchor="end"
                dominantBaseline="central"
                opacity={0.75}
              >
                {flipViz ? 'Palindrome 4' : 'Palindrome 3'}
              </text>
              {rangeArr(flipStrip.left, flipStrip.right).map((i) => {
                const dx = flipViz ? (2 * C - 2 * i) * SIDE : 0;
                const marked = flipViz ? 2 * C - i === cur : i === M;
                return (
                  <g
                    key={`f-${i}`}
                    className="manacher-flip-cell"
                    style={{ transform: `translateX(${dx}px)` }}
                  >
                    <Cell
                      char={s[i]}
                      x={col(i)}
                      y={PAL34_Y}
                      fill={
                        marked ? 'var(--highlight-fill)' : 'var(--cell-fill)'
                      }
                      stroke="var(--tab-active)"
                    />
                  </g>
                );
              })}
            </g>
          )}

          {/* radius row */}
          {s.split('').map((_, j) => (
            <Cell
              key={`r-${j}`}
              char={radiusCellChar(j)}
              x={col(j)}
              y={RAD_Y}
              faded={j > cur}
              fill={j === cur ? 'var(--highlight-fill)' : 'var(--cell-fill)'}
              stroke={j === cur ? 'var(--tab-active)' : 'var(--cell-stroke)'}
            />
          ))}
        </Canvas>

        <p className="manacher-caption">{frame.caption}</p>

        {/* Controls stay put — the derivation panel grows *below* them so the
            button row never shifts as more proof lines appear. */}
        <StepController player={player} />

        {inProof && (
          <div className="manacher-derivation">
            <span className="manacher-derivation__label">
              Why no outside comparison is needed
            </span>
            <ol>
              {frame.derivationLines.map((line, i) => (
                <li
                  key={i}
                  className={
                    i === frame.derivationLines.length - 1
                      ? 'is-current'
                      : undefined
                  }
                >
                  {line}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}

/** Small "?" / "×" badge pinned to a cell's top-right corner (proof frames). */
function ProofBadge({
  x,
  symbol,
  tone,
}: {
  x: number;
  symbol: string;
  tone: 'query' | 'cross';
}) {
  const color = tone === 'cross' ? 'var(--mismatch)' : 'var(--proof-query)';
  return (
    <g>
      <circle
        cx={x + SIDE - 3}
        cy={S_Y + 3}
        r={9}
        fill="var(--panel-bg)"
        stroke={color}
        strokeWidth={2}
      />
      <text
        x={x + SIDE - 3}
        y={S_Y + 3}
        fontSize={13}
        fontWeight={700}
        textAnchor="middle"
        dominantBaseline="central"
        fill={color}
      >
        {symbol}
      </text>
    </g>
  );
}

function StripRow({
  s,
  y,
  left,
  right,
  markCenter,
  label,
  color,
}: {
  s: string;
  y: number;
  left: number;
  right: number;
  markCenter: number | null;
  label: string;
  color: string;
}) {
  return (
    <g>
      <text
        x={LABEL_W - 8}
        y={y + SIDE / 2}
        fontSize={13}
        textAnchor="end"
        dominantBaseline="central"
        opacity={0.75}
      >
        {label}
      </text>
      {rangeArr(left, right).map((i) => (
        <Cell
          key={`${label}-${i}`}
          char={s[i]}
          x={col(i)}
          y={y}
          fill={i === markCenter ? 'var(--highlight-fill)' : 'var(--cell-fill)'}
          stroke={color}
        />
      ))}
    </g>
  );
}

function rangeArr(a: number, b: number): number[] {
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  return Array.from({ length: hi - lo + 1 }, (_, k) => lo + k);
}
